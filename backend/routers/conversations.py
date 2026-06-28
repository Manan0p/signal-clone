import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from database import get_db
from models.user import User
from models.conversation import Conversation, ConversationParticipant
from models.message import Message
from schemas.conversation import ConversationOut, ConversationCreate, ParticipantOut
from schemas.message import MessageOut, MessageCreate, MarkReadRequest
from schemas.user import UserOut
from services.auth_service import get_current_user
from services.message_service import create_message, get_message_with_sender, get_unread_count
from services.websocket_manager import manager
from datetime import datetime

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


async def build_conversation_out(
    db: AsyncSession, conv: Conversation, current_user_id: str
) -> ConversationOut:
    # Participants
    p_result = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv.id
        )
    )
    participants_raw = p_result.scalars().all()
    participants = []
    for p in participants_raw:
        u_result = await db.execute(select(User).where(User.id == p.user_id))
        u = u_result.scalar_one_or_none()
        if u:
            participants.append(
                ParticipantOut(
                    user_id=p.user_id,
                    role=p.role,
                    joined_at=p.joined_at,
                    user=UserOut.model_validate(u),
                )
            )

    unread = await get_unread_count(db, conv.id, current_user_id)

    return ConversationOut(
        id=conv.id,
        type=conv.type,
        name=conv.name,
        avatar_color=conv.avatar_color,
        created_by=conv.created_by,
        created_at=conv.created_at,
        last_message_id=conv.last_message_id,
        last_message_at=conv.last_message_at,
        last_message_preview=conv.last_message_preview,
        unread_count=unread,
        participants=participants,
    )


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ConversationParticipant.conversation_id).where(
            ConversationParticipant.user_id == current_user.id
        )
    )
    conv_ids = [row[0] for row in result.fetchall()]

    if not conv_ids:
        return []

    conv_result = await db.execute(
        select(Conversation)
        .where(Conversation.id.in_(conv_ids))
        .order_by(Conversation.last_message_at.desc().nullslast())
    )
    convs = conv_result.scalars().all()

    return [await build_conversation_out(db, c, current_user.id) for c in convs]


@router.post("", response_model=ConversationOut)
async def create_conversation(
    req: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if direct conversation already exists
    my_convs = await db.execute(
        select(ConversationParticipant.conversation_id).where(
            ConversationParticipant.user_id == current_user.id
        )
    )
    my_conv_ids = [row[0] for row in my_convs.fetchall()]

    their_convs = await db.execute(
        select(ConversationParticipant.conversation_id).where(
            ConversationParticipant.user_id == req.other_user_id
        )
    )
    their_conv_ids = [row[0] for row in their_convs.fetchall()]

    shared = set(my_conv_ids) & set(their_conv_ids)
    for cid in shared:
        c_result = await db.execute(
            select(Conversation).where(Conversation.id == cid, Conversation.type == "direct")
        )
        existing = c_result.scalar_one_or_none()
        if existing:
            return await build_conversation_out(db, existing, current_user.id)

    # Create new
    other_result = await db.execute(select(User).where(User.id == req.other_user_id))
    other = other_result.scalar_one_or_none()
    if not other:
        raise HTTPException(status_code=404, detail="User not found")

    conv = Conversation(
        id=str(uuid.uuid4()),
        type="direct",
        created_by=current_user.id,
    )
    db.add(conv)

    for uid in [current_user.id, req.other_user_id]:
        p = ConversationParticipant(
            conversation_id=conv.id,
            user_id=uid,
            role="member",
        )
        db.add(p)

    await db.commit()
    await db.refresh(conv)
    return await build_conversation_out(db, conv, current_user.id)


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify participant
    cp = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
        )
    )
    if not cp.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a participant")

    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return await build_conversation_out(db, conv, current_user.id)


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: str,
    cursor: str | None = Query(None),
    limit: int = Query(30, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cp = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
        )
    )
    if not cp.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a participant")

    query = select(Message).where(
        Message.conversation_id == conversation_id,
    ).order_by(Message.created_at.desc()).limit(limit)

    if cursor:
        cursor_result = await db.execute(
            select(Message.created_at).where(Message.id == cursor)
        )
        cursor_ts = cursor_result.scalar_one_or_none()
        if cursor_ts:
            query = query.where(Message.created_at < cursor_ts)

    result = await db.execute(query)
    messages = list(reversed(result.scalars().all()))
    return [await get_message_with_sender(db, m) for m in messages]


@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def send_message(
    conversation_id: str,
    req: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cp = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
        )
    )
    if not cp.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a participant")

    msg = await create_message(
        db, conversation_id, current_user.id, req.content, reply_to_id=req.reply_to_id
    )
    msg_out = await get_message_with_sender(db, msg)

    # Broadcast via WebSocket
    await manager.broadcast_to_conversation(
        conversation_id,
        {"type": "message.new", "message": msg_out.model_dump(mode="json"), "conversation_id": conversation_id},
        exclude_user_id=current_user.id,
    )

    return msg_out


@router.patch("/{conversation_id}/read")
async def mark_read(
    conversation_id: str,
    req: MarkReadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cp_result = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
        )
    )
    cp = cp_result.scalar_one_or_none()
    if not cp:
        raise HTTPException(status_code=403, detail="Not a participant")

    cp.last_read_message_id = req.message_id
    await db.commit()

    # Broadcast read receipt
    msg_result = await db.execute(select(Message).where(Message.id == req.message_id))
    msg = msg_result.scalar_one_or_none()
    if msg and msg.sender_id != current_user.id:
        msg.status = "read"
        await db.commit()
        await manager.send_to_user(
            msg.sender_id,
            {
                "type": "message.status",
                "message_id": req.message_id,
                "status": "read",
                "conversation_id": conversation_id,
            },
        )

    return {"ok": True}
