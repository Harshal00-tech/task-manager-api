import Joi from "joi";

const passwordSchema = Joi.string()
	.min(8)
	.pattern(/[A-Z]/)
	.pattern(/[a-z]/)
	.pattern(/\d/)
	.pattern(/[!@#$%^&*]/)
	.required()
	.messages({
		"string.min": "Password must be at least 8 character long.",
		"string.pattern.base":
			"Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
	});

const registerValidationSchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string().email().lowercase().required(),
	role: Joi.string().required(),
	password: passwordSchema,
	avatar: Joi.object().required(),
});

const loginValidationSchema = Joi.object({
	email: Joi.string().email().lowercase().required(),
	password: Joi.string()
		.min(8)
		.pattern(/[A-Z]/)
		.pattern(/[a-z]/)
		.pattern(/\d/)
		.pattern(/[!@#$%^&*]/)
		.required()
		.messages({
			"string.min": "Password must be at least 8 character long.",
			"string.pattern.base":
				"Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
		}),
});

const resetLinkValidationSchema = Joi.object({
	email: Joi.string().email().lowercase().required(),
	resetLink: Joi.string().uri().required().messages({
		"string.required": "url must be required.",
		"string.pattern.base": "Invalid URL format. Please enter a valid URL.",
	}),
});

const resetPasswordValidationSchema = Joi.object({
	email: Joi.string().email().lowercase().required(),
	resetToken: Joi.string().required(),
	newPassword: passwordSchema,
});

const updateUservalidateSchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string().email().lowercase().required(),
	role: Joi.string().required(),
});

const avatarValidateSchema = Joi.object({
	avatar: Joi.any().required(),
});

const changePassValidationSchema = Joi.object({
	newPassword: passwordSchema.invalid(Joi.ref("oldPassword")).messages({
		"any.invalid": "New password must be different from the old password.",
	}),
	oldPassword: passwordSchema,
});

const createTaskValidateSchema = Joi.object({
	dueDate: Joi.date().greater("now").required(),
	title: Joi.string().min(3).required(),
	description: Joi.string().min(3).max(300).required(),
	priority: Joi.string().valid("low", "medium", "high").required(),
	assignedTo: Joi.array().items(Joi.string()).required(),
	localAttachment: Joi.object().required(),
});

const updatedAttachmentValidateSchema = Joi.object({
	localAttachment: Joi.object().required(),
	taskId: Joi.string().alphanum().required(),
});

const updateTaskValidateSchema = Joi.object({
	taskId: Joi.string().alphanum().required(),
	dueDate: Joi.date().greater("now").required(),
	title: Joi.string().min(3).required(),
	description: Joi.string().min(3).max(300).required(),
	priority: Joi.string().valid("low", "medium", "high").required(),
	assignedTo: Joi.array().items(Joi.string()).required(),
});

const updateStatusValidateSchema = Joi.object({
	taskId: Joi.string().alphanum().required(),
	status: Joi.string().valid("pending", "in-progress", "completed"),
});

const userIdAndTaskIdSchema = Joi.object({
	userId: Joi.string().alphanum().required(),
	taskId: Joi.string().alphanum().required(),
});

export {
	loginValidationSchema,
	registerValidationSchema,
	resetLinkValidationSchema,
	resetPasswordValidationSchema,
	updateUservalidateSchema,
	avatarValidateSchema,
	changePassValidationSchema,
	createTaskValidateSchema,
	updatedAttachmentValidateSchema,
	updateTaskValidateSchema,
	updateStatusValidateSchema,
	userIdAndTaskIdSchema,
};
