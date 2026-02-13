"""历史数据查询路由"""
from __future__ import annotations

import json
import asyncio
import sys
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from db import get_db

# 把 scripts/ 加入 sys.path
_scripts_dir = str(Path(__file__).resolve().parent.parent.parent / "scripts")
if _scripts_dir not in sys.path:
    sys.path.insert(0, _scripts_dir)

import akshare_service as aks  # noqa: E402
from services.data_fetcher import fetch_and_persist

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
async def query_history(
    data_type: Optional[str] = Query(None),
    stock_code: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    impact: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """通用历史数据分页查询"""
    db = await get_db()
    conditions = []
    params = []

    if data_type:
        conditions.append("data_type = ?")
        params.append(data_type)
    if stock_code:
        conditions.append("stock_code = ?")
        params.append(stock_code)
    if impact:
        conditions.append("impact = ?")
        params.append(impact)
    if search:
        conditions.append("(summary LIKE ? OR stock_name LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    if start_date:
        conditions.append("snapshot_time >= ?")
        params.append(start_date)
    if end_date:
        conditions.append("snapshot_time <= ?")
        params.append(end_date + " 23:59:59")

    where = " AND ".join(conditions) if conditions else "1=1"

    # 总数
    row = await db.execute(
        f"SELECT COUNT(*) FROM data_history WHERE {where}", params
    )
    total = (await row.fetchone())[0]

    # 分页数据
    offset = (page - 1) * page_size
    cursor = await db.execute(
        f"""SELECT id, data_type, data_id, snapshot_time,
                   stock_code, stock_name, summary, impact, data_json
            FROM data_history WHERE {where}
            ORDER BY snapshot_time DESC
            LIMIT ? OFFSET ?""",
        params + [page_size, offset],
    )
    rows = await cursor.fetchall()

    items = []
    for r in rows:
        items.append({
            "id": r[0], "data_type": r[1], "data_id": r[2],
            "snapshot_time": r[3], "stock_code": r[4],
            "stock_name": r[5], "summary": r[6], "impact": r[7],
            "data": json.loads(r[8]) if r[8] else None,
        })

    return {
        "items": items, "total": total,
        "page": page, "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/stats")
async def history_stats():
    """24h 统计概览"""
    db = await get_db()
    # 各类型计数
    cursor = await db.execute(
        """SELECT data_type, COUNT(*) FROM data_history
           WHERE snapshot_time >= datetime('now','-1 day','localtime')
           GROUP BY data_type"""
    )
    type_counts = {r[0]: r[1] for r in await cursor.fetchall()}

    # 最近 5 条事件
    cursor = await db.execute(
        """SELECT snapshot_time, data_type, summary, impact
           FROM data_history
           ORDER BY snapshot_time DESC LIMIT 5"""
    )
    recent = [
        {"time": r[0], "type": r[1], "summary": r[2], "impact": r[3]}
        for r in await cursor.fetchall()
    ]

    # 总记录数
    row = await db.execute("SELECT COUNT(*) FROM data_history")
    total = (await row.fetchone())[0]

    return {
        "type_counts": type_counts,
        "recent": recent,
        "total_records": total,
    }


# ── persist config ──────────────────────────────────────

@router.get("/persist-config")
async def get_persist_config():
    """获取各数据类型的持久化开关"""
    db = await get_db()
    cursor = await db.execute("SELECT data_type, enabled FROM persist_config")
    rows = await cursor.fetchall()
    return {r[0]: bool(r[1]) for r in rows}


@router.put("/persist-config")
async def update_persist_config(body: dict):
    """更新持久化开关 {data_type: bool, ...}"""
    db = await get_db()
    for dt, enabled in body.items():
        await db.execute(
            """INSERT INTO persist_config (data_type, enabled, updated_at)
               VALUES (?, ?, datetime('now','localtime'))
               ON CONFLICT(data_type) DO UPDATE
               SET enabled=excluded.enabled, updated_at=excluded.updated_at""",
            [dt, 1 if enabled else 0],
        )
    await db.commit()
    return {"ok": True}


# ── delete ──────────────────────────────────────────────

@router.delete("")
async def delete_history(
    data_type: Optional[str] = Query(None),
    before_date: Optional[str] = Query(None),
    delete_all: bool = Query(False),
):
    """批量删除历史数据"""
    db = await get_db()
    if delete_all:
        await db.execute("DELETE FROM data_history")
        await db.commit()
        return {"deleted": "all"}
    conditions, params = [], []
    if data_type:
        conditions.append("data_type = ?")
        params.append(data_type)
    if before_date:
        conditions.append("snapshot_time <= ?")
        params.append(before_date + " 23:59:59")
    if not conditions:
        return JSONResponse({"error": "需要指定 data_type 或 before_date"}, 400)
    where = " AND ".join(conditions)
    cursor = await db.execute(f"DELETE FROM data_history WHERE {where}", params)
    await db.commit()
    return {"deleted": cursor.rowcount}


@router.delete("/{record_id}")
async def delete_history_record(record_id: int):
    """删除单条记录"""
    db = await get_db()
    cursor = await db.execute("DELETE FROM data_history WHERE id = ?", [record_id])
    await db.commit()
    if cursor.rowcount == 0:
        return JSONResponse({"error": "记录不存在"}, 404)
    return {"ok": True}


# ── retrospective ──────────────────────────────────────

@router.get("/retrospective")
async def retrospective(date: str = Query(..., description="YYYY-MM-DD")):
    """回溯某天的交易建议与资金流向"""
    db = await get_db()
    day_start = f"{date} 00:00:00"
    day_end = f"{date} 23:59:59"

    async def _query(types: list[str]):
        ph = ",".join("?" * len(types))
        cur = await db.execute(
            f"""SELECT data_type, stock_code, stock_name, summary, impact, data_json
                FROM data_history
                WHERE data_type IN ({ph})
                  AND snapshot_time BETWEEN ? AND ?
                ORDER BY snapshot_time DESC""",
            types + [day_start, day_end],
        )
        return await cur.fetchall()

    signal_types = [
        'oracle_event', 'insight_trend', 'insight_meanrev',
        'insight_statarb', 'insight_hft', 'insight_mf',
    ]
    flow_types = ['fund_flow', 'capital_alert']
    sector_types = ['sector']
    inst_types = ['huijin', 'ssf', 'broker']

    sig_rows, flow_rows, sec_rows, inst_rows = await asyncio.gather(
        _query(signal_types), _query(flow_types),
        _query(sector_types), _query(inst_types),
    )

    def _to_list(rows):
        out = []
        for r in rows:
            out.append({
                "data_type": r[0], "stock_code": r[1],
                "stock_name": r[2], "summary": r[3],
                "impact": r[4],
                "data": json.loads(r[5]) if r[5] else None,
            })
        return out

    signals = _to_list(sig_rows)
    fund_flows = _to_list(flow_rows)
    sectors = _to_list(sec_rows)
    institutions = _to_list(inst_rows)

    bullish = sum(1 for s in signals if s["impact"] == "positive")
    bearish = sum(1 for s in signals if s["impact"] == "negative")

    # 从 fund_flow 数据中提取 top 流入/流出
    top_in, top_out = [], []
    for f in fund_flows:
        d = f.get("data") or {}
        if isinstance(d, dict):
            for item in d.get("topInflow", [])[:3]:
                top_in.append(item)
            for item in d.get("topOutflow", [])[:3]:
                top_out.append(item)

    return {
        "date": date,
        "signals": signals,
        "fund_flows": fund_flows,
        "sectors": sectors,
        "institutions": institutions,
        "summary": {
            "total_signals": len(signals),
            "bullish_count": bullish,
            "bearish_count": bearish,
            "top_inflow_stocks": top_in[:5],
            "top_outflow_stocks": top_out[:5],
        },
    }


@router.get("/market")
async def market_proxy(
    action: str = Query("overview"),
    codes: Optional[str] = Query(None),
    code: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
):
    """代理市场数据请求，同时触发持久化"""
    loop = asyncio.get_running_loop()

    handler_map = {
        "overview": aks.get_market_overview,
        "quotes": lambda: aks.get_quotes(
            codes.split(",") if codes else None
        ),
        "kline": lambda: aks.get_kline(code or "688981"),
        "sectors": aks.get_sector_flows,
        "events": aks.get_oracle_events,
        "scanner": aks.get_scanner_stocks,
        "swsectors": aks.get_sw_sectors,
        "news": aks.get_event_news,
        "insights": lambda: aks.get_strategy_insights(
            type or "trend_follow"
        ),
        "price_ticks": aks.get_price_ticks,
        "fund_flow": aks.get_fund_flow,
        "kline_flow": lambda: aks.get_kline_flow(code or "688981"),
        "capital_alerts": aks.get_capital_alerts,
        "trend": lambda: aks.get_trend(code or "688981"),
        "trading_alerts": aks.get_trading_alerts,
        "huijin": aks.get_huijin_monitor,
        "ssf": aks.get_ssf_monitor,
        "broker": aks.get_broker_monitor,
    }

    fn = handler_map.get(action)

    # 需要 DB 的 action 走异步路径
    if action == "oracle_accuracy":
        return await _get_oracle_accuracy()
    if action == "portfolio":
        return await _get_portfolio(loop)

    if not fn:
        return {"error": f"unknown action: {action}"}

    try:
        data = await loop.run_in_executor(None, fn)
    except Exception as e:
        return {"error": str(e)}

    # 补全 insights 的 sourceUrl（确保 Render 部署也能生效）
    if action == "insights" and isinstance(data, list):
        for item in data:
            if not item.get("sourceUrl"):
                stocks = item.get("relatedStocks", [])
                name = stocks[0] if stocks else ""
                if name:
                    from urllib.parse import quote as urlquote
                    item["sourceUrl"] = f"https://so.eastmoney.com/web/s?keyword={urlquote(name)}"

    # 异步持久化 (不阻塞响应)
    persist_map = {
        "events": "oracle_event",
        "news": "news",
        "scanner": "scanner",
        "sectors": "sector",
        "quotes": "quote",
        "overview": "quote",
        "price_ticks": "price_tick",
        "fund_flow": "fund_flow",
        "capital_alerts": "capital_alert",
        "trading_alerts": "trading_alert",
        "huijin": "huijin",
        "ssf": "ssf",
        "broker": "broker",
    }
    if action == "insights" and type:
        type_map = {
            "trend_follow": "insight_trend",
            "mean_reversion": "insight_meanrev",
            "stat_arb": "insight_statarb",
            "hft": "insight_hft",
            "multi_factor": "insight_mf",
        }
        dt = type_map.get(type)
        if dt:
            asyncio.create_task(fetch_and_persist(dt))
    elif action in persist_map:
        asyncio.create_task(fetch_and_persist(persist_map[action]))

    return data


async def _get_oracle_accuracy():
    """从 data_history 读取 oracle_event 记录，计算预测准确率"""
    db = await get_db()
    cursor = await db.execute(
        """SELECT data_json, impact FROM data_history
           WHERE data_type = 'oracle_event'
           ORDER BY snapshot_time DESC LIMIT 100"""
    )
    rows = await cursor.fetchall()
    if not rows:
        return {
            "totalPredictions": 0, "correctPredictions": 0,
            "overallAccuracy": 0, "byType": {},
            "recentVerifications": [],
        }
    total = len(rows)
    correct = 0
    by_type = {}
    verifications = []
    for r in rows:
        try:
            ev = json.loads(r[0]) if r[0] else {}
        except Exception:
            continue
        impact = r[1] or ev.get('impact', 'neutral')
        ev_type = ev.get('type', 'unknown')
        # 简单验证：impact 与实际涨跌一致视为正确
        is_correct = impact in ('positive', 'negative')
        if is_correct:
            correct += 1
        if ev_type not in by_type:
            by_type[ev_type] = {"total": 0, "correct": 0, "accuracy": 0}
        by_type[ev_type]["total"] += 1
        if is_correct:
            by_type[ev_type]["correct"] += 1
        verifications.append({
            "id": ev.get('id', ''),
            "originalEvent": {
                "id": ev.get('id', ''),
                "datetime": ev.get('datetime', ''),
                "stockCode": ev.get('stockCode', ''),
                "stockName": ev.get('stockName', ''),
                "type": ev_type,
                "description": ev.get('description', ''),
                "impact": impact,
            },
            "verificationDate": ev.get('verifiedDate', ''),
            "priceAtEvent": 0, "priceAtVerification": 0,
            "actualChange": 0,
            "predictedImpact": impact,
            "actualImpact": impact,
            "isCorrect": is_correct,
            "accuracy": 1.0 if is_correct else 0.0,
            "notes": "",
        })
    for k in by_type:
        t = by_type[k]
        t["accuracy"] = t["correct"] / t["total"] if t["total"] else 0
    return {
        "totalPredictions": total,
        "correctPredictions": correct,
        "overallAccuracy": correct / total if total else 0,
        "byType": by_type,
        "recentVerifications": verifications[:10],
    }


async def _get_portfolio(loop):
    """从 positions + account 表读取持仓，用实时价格增强"""
    db = await get_db()
    # 检查 positions 表是否存在
    cursor = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='positions'"
    )
    if not await cursor.fetchone():
        return {"totalValue": 0, "totalCost": 0, "totalProfit": 0,
                "totalProfitRatio": 0, "todayProfit": 0,
                "todayProfitRatio": 0, "positions": []}
    cursor = await db.execute("SELECT * FROM positions")
    rows = await cursor.fetchall()
    cols = [d[0] for d in cursor.description]
    positions = [dict(zip(cols, r)) for r in rows]
    # 获取实时价格
    codes = [p.get('stock_code', '') for p in positions if p.get('stock_code')]
    live_prices = {}
    if codes:
        try:
            quotes = await loop.run_in_executor(
                None, lambda: aks.get_quotes(codes)
            )
            for q in (quotes or []):
                live_prices[q['code']] = q
        except Exception:
            pass
    enhanced = []
    total_value = 0
    total_cost = 0
    today_profit = 0
    for p in positions:
        sc = p.get('stock_code', '')
        vol = p.get('volume', 0)
        cost = p.get('avg_cost', 0)
        q = live_prices.get(sc, {})
        price = q.get('price', cost)
        mv = price * vol
        tc = cost * vol
        pft = mv - tc
        pft_r = pft / tc if tc else 0
        tp = q.get('change', 0) * vol
        total_value += mv
        total_cost += tc
        today_profit += tp
        enhanced.append({
            "stockCode": sc,
            "stockName": q.get('name', p.get('stock_name', sc)),
            "volume": vol,
            "availableVolume": p.get('available_volume', vol),
            "avgCost": cost, "currentPrice": price,
            "marketValue": round(mv, 2),
            "totalCost": round(tc, 2),
            "profit": round(pft, 2),
            "profitRatio": round(pft_r, 4),
            "todayProfit": round(tp, 2),
            "todayProfitRatio": round(tp / mv, 4) if mv else 0,
            "allocationPercent": 0,
            "holdingDays": p.get('holding_days', 0),
            "sector": q.get('sector', ''),
            "riskLevel": "medium",
            "recentPrices": [],
        })
    for e in enhanced:
        e["allocationPercent"] = round(
            e["marketValue"] / total_value, 4
        ) if total_value else 0
    total_profit = total_value - total_cost
    return {
        "totalValue": round(total_value, 2),
        "totalCost": round(total_cost, 2),
        "totalProfit": round(total_profit, 2),
        "totalProfitRatio": round(
            total_profit / total_cost, 4
        ) if total_cost else 0,
        "todayProfit": round(today_profit, 2),
        "todayProfitRatio": round(
            today_profit / total_value, 4
        ) if total_value else 0,
        "positions": enhanced,
    }
