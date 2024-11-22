const socket = io("wss://io-ws-chatapp.onrender.com");

const msgInput = document.querySelector("#message");
const nameInput = document.querySelector("#name");
const chatRoom = document.querySelector("#room");

const activity = document.querySelector(".activity");
const userList = document.querySelector(".user-list");
const roomList = document.querySelector(".room-list");
const chatDisplay = document.querySelector(".chat-display");

function sendMessage(e) {
	e.preventDefault();

	if (nameInput.value && msgInput.value && chatRoom.value) {
		socket.emit("message", {
			name: nameInput.value,
			text: msgInput.value,
		});

		msgInput.value = "";
	}

	msgInput.focus();
}

function enterRoom(e) {
	e.preventDefault();

	if (nameInput.value && chatRoom.value) {
		socket.emit("enterRoom", {
			name: nameInput.value,
			room: chatRoom.value,
		});
	}
}

document.querySelector(".form-msg").addEventListener("submit", sendMessage);

document.querySelector(".form-join").addEventListener("submit", enterRoom);

msgInput.addEventListener("keypress", () => {
	socket.emit("activity", nameInput.value);
});

// listens for message
socket.on("message", (data) => {
	activity.textContent = "";
	const { name, text, time } = data;
	const li = document.createElement("li");
	// by default for admin messages class is post
	li.className = "post";

	if (name === nameInput.value) {
		// if the message is from the current user
		li.classList.add("post--left");
	}

	if (name !== nameInput.value && name !== "Admin") {
		// if the message is from another user
		li.classList.add("post--right");
	}

	if (name !== "Admin") {
		li.innerHTML = `<div class="post__header ${
			name === nameInput.value
				? "post__header--user"
				: "post__header--reply"
		}">
            <span class="post__header--name">${name}</span>
            <span class="post__header--time">${time}</span>
        </div>
        <div class="post__text">${text}</div>`;
	} else {
		li.innerHTML = `<div class="post__text">${text}</div>`;
	}

	chatDisplay.appendChild(li);
	chatDisplay.scrollTop = chatDisplay.scrollHeight;
	// this will keep the chat scrolled to the bottom
});

// listens for activity
let activityTimer;
socket.on("activity", (name) => {
	activity.textContent = `${name} is typing...`;

	// clear after 2 seconds
	clearTimeout(activityTimer);
	activityTimer = setTimeout(() => {
		activity.textContent = "";
	}, 2000);
});

// listens for users list
socket.on("userList", ({ users }) => {
	showUsers(users);
});

// listens for rooms list
socket.on("roomList", ({ rooms }) => {
	showRooms(rooms);
});

function showUsers(users) {
	userList.textContent = "";
	if (users) {
		userList.innerHTML = `<em> Users in ${chatRoom.value}: </em>`;
	}
	users.forEach((user, idx) => {
		userList.textContent += `${user.name}${
			idx === users.length - 1 ? "" : ", "
		}`;
	});
}

function showRooms(rooms) {
	roomList.textContent = "";
	if (rooms) {
		roomList.innerHTML = "<em> Active Rooms: </em>";
	}
	rooms.forEach((room, idx) => {
		roomList.textContent += `${room}${
			idx === rooms.length - 1 ? "" : ", "
		}`;
	});
}
