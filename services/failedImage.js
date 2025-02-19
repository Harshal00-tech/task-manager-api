import fs from "fs";
import cron from "node-cron";
import path from "path";

const publicPath = path.resolve("public");
cron.schedule("46 14 * * *", async () => {
	const files = await fs.promises.readdir(publicPath);
	if ((files.length < 2) & (files[0] == ".gitkeep")) {
		return;
	}
	files.map(async (file) => {
		if (file != ".gitkeep") {
			const filePath = path.join(publicPath, file);
			fs.unlink(filePath);
		}
	});
});
