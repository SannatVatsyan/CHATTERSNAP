const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

let users = []; // Array to track users waiting for a match

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Add user to the array
  users.push(socket.id);

  // Try to find a random match
  if (users.length > 1) {
    const matchedUserId = users.find((id) => id !== socket.id);
    io.to(socket.id).emit('matched', matchedUserId); // Send match to the new user
    io.to(matchedUserId).emit('matched', socket.id); // Send match to the existing user
    users = users.filter((id) => id !== socket.id && id !== matchedUserId); // Remove matched users
  }

  // Handle chat messages
  socket.on('message', (message) => {
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    users = users.filter((id) => id !== socket.id); // Remove the user from the waiting list
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
