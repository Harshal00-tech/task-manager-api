import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (path) => {
	try {
		const res = await cloudinary.uploader.upload(path);
		setImmediate(async () => {
			await fs.unlink(path, (err) => {
				if (err) throw err;
			});
		});
		return res;
	} catch (error) {
		throw new Error("error while uploading avatar.");
	}
};

const deleteOnCloudinary = async (public_id) => {
	try {
		const res = await cloudinary.api.delete_resources(public_id);
		return res;
	} catch (error) {
		throw new Error("error while deleting avatar.");
	}
};

export { uploadOnCloudinary, deleteOnCloudinary };
