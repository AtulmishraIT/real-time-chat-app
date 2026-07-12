'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ChatContainer from '@/components/ChatContainer';

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
const POLL_INTERVAL = 1000; // Poll every 1 second

export default function Page() {
  const [currentUser, setCurrentUser] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages?roomId=${ROOM_ID}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('[v0] Error fetching messages:', error);
    }
  }, []);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/users?roomId=${ROOM_ID}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setOnlineUsers(data.users || []);
    } catch (error) {
      console.error('[v0] Error fetching users:', error);
    }
  }, []);

  // Poll for updates
  useEffect(() => {
    if (!joined || !currentUser) return;

    const poll = async () => {
      await Promise.all([fetchMessages(), fetchOnlineUsers()]);
    };

    // Initial poll
    poll();

    // Set up interval
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [joined, currentUser, fetchMessages, fetchOnlineUsers]);

  const handleJoinChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      try {
        // Register user
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            roomId: ROOM_ID,
          }),
        });
        if (!response.ok) throw new Error('Failed to join chat');
        
        setCurrentUser(username.trim());
        setJoined(true);
        await fetchMessages();
      } catch (error) {
        console.error('[v0] Error joining chat:', error);
        alert('Failed to join chat');
      }
    }
  };

  const handleSendMessage = async (message: string) => {
    if (message.trim() && currentUser) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: ROOM_ID,
            username: currentUser,
            content: message.trim(),
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('[v0] API error:', errorData);
          throw new Error(errorData.error || 'Failed to send message');
        }
        await fetchMessages();
      } catch (error) {
        console.error('[v0] Error sending message:', error);
      }
    }
  };

  const handleTyping = () => {
    setTypingUsers((prev) => {
      if (!prev.includes(currentUser) && currentUser) {
        return [...prev, currentUser];
      }
      return prev;
    });
  };

  const handleStopTyping = () => {
    setTypingUsers((prev) => prev.filter((u) => u !== currentUser));
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
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Join Chat
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {isConnected ? 'Ready to connect' : 'Connecting...'}
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
