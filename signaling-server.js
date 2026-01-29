#!/usr/bin/env node

// Node.js v24+ compatible, CommonJS style
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // Add TURN server here for production
  // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
];

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    socket.user = jwt.verify(token, 'CHANGE_THIS_SECRET');
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, role }) => {
    socket.join(roomId);
    socket.role = role;
    // For demo, use email as userId if present, else socket.id
    const userId = socket.user?.email || socket.id;
    io.to(roomId).emit('user-joined', { userId, role });
  });

  socket.on('signal', ({ roomId, data, to }) => {
    if (to) {
      socket.to(to).emit('signal', { from: socket.id, data });
    } else {
      socket.to(roomId).emit('signal', { from: socket.id, data });
    }
  });

  socket.on('proctor-action', ({ roomId, action, targetId }) => {
    io.to(targetId).emit('proctor-action', { action });
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      socket.to(room).emit('user-left', { userId: socket.user.id });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
