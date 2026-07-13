# Real-Time Chat App - Feature Documentation

## Overview
Enhanced real-time chat application with authentication, message management, direct messaging, and user search capabilities.

## Features Implemented

### 1. Authentication & Session Management
- **Password-based Registration & Login**
  - Secure password hashing using bcryptjs (10 salt rounds)
  - JWT token generation with 30-day expiration
  - Username/password validation on both client and server
  
- **Session Persistence**
  - Auth token stored in localStorage for auto-login
  - User remains logged in after page refresh
  - Auto-load chat without re-entering credentials
  - Logout clears session and sets user status to offline

- **User Registration**
  - Create account with username and password
  - Prevent duplicate usernames
  - Password hashing before storage in MongoDB
  - Automatic login after successful registration

### 2. Message Management
- **Send Messages**
  - Real-time message posting to current room
  - Support for general chat and direct messages
  - Message includes username, content, and timestamp

- **Edit Messages**
  - Users can edit only their own messages
  - Inline edit mode with Save/Cancel buttons
  - Edit button visible on message hover (owner only)
  - Edited messages show "(edited)" label with timestamp

- **Delete Messages**
  - Soft-delete functionality (messages marked as deleted, not removed)
  - Users can delete only their own messages
  - Delete button visible on message hover (owner only)
  - Deleted messages are filtered from display

### 3. User Search & Direct Messaging
- **User Search**
  - Live search with regex matching (case-insensitive)
  - Autocomplete dropdown showing search results
  - Display user status (online/offline) in results
  - Filter out current user from search results

- **Direct Messaging**
  - Start 1-to-1 conversations with any user
  - Unique room IDs using sorted usernames: `dm_user1_user2`
  - Switch between general chat and direct messages
  - Back button to exit DM and return to general chat
  - DM recipient name displayed in chat header

### 4. Room Switching
- **General Chat Room**
  - Default public chat room for all users
  - Access without searching
  - Shows "General Chat" in header

- **Direct Message Rooms**
  - Private 1-to-1 conversations
  - Created dynamically when user selects another user
  - Room name shows recipient username
  - Independent message history per DM

### 5. UI/UX Features
- **Real-time Polling**
  - Messages refresh every 1 second
  - Online users list updates automatically
  - Connected status indicator

- **User Interface**
  - Two-column layout: chat area and sidebar
  - Search Users section at top of sidebar
  - Online Users section below search
  - Connection status badge (green when connected)
  - Logout button in top-right

- **Message Display**
  - Own messages right-aligned with blue background
  - Other messages left-aligned with gray background
  - Username and timestamp for each message
  - "(edited)" indicator for modified messages
  - Edit/Delete buttons appear on hover (owner only)

- **Auth Form**
  - Toggle between Login and Register modes
  - Error messaging for invalid credentials
  - Disabled button states during processing
  - Clear visual indication of form state

## Database Schema

### Users Collection
```javascript
{
  username: String (unique, required),
  password: String (hashed, required),
  status: String (enum: 'online', 'offline', default: 'offline'),
  socketId: String (optional),
  createdAt: Date (default: now)
}
```

### Messages Collection
```javascript
{
  roomId: String (required),
  userId: ObjectId (ref: User),
  username: String (required),
  content: String (required),
  timestamp: Date (default: now),
  editedAt: Date (optional),
  deleted: Boolean (default: false)
}
```

### Chat Rooms Collection
```javascript
{
  name: String (required),
  participants: [ObjectId] (ref: User),
  createdAt: Date (default: now)
}
```

## API Endpoints

### Authentication
- **POST /api/auth**
  - `action: "register"` - Create new account
  - `action: "login"` - Authenticate user
  - Returns: `{ token, user }`

### Users
- **GET /api/users?query=**
  - Search users by username (regex)
  - Optional query parameter for search
  - Returns: `{ users: [{ username, status }] }`

- **POST /api/users**
  - `action: "logout"` - Set user status to offline
  - Returns: `{ success: true }`

### Messages
- **GET /api/messages?roomId=**
  - Fetch messages for specific room
  - Returns: `{ messages: [...] }`

- **POST /api/messages**
  - Send new message to room
  - Body: `{ roomId, username, content }`
  - Returns: `{ message }`

- **PUT /api/messages**
  - Edit existing message
  - Body: `{ messageId, content, username }`
  - Returns: `{ message }`

- **DELETE /api/messages?messageId=&username=**
  - Soft-delete a message
  - Returns: `{ success: true }`

## Component Structure

- **page.tsx** - Main app container, handles auth state and room switching
- **AuthForm.tsx** - Login/Register form with toggle
- **ChatContainer.tsx** - Main chat layout with header, messages, input, and sidebar
- **MessageList.tsx** - Display messages with edit/delete actions
- **MessageInput.tsx** - Input field with send button
- **UserSearch.tsx** - User search dropdown
- **UserList.tsx** - Online users display
- **TypingIndicator.tsx** - Show typing status

## Security Features

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with 30-day expiration
- Per-user message edit/delete authorization
- Session token validation on all protected endpoints
- MongoDB injection prevention with parameterized queries

## How to Use

### Registration
1. Click "Register" on login page
2. Enter desired username and password
3. Submit form
4. Automatically logged in and taken to chat

### Login
1. Enter username and password on login form
2. Submit
3. Redirected to chat if credentials are correct

### Sending Messages
1. Type message in input field at bottom
2. Press Enter or click Send button
3. Message appears in chat

### Editing Messages
1. Hover over your own message
2. Click "Edit" button
3. Modify text and click "Save"
4. Message updates with "(edited)" label

### Deleting Messages
1. Hover over your own message
2. Click "Delete" button
3. Message disappears from chat (soft-deleted)

### Starting Direct Messages
1. Use search field in sidebar
2. Type username to search
3. Click on user from results
4. Direct message room opens
5. Chat is now private 1-to-1 conversation

### Logout
1. Click "Logout" button in top-right
2. Redirected to login page
3. User status set to offline

## Technical Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + localStorage
- **Password Security**: bcryptjs with 10 salt rounds
