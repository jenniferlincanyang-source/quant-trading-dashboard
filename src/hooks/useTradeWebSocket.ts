'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export interface TradeWsMessage {
  type: 'connected' | 'trade_executed' | 'order_update' | 'heartbeat' | 'pong' | 'subscribed';
  order_id?: string;
  stock_code?: string;
  stock_name?: string;
  direction?: string;
  filled_volume?: number;
  filled_price?: number;
  status?: string;
  message?: string;
  timestamp?: string;
}

export function useTradeWebSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<TradeWsMessage | null>(null);
  const [executions, setExecutions] = useState<TradeWsMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket('ws://localhost:8000/ws/trade');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'trade' }));
    };

    ws.onmessage = (e) => {
      try {
        const msg: TradeWsMessage = JSON.parse(e.data);
        setLastMessage(msg);

        if (msg.type === 'trade_executed' || msg.type === 'order_update') {
          setExecutions(prev => [msg, ...prev].slice(0, 50));
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendPing = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'ping' }));
  }, []);

  return { connected, lastMessage, executions, sendPing };
}
