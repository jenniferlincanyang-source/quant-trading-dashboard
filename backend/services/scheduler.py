"""
自动更新调度器 — 按不同间隔采集各类数据
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from services.data_fetcher import fetch_and_persist

logger = logging.getLogger("scheduler")

# 采集间隔 (秒)
INTERVALS = {
    "quote": 30,
    "oracle_event": 60,
    "scanner": 60,
    "sector": 120,
    "news": 300,
    "insight_trend": 300,
    "insight_meanrev": 300,
    "insight_statarb": 300,
    "insight_hft": 300,
    "insight_mf": 300,
    "price_tick": 10,
    "fund_flow": 60,
    "capital_alert": 120,
    "trading_alert": 30,
    "huijin": 60,
    "ssf": 60,
    "broker": 60,
}


def _is_trading_hours() -> bool:
    """判断当前是否在交易时段 (工作日 9:00-16:00)"""
    now = datetime.now()
    if now.weekday() >= 5:  # 周六日
        return False
    return 9 <= now.hour < 16


class DataScheduler:
    def __init__(self):
        self._tasks: list[asyncio.Task] = []
        self._running = False

    async def start(self):
        if self._running:
            return
        self._running = True
        logger.info("scheduler starting — %d data types", len(INTERVALS))
        for data_type, interval in INTERVALS.items():
            task = asyncio.create_task(
                self._loop(data_type, interval),
                name=f"sched_{data_type}",
            )
            self._tasks.append(task)

    async def stop(self):
        self._running = False
        for t in self._tasks:
            t.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("scheduler stopped")

    async def _loop(self, data_type: str, interval: int):
        """单类型采集循环"""
        while self._running:
            if _is_trading_hours():
                try:
                    await fetch_and_persist(data_type)
                except Exception as e:
                    logger.error("sched %s error: %s", data_type, e)
            else:
                logger.debug("skip %s — outside trading hours", data_type)
            await asyncio.sleep(interval)


scheduler = DataScheduler()
