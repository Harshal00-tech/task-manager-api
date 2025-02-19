import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		password: {
			type: String, //hashed using bcrypt
			required: true,
		},
		role: {
			type: String,
			enum: ["admin", "user", "manager"],
			required: true,
		},
		tasks: [
			{
				type: mongoose.Types.ObjectId,
				ref: "Task",
			},
		],
		avatar: {
			//cloudinary url.
			type: String,
			required: true,
		},
		cld_id: {
			type: String,
			required: true,
		},
		resetToken: {
			type: String,
		},
		resetTokenExpiry: {
			type: Date,
		},
	},
	{ timestamps: true }
);

userSchema.methods.createToken = async function () {
	return await jwt.sign(
		{
			_id: this._id,
		},
		process.env.JWT_SECRET,
		{
			expiresIn: "1d",
		}
	);
};

userSchema.methods.generateResetToken = async function () {
	let token = crypto.randomBytes(32).toString("hex");
	this.resetToken = token;
	this.resetTokenExpiry = Date.now() + 3600000; //1 hour to delete.
	return await this.save();
};

userSchema.methods.compareToken = async function (token) {
	if (this.resetToken == token) {
		return true;
	} else return false;
};

const User = new mongoose.model("User", userSchema);
export default User;
