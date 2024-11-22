import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";

const app = express();

// __dirname is not available for module imports, so can't use it here
app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});

// state for the users
const UsersState = {
	users: [],
	setUsers: function (newUsersArray) {
		this.users = newUsersArray;
	},
};

const io = new Server(expressServer, {
	cors: {
		origin:
			process.env.NODE_ENV === "production"
				? false
				: ["http://localhost:5500", "http://127.0.0.1:5500"],
	},
});

io.on("connection", (socket) => {
	console.log(`User ${socket.id} connected`);

	//  Upon connection - only to the user
	socket.emit("message", buildMsg(ADMIN, "Welcome to the chat!"));

	socket.on("enterRoom", ({ name, room }) => {
		// Leave previous room
		const prevRoom = getUser(socket.id)?.room;

		if (prevRoom) {
			socket.leave(prevRoom);
			socket.broadcast
				.to(prevRoom)
				.emit("message", buildMsg(ADMIN, `${name} has left the room.`));
			// io.to or socket.broadcast.to
			// io.to sends to all in the room
			// socket.broadcast.to sends to all in the room except the sender
		}

		const user = activateUser(socket.id, name, room);

		// Can not update previous room users list until after the state update in activate user

		if (prevRoom) {
			io.to(prevRoom).emit("userList", {
				users: getUsersInRoom(prevRoom),
			});
		}

		// join the room
		socket.join(room);

		// To the user who joined
		socket.emit(
			"message",
			buildMsg(ADMIN, `You have joined the ${room} chat room.`)
		);

		// To all in the room
		socket.broadcast
			.to(room)
			.emit("message", buildMsg(ADMIN, `${name} has joined the room.`));

		// Update user list for room
		io.to(room).emit("userList", {
			users: getUsersInRoom(room),
		});

		// Update room list for everyone
		io.emit("roomList", {
			rooms: getAllActiveRooms(),
		});
	});

	// When User disconnects - to all Others
	socket.on("disconnect", () => {
		const user = getUser(socket.id);
		userLeavesApp(socket.id);

		if (user) {
			io.to(user.room).emit(
				"message",
				buildMsg(ADMIN, `${user.name} has left the room.`)
			);

			io.to(user.room).emit("userList", {
				users: getUsersInRoom(user.room),
			});

			io.emit("roomList", {
				rooms: getAllActiveRooms(),
			});
		}

		console.log(`User ${socket.id} disconnected`);
	});

	// Listening for the message event
	socket.on("message", ({ name, text }) => {
		const room = getUser(socket.id)?.room;
		if (room) {
			io.to(room).emit("message", buildMsg(name, text));
		}
	});

	// Listen for 'activity'
	socket.on("activity", (name) => {
		const room = getUser(socket.id)?.room;
		if (room) {
			socket.broadcast.to(room).emit("activity", name);
		}
	});
});

function buildMsg(name, text) {
	return {
		name,
		text,
		time: new Intl.DateTimeFormat("default", {
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
		}).format(new Date()),
	};
}

// Users functions

function activateUser(id, name, room) {
	const user = { id, name, room };

	UsersState.setUsers([
		...UsersState.users.filter((user) => user.id !== id),
		user,
	]);

	return user;
}

function userLeavesApp(id) {
	UsersState.setUsers(UsersState.users.filter((user) => user.id !== id));
}

function getUser(id) {
	return UsersState.users.find((user) => user.id === id);
}

function getUsersInRoom(room) {
	return UsersState.users.filter((user) => user.room === room);
}

function getAllActiveRooms() {
	return Array.from(new Set(UsersState.users.map((user) => user.room)));
}
