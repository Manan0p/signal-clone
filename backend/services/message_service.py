import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models.message import Message, MessageRead
from models.conversation import Conversation, ConversationParticipant
from schemas.message import MessageOut
from schemas.user import UserOut
from models.user import User


async def create_message(
    db: AsyncSession,
    conversation_id: str,
    sender_id: str,
    content: str,
    msg_type: str = "text",
    reply_to_id: str | None = None,
    attachment_url: str | None = None,
) -> Message:
    msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        type=msg_type,
        status="sent",
        reply_to_id=reply_to_id,
        attachment_url=attachment_url,
        created_at=datetime.utcnow(),
    )
    db.add(msg)

    # Update conversation last message
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_result.scalar_one_or_none()
    if conv:
        conv.last_message_id = msg.id
        conv.last_message_at = msg.created_at
        if content:
            preview = content if len(content) <= 80 else content[:77] + "..."
        else:
            preview = "[Attachment]"
        conv.last_message_preview = preview

    await db.commit()
    await db.refresh(msg)
    return msg


async def get_message_with_sender(db: AsyncSession, msg: Message) -> MessageOut:
    sender = None
    if msg.sender_id:
        result = await db.execute(select(User).where(User.id == msg.sender_id))
        sender_obj = result.scalar_one_or_none()
        if sender_obj:
            sender = UserOut.model_validate(sender_obj)

    reply_to = None
    if msg.reply_to_id:
        result = await db.execute(select(Message).where(Message.id == msg.reply_to_id))
        reply_msg = result.scalar_one_or_none()
        if reply_msg and reply_msg.sender_id:
            sr = await db.execute(select(User).where(User.id == reply_msg.sender_id))
            reply_sender = sr.scalar_one_or_none()
            from schemas.message import ReplyInfo
            reply_to = ReplyInfo(
                id=reply_msg.id,
                content=reply_msg.content,
                sender_display_name=reply_sender.display_name if reply_sender else "Unknown",
            )

    return MessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        content=msg.content,
        type=msg.type,
        status=msg.status,
        reply_to_id=msg.reply_to_id,
        created_at=msg.created_at,
        edited_at=msg.edited_at,
        is_deleted=msg.is_deleted,
        attachment_url=msg.attachment_url,
        sender=sender,
        reply_to=reply_to,
    )


async def get_unread_count(db: AsyncSession, conversation_id: str, user_id: str) -> int:
    # Get user's last read message
    cp_result = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    cp = cp_result.scalar_one_or_none()
    if not cp:
        return 0

    query = select(func.count(Message.id)).where(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,
        Message.is_deleted == False,  # noqa: E712
    )

    if cp.last_read_message_id:
        # Get the timestamp of the last read message
        lr_result = await db.execute(
            select(Message.created_at).where(Message.id == cp.last_read_message_id)
        )
        lr_ts = lr_result.scalar_one_or_none()
        if lr_ts:
            query = query.where(Message.created_at > lr_ts)

    result = await db.execute(query)
    return result.scalar() or 0
