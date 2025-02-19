import swaggerJSDoc from "swagger-jsdoc";

const option = {
	definition: {
		openapi: "3.1.0",
		info: {
			title: "Task Management API",
			version: "1.1.0",
			description:
				"This is the task management api documentation, contain rest api for various task operations.",
		},
		servers: [
			{
				url: "https://task-manager-api-80kd.onrender.com",
			},
		],
		components: {
			schemas: {
				Task: {
					type: "object",
					properties: {
						_id: { type: "string", example: "taskObjectId" },
						title: {
							type: "string",
							example: "Finish Swagger Docs",
						},
						description: {
							type: "string",
							example: "Write API documentation for Task Manager",
						},
						attachmentUrl: {
							type: "string",
							example: "https://example.com/file.pdf",
						},
						cld_id: { type: "string", example: "cloudinaryFileId" },
						priority: {
							type: "string",
							enum: ["low", "medium", "high"],
							example: "high",
						},
						status: {
							type: "string",
							enum: ["pending", "in-progress", "completed"],
							example: "pending",
						},
						dueDate: {
							type: "string",
							format: "date-time",
							example: "2025-02-20T12:00:00Z",
						},
						project: { type: "string", example: "projectObjectId" },
						assignedTo: {
							type: "array",
							items: { type: "string" },
							example: ["userObjectId1", "userObjectId2"],
						},
						createdBy: { type: "string", example: "userObjectId" },
						isDeleted: { type: "boolean", example: false },
						createdAt: {
							type: "string",
							format: "date-time",
							example: "2025-02-13T10:00:00Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							example: "2025-02-13T10:30:00Z",
						},
					},
				},
				User: {
					type: "object",
					properties: {
						_id: { type: "string", example: "userObjectId" },
						name: { type: "string", example: "John Doe" },
						email: {
							type: "string",
							example: "john.doe@example.com",
						},
						password: {
							type: "string",
							example: "hashed_password",
						},
						role: {
							type: "string",
							enum: ["admin", "user", "manager"],
							example: "user",
						},
						tasks: {
							type: "array",
							items: { type: "string" },
							example: ["taskObjectId1", "taskObjectId2"],
						},
						avatar: {
							type: "string",
							example: "https://cloudinary.com/avatar.png",
						},
						cld_id: { type: "string", example: "cloudinaryFileId" },
						resetToken: {
							type: "string",
							example: "resetTokenString",
						},
						resetTokenExpiry: {
							type: "string",
							format: "date-time",
							example: "2025-02-20T12:00:00Z",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							example: "2025-02-13T10:00:00Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							example: "2025-02-13T10:30:00Z",
						},
					},
				},
				Login: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "loginObjectId",
						},
						userId: { type: "string", example: "userObjectId" },
						loginAt: {
							type: "array",
							items: { type: "string", format: "date-time" },
							example: [
								"2025-02-13T12:00:00Z",
								"2025-02-14T08:30:00Z",
							],
						},
						isDeleted: { type: "boolean", example: false },
						expireAt: {
							type: "string",
							format: "date-time",
							example: "2025-02-14T12:00:00Z",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							example: "2025-02-13T10:00:00Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							example: "2025-02-13T10:30:00Z",
						},
					},
				},
			},
		},
	},
	apis: ["./routes/*.routes.js"],
};

export const specs = swaggerJSDoc(option);
