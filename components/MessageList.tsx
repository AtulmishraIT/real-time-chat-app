'use client';

import { useEffect, useRef } from 'react';

interface Message {
  _id?: string;
  username: string;
  content: string;
  timestamp: Date | string;
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
}

export default function MessageList({
  messages,
  currentUser,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message._id || `${message.timestamp}-${message.username}`}
            className={`flex gap-3 ${
              message.username === currentUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.username === currentUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <div className="text-xs font-semibold mb-1">
                {message.username}
              </div>
              <p className="text-sm break-words">{message.content}</p>
              <div className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}
