# Signal Clone: Secure Real-Time Messenger

A pixel-perfect clone of the **Signal Messenger** application featuring a Next.js (TypeScript) frontend and a FastAPI (Python) backend connected via REST APIs and WebSockets for real-time secure messaging.

**🌐 Live Demo:** https://signal-clone-nu.vercel.app/

---

## 🎯 What This Project Does

Signal Clone is built around a secure real-time messaging flow: **sign in with a phone number → customize profile avatar and display details → connect with contacts → create group or direct chats → message in real time with receipt indicators, attachments, and thread replies**.

It helps you:
- Exchange secure direct messages asynchronously using real-time WebSockets
- Track message lifecycle status: sending, sent, delivered, and read
- Upload, render, and view image attachments up to 2MB in a fullscreen lightbox
- Reply directly to specific messages in a chat to quote them
- Manage multi-member group conversations with real-time system notification logs
- Keep multiple browser tabs/windows perfectly synchronized for the same user session

---

## 📐 Architecture Overview

```ascii
+-----------------------+           REST API (JSON)            +----------------------+
|                       |  --------------------------------->  |                      |
|    Next.js Client     |                                      |    FastAPI Server    |
|  (Zustand + React)    |  <---------------------------------  | (Python + Uvicorn)   |
|                       |                                      |                      |
|   +---------------+   |           WebSockets (ws://)         |   +--------------+   |
|   | wsManager.ts  |   |  <================================>  |   | WS Manager   |   |
|   +---------------+   |      message.new, typing, read       |   +--------------+   |
+-----------------------+                                      +----------+-----------+
                                                                          |
                                                                          v
                                                                 +------------------+
                                                                 |  SQLite (Local)  |
                                                                 +------------------+
```

---

## ✨ Core Features

- **🔐 Authentication & Onboarding** - Simple phone/username signup with a mock OTP (`123456`), display name configuration, and profile color setting.
- **🧭 Contacts & Conversation List** - Sidebar containing active chats sorted dynamically by the most recent message timestamp. Search bar filters chats on-the-fly.
- **💬 Real-Time Direct Messaging** - WebSockets broadcast text and image attachments instantly, rendering delivery checks, typing indicators, and message status tags.
- **👥 Multiple Connection Sync** - WebSocket connections support multiple tabs per user simultaneously to prevent missing incoming payloads.
- **📦 Group Messaging** - Custom group conversations with system message logging on member joins, departures, or creations.
- **🔧 Group Admin Controls** - Group admins can add new participants or remove existing members from the active panel.
- **🖼️ Image Attachments** - Upload base64-encoded image attachments under 2MB and view them in a responsive fullscreen gallery lightbox.
- **💬 Threaded / Quoted Messages** - Hover on messages to quote and reply to them contextually.
- **🌙 Dark/Light Mode** - Pure CSS variables that toggle styles instantly without re-rendering components.
- **🔒 End-to-End Encryption Banner** - Visual system notices placed at the top of chats to simulate privacy-first protocols.

---

## 👥 Who Is This For?

Great for learning/building:
- **FastAPI WebSockets**: Multi-connection managers, token verification, and real-time state broadcasts
- **Next.js 14/15**: Routing, Zustand integration, component drilling, and responsive design
- **State Synchronizations**: Handling store lists, chronologically sorting socket events, and unread counts
- **Asynchronous Databases**: Database transactions using SQLAlchemy async sessions and SQLite

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14/15** - App Router framework
- **React 18/19** - UI Library
- **Zustand** - Global state stores for auth, conversations, and message logs
- **Vanilla CSS** - Signal color system custom variables (in `globals.css`)
- **Emoji Picker React** - Inline emoji keyboards
- **Date-fns** - Clean timestamp formatting

### Backend & Services
- **FastAPI** - Python framework
- **SQLAlchemy (Async)** - ORM mapping
- **Python Jose** - JWT verification
- **Uvicorn** - High-performance server hosting

### Database
- **SQLite (Default)** - Local file database (`signal.db`)
- **PostgreSQL (Optional)** - Production cloud database (e.g. Supabase connection keys)

---

## 📁 Project Structure

```text
signal-clone/
├── backend/                      # Python FastAPI Backend
│   ├── models/                   # Database models (User, Message, Conversation)
│   ├── routers/                  # API endpoints (Auth, Users, Conversations, Groups, WebSockets)
│   ├── schemas/                  # Pydantic schemas (Request/Response validation)
│   ├── services/                 # Business logic modules (Auth, WS Manager, Message updates)
│   ├── database.py               # SQLite connection / async engine setup
│   ├── seed.py                   # SQLite test database seeder
│   └── main.py                   # FastAPI entrypoint
├── frontend/                     # Next.js Frontend
│   ├── app/                      # App router layouts and chat pages
│   ├── components/               # UI components
│   │   ├── auth/                 # Login & Registration views
│   │   ├── chat/                 # MessageList, MessageInput, ChatHeader, DeliveryStatus
│   │   ├── common/               # Shared Avatar, Toasts, EmptyState
│   │   ├── modals/               # NewChat, NewGroup, GroupInfo, Image Lightbox
│   │   └── settings/             # SettingsPanel (theme and profile toggles)
│   ├── hooks/                    # React Hooks (useMessages, useWebSocket)
│   ├── lib/                      # Client modules (api, date timezone utilities, wsManager)
│   └── stores/                   # Zustand stores (authStore, conversationStore, messageStore)
└── .gitignore                    # Comprehensive ignore files
```

---

## 🚀 Quick Start

### 1) Prerequisites
- Node.js 18+
- Python 3.11+
- SQLite or PostgreSQL

### 2) Backend Setup
Navigate to the `backend` directory and activate a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```
Install backend requirements:
```bash
pip install -r requirements.txt
```
Seed the database with test profiles and message records:
```bash
python seed.py
```
Start the FastAPI hot-reload server:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3) Frontend Setup
Navigate to the `frontend` directory in a new terminal:
```bash
cd frontend
npm install
```
Start the Next.js local development server:
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

### 4) Seed Data Login Credentials
Log in using any of the seeded phone numbers. The OTP for all accounts is `123456`.
- **Alice Johnson**: `+919000000001`
- **Bob Martinez**: `+919000000002`
- **Carol White**: `+919000000003`

---

## 🌐 API Routes

| Endpoint | Methods | Purpose |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Create a new user profile |
| `/api/auth/login` | `POST` | Authenticate using a phone number + fixed OTP |
| `/api/auth/logout` | `POST` | Discard active user JWT session |
| `/api/auth/me` | `GET` | Get current user's profile |
| `/api/users/search` | `GET` | Search global users by username or phone |
| `/api/users/me/contacts` | `GET`, `POST` | Retrieve or append users to personal contacts |
| `/api/conversations` | `GET`, `POST` | Fetch conversation items or initialize DMs |
| `/api/conversations/{id}/messages` | `GET` | Paginated message logs (cursor-based loading) |
| `/api/conversations/{id}/read` | `PATCH` | Broadcast read-receipt timestamp updates |
| `/api/groups` | `POST`, `PATCH` | Create groups or modify name/color settings |
| `/api/groups/{id}/members` | `GET`, `POST` | Fetch group members or append new participants |
| `/api/groups/{id}/members/{user_id}` | `DELETE` | Leave groups or remove specific participants |

### 🔌 WebSocket Gateway
Endpoint: `WS /ws/{user_id}?token={jwt_token}`

*   **Client → Server Payload Examples:**
    ```json
    { "type": "message.send", "conversation_id": "uuid", "content": "Hello!", "attachment": "data:image/...", "reply_to_id": "uuid" }
    { "type": "typing.start", "conversation_id": "uuid" }
    { "type": "typing.stop", "conversation_id": "uuid" }
    { "type": "message.read", "conversation_id": "uuid", "message_id": "uuid" }
    ```
*   **Server → Client Payload Examples:**
    ```json
    { "type": "message.new", "message": { ... }, "conversation_id": "uuid" }
    { "type": "message.status", "message_id": "uuid", "status": "read", "conversation_id": "uuid" }
    { "type": "typing.indicator", "conversation_id": "uuid", "user_id": "uuid", "is_typing": true }
    ```

---

## 💾 Database Schema (SQLite / PostgreSQL)

### `User`
- Unique mappings: `phone_number` and `username`
- Fields: `id`, `display_name`, `avatar_color`, `avatar_url`, `about`, `is_online`, `last_seen`, `created_at`

### `Conversation`
- Types: `"direct"` or `"group"`
- Fields: `id`, `name`, `avatar_color`, `created_by`, `created_at`, `last_message_id`, `last_message_at`, `last_message_preview`

### `ConversationParticipant`
- Links users to chats: `conversation_id` and `user_id` (Composite Primary Key)
- Fields: `role` (`"admin"` / `"member"`), `joined_at`, `last_read_message_id`

### `Message`
- Messages registry: `id` (Primary Key)
- Fields: `conversation_id`, `sender_id`, `content`, `type` (`"text"` / `"system"`), `status` (`"sent"` / `"delivered"` / `"read"`), `reply_to_id`, `attachment_url`, `created_at`, `is_deleted`

---

## 📊 How It Works (End-to-End Flow)

1. **Connection**: Frontend triggers the WebSocket connection using the active user's JWT. `WebSocketManager` registers the socket, flags the user `is_online = True` in SQL, and broadcasts the status update.
2. **Conversation**: A user clicks an active chat. The client fetches its messages using cursor-based pagination and marks unread messages as `read`.
3. **Sending**: Typing triggers `typing.start` and `typing.stop` indicators. Submitting a message transmits a JSON packet containing text content, optional file attachments, or parent reply identifiers.
4. **Broadcasting**: The server saves the record to the database, sends the confirmation back to all open tabs of the sender, and broadcasts the new message payload to all other active WebSocket endpoints representing members of the conversation.

---

## 🐛 Troubleshooting

| Issue | Likely Cause | Fix |
| :--- | :--- | :--- |
| Disconnected live updates | Socket closed or session expired | Hard refresh page to verify authorization and reconnect |
| Messages out-of-order | Network lag or browser clock lag | The client's store automatically performs `created_at` sorting, so refreshing or reconnecting corrects the order |
| Blank sidebar preview | Attachment text is not specified | Check image formats; files under 2MB are automatically converted to `[Attachment]` indicators |
| Missing newly created group | WebSockets sync failed | Open chats or trigger a message to fetch groups, or perform a manual browser reload |

---

## 🚢 Building for Production

### Backend Build
Ensure a production-grade database URL is configured in your `.env` variables and start the server:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Build
Compile static optimizations:
```bash
npm run build
npm run start
```

---

**Copyright © 2026 Manan**
