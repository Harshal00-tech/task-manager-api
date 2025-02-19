import mongoose from "mongoose";

const loginSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		loginAt: [{ type: Date, default: () => new Date() }],
		isDeleted: {
			type: Boolean,
			default: false,
		},
		expireAt: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true }
);

loginSchema.methods.updateLogin = async function () {
	this.expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
	this.loginAt.push(Date.now());
	this.isDeleted = false;
	await this.save();
};
const Login = mongoose.model("Login", loginSchema);

export default Login;
