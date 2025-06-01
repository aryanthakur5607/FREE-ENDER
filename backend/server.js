const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const serviceRoutes = require('./routes/service.routes');
const messageRoutes = require('./routes/messages');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000', 'https://free-ender.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Add error handling for CORS
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: 'Invalid token' });
  } else if (err.name === 'CorsError') {
    res.status(403).json({ message: 'CORS error: Not allowed by CORS' });
  } else {
    next(err);
  }
});

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000', 'https://free-ender.onrender.com'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinService', (serviceId) => {
    socket.join(serviceId);
    console.log(`User joined service room: ${serviceId}`);
  });

  socket.on('sendMessage', (message) => {
    io.to(message.serviceId).emit('newMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/skills', require('./routes/skill.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 