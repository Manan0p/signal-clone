from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from services.auth_service import decode_token
from services.websocket_manager import manager
from services.message_service import create_message, get_message_with_sender
from database import AsyncSessionLocal
from models.conversation import ConversationParticipant, Conversation
from models.message import Message
from models.user import User
from sqlalchemy import select
import json

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
):
    # Verify token
    try:
        token_user_id = decode_token(token)
        if token_user_id != user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = data.get("type")

            if event_type == "ping":
                await manager.send_to_user(user_id, {"type": "pong"})

            elif event_type == "message.send":
                conversation_id = data.get("conversation_id")
                content = data.get("content", "").strip()
                reply_to_id = data.get("reply_to_id")
                attachment = data.get("attachment")

                if not conversation_id or (not content and not attachment):
                    continue

                async with AsyncSessionLocal() as db:
                    # Verify participant
                    cp = await db.execute(
                        select(ConversationParticipant).where(
                            ConversationParticipant.conversation_id == conversation_id,
                            ConversationParticipant.user_id == user_id,
                        )
                    )
                    if not cp.scalar_one_or_none():
                        continue

                    msg = await create_message(db, conversation_id, user_id, content, reply_to_id=reply_to_id, attachment_url=attachment)
                    msg_out = await get_message_with_sender(db, msg)

                msg_dict = msg_out.model_dump(mode="json")

                # Send back to sender
                await manager.send_to_user(user_id, {
                    "type": "message.new",
                    "message": msg_dict,
                    "conversation_id": conversation_id,
                })

                # Broadcast to others
                await manager.broadcast_to_conversation(
                    conversation_id,
                    {"type": "message.new", "message": msg_dict, "conversation_id": conversation_id},
                    exclude_user_id=user_id,
                )

            elif event_type == "typing.start":
                conversation_id = data.get("conversation_id")
                if conversation_id:
                    async with AsyncSessionLocal() as db:
                        u_res = await db.execute(select(User).where(User.id == user_id))
                        u = u_res.scalar_one_or_none()
                        display_name = u.display_name if u else "Someone"

                    await manager.broadcast_to_conversation(
                        conversation_id,
                        {
                            "type": "typing.indicator",
                            "conversation_id": conversation_id,
                            "user_id": user_id,
                            "display_name": display_name,
                            "is_typing": True,
                        },
                        exclude_user_id=user_id,
                    )

            elif event_type == "typing.stop":
                conversation_id = data.get("conversation_id")
                if conversation_id:
                    await manager.broadcast_to_conversation(
                        conversation_id,
                        {
                            "type": "typing.indicator",
                            "conversation_id": conversation_id,
                            "user_id": user_id,
                            "is_typing": False,
                        },
                        exclude_user_id=user_id,
                    )

            elif event_type == "message.read":
                conversation_id = data.get("conversation_id")
                message_id = data.get("message_id")
                if conversation_id and message_id:
                    async with AsyncSessionLocal() as db:
                        cp_result = await db.execute(
                            select(ConversationParticipant).where(
                                ConversationParticipant.conversation_id == conversation_id,
                                ConversationParticipant.user_id == user_id,
                            )
                        )
                        cp = cp_result.scalar_one_or_none()
                        if cp:
                            cp.last_read_message_id = message_id
                            msg_result = await db.execute(
                                select(Message).where(Message.id == message_id)
                            )
                            msg = msg_result.scalar_one_or_none()
                            if msg and msg.sender_id and msg.sender_id != user_id:
                                msg.status = "read"
                                await db.commit()
                                await manager.send_to_user(
                                    msg.sender_id,
                                    {
                                        "type": "message.status",
                                        "message_id": message_id,
                                        "status": "read",
                                        "conversation_id": conversation_id,
                                    },
                                )
                            else:
                                await db.commit()

    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)
    except Exception:
        await manager.disconnect(user_id, websocket)
