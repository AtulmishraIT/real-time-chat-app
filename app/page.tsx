'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatContainer from '@/components/ChatContainer';
import { useSocket } from '@/lib/useSocket';

interface Message {
  _id?: string;
  username: string;
  content: string;
  timestamp: Date | string;
}

interface User {
  _id?: string;
  username: string;
  status?: string;
}

const ROOM_ID = 'general';

export default function Page() {
  const [currentUser, setCurrentUser] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);

  const { isConnected, emit, on, off } = useSocket({
    onConnect: () => {
      console.log('[v0] Socket connected');
    },
    onDisconnect: () => {
      console.log('[v0] Socket disconnected');
    },
  });

  // Handle room messages
  const handleReceiveMessage = useCallback((data: Message) => {
    console.log('[v0] Received message:', data);
    setMessages((prev) => [...prev, data]);
  }, []);

  // Handle typing users
  const handleTypingUsers = useCallback((users: string[]) => {
    console.log('[v0] Typing users:', users);
    setTypingUsers(users);
  }, []);

  // Handle online users
  const handleOnlineUsers = useCallback((users: User[]) => {
    console.log('[v0] Online users:', users);
    setOnlineUsers(users);
  }, []);

  // Handle message history
  const handleMessageHistory = useCallback((msgs: Message[]) => {
    console.log('[v0] Message history received:', msgs.length);
    setMessages(msgs);
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!isConnected) return;

    on('receive_message', handleReceiveMessage);
    on('typing_users', handleTypingUsers);
    on('online_users', handleOnlineUsers);
    on('message_history', handleMessageHistory);

    return () => {
      off('receive_message', handleReceiveMessage);
      off('typing_users', handleTypingUsers);
      off('online_users', handleOnlineUsers);
      off('message_history', handleMessageHistory);
    };
  }, [isConnected, on, off, handleReceiveMessage, handleTypingUsers, handleOnlineUsers, handleMessageHistory]);

  // Join room when user is set
  useEffect(() => {
    if (joined && currentUser && isConnected) {
      console.log('[v0] Joining room:', ROOM_ID, 'as', currentUser);
      emit('join_room', { roomId: ROOM_ID, username: currentUser });
      emit('get_messages', { roomId: ROOM_ID });
    }
  }, [joined, currentUser, isConnected, emit]);

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setCurrentUser(username);
      setJoined(true);
    }
  };

  const handleSendMessage = (message: string) => {
    if (message.trim() && currentUser) {
      console.log('[v0] Sending message:', message);
      emit('send_message', {
        roomId: ROOM_ID,
        username: currentUser,
        content: message,
      });
    }
  };

  const handleTyping = () => {
    if (currentUser) {
      emit('typing', { roomId: ROOM_ID, username: currentUser });
    }
  };

  const handleStopTyping = () => {
    if (currentUser) {
      emit('stop_typing', { roomId: ROOM_ID, username: currentUser });
    }
  };

  if (!joined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Chat Room</h1>
            <p className="mt-2 text-gray-600">
              Enter your username to join the conversation
            </p>
          </div>

          <form onSubmit={handleJoinChat} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isConnected}
              />
              {!isConnected && (
                <p className="mt-2 text-sm text-yellow-600">
                  Connecting to server...
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!username.trim() || !isConnected}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Join Chat
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {isConnected ? 'Connected to server' : 'Connecting...'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <ChatContainer
      messages={messages}
      currentUser={currentUser}
      onSendMessage={handleSendMessage}
      onTyping={handleTyping}
      onStopTyping={handleStopTyping}
      typingUsers={typingUsers}
      onlineUsers={onlineUsers}
      isConnected={isConnected}
    />
  );
}
