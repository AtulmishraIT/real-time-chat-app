'use client';

interface TypingIndicatorProps {
  typingUsers: string[];
  currentUser: string;
}

export default function TypingIndicator({
  typingUsers,
  currentUser,
}: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const otherUsersTyping = typingUsers.filter(
    (user) => user !== currentUser
  );

  if (otherUsersTyping.length === 0) {
    return null;
  }

  const names =
    otherUsersTyping.length === 1
      ? otherUsersTyping[0]
      : otherUsersTyping.slice(0, -1).join(', ') +
        ' and ' +
        otherUsersTyping[otherUsersTyping.length - 1];

  return (
    <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 flex items-center gap-2">
      <span>{names} {otherUsersTyping.length === 1 ? 'is' : 'are'} typing</span>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        ></span>
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        ></span>
      </div>
    </div>
  );
}
