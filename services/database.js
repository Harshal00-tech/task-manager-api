import mongoose from "mongoose";

const connection = async () => {
	try {
		await mongoose.connect(process.env.CONNECTION_URL);
	} catch (error) {
		throw new Error("MongoDB connection Error!", error);
	}
};

export default connection;
