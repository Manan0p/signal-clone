import { WSEvent } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

type EventHandler = (event: WSEvent) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private token: string | null = null;
  private handlers: Set<EventHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 10;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isIntentionalDisconnect = false;

  connect(userId: string, token: string) {
    this.userId = userId;
    this.token = token;
    this.isIntentionalDisconnect = false;
    this._connect();
  }

  private _connect() {
    if (!this.userId || !this.token) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = `${WS_URL}/ws/${this.userId}?token=${this.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._startPing();
      this.handlers.forEach((h) => h({ type: 'system.connected' } as any));
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WSEvent;
        this.handlers.forEach((h) => h(data));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this._stopPing();
      if (!this.isIntentionalDisconnect) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnects) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this._connect(), delay);
  }

  private _startPing() {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 25000);
  }

  private _stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.userId = null;
    this.token = null;
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();
