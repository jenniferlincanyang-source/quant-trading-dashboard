"""WebSocket 路由 — 实时推送成交结果"""
from __future__ import annotations
import asyncio
import json
import logging
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()

# 活跃连接池
_connections: set[WebSocket] = set()


async def broadcast(message: dict) -> None:
    """向所有连接推送消息"""
    dead: set[WebSocket] = set()
    payload = json.dumps(message, ensure_ascii=False, default=str)
    for ws in _connections:
        try:
            await ws.send_text(payload)
        except Exception:
            dead.add(ws)
    _connections.difference_update(dead)


@router.websocket("/ws/trade")
async def trade_websocket(ws: WebSocket):
    await ws.accept()
    _connections.add(ws)
    logger.info("WebSocket 连接: %s (在线 %d)", ws.client, len(_connections))

    try:
        # 发送欢迎消息
        await ws.send_text(json.dumps({
            "type": "connected",
            "message": "实盘交易 WebSocket 已连接",
            "timestamp": datetime.now().isoformat(),
        }))

        # 心跳 + 监听
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=30)
                msg = json.loads(data)

                if msg.get("type") == "ping":
                    await ws.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat(),
                    }))
                elif msg.get("type") == "subscribe":
                    await ws.send_text(json.dumps({
                        "type": "subscribed",
                        "channel": msg.get("channel", "trade"),
                        "timestamp": datetime.now().isoformat(),
                    }))

            except asyncio.TimeoutError:
                # 30s 无消息, 发心跳
                await ws.send_text(json.dumps({
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat(),
                }))

    except WebSocketDisconnect:
        pass
    finally:
        _connections.discard(ws)
        logger.info("WebSocket 断开 (在线 %d)", len(_connections))
