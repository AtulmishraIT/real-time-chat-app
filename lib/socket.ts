import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { User, Message } from './models';
import dbConnect from './db';

let io: Server | null = null;
let typingUsers: { [key: string]: Set<string> } = {};

export function initializeSocket(httpServer: HTTPServer) {
  if (!io) {
    io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
      console.log('[Socket] User connected:', socket.id);

      // User joins a room
      socket.on('join_room', async (data) => {
        const { roomId, username } = data;
        socket.join(roomId);

        // Update user status
        try {
          await dbConnect();
          let user = await User.findOne({ username });
          if (!user) {
            user = await User.create({ username });
          }
          user.status = 'online';
          user.socketId = socket.id;
          await user.save();

          // Notify room about new user
          const onlineUsers = await User.find({ status: 'online' }).select(
            'username'
          );
          io?.to(roomId).emit('user_joined', {
            username,
            onlineCount: onlineUsers.length,
          });
          io?.to(roomId).emit('online_users', onlineUsers);
        } catch (error) {
          console.error('[Socket] Error on join_room:', error);
        }
      });

      // Handle incoming messages
      socket.on('send_message', async (data) => {
        const { roomId, username, content } = data;

        try {
          await dbConnect();
          const user = await User.findOne({ username });
          if (!user) return;

          // Save message to database
          const message = await Message.create({
            roomId,
            userId: user._id,
            username,
            content,
            timestamp: new Date(),
          });

          // Broadcast to room
          io?.to(roomId).emit('receive_message', {
            _id: message._id,
            username,
            content,
            timestamp: message.timestamp,
          });

          // Clear typing indicator
          if (typingUsers[roomId]) {
            typingUsers[roomId].delete(username);
            io?.to(roomId).emit('typing_users', Array.from(typingUsers[roomId]));
          }
        } catch (error) {
          console.error('[Socket] Error on send_message:', error);
        }
      });

      // Handle typing indicator
      socket.on('typing', (data) => {
        const { roomId, username } = data;
        if (!typingUsers[roomId]) {
          typingUsers[roomId] = new Set();
        }
        typingUsers[roomId].add(username);
        io?.to(roomId).emit('typing_users', Array.from(typingUsers[roomId]));
      });

      // Handle stop typing
      socket.on('stop_typing', (data) => {
        const { roomId, username } = data;
        if (typingUsers[roomId]) {
          typingUsers[roomId].delete(username);
          io?.to(roomId).emit('typing_users', Array.from(typingUsers[roomId]));
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log('[Socket] User disconnected:', socket.id);

        try {
          await dbConnect();
          const user = await User.findOne({ socketId: socket.id });
          if (user) {
            user.status = 'offline';
            user.socketId = undefined;
            await user.save();

            // Notify all rooms
            const rooms = socket.rooms;
            rooms.forEach((roomId) => {
              if (roomId !== socket.id) {
                io?.to(roomId).emit('user_left', {
                  username: user.username,
                });
                if (typingUsers[roomId]) {
                  typingUsers[roomId].delete(user.username);
                  io?.to(roomId).emit('typing_users', Array.from(typingUsers[roomId]));
                }
              }
            });
          }
        } catch (error) {
          console.error('[Socket] Error on disconnect:', error);
        }
      });

      // Get room messages history
      socket.on('get_messages', async (data) => {
        const { roomId } = data;
        try {
          await dbConnect();
          const messages = await Message.find({ roomId })
            .sort({ timestamp: 1 })
            .limit(50);

          socket.emit('message_history', messages);
        } catch (error) {
          console.error('[Socket] Error on get_messages:', error);
        }
      });
    });
  }

  return io;
}

export function getIO() {
  return io;
}
