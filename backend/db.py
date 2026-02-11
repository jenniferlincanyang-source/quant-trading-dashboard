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
    """)
    await db.commit()


async def close_db() -> None:
    global _db
    if _db:
        await _db.close()
        _db = None
