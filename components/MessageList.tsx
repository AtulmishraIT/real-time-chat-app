'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  _id?: string;
  username: string;
  content: string;
  timestamp: Date | string;
  editedAt?: Date | string;
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

export default function MessageList({
  messages,
  currentUser,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEditSubmit = (messageId: string) => {
    if (editContent.trim()) {
      onEditMessage(messageId, editContent);
      setEditingId(null);
      setEditContent('');
    }
  };

  const startEdit = (message: Message) => {
    setEditingId(message._id || null);
    setEditContent(message.content);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => {
          const isOwn = message.username === currentUser;
          const isEditing = editingId === message._id;

          return (
            <div
              key={message._id || `${message.timestamp}-${message.username}`}
              className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className="group">
                {isEditing ? (
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => handleEditSubmit(message._id || '')}
                      className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg relative ${
                      isOwn
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
                      {message.editedAt && (
                        <span className="ml-2">(edited)</span>
                      )}
                    </div>

                    {isOwn && (
                      <div className="absolute -right-20 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => startEdit(message)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteMessage(message._id || '')}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={endRef} />
    </div>
  );
}
