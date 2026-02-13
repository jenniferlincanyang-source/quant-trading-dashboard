"""SQLite 持久化 — aiosqlite 直连"""
from __future__ import annotations
import os
import aiosqlite

DB_PATH = os.path.join(os.path.dirname(__file__), "quant.db")

_db: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _db
    if _db is None:
        _db = await aiosqlite.connect(DB_PATH)
        _db.row_factory = aiosqlite.Row
        await _init_tables(_db)
    return _db


async def _init_tables(db: aiosqlite.Connection) -> None:
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            stock_code TEXT NOT NULL,
            stock_name TEXT DEFAULT '',
            direction TEXT NOT NULL,
            price REAL NOT NULL,
            volume INTEGER NOT NULL,
            filled_volume INTEGER DEFAULT 0,
            filled_price REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            strategy TEXT DEFAULT 'multi_factor',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS positions (
            stock_code TEXT PRIMARY KEY,
            stock_name TEXT DEFAULT '',
            volume INTEGER DEFAULT 0,
            available_volume INTEGER DEFAULT 0,
            avg_cost REAL DEFAULT 0,
            market_value REAL DEFAULT 0,
            profit REAL DEFAULT 0,
            profit_ratio REAL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS account (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            cash REAL DEFAULT 500000
        );

        INSERT OR IGNORE INTO account (id, cash) VALUES (1, 500000);

        CREATE TABLE IF NOT EXISTS data_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_type TEXT NOT NULL,
            data_id TEXT,
            snapshot_time TEXT NOT NULL,
            data_json TEXT NOT NULL,
            stock_code TEXT,
            stock_name TEXT,
            summary TEXT,
            impact TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE INDEX IF NOT EXISTS idx_dh_type_time
            ON data_history (data_type, snapshot_time DESC);
        CREATE INDEX IF NOT EXISTS idx_dh_stock_type
            ON data_history (stock_code, data_type);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_dh_type_dataid
            ON data_history (data_type, data_id)
            WHERE data_id IS NOT NULL;

        CREATE TABLE IF NOT EXISTS persist_config (
            data_type TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 1,
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );
    """)

    # seed all known data types
    known_types = [
        'oracle_event', 'news', 'quote', 'scanner', 'sector',
        'insight_trend', 'insight_meanrev', 'insight_statarb',
        'insight_hft', 'insight_mf', 'price_tick', 'fund_flow',
        'capital_alert', 'trading_alert', 'huijin', 'ssf', 'broker',
    ]
    await db.executemany(
        "INSERT OR IGNORE INTO persist_config (data_type) VALUES (?)",
        [(t,) for t in known_types],
    )
    await db.commit()


async def close_db() -> None:
    global _db
    if _db:
        await _db.close()
        _db = None
