import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;
const app = express();

// __dirname is not available for module imports, so can't use it here
app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

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

  // Upon connection - only to the user
  // It is different from io.emit
  socket.emit("message", "Welcome to Chat App!");

  // Upon connection - to all Other
  socket.broadcast.emit(
    "message",
    `User ${socket.id.substring(0, 5)} is connected.`
  );

  // Listening for the message event
  socket.on("message", (data) => {
    console.log(`Received Message from ${socket.id.substring(0, 5)}:`, data);
    // Emitting message to everyone connected to the server
    io.emit("message", `${socket.id.substring(0, 5)}: ${data}`);
  });

  // When User disconnects - to all Others
  socket.on("disconnect", () => {
    socket.broadcast.emit(
      "message",
      `User ${socket.id.substring(0, 5)} is disconnected.`
    );
  });

  // Listen for 'activity'
  socket.on("activity", (name) => {
    socket.broadcast.emit("activity", name);
  });
});
