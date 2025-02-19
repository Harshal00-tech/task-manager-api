import multer from "multer";

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "public");
	},
	filename: (req, file, cb) => {
		cb(null, +Math.floor(Math.random() * 1000) + "-" + file.originalname);
	},
});

const upload = multer({ storage: storage });
export { upload };
