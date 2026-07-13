'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ChatContainer from '@/components/ChatContainer';
import AuthForm from '@/components/AuthForm';

interface Message {
  _id?: string;
  username: string;
  content: string;
  timestamp: Date | string;
  edited?: boolean;
  editedAt?: Date | string;
  deleted?: boolean;
}

interface User {
  _id?: string;
  username: string;
  status?: string;
}

const ROOM_ID = 'general';
const POLL_INTERVAL = 1000;

export default function Page() {
  const [currentUser, setCurrentUser] = useState('');
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username');

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setCurrentUser(savedUsername);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/messages?roomId=${ROOM_ID}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      // Filter out deleted messages
      setMessages((data.messages || []).filter((m: Message) => !m.deleted));
    } catch (error) {
      console.error('[v0] Error fetching messages:', error);
    }
  }, [token]);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setOnlineUsers(data.users || []);
    } catch (error) {
      console.error('[v0] Error fetching users:', error);
    }
  }, [token]);

  // Poll for updates
  useEffect(() => {
    if (!isAuthenticated || !currentUser || !token) return;

    const poll = async () => {
      await Promise.all([fetchMessages(), fetchOnlineUsers()]);
    };

    poll();
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isAuthenticated, currentUser, token, fetchMessages, fetchOnlineUsers]);

  const handleAuthSuccess = (username: string, authToken: string) => {
    setCurrentUser(username);
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('username', username);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', username: currentUser }),
      });
    } catch (error) {
      console.error('[v0] Error logging out:', error);
    }
    
    setCurrentUser('');
    setToken('');
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
  };

  const handleSendMessage = async (message: string) => {
    if (message.trim() && currentUser && token) {
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
        if (!response.ok) throw new Error('Failed to send message');
        await fetchMessages();
      } catch (error) {
        console.error('[v0] Error sending message:', error);
      }
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          content: newContent,
          username: currentUser,
        }),
      });
      if (!response.ok) throw new Error('Failed to edit message');
      await fetchMessages();
    } catch (error) {
      console.error('[v0] Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(
        `/api/messages?messageId=${messageId}&username=${currentUser}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete message');
      await fetchMessages();
    } catch (error) {
      console.error('[v0] Error deleting message:', error);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <ChatContainer
      messages={messages}
      currentUser={currentUser}
      onSendMessage={handleSendMessage}
      onEditMessage={handleEditMessage}
      onDeleteMessage={handleDeleteMessage}
      typingUsers={typingUsers}
      onlineUsers={onlineUsers}
      isConnected={true}
      onLogout={handleLogout}
    />
  );
}
