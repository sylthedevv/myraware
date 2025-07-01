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
let onlineUsers = 0;

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(cookieParser());

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });

  let role = 'user';
  const lower = username.toLowerCase();

  if (lower === 'cherie' && password === process.env.OWNER_PASSWORD) {
    role = 'owner';
  } else if (lower === 'cherie') {
    role = 'user';
  } else if (password === process.env.ADMIN_PASSWORD) {
    role = 'admin';
  }

  const token = jwt.sign({ username, role }, SECRET_KEY, { expiresIn: '1d' });
  res.json({ token, username, role });
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    socket.username = decoded.username;
    socket.role = decoded.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('user count', onlineUsers);

  console.log(`✅ ${socket.username} (${socket.role}) connected`);

  if (socket.role === 'owner' || socket.role === 'admin') {
    io.emit('chat message', {
      username: 'System',
      message: `${socket.username.toUpperCase()} has logged in as ${socket.role.toUpperCase()}`,
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
    onlineUsers--;
    io.emit('user count', onlineUsers);
    console.log(`❌ ${socket.username} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
app.use(express.static(__dirname + '/public'));
