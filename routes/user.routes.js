import { Router } from "express";
import {
	getUser,
	loginUser,
	logOutUser,
	registerUser,
	resetPassword,
	sendResetMail,
	updateAvatar,
	updateUser,
	changePassword,
} from "../controllers/user.controllers.js";
import verifyUser from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

//Swagger ui routes
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * security:
 *   - BearerAuth: []
 */

/**
 * @swagger
 * /api/v1/users/create-user:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with an avatar upload.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *               - avatar
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securepassword123"
 *               role:
 *                 type: string
 *                 enum: ["admin", "user", "manager"]
 *                 example: "user"
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user created successfully."
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: User Login
 *     description: Authenticates a user and returns a JWT token.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securepassword123"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user created successfully"
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Incorrect password
 *       404:
 *         description: User doesn't exist
 *       500:
 *         description: Server error while creating token
 */

/**
 * @swagger
 * /api/v1/users/send-reset-password-mail:
 *   post:
 *     summary: Send Reset Password Mail
 *     description: Sends a reset password email to the user with a reset link.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetLink
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               resetLink:
 *                 type: string
 *                 example: "http://localhost:3000/reset-password"
 *     responses:
 *       200:
 *         description: Reset password mail sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "mail sent successfully."
 *                 resetToken:
 *                   type: string
 *                   example: "a1b2c3d4e5f6g7h8i9j0"
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User doesn't exist
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/reset-password:
 *   patch:
 *     summary: Reset User Password
 *     description: Resets the user's password using the reset token.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetToken
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               resetToken:
 *                 type: string
 *                 example: "a1b2c3d4e5f6g7h8i9j0"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "password reset successfully"
 *       400:
 *         description: Missing required fields or expired reset link
 *       401:
 *         description: Unauthorized - Invalid reset token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/update-user:
 *   patch:
 *     summary: Update User Details
 *     description: Updates the authenticated user's details.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               role:
 *                 type: string
 *                 enum: ["admin", "user", "manager"]
 *                 example: "user"
 *     responses:
 *       200:
 *         description: User details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user's detail updated successfully"
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/update-avatar:
 *   patch:
 *     summary: Update User Avatar
 *     description: Updates the authenticated user's avatar.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "avatar is updated successfully."
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/logout:
 *   post:
 *     summary: Logout User
 *     description: Logs out the authenticated user by invalidating their session.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user logout successfully."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/user-profile:
 *   get:
 *     summary: Get user profile
 *     description: Fetch the profile of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user data fetched successfully."
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: User not found
 */

const router = Router();

router.post("/create-user", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/send-reset-password-mail", sendResetMail);
router.patch("/reset-password", resetPassword);
router.patch("/change-password", verifyUser, changePassword);
router.patch("/update-user", verifyUser, updateUser);
router.patch(
	"/update-avatar",
	upload.single("avatar"),
	verifyUser,
	updateAvatar
);
router.get("/user-profile", verifyUser, getUser);
router.post("/logout", verifyUser, logOutUser);

export default router;
