"""
数据采集服务 — 调用 akshare_service 并持久化到 SQLite
"""
from __future__ import annotations

import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiosqlite

from db import get_db

# 把 scripts/ 加入 sys.path 以便 import akshare_service
_scripts_dir = str(Path(__file__).resolve().parent.parent.parent / "scripts")
if _scripts_dir not in sys.path:
    sys.path.insert(0, _scripts_dir)

import akshare_service as aks  # noqa: E402

logger = logging.getLogger("data_fetcher")

# ── 采集函数映射 ──
FETCH_MAP = {
    "oracle_event": aks.get_oracle_events,
    "news": aks.get_event_news,
    "insight_trend": lambda: aks.get_strategy_insights("trend_follow"),
    "insight_meanrev": lambda: aks.get_strategy_insights("mean_reversion"),
    "insight_statarb": lambda: aks.get_strategy_insights("stat_arb"),
    "insight_hft": lambda: aks.get_strategy_insights("hft"),
    "insight_mf": lambda: aks.get_strategy_insights("multi_factor"),
    "quote": lambda: aks.get_quotes(),
    "scanner": aks.get_scanner_stocks,
    "sector": aks.get_sector_flows,
    "price_tick": aks.get_price_ticks,
    "fund_flow": aks.get_fund_flow,
    "capital_alert": aks.get_capital_alerts,
    "trading_alert": aks.get_trading_alerts,
    "huijin": aks.get_huijin_monitor,
    "ssf": aks.get_ssf_monitor,
    "broker": aks.get_broker_monitor,
}


async def fetch_and_persist(data_type: str) -> int:
    """采集一种数据并写入 data_history，返回新增行数"""
    fn = FETCH_MAP.get(data_type)
    if not fn:
        logger.warning("unknown data_type: %s", data_type)
        return 0

    # 检查持久化开关
    db = await get_db()
    row = await db.execute(
        "SELECT enabled FROM persist_config WHERE data_type = ?", [data_type]
    )
    cfg = await row.fetchone()
    if cfg and cfg[0] == 0:
        logger.debug("persist disabled for %s, skip", data_type)
        return 0

    loop = asyncio.get_running_loop()
    try:
        raw = await loop.run_in_executor(None, fn)
    except Exception as e:
        logger.error("fetch %s failed: %s", data_type, e)
        return 0

    if not raw:
        return 0

    items = raw if isinstance(raw, list) else [raw]
    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db = await get_db()
    count = 0
    for item in items:
        data_id = _extract_id(item, data_type)
        stock_code = item.get("code") or item.get("stock_code")
        stock_name = item.get("name") or item.get("stock_name")
        summary = item.get("title") or item.get("summary") or item.get("name")
        impact = item.get("impact") or item.get("signal")

        try:
            await db.execute(
                """INSERT OR IGNORE INTO data_history
                   (data_type, data_id, snapshot_time, data_json,
                    stock_code, stock_name, summary, impact)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (data_type, data_id, now_iso,
                 json.dumps(item, ensure_ascii=False),
                 stock_code, stock_name, summary, impact),
            )
            count += db.total_changes  # rough
        except Exception as e:
            logger.debug("insert skip: %s", e)

    await db.commit()
    logger.info("persisted %s: %d items", data_type, len(items))
    return len(items)


def _extract_id(item: dict, data_type: str) -> Optional[str]:
    """提取去重用 ID"""
    if "id" in item:
        return f"{data_type}_{item['id']}"
    if "code" in item:
        ts = item.get("datetime") or item.get("time") or ""
        return f"{data_type}_{item['code']}_{ts[:16]}"
    return None
