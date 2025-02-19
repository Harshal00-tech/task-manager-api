import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		attachmentUrl: {
			type: String,
		},
		cld_id: String,
		priority: {
			type: String,
			enum: ["low", "medium", "high"],
			default: "medium",
		},
		status: {
			type: String,
			enum: ["pending", "in-progress", "completed"],
			default: "pending",
		},
		dueDate: { type: Date, required: true },
		project: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Project",
		},
		assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
