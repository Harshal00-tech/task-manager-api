import { Router } from "express";
import verifyUser from "../middleware/auth.middleware.js";
import isAuthorized from "../middleware/isAuthorized.middleware.js";
import {
	createTask,
	deleteTask,
	getAllTask,
	getTaskById,
	removeUserFromTask,
	addUserFromTask,
	updateTaskStatus,
	updateTask,
	updateAttachment,
	getUserTask,
} from "../controllers/task.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import isAdmin from "../middleware/isAdmin.middleware.js";

//Swagger ui routes
/**
 * @swagger
 * /api/v1/tasks/create-task:
 *   post:
 *     summary: Create a new task
 *     description: Allows admin or manager to create a new task and assign it to users.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Design UI for Dashboard"
 *               description:
 *                 type: string
 *                 example: "Create an intuitive UI for the main dashboard."
 *               priority:
 *                 type: string
 *                 enum: ["low", "medium", "high"]
 *                 example: "high"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-03-15"
 *               assignedTo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [ "67ac9994dd86e8e122bab53a", "67ac99bfdd86e8e122bab53d" ]
 *               localAttachment:
 *                 type: string
 *                 format: binary
 *                 description: Optional file attachment for the task.
 *     responses:
 *       200:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "task created successfully"
 *                 task:
 *                   $ref: "#/components/schemas/Task"
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User does not have admin or manager role
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/tasks/update-task/{taskId}:
 *   patch:
 *     summary: Update an existing task
 *     description: Allows admin or manager to update task details.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Task Title"
 *               description:
 *                 type: string
 *                 example: "Updated description of the task."
 *               priority:
 *                 type: string
 *                 enum: ["low", "medium", "high"]
 *                 example: "high"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-03-15"
 *               assignedTo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["65df2a47f2d39a7a1e123456", "65df2b34f2d39a7a1e654321"]
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "task updated successfully"
 *                 task:
 *                   $ref: "#/components/schemas/Task"
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User does not have admin or manager role
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/tasks/update-attachment/{taskId}:
 *   patch:
 *     summary: Update task attachment
 *     description: Allows admin or manager to update the attachment of a task.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               localAttachment:
 *                 type: string
 *                 format: binary
 *                 description: New file attachment for the task.
 *     responses:
 *       200:
 *         description: Attachment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "attachment is updated!"
 *                 task:
 *                   $ref: "#/components/schemas/Task"
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User does not have admin or manager role
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/tasks/update-task-status/{taskId}:
 *   patch:
 *     summary: Update task status
 *     description: Allows assigned users to update the status of a task.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["pending", "in-progress", "completed"]
 *                 example: "in-progress"
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "task's status updated!"
 *                 task:
 *                   $ref: "#/components/schemas/Task"
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User not authorized to update this task
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/tasks/add-member:
 *   patch:
 *     summary: Add a member to a task
 *     description: Adds a user to the assigned members of a task and updates the task details.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to be added to the task
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to which the user is to be added
 *     responses:
 *       200:
 *         description: Team member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "One team member has been added to the task."
 *                 task:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Task or user not found
 *       500:
 *         description: Server error while adding the member
 */

/**
 * @swagger
 * /api/v1/tasks/delete-task/{taskId}:
 *   delete:
 *     summary: Soft delete a task
 *     description: Marks a task as deleted by setting the isDeleted flag to true. Only authorized users (Admin/Manager) can perform this action.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to delete
 *     responses:
 *       200:
 *         description: Task successfully marked as deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "task deleted!"
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User not authorized to delete this task
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/tasks/remove-member:
 *   delete:
 *     summary: Remove a member from a task
 *     description: Removes a user from the assigned members of a task and updates the task details.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to be removed from the task
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task from which the user is to be removed
 *     responses:
 *       200:
 *         description: Team member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "One team member has been removed from the task."
 *                 task:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Task or user not found
 *       500:
 *         description: Server error while removing the member
 */

//GET ROUTES
/**
 * @swagger
 * /api/v1/users/get-task/{taskId}:
 *   get:
 *     summary: Get task details by ID
 *     description: Retrieves detailed information about a specific task using its ID.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to retrieve
 *     responses:
 *       200:
 *         description: Task details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "task fetched!"
 *                 task:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     dueDate:
 *                       type: string
 *                       format: date
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error while fetching task
 */

/**
 * @swagger
 * /api/v1/tasks/get-all-tasks:
 *   get:
 *     summary: Get All Tasks
 *     description: Fetch all tasks, accessible only by admin or manager.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of tasks per page.
 *     responses:
 *       200:
 *         description: All tasks fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "all task fetched successfully!"
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Task"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User does not have admin or manager role
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/get-user-tasks:
 *   get:
 *     summary: Get User Tasks
 *     description: Retrieves the tasks assigned to the authenticated user.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User tasks fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user tasks fetched successfully."
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "67ac99bfdd86e8e122bab53d"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     tasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Complete API Documentation"
 *                           description:
 *                             type: string
 *                             example: "Write Swagger documentation for API endpoints"
 *                           priority:
 *                             type: string
 *                             enum: ["low", "medium", "high"]
 *                             example: "high"
 *                           status:
 *                             type: string
 *                             enum: ["pending", "in-progress", "completed"]
 *                             example: "in-progress"
 *                           dueDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-02-15T12:00:00.000Z"
 *                           creator:
 *                             type: object
 *                             properties:
 *                               email:
 *                                 type: string
 *                                 example: "admin@example.com"
 *                               name:
 *                                 type: string
 *                                 example: "Admin User"
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */

const router = Router();

//ACCESSIBLE BY ADMIN ONLY.
router.get("/get-all-tasks", verifyUser, isAuthorized, isAdmin, getAllTask);

//ACCESSIBLE BY ADMIN/MANAGER ONLY
router.post(
	"/create-task",
	upload.single("localAttachment"),
	verifyUser,
	isAuthorized,
	createTask
);
router.patch(
	"/update-attachment/:taskId",
	upload.single("localAttachment"),
	verifyUser,
	isAuthorized,
	updateAttachment
);
router.patch("/update-task/:taskId", verifyUser, isAuthorized, updateTask);
router.delete("/delete-task/:taskId", verifyUser, isAuthorized, deleteTask);
router.delete("/remove-member", verifyUser, isAuthorized, removeUserFromTask);
router.patch("/add-member", verifyUser, isAuthorized, addUserFromTask);

//ACCESSIBLE BY ALL.
router.get("/get-task/:taskId", verifyUser, getTaskById);
router.get("/get-user-tasks", verifyUser, getUserTask);
router.patch("/update-task-status/:taskId", verifyUser, updateTaskStatus);

export default router;
