import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import {
	deleteOnCloudinary,
	uploadOnCloudinary,
} from "../services/cloudinary.js";

import { getIO, getOnlineUsers } from "../services/socket.js";
import {
	createTaskValidateSchema,
	updatedAttachmentValidateSchema,
	updateTaskValidateSchema,
	updateStatusValidateSchema,
	userIdAndTaskIdSchema,
} from "../services/validationSchema.js";

const createTask = async (req, res, next) => {
	let { title, description, priority, dueDate, assignedTo } = req.body;
	if (!Array.isArray(assignedTo)) {
		assignedTo = assignedTo.split([","]);
	}
	const localAttachment = req.file;

	const { _, error } = createTaskValidateSchema.validate({
		title,
		description,
		priority,
		dueDate,
		assignedTo,
		localAttachment,
	});
	if (error) {
		error.statusCode = 400;
		return next(error);
	}

	const uploadedAttachment = await uploadOnCloudinary(localAttachment.path);

	const userId = req.user._id;
	const newTask = await Task.create({
		title,
		description,
		priority,
		dueDate: new Date(dueDate),
		assignedTo,
		createdBy: userId,
		attachmentUrl: uploadedAttachment.secure_url,
		cld_id: uploadedAttachment.public_id,
	});
	setImmediate(async () => {
		try {
			for (let assigneeId of assignedTo) {
				await User.findByIdAndUpdate(assigneeId, {
					$push: { tasks: newTask._id },
				});
			}
		} catch (error) {
			return next(error);
		}
	});
	if (!newTask) {
		let err = new Error();
		return next(err);
	}

	setImmediate(async () => {
		const io = getIO();
		const onlineUsers = getOnlineUsers();

		newTask.assignedTo.forEach((userId) => {
			const socketId = onlineUsers.get(userId.toString());
			io.to(socketId).emit("task-created", newTask);
		});
	});

	return res
		.status(200)
		.json({ message: "task created successfully", task: newTask });
};

const updateTask = async (req, res, next) => {
	const taskId = req.params.taskId;
	const { title, description, priority, dueDate, assignedTo } = req.body;
	const { _, error } = updateTaskValidateSchema.validate({
		title,
		description,
		priority,
		dueDate,
		assignedTo,
		taskId,
	});

	if (error) {
		error.statusCode = 400;
		return next(error);
	}

	let updatedTask = await Task.findOneAndUpdate(
		{ _id: taskId, isDeleted: false },
		{
			title,
			description,
			priority,
			dueDate: new Date(dueDate),
			assignedTo,
		},
		{ new: true }
	);

	if (!updatedTask) {
		let err = new Error("server error while updating task");
		return next(err);
	}

	setImmediate(async () => {
		const io = getIO();
		const onlineUsers = getOnlineUsers();

		updatedTask.assignedTo.forEach((userId) => {
			const socketId = onlineUsers.get(userId.toString());
			io.to(socketId).emit("task-updated", updatedTask);
		});
	});

	return res
		.status(200)
		.json({ message: "task updated successfully", task: updatedTask });
};

const updateTaskStatus = async (req, res, next) => {
	const { status } = req.body;
	const taskId = req.params.taskId;

	const { _, error } = updateStatusValidateSchema.validate({
		taskId,
		status,
	});

	if (error) {
		error.statusCode = 400;
		return next(error);
	}

	const updatedTask = await Task.findOneAndUpdate(
		{ _id: taskId, isDeleted: false },
		{ status },
		{ new: true }
	);

	if (!updatedTask) {
		let err = new Error("server error while updating task");
		return next(err);
	}

	setImmediate(async () => {
		const io = getIO();
		const onlineUsers = getOnlineUsers();

		updatedTask.assignedTo.forEach((userId) => {
			const socketId = onlineUsers.get(userId.toString());
			io.to(socketId).emit("task-status-updated", updatedTask);
		});
		const socketId = onlineUsers.get(updatedTask.createdBy.toString());
		io.to(socketId).emit("task-status-updated", updatedTask);
	});

	return res
		.status(200)
		.json({ message: "task's status updated!", task: updatedTask });
};

const updateAttachment = async (req, res, next) => {
	const taskId = req.params.taskId;
	const localAttachment = req.file;

	const { _, error } = updatedAttachmentValidateSchema.validate();
	if (error) {
		error.statusCode(400);
		return next(error);
	}

	const task = await Task.findById(taskId);
	if (!task) {
		let error = new Error("server error while fetching task!");
		return next(error);
	}
	const uploadedAttachment = await uploadOnCloudinary(localAttachment.path);
	if (task.cld_id) {
		await deleteOnCloudinary(task.cld_id);
	}
	task.attachmentUrl = uploadedAttachment.secure_url;
	task.cld_id = uploadedAttachment.public_id;
	await task.save();

	setImmediate(async () => {
		const io = getIO();
		const onlineUsers = getOnlineUsers();

		task.assignedTo.forEach((userId) => {
			const socketId = onlineUsers.get(userId.toString());
			io.to(socketId).emit("task-attachment-update", task);
		});
		const socketId = onlineUsers.get(task.createdBy.toString());
		io.to(socketId).emit("task-attachment-update", task);
	});
	return res.status(200).json({ message: "attachment is updated!", task });
};

const getTaskById = async (req, res, next) => {
	const taskId = req.params.taskId;
	if (!taskId) {
		let err = new Error("taskId required");
		err.statusCode = 400;
		return next(err);
	}
	const task = await Task.aggregate([
		{
			$match: { _id: new mongoose.Types.ObjectId(taskId) },
		},
		{
			$lookup: {
				from: "users",
				localField: "assignedTo",
				foreignField: "_id",
				as: "members",
				pipeline: [
					{
						$project: {
							name: 1,
							_id: 0,
						},
					},
				],
			},
		},
		{
			$project: {
				assignedTo: 0,
				isDeleted: 0,
			},
		},
	]);
	if (!task) {
		let err = new Error("server error while fetching task");
		return next(err);
	}
	return res.status(200).json({ message: "task fetched!", task });
};

const removeUserFromTask = async (req, res, next) => {
	const { userId, taskId } = req.query;

	const { _, error } = userIdAndTaskIdSchema.validate({ userId, taskId });
	if (error) {
		error.statusCode = 400;
		return next(error);
	}
	try {
		//remove user from task db
		await Task.findByIdAndUpdate(taskId, {
			$pull: { assignedTo: userId },
		});

		//lookup users
		let task = await Task.aggregate([
			{
				$match: { _id: new mongoose.Types.ObjectId(taskId) },
			},
			{
				$lookup: {
					from: "users",
					localField: "assignedTo",
					foreignField: "_id",
					as: "members",
					pipeline: [
						{
							$project: {
								name: 1,
								email: 1,
								_id: 0,
							},
						},
					],
				},
			},
			{
				$project: {
					assignedTo: 0,
					isDeleted: 0,
				},
			},
		]);

		//remove task from the user db.
		setImmediate(async () => {
			try {
				await User.findByIdAndUpdate(userId, {
					$pull: { tasks: new mongoose.Types.ObjectId(taskId) },
				});
			} catch (error) {
				next(error);
			}
		});
		setImmediate(async () => {
			const io = getIO();
			const onlineUsers = getOnlineUsers();
			task = task[0];
			task.members.forEach(async (username) => {
				const user = await User.findOne({ name: username.name });
				const socketId = onlineUsers.get(user._id.toString());
				io.to(socketId).emit("user-removed", task);
			});
			const socketId = onlineUsers.get(task.createdBy.toString());
			io.to(socketId).emit("user-removed", task);
		});

		return res.status(200).json({
			message: "One team member has been removed to the task.",
			task: task,
		});
	} catch (error) {
		return next(error);
	}
};

const addUserFromTask = async (req, res, next) => {
	const { userId, taskId } = req.query;

	const { _, error } = userIdAndTaskIdSchema.validate({ userId, taskId });
	if (error) {
		error.statusCode = 400;
		return next(error);
	}

	try {
		await Task.findByIdAndUpdate(taskId, {
			$addToSet: { assignedTo: userId },
		});

		let task = await Task.aggregate([
			{
				$match: { _id: new mongoose.Types.ObjectId(taskId) },
			},
			{
				$lookup: {
					from: "users",
					localField: "assignedTo",
					foreignField: "_id",
					as: "members",
					pipeline: [
						{
							$project: {
								name: 1,
								email: 1,
								_id: 0,
							},
						},
					],
				},
			},
			{
				$project: {
					assignedTo: 0,
					isDeleted: 0,
				},
			},
		]);

		setImmediate(async () => {
			try {
				//check if the user already exist at the given task.
				await User.findByIdAndUpdate(userId, {
					$addToSet: { tasks: taskId },
				});
			} catch (error) {
				return next(error);
			}
		});

		setImmediate(async () => {
			const io = getIO();
			const onlineUsers = getOnlineUsers();
			task = task[0];
			task.members.forEach(async (username) => {
				const user = await User.findOne({ name: username.name });
				const socketId = onlineUsers.get(user._id.toString());
				io.to(socketId).emit("user-added", task);
			});

			const socketId = onlineUsers.get(task.createdBy.toString());
			io.to(socketId).emit("user-added", task);
		});

		return res.status(200).json({
			message: "One team member has been added to the task.",
			task: task,
		});
	} catch (error) {
		return next(error);
	}
};

//admin purpose
const getAllTask = async (req, res, next) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 1;
	let tasks;
	try {
		tasks = await Task.aggregate([
			{
				$lookup: {
					from: "users",
					localField: "assignedTo",
					foreignField: "_id",
					as: "mamber",
					pipeline: [
						{
							$project: {
								name: 1,
								_id: 0,
							},
						},
					],
				},
			},
			{
				$project: {
					assignedTo: 0,
					isDeleted: 0,
				},
			},
			{
				$skip: (page - 1) * limit,
			},
			{
				$limit: limit,
			},
			{
				$sort: {
					priority: 1,
				},
			},
		]);
	} catch (error) {
		next(error);
	}
	return res
		.status(200)
		.json({ message: "all task fetched successfully!", tasks });
};

const getUserTask = async (req, res, next) => {
	let user;
	try {
		user = await User.aggregate([
			{
				$match: { _id: req.user._id },
			},
			{
				$lookup: {
					from: "tasks",
					localField: "tasks",
					foreignField: "_id",
					as: "tasks",
					pipeline: [
						{
							$project: {
								assignedTo: 0,
								_id: 0,
								createdAt: 0,
								updatedAt: 0,
							},
						},
					],
				},
			},
			{
				$unwind: {
					path: "$tasks",
					preserveNullAndEmptyArrays: true, // Keeps users without tasks
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "tasks.createdBy",
					foreignField: "_id",
					as: "tasks.creator",
					pipeline: [
						{
							$project: {
								email: 1,
								name: 1,
								_id: 0,
							},
						},
					],
				},
			},
			{
				$unwind: {
					path: "$tasks.creator",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: "$_id",
					name: { $first: "$name" },
					tasks: { $push: "$tasks" },
				},
			},
		]);
	} catch (error) {
		return next(error);
	}
	return res
		.status(200)
		.json({ message: "user tasks fetched successfully.", user });
};

const deleteTask = async (req, res, next) => {
	const taskId = req.params.taskId;
	//check for the task,
	//change the flag from false to true at isDeleted.
	//delete respective task from the user db
	//send response.
	if (!taskId) {
		let err = new Error("taskId required!");
		err.statusCode = 400;
		return next(err);
	}
	const deletedTask = await Task.findByIdAndUpdate(
		taskId,
		{ isDeleted: true },
		{ new: true }
	);
	setImmediate(async () => {
		deletedTask.assignedTo.forEach(async (userId) => {
			const updatedUser = await User.findByIdAndUpdate(userId, {
				$pull: { tasks: taskId },
			});
		});
	});

	setImmediate(async () => {
		const io = getIO();
		const onlineUsers = getOnlineUsers();

		deletedTask.assignedTo.forEach((userId) => {
			const socketId = onlineUsers.get(userId.toString());
			io.to(socketId).emit("task-deleted", deletedTask);
		});
	});
	return res.status(200).json({ message: "task deleted!" });
};

export {
	createTask,
	updateTask,
	updateTaskStatus,
	deleteTask,
	getAllTask,
	getTaskById,
	removeUserFromTask,
	addUserFromTask,
	updateAttachment,
	getUserTask,
};
