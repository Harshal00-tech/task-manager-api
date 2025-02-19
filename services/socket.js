import { Server } from "socket.io";

let io;
const onlineUsers = new Map(); //  userId -> socketId mapping

export function initServer(server) {
	io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		},
	});

	io.on("connection", (socket) => {
		socket.on("userConnected", (userId) => {
			onlineUsers.set(userId, socket.id);
		});

		socket.on("disconnect", () => {
			for (const [userId, socketId] of onlineUsers.entries()) {
				if (socketId === socket.id) {
					onlineUsers.delete(userId);
					break;
				}
			}
		});
	});

	return io;
}

export function getIO() {
	if (!io) {
		throw new Error("Socket.io not initialized!");
	}
	return io;
}

export function getOnlineUsers() {
	return onlineUsers;
}
