const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

app.get("/", (req, res) => {
    res.send("Backend is running!");
  });

const io = new Server(server, {
cors: {
    origin: ["http://localhost:3000", "https://c930-211-30-10-200.ngrok-free.app"],
    methods: ["GET", "POST"],
  },
});

const users = {};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
  
    // Add user to pool
    users[socket.id] = socket;
    console.log('Current users:', Object.keys(users));
  
    // Try to match the user with another user
    const availableUsers = Object.keys(users).filter((id) => id !== socket.id);
    if (availableUsers.length > 0) {
      const matchedUserId = availableUsers[0];
      console.log(`Matching ${socket.id} with ${matchedUserId}`);
      socket.emit('matched', matchedUserId);
      users[matchedUserId].emit('matched', socket.id);
    }
  
    // Handle signaling
    socket.on('send-signal', ({ userToSignal, callerId, signal }) => {
      console.log(`Signal sent from ${callerId} to ${userToSignal}`, signal);
      if (users[userToSignal]) {
        users[userToSignal].emit('receive-call', { signal, callerId });
      }
    });
  
    socket.on('accept-call', ({ signal, callerId }) => {
      console.log(`Signal accepted by ${callerId} for ${signal}`);
      if (users[callerId]) {
        users[callerId].emit('call-accepted', signal);
      }
    });
  
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      delete users[socket.id];
      console.log('Updated users:', Object.keys(users));
    
    // Notify other users about the disconnection
    socket.broadcast.emit('peer-disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5001;       // port 5000 already in use
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
