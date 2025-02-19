import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import sgMail from "@sendgrid/mail";
import cron from "node-cron";

const sendMail = async (data) => {
	const { title, due, email, name } = data;
	const msg = {
		to: email,
		from: "harshal.patil@differenzsystem.com",
		subject: "task reminder " + title,
		html: `<div>
        <center>
          <h1>Task due reminder</h1>
        </center>
				
				<p>Hello,</p>
				<p>We are here by inform that you have task named ${title} has due date is here at ${due}. we are request you to done the task at the given time to avoid any panelty.if you already complate your task please ignore this mail.</p>
				
				<div class="footer">
						<p>If you have any questions, feel free to contact our support team at [support@task_manager.com].</p>
				</div>
			</div>`,
	};
	await sgMail.send(msg);
	console.log("reminder sent to the following email.");
};

cron.schedule("15 16 * * *", async () => {
	const now = new Date();
	const tomorrow = new Date();
	tomorrow.setDate(now.getDate() + 1);
	tomorrow.setHours(23, 59, 59, 999);

	let tasks = await Task.find({
		dueDate: { $gte: now, $lte: tomorrow },
		isDeleted: false,
		status: "pending",
	});
	tasks.forEach((task) => {
		task.assignedTo.forEach(async (userId) => {
			const user = await User.findById(userId);
			if (user) {
				await sendMail({
					title: task.title,
					due: task.dueDate,
					email: user.email,
					name: user.name,
				});
			}
		});
	});
});
