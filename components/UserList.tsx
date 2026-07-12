'use client';

interface User {
  _id?: string;
  username: string;
  status?: string;
}

interface UserListProps {
  users: User[];
  currentUser: string;
}

export default function UserList({ users, currentUser }: UserListProps) {
  return (
    <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 hidden lg:flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-4">Online Users</h3>
      <div className="space-y-2 overflow-y-auto flex-1">
        {users && users.length > 0 ? (
          users.map((user) => (
            <div
              key={user._id || user.username}
              className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200"
            >
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-900">
                {user.username}
                {user.username === currentUser && (
                  <span className="text-xs text-gray-500"> (you)</span>
                )}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No users online</p>
        )}
      </div>
    </div>
  );
}
