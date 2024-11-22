import User from "./User";

class UsersService {
	constructor() {
		this.users = [];
	}

	addUser(id, name, room) {
		const user = new User(id, name, room);
		this.users = [...this.users.filter((user) => user.id !== id), user];
		return user;
	}

	removeUser(id) {
		this.users = this.users.filter((user) => user.id !== id);
	}

	getUser(id) {
		return this.users.find((user) => user.id === id);
	}

	getUsersInRoom(room) {
		return this.users.filter((user) => user.room === room);
	}

	getAllActiveRooms() {
		return Array.from(new Set(this.users.map((user) => user.room)));
	}
}

const UsersState = new UsersService();

export default UsersState;
