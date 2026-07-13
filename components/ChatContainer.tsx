'use client';

import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import UserList from './UserList';

interface Message {
  _id?: string;
  username: string;
  content: string;
  timestamp: Date | string;
  editedAt?: Date | string;
}

interface User {
  _id?: string;
  username: string;
  status?: string;
}

interface ChatContainerProps {
  messages: Message[];
  currentUser: string;
  onSendMessage: (message: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  typingUsers: string[];
  onlineUsers: User[];
  isConnected: boolean;
  onLogout: () => void;
}

export default function ChatContainer({
  messages,
  currentUser,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  typingUsers,
  onlineUsers,
  isConnected,
  onLogout,
}: ChatContainerProps) {
  return (
    <div className="flex h-screen bg-white">
      <div className="flex flex-col flex-1">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                General Chat
              </h1>
              <p className="text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {currentUser}
                </p>
                <div
                  className={`w-3 h-3 rounded-full mx-auto mt-1 ${
                    isConnected ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></div>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <MessageList 
          messages={messages} 
          currentUser={currentUser}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
        />
        <TypingIndicator typingUsers={typingUsers} currentUser={currentUser} />
        <MessageInput
          onSend={onSendMessage}
          disabled={!isConnected}
        />
      </div>

      <UserList users={onlineUsers} currentUser={currentUser} />
    </div>
  );
}
