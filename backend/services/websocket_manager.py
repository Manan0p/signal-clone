from typing import Dict, Set
from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
from models.conversation import ConversationParticipant
from models.user import User
from datetime import datetime


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        await self._set_online(user_id, True)
        await self.broadcast_user_status(user_id, True)

    async def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                await self._set_online(user_id, False)
                await self.broadcast_user_status(user_id, False)

    async def _set_online(self, user_id: str, is_online: bool):
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                user.is_online = is_online
                if not is_online:
                    user.last_seen = datetime.utcnow()
                await db.commit()

    async def send_to_user(self, user_id: str, data: dict):
        if user_id in self.active_connections:
            dead_sockets = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(data)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                await self.disconnect(user_id, ws)

    async def broadcast_to_conversation(
        self, conversation_id: str, data: dict, exclude_user_id: str | None = None
    ):
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(ConversationParticipant.user_id).where(
                    ConversationParticipant.conversation_id == conversation_id
                )
            )
            participant_ids = [row[0] for row in result.fetchall()]

        for uid in participant_ids:
            if uid != exclude_user_id:
                await self.send_to_user(uid, data)

    async def broadcast_user_status(self, user_id: str, is_online: bool):
        """Notify all users who share a conversation with user_id"""
        async with AsyncSessionLocal() as db:
            # Get all conversations the user is in
            conv_result = await db.execute(
                select(ConversationParticipant.conversation_id).where(
                    ConversationParticipant.user_id == user_id
                )
            )
            conv_ids = [row[0] for row in conv_result.fetchall()]

            # Get all participants of those conversations (excluding self)
            notified: Set[str] = set()
            for cid in conv_ids:
                p_result = await db.execute(
                    select(ConversationParticipant.user_id).where(
                        ConversationParticipant.conversation_id == cid,
                        ConversationParticipant.user_id != user_id,
                    )
                )
                for row in p_result.fetchall():
                    notified.add(row[0])

        async with AsyncSessionLocal() as db:
            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            last_seen = user.last_seen.isoformat() if user and user.last_seen else None

        payload = {
            "type": "user.online",
            "user_id": user_id,
            "is_online": is_online,
            "last_seen": last_seen,
        }
        for uid in notified:
            await self.send_to_user(uid, payload)


manager = WebSocketManager()
