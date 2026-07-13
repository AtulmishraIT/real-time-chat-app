'use client';

import { useState, useCallback } from 'react';

interface User {
  _id?: string;
  username: string;
  status?: string;
}

interface UserSearchProps {
  currentUser: string;
  onSelectUser: (username: string) => void;
}

export default function UserSearch({ currentUser, onSelectUser }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await fetch(`/api/users?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      
      // Filter out current user
      const filtered = (data.users || []).filter(
        (u: User) => u.username !== currentUser
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('[v0] Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentUser]);

  const handleSelectUser = (username: string) => {
    onSelectUser(username);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search users..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-sm text-gray-500">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">No users found</div>
          ) : (
            <ul>
              {searchResults.map((user) => (
                <li key={user._id || user.username}>
                  <button
                    onClick={() => handleSelectUser(user.username)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-100 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-medium text-gray-900">{user.username}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
