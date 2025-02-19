import Login from "../models/login.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import sgMail from "@sendgrid/mail";
import {
	uploadOnCloudinary,
	deleteOnCloudinary,
} from "../services/cloudinary.js";
import {
	registerValidationSchema,
	loginValidationSchema,
	resetLinkValidationSchema,
	resetPasswordValidationSchema,
	updateUservalidateSchema,
	avatarValidateSchema,
	changePassValidationSchema,
} from "../services/validationSchema.js";

const registerUser = async (req, res, next) => {
	const { email, name, password, role } = req.body;
	const avatar = req.file;

	const { _, error } = registerValidationSchema.validate({
		name,
		email,
		password,
		role,
		avatar,
	});

	if (error) {
		error.statusCode = 400;
		return next(error);
	}
	const user = await User.findOne({ email });
	if (user) {
		let err = new Error("user already exist");
		err.statusCode = 409;
		return next(err);
	}
	const uploadedImage = await uploadOnCloudinary(avatar.path);
	const hashedPass = await bcrypt.hash(password, 12);
	if (!hashedPass) {
		let err = new Error("server error while hashing password");
		return next("errror" + err);
	}
	const createdUser = await User.create({
		name,
		email,
		password: hashedPass,
		avatar: uploadedImage.secure_url,
		cld_id: uploadedImage.public_id,
		role,
	});
	if (!createdUser) {
		let err = new Error("server error while creating user");
		return next(err);
	}
	const msg = {
		to: `${createdUser.email}`,
		from: "harshal.patil@differenzsystem.com", // Use the email address or domain you verified above
		subject: "Account created successfully",
		html: "<strong>Account created successfully</strong>",
	};
	try {
		await sgMail.send(msg);
	} catch (error) {
		return next(err);
	}
	createdUser.password = undefined;
	return res
		.status(200)
		.json({ message: "user created successfully.", user: createdUser });
};

const loginUser = async (req, res, next) => {
	const { email, password } = req.body;
	const { _, error } = loginValidationSchema.validate({
		email,
		password,
	});
	if (error) {
		error.statusCode = 400;
		return next(error);
	}
	const user = await User.findOne({ email });
	if (!user) {
		let err = new Error("User Doesn't Exist");
		err.statusCode = 404;
		return next(err);
	}
	const checkPass = await bcrypt.compare(password, user.password);
	if (!checkPass) {
		let err = new Error("incorrect password");
		err.statusCode = 401;
		return next(err);
	}
	const createdToken = await user.createToken();
	if (!createdToken) {
		let err = new Error("server error while creating token.");
		return next(err);
	}
	const logindetail = await Login.findOne({ userId: user._id });
	try {
		if (!logindetail) {
			Login.create({
				userId: user._id,
				loginAt: [Date.now()],
				expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			});
		} else {
			await logindetail.updateLogin();
		}
	} catch (error) {
		next(error);
	}
	user.password = undefined;
	return res.status(200).json({
		message: "user created successfully",
		user,
		token: createdToken,
	});
};

const sendResetMail = async (req, res, next) => {
	//check for the email and user account
	//generate resetToken
	//send resettoken as an params via at the reset link.
	const { email, resetLink } = req.body;
	const { _, error } = resetLinkValidationSchema.validate({
		email,
		resetLink,
	});
	if (error) {
		error.statusCode(400);
		return next(error);
	}
	let user = await User.findOne({ email });
	if (!user) {
		let err = new Error("User Doesn't Exist");
		err.statusCode = 404;
		return next(err);
	}
	try {
		user = await user.generateResetToken();
	} catch (error) {
		return next(error);
	}

	const msg = {
		to: req.body.email,
		from: "harshal.patil@differenzsystem.com", // Use the email address or domain you verified above
		subject: "Reset Password",
		html: `<div>
				<h1>Password Reset Request</h1>
				<p>Hello,</p>
				<p>We received a request to reset your password for your account. If you did not request a password reset, please ignore this email. If you did, please click the button below to reset your password:</p>
				<a href="${resetLink}/?token=${user.resetToken}&email=${email}" class="button">Reset My Password</a>
				<p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
				<p><a href="${resetLink}/?token=${user.resetToken}&email=${email}">'${resetLink}/?token=${user.resetToken}&email=${email}'</a></p>
				<p>Thank you,<br>The task manager Team</p>

				<div class="footer">
						<p>If you have any questions, feel free to contact our support team at [support@task_manager.com].</p>
				</div>
			</div>`,
	};
	try {
		await sgMail.send(msg);
	} catch (error) {
		return next(err);
	}
	return res.status(200).json({
		message: "mail sent successfully.",
		resetToken: user.resetToken,
	});
};

const resetPassword = async (req, res, next) => {
	const { email, resetToken, newPassword } = req.body;
	const { _, error } = resetPasswordValidationSchema.validate({
		email,
		resetToken,
		newPassword,
	});
	if (error) {
		error.statusCode = 400;
		return next(error);
	}
	const user = await User.findOne({
		email,
		resetTokenExpiry: { $gt: Date.now() },
	});
	if (!user) {
		let err = new Error("reset password link is expire!");
		err.statusCode = 400;
		return next(err);
	}
	const checkToken = await user.compareToken(resetToken);
	if (!checkToken) {
		let err = new Error("unauthorized");
		err.statusCode = 401;
		return next(err);
	}
	const hashedPass = await bcrypt.hash(newPassword, 12);
	if (!hashedPass) {
		let err = new Error("server error while hashing password");
		return next(err);
	}
	user.password = hashedPass;
	user.resetToken = undefined;
	user.resetTokenExpiry = undefined;
	await user.save();
	res.status(200).json({ message: "password reset successfully" });
};

const changePassword = async (req, res, next) => {
	const userId = req.user._id;
	const { newPassword, oldPassword } = req.body;
	const { _, error } = changePassValidationSchema.validate({
		newPassword,
		oldPassword,
	});
	if (error) {
		error.statusCode = 400;
		return next(error);
	}
	const user = await User.findById(userId);
	const checkedPass = await bcrypt.compare(oldPassword, user.password);

	if (!checkedPass) {
		const err = new Error("invalid password!");
		err.statusCode(422);
		return next(err);
	}
	const hashedPass = await bcrypt.hash(newPassword, 12);
	if (!hashedPass) {
		const err = new Error("server error while encrypting password.");
		return next(err);
	}
	user.password = hashedPass;
	await user.save();
	return res.status(200).json({ message: "password changed successfully." });
};

const updateUser = async (req, res, next) => {
	const { email, name, role } = req.body;
	let user = req.user;
	const { _, error } = updateUservalidateSchema.validate({
		email,
		name,
		role,
	});
	if (error) {
		error.statusCode(400);
		return next(error);
	}
	user.email = email;
	user.name = name;
	user.role = role;
	user = await user.save();
	return res
		.status(200)
		.json({ message: "user's detail updated successfully", user });
};

const updateAvatar = async (req, res, next) => {
	const user = req.user;
	const avatar = req.file;
	const { _, error } = avatarValidateSchema.validate({ avatar });
	if (error) {
		error.statusCode = 400;
		return next(error);
	}

	let uploadedImage;
	try {
		uploadedImage = await uploadOnCloudinary(avatar.path);
		await deleteOnCloudinary(user.cld_id);
	} catch (error) {
		next(error);
	}
	user.avatar = uploadedImage.secure_url;
	user.cld_id = uploadedImage.public_id;
	await user.save();
	return res
		.status(200)
		.json({ message: "avatar is updated successfully.", user });
};

const getUser = (req, res, next) => {
	const user = req.user;
	return res
		.status(200)
		.json({ message: "user data fetched successfully.", user });
};

const logOutUser = async (req, res, next) => {
	let user = req.user;
	const loginDetail = await Login.findOne({ userId: user._id });
	if (!loginDetail) {
		let err = new Error("unauthorized!");
		err.statusCode = 401;
		return next(err);
	}
	loginDetail.isDeleted = true;
	loginDetail.expireAt = Date.now();
	loginDetail.save();
	return res.status(200).json({ message: "user logout successfully." });
};

export {
	getUser,
	loginUser,
	registerUser,
	sendResetMail,
	resetPassword,
	updateUser,
	logOutUser,
	updateAvatar,
	changePassword,
};
