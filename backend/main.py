import sys
import asyncio

if sys.platform == 'win32':
    # Workaround for https://github.com/encode/uvicorn/issues/1183
    # Suppresses noisy "ConnectionResetError: [WinError 10054]" in ProactorEventLoop
    from functools import wraps
    try:
        from asyncio.proactor_events import _ProactorBasePipeTransport
        def patched_call_connection_lost(self, exc):
            try:
                self._original_call_connection_lost(exc)
            except ConnectionResetError:
                pass
        _ProactorBasePipeTransport._original_call_connection_lost = _ProactorBasePipeTransport._call_connection_lost
        _ProactorBasePipeTransport._call_connection_lost = patched_call_connection_lost
    except ImportError:
        pass

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db
from routers import auth, users, conversations, groups, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Signal Clone API", version="1.0.0", lifespan=lifespan)

# Allow configured origins (comma-separated in env) or default to localhost
cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_origins_env:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(conversations.router)
app.include_router(groups.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
