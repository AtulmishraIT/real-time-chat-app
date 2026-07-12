const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

let typingUsers = {};

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

// Define Mongoose schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  status: { type: String, default: 'offline' },
  socketId: String,
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  userId: mongoose.Schema.Types.ObjectId,
  username: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins a room
    socket.on('join_room', async (data) => {
      const { roomId, username } = data;
      socket.join(roomId);
      console.log(`${username} joined room ${roomId}`);

      try {
        let user = await User.findOne({ username });
        if (!user) {
          user = await User.create({ username });
        }
        user.status = 'online';
        user.socketId = socket.id;
        await user.save();

        const onlineUsers = await User.find({ status: 'online' }).select(
          'username'
        );
        io.to(roomId).emit('user_joined', {
          username,
          onlineCount: onlineUsers.length,
        });
        io.to(roomId).emit('online_users', onlineUsers);
      } catch (error) {
        console.error('Error on join_room:', error);
      }
    });

    // Handle incoming messages
    socket.on('send_message', async (data) => {
      const { roomId, username, content } = data;

      try {
        const user = await User.findOne({ username });
        if (!user) return;

        const message = await Message.create({
          roomId,
          userId: user._id,
          username,
          content,
          timestamp: new Date(),
        });

        io.to(roomId).emit('receive_message', {
          _id: message._id,
          username,
          content,
          timestamp: message.timestamp,
        });

        if (typingUsers[roomId]) {
          typingUsers[roomId].delete(username);
          io.to(roomId).emit('typing_users', Array.from(typingUsers[roomId]));
        }
      } catch (error) {
        console.error('Error on send_message:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { roomId, username } = data;
      if (!typingUsers[roomId]) {
        typingUsers[roomId] = new Set();
      }
      typingUsers[roomId].add(username);
      io.to(roomId).emit('typing_users', Array.from(typingUsers[roomId]));
    });

    // Handle stop typing
    socket.on('stop_typing', (data) => {
      const { roomId, username } = data;
      if (typingUsers[roomId]) {
        typingUsers[roomId].delete(username);
        io.to(roomId).emit('typing_users', Array.from(typingUsers[roomId]));
      }
    });

    // Get room messages history
    socket.on('get_messages', async (data) => {
      const { roomId } = data;
      try {
        const messages = await Message.find({ roomId })
          .sort({ timestamp: 1 })
          .limit(50);

        socket.emit('message_history', messages);
      } catch (error) {
        console.error('Error on get_messages:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);

      try {
        const user = await User.findOne({ socketId: socket.id });
        if (user) {
          user.status = 'offline';
          user.socketId = undefined;
          await user.save();

          const rooms = Object.keys(socket.rooms).filter((r) => r !== socket.id);
          rooms.forEach((roomId) => {
            io.to(roomId).emit('user_left', { username: user.username });
            if (typingUsers[roomId]) {
              typingUsers[roomId].delete(user.username);
              io.to(roomId).emit('typing_users', Array.from(typingUsers[roomId]));
            }
          });
        }
      } catch (error) {
        console.error('Error on disconnect:', error);
      }
    });
  });

  // Connect to MongoDB before starting server
  connectDB().then(() => {
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io server running on ws://${hostname}:${port}`);
    });
  });
});
