"""
Seed the database with realistic Signal-clone data.
Run: python seed.py
"""
import asyncio
import uuid
from datetime import datetime, timedelta
import random
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, AsyncSessionLocal
from models.user import User
from models.conversation import Conversation, ConversationParticipant, Contact
from models.message import Message

AVATAR_COLORS = [
    "#E57373", "#F06292", "#BA68C8", "#7986CB",
    "#4FC3F7", "#4DB6AC", "#81C784", "#FFD54F",
    "#FF8A65", "#4CAF50",
]

USERS_DATA = [
    {"phone": "+919000000001", "username": "alice", "display_name": "Alice Johnson"},
    {"phone": "+919000000002", "username": "bob", "display_name": "Bob Martinez"},
    {"phone": "+919000000003", "username": "carol", "display_name": "Carol White"},
    {"phone": "+919000000004", "username": "david", "display_name": "David Kim"},
    {"phone": "+919000000005", "username": "emma", "display_name": "Emma Davis"},
    {"phone": "+919000000006", "username": "frank", "display_name": "Frank Wilson"},
    {"phone": "+919000000007", "username": "grace", "display_name": "Grace Lee"},
    {"phone": "+919000000008", "username": "henry", "display_name": "Henry Brown"},
    {"phone": "+919000000009", "username": "iris", "display_name": "Iris Chen"},
    {"phone": "+919000000010", "username": "jack", "display_name": "Jack Taylor"},
]

NOW = datetime.utcnow()

DIRECT_CONVERSATIONS = [
    ("alice", "bob", [
        ("alice", "Hey Bob! How's your day going?", -6 * 24 * 60),
        ("bob", "Pretty good! Just finished the new design mockups. You?", -6 * 24 * 60 + 3),
        ("alice", "Nice! I'd love to take a look at them when you're ready", -6 * 24 * 60 + 7),
        ("bob", "Sure thing, I'll share them after standup", -6 * 24 * 60 + 10),
        ("alice", "Perfect 👍", -6 * 24 * 60 + 12),
        ("bob", "Also, did you see the new Signal update? The stories feature looks interesting", -5 * 24 * 60),
        ("alice", "Yeah! Though I'm not sure about stories in a privacy app haha", -5 * 24 * 60 + 5),
        ("bob", "Fair point 😄", -5 * 24 * 60 + 8),
        ("alice", "Are you coming to the team lunch on Friday?", -3 * 24 * 60),
        ("bob", "Yes! Looking forward to it", -3 * 24 * 60 + 2),
        ("alice", "Great, I'll make a reservation for 12:30", -3 * 24 * 60 + 5),
        ("bob", "Sounds perfect. Hey, can you share the API docs?", -2 * 24 * 60),
        ("alice", "Sure! Here's the link: https://docs.example.com/api", -2 * 24 * 60 + 3),
        ("bob", "Thanks! The websocket section is really helpful", -1 * 24 * 60),
        ("alice", "No problem. Let me know if you have questions", -1 * 24 * 60 + 5),
        ("bob", "Will do. Talk later!", -1 * 24 * 60 + 8),
        ("alice", "Later! 👋", -60),
    ]),
    ("carol", "david", [
        ("carol", "David, do you have the presentation slides ready?", -7 * 24 * 60),
        ("david", "Working on them now. Should be done by tomorrow", -7 * 24 * 60 + 15),
        ("carol", "Great, the client meeting is at 3pm", -7 * 24 * 60 + 20),
        ("david", "Got it. Should I include the Q3 metrics?", -6 * 24 * 60),
        ("carol", "Definitely! And the growth projections too", -6 * 24 * 60 + 5),
        ("david", "Perfect. I'll send you a draft tonight", -6 * 24 * 60 + 8),
        ("carol", "Thanks David! The team is counting on you 🙏", -5 * 24 * 60),
        ("david", "No pressure haha 😅", -5 * 24 * 60 + 3),
        ("carol", "Btw, how's the new apartment?", -4 * 24 * 60),
        ("david", "It's amazing! Finally have a proper home office", -4 * 24 * 60 + 10),
        ("carol", "That's so important for remote work!", -4 * 24 * 60 + 15),
        ("david", "100%! Standing desk and everything 😎", -3 * 24 * 60),
        ("carol", "Living the dream!", -3 * 24 * 60 + 5),
        ("david", "Slides are ready btw, check your email", -2 * 24 * 60),
        ("carol", "Just saw them — they look amazing! Great work!", -2 * 24 * 60 + 30),
        ("david", "Thanks! The client seemed impressed", -1 * 24 * 60),
        ("carol", "They loved it! We got the contract 🎉", -30),
        ("david", "YES! That's amazing news!! 🥳", -25),
        ("carol", "Dinner's on me tonight!", -20),
    ]),
    ("emma", "frank", [
        ("emma", "Frank, quick question about the authentication flow", -5 * 24 * 60),
        ("frank", "Sure, what's up?", -5 * 24 * 60 + 2),
        ("emma", "Should we use refresh tokens or just extend JWT expiry?", -5 * 24 * 60 + 5),
        ("frank", "Definitely refresh tokens. More secure and better UX", -5 * 24 * 60 + 10),
        ("emma", "Makes sense. What about token rotation?", -5 * 24 * 60 + 15),
        ("frank", "Yes, rotate on each refresh. I can show you the implementation", -5 * 24 * 60 + 18),
        ("emma", "That would be great, thanks!", -4 * 24 * 60),
        ("frank", "Also consider using httpOnly cookies instead of localStorage", -4 * 24 * 60 + 5),
        ("emma", "Good point. Prevents XSS attacks", -4 * 24 * 60 + 8),
        ("frank", "Exactly. I'll PR a skeleton implementation", -3 * 24 * 60),
        ("emma", "Reviewed your PR — looks solid! Left a few comments", -2 * 24 * 60),
        ("frank", "Thanks! Addressing them now", -2 * 24 * 60 + 60),
        ("emma", "Merged! Great work 🚀", -1 * 24 * 60),
        ("frank", "Cheers! Let me know if anything breaks", -60),
        ("emma", "Will do. Everything looks good so far!", -30),
    ]),
    ("grace", "henry", [
        ("grace", "Henry! Did you catch the game last night?", -4 * 24 * 60),
        ("henry", "YES! That last-minute goal was insane! 🔥", -4 * 24 * 60 + 5),
        ("grace", "I literally jumped off my couch 😂", -4 * 24 * 60 + 8),
        ("henry", "Same! My neighbors must think I'm crazy", -4 * 24 * 60 + 12),
        ("grace", "Worth it though! Best match this season", -3 * 24 * 60),
        ("henry", "Absolutely. Hey, are you going to the watch party on Saturday?", -3 * 24 * 60 + 5),
        ("grace", "Wouldn't miss it! What time?", -3 * 24 * 60 + 10),
        ("henry", "7pm at Marco's place. Bring snacks!", -3 * 24 * 60 + 15),
        ("grace", "On it. I'll make my famous guacamole 🥑", -2 * 24 * 60),
        ("henry", "Legendary choice 👏", -2 * 24 * 60 + 5),
        ("grace", "See you Saturday! 🎉", -1 * 24 * 60),
        ("henry", "Can't wait!", -1 * 24 * 60 + 5),
    ]),
    ("iris", "jack", [
        ("iris", "Jack, are you free for a quick call?", -3 * 24 * 60),
        ("jack", "In 30 minutes, sure!", -3 * 24 * 60 + 5),
        ("iris", "Perfect, I'll send a calendar invite", -3 * 24 * 60 + 8),
        ("jack", "Got it. Is this about the project proposal?", -3 * 24 * 60 + 12),
        ("iris", "Yes, and also the budget review", -3 * 24 * 60 + 15),
        ("jack", "Alright, I have the numbers ready", -3 * 24 * 60 + 18),
        ("iris", "Great call! I think we're aligned on the roadmap now", -2 * 24 * 60 + 35),
        ("jack", "Agreed. Q4 is going to be intense but exciting", -2 * 24 * 60 + 38),
        ("iris", "100%. Let's catch up again next week", -2 * 24 * 60 + 42),
        ("jack", "Sounds good. Talk soon!", -2 * 24 * 60 + 45),
        ("iris", "Oh and Jack — congrats on the promotion! Well deserved 🎊", -1 * 24 * 60),
        ("jack", "Thank you so much Iris! Means a lot coming from you 😊", -1 * 24 * 60 + 10),
        ("iris", "You've been crushing it. Excited to work more closely!", -1 * 24 * 60 + 15),
        ("jack", "Same here! Big things coming 🚀", -45),
    ]),
]

GROUP_CONVERSATIONS = [
    {
        "name": "Design Team",
        "avatar_color": "#7986CB",
        "created_by": "alice",
        "members": ["alice", "bob", "carol", "david", "emma"],
        "messages": [
            ("alice", "Good morning team! 🌟", -7 * 24 * 60),
            ("bob", "Morning! Ready for the sprint review?", -7 * 24 * 60 + 5),
            ("carol", "Yes! I finished the mockups for the new onboarding flow", -7 * 24 * 60 + 10),
            ("david", "Looking forward to seeing them Carol!", -7 * 24 * 60 + 15),
            ("emma", "Me too! The current onboarding is a bit clunky", -7 * 24 * 60 + 18),
            ("alice", "Agreed. Carol please share in the meeting", -7 * 24 * 60 + 20),
            ("carol", "Will do! I also have 3 alternatives to compare", -6 * 24 * 60),
            ("bob", "Love having options. Makes the decision easier", -6 * 24 * 60 + 5),
            ("david", "Just reviewed the Figma file — the animation on variant B is 🔥", -5 * 24 * 60),
            ("alice", "Ooh I need to look at this", -5 * 24 * 60 + 3),
            ("carol", "Haha thanks David! I spent way too long on that transition 😅", -5 * 24 * 60 + 10),
            ("emma", "Worth it! It feels very premium", -5 * 24 * 60 + 15),
            ("alice", "Team, reminder: design critique tomorrow at 2pm", -4 * 24 * 60),
            ("bob", "In the usual room?", -4 * 24 * 60 + 3),
            ("alice", "Yes, Conference Room B. I'll send a calendar update", -4 * 24 * 60 + 5),
            ("david", "Who's presenting?", -3 * 24 * 60),
            ("carol", "Me and Bob are co-presenting", -3 * 24 * 60 + 5),
            ("emma", "Excited to see the full walkthrough!", -3 * 24 * 60 + 8),
            ("bob", "The critique went really well! Great feedback from the stakeholders", -2 * 24 * 60 + 180),
            ("carol", "Yes! They especially loved the micro-animations", -2 * 24 * 60 + 185),
            ("alice", "Fantastic work everyone! 🎉 Let's keep this momentum", -2 * 24 * 60 + 190),
            ("david", "Next up: the dashboard redesign?", -1 * 24 * 60),
            ("alice", "Exactly. I'll create tickets today", -1 * 24 * 60 + 5),
            ("emma", "Looking forward to it! This team rocks 💪", -60),
            ("bob", "The best! 🚀", -50),
        ],
    },
    {
        "name": "Weekend Plans",
        "avatar_color": "#4FC3F7",
        "created_by": "grace",
        "members": ["grace", "henry", "iris", "jack"],
        "messages": [
            ("grace", "Guys! Anyone up for hiking this weekend? 🏔️", -5 * 24 * 60),
            ("henry", "I'm in! Which trail?", -5 * 24 * 60 + 10),
            ("iris", "Yes please! I need some fresh air", -5 * 24 * 60 + 15),
            ("jack", "Count me in! Haven't hiked in ages", -5 * 24 * 60 + 20),
            ("grace", "How about the ridge trail? It's about 8km, stunning views", -5 * 24 * 60 + 25),
            ("henry", "Perfect difficulty level! Not too easy, not too hard", -4 * 24 * 60),
            ("iris", "8km sounds good. What time are we starting?", -4 * 24 * 60 + 5),
            ("grace", "8am? Beat the afternoon heat", -4 * 24 * 60 + 10),
            ("jack", "Early bird! But yes, 8am works", -4 * 24 * 60 + 15),
            ("henry", "I'll bring sandwiches for everyone 🥪", -3 * 24 * 60),
            ("iris", "You're the best Henry! I'll bring the trail mix and energy bars", -3 * 24 * 60 + 5),
            ("grace", "I'll bring water and a first aid kit", -3 * 24 * 60 + 10),
            ("jack", "I'll bring my portable speaker. Hiking playlist incoming 🎵", -3 * 24 * 60 + 15),
            ("grace", "Perfect! We're all set then", -2 * 24 * 60),
            ("henry", "Can't wait! The weather forecast looks great", -2 * 24 * 60 + 5),
            ("iris", "Sunny and 22°C 😍 Perfect hiking weather", -2 * 24 * 60 + 10),
            ("jack", "Let's meetup at the trailhead parking lot?", -1 * 24 * 60),
            ("grace", "Yes! Sending the location 📍", -1 * 24 * 60 + 5),
            ("henry", "See everyone tomorrow morning! This is gonna be great 🌄", -30),
            ("iris", "SO excited! See you all at 8! 🥾", -20),
        ],
    },
]


async def seed():
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        count = await db.execute(select(func.count(User.id)))
        if count.scalar() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # Create users
        user_map: dict[str, User] = {}
        for i, ud in enumerate(USERS_DATA):
            user = User(
                id=str(uuid.uuid4()),
                phone_number=ud["phone"],
                username=ud["username"],
                display_name=ud["display_name"],
                avatar_color=AVATAR_COLORS[i % len(AVATAR_COLORS)],
                about="Hey there! I am using Signal.",
                is_online=random.random() > 0.7,
                last_seen=NOW - timedelta(minutes=random.randint(5, 1440)),
            )
            db.add(user)
            user_map[ud["username"]] = user

        await db.flush()
        print(f"Created {len(user_map)} users")

        # Add contacts (everyone knows everyone in seed data)
        for u1 in user_map.values():
            for u2 in user_map.values():
                if u1.id != u2.id:
                    contact = Contact(user_id=u1.id, contact_id=u2.id)
                    db.add(contact)
        await db.flush()

        # Create direct conversations
        for sender_uname, receiver_uname, msgs in DIRECT_CONVERSATIONS:
            sender = user_map[sender_uname]
            receiver = user_map[receiver_uname]

            conv = Conversation(
                id=str(uuid.uuid4()),
                type="direct",
                created_by=sender.id,
            )
            db.add(conv)
            await db.flush()

            for uid in [sender.id, receiver.id]:
                p = ConversationParticipant(
                    conversation_id=conv.id,
                    user_id=uid,
                    role="member",
                )
                db.add(p)

            last_msg = None
            for msg_sender_uname, content, offset_minutes in msgs:
                msg_sender = user_map[msg_sender_uname]
                msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conv.id,
                    sender_id=msg_sender.id,
                    content=content,
                    type="text",
                    status="read",
                    created_at=NOW + timedelta(minutes=offset_minutes),
                )
                db.add(msg)
                last_msg = msg

            if last_msg:
                preview = last_msg.content if len(last_msg.content) <= 80 else last_msg.content[:77] + "..."
                conv.last_message_id = last_msg.id
                conv.last_message_at = last_msg.created_at
                conv.last_message_preview = preview

            await db.flush()

        print(f"Created {len(DIRECT_CONVERSATIONS)} direct conversations")

        # Create group conversations
        for gd in GROUP_CONVERSATIONS:
            creator = user_map[gd["created_by"]]
            conv = Conversation(
                id=str(uuid.uuid4()),
                type="group",
                name=gd["name"],
                avatar_color=gd["avatar_color"],
                created_by=creator.id,
            )
            db.add(conv)
            await db.flush()

            for uname in gd["members"]:
                u = user_map[uname]
                role = "admin" if uname == gd["created_by"] else "member"
                p = ConversationParticipant(
                    conversation_id=conv.id,
                    user_id=u.id,
                    role=role,
                )
                db.add(p)

            # System message for group creation
            system_msg = Message(
                id=str(uuid.uuid4()),
                conversation_id=conv.id,
                sender_id=None,
                content=f'{creator.display_name} created the group "{gd["name"]}"',
                type="system",
                status="read",
                created_at=NOW - timedelta(days=8),
            )
            db.add(system_msg)

            last_msg = None
            for msg_sender_uname, content, offset_minutes in gd["messages"]:
                msg_sender = user_map[msg_sender_uname]
                msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conv.id,
                    sender_id=msg_sender.id,
                    content=content,
                    type="text",
                    status="read",
                    created_at=NOW + timedelta(minutes=offset_minutes),
                )
                db.add(msg)
                last_msg = msg

            if last_msg:
                preview = last_msg.content if len(last_msg.content) <= 80 else last_msg.content[:77] + "..."
                conv.last_message_id = last_msg.id
                conv.last_message_at = last_msg.created_at
                conv.last_message_preview = preview

            await db.flush()

        print(f"Created {len(GROUP_CONVERSATIONS)} group conversations")
        await db.commit()
        print("✅ Database seeded successfully!")
        print("\nLogin credentials (OTP: 123456):")
        for ud in USERS_DATA:
            print(f"  {ud['display_name']}: {ud['phone']}")


if __name__ == "__main__":
    asyncio.run(seed())
