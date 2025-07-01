const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const SECRET_KEY = process.env.JWT_SECRET || 'default_secret';

// Serve static files
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(cookieParser());

/**
 * LOGIN LOGIC
 */
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });

  let role = 'user';

  if (username.toLowerCase() === 'cherie' && password === process.env.OWNER_PASSWORD) {
    role = 'owner';
  } else if (username.toLowerCase() === 'cherie') {
    role = 'user';
  } else if (password === process.env.ADMIN_PASSWORD) {
    role = 'admin';
  }

  const token = jwt.sign({ username, role }, SECRET_KEY, { expiresIn: '1d' });
  res.json({ token, username, role });
});

// Store connected sockets
let connectedUsers = new Set();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No auth token'));

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    socket.username = payload.username;
    socket.role = payload.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  connectedUsers.add(socket.id);

  // Send user count to all clients
  io.emit('user count', connectedUsers.size);

  console.log(`✅ ${socket.username} (${socket.role}) connected`);

  // Send system message if admin or owner logs in
  if (socket.role === 'admin' || socket.role === 'owner') {
    io.emit('chat message', {
      username: 'System',
      message: `${socket.username} has entered as ${socket.role.toUpperCase()}`,
      role: 'system'
    });
  }

  socket.on('chat message', (msg) => {
    io.emit('chat message', {
      username: socket.username,
      message: msg,
      role: socket.role
    });
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    io.emit('user count', connectedUsers.size);
    console.log(`❌ ${socket.username} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
