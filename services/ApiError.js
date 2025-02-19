class ApiError extends Error {
	constructor(statusCode, message, error = [], stack) {
		super(message);
		(this.statusCode = statusCode), (this.error = error);
		if (!stack) {
			this.stack = Error.captureStackTrace(this);
		} else {
			this.stack = stack;
		}
	}
}

export default ApiError;
