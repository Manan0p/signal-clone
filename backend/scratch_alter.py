import asyncio
from sqlalchemy import text
from database import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE messages ADD COLUMN attachment_url TEXT;"))
            print("Successfully added attachment_url column.")
        except Exception as e:
            print(f"Error (column might already exist?): {e}")

if __name__ == "__main__":
    asyncio.run(main())
