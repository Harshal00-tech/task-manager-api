import jwt from "jsonwebtoken";
import Login from "../models/login.model.js";
import User from "../models/user.model.js";

const verifyUser = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		let err = new Error("Token not found or invalid format.");
		err.statusCode = 401;
		return next(err);
	}

	const token = authHeader.split(" ")[1];

	let decodedToken;
	try {
		decodedToken = jwt.verify(token, process.env.JWT_SECRET);
	} catch (error) {
		let err = new Error("Unauthenticated.");
		err.statusCode = 401;
		return next(err);
	}

	if (!decodedToken) {
		let err = new Error("Unauthenticated.");
		err.statusCode = 401;
		return next(err);
	}

	const user = await User.findById(decodedToken._id).select("-password");
	if (!user) {
		let err = new Error("User not found.");
		err.statusCode = 404;
		return next(err);
	}

	const loginDetail = await Login.findOne({ userId: decodedToken._id });
	if (
		!loginDetail ||
		loginDetail.isDeleted ||
		loginDetail.expireAt < Date.now()
	) {
		let err = new Error("Session expired or invalid.");
		err.statusCode = 401;
		return next(err);
	}

	req.user = user;
	next();
};

export default verifyUser;
