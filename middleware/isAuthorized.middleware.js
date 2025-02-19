const isAuthorized = (req, res, next) => {
	let user = req.user;
	if (user.role == "admin" || user.role == "manager") {
		next();
	} else {
		let err = new Error("unauthorized.");
		err.statusCode = 401;
		return next(err);
	}
};

export default isAuthorized;
