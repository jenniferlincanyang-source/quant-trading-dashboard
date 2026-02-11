"""Mock 交易服务 — macOS 开发用 (含资金追踪 + SQLite 持久化)"""
from __future__ import annotations
import asyncio
import uuid
import random
import logging
from datetime import datetime, date
from schemas import (
    TradeRequest, Order, Position, OrderStatus, Direction,
)
from db import get_db

logger = logging.getLogger(__name__)


class MockTrader:
    def __init__(self) -> None:
        self._orders: dict[str, Order] = {}
        self._positions: dict[str, Position] = {}
        self._cash: float = 500_000.0
        self._connected = False
        # T+1: 记录每只股票当日买入量 {code: {date_str: volume}}
        self._buy_dates: dict[str, dict[str, int]] = {}

    async def connect(self) -> None:
        await asyncio.sleep(0.1)
        self._connected = True
        await self._load_from_db()
        if not self._positions:
            # 首次启动: 预置持仓
            self._positions = {
                "600519": Position(
                    stock_code="600519", stock_name="贵州茅台",
                    volume=200, available_volume=200,
                    avg_cost=1650.0, market_value=330000.0,
                    profit=0.0, profit_ratio=0.0,
                ),
                "000001": Position(
                    stock_code="000001", stock_name="平安银行",
                    volume=1000, available_volume=1000,
                    avg_cost=12.10, market_value=12100.0,
                    profit=0.0, profit_ratio=0.0,
                ),
            }
            self._cash = 500_000.0 - 330000.0 - 12100.0
            await self._save_positions()
            await self._save_cash()

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def total_asset(self) -> float:
        mv = sum(p.market_value for p in self._positions.values())
        return self._cash + mv

    @property
    def cash(self) -> float:
        return self._cash

    def get_positions(self) -> list[Position]:
        self._refresh_available_volumes()
        return list(self._positions.values())

    def get_orders(self, status: str = None) -> list[Order]:
        orders = list(self._orders.values())
        if status and status != "all":
            orders = [o for o in orders if o.status.value == status]
        return sorted(orders, key=lambda o: o.created_at, reverse=True)

    async def submit_order(self, req: TradeRequest) -> Order:
        # 买入前校验现金
        if req.direction == Direction.buy:
            cost = req.price * req.volume
            if cost > self._cash:
                raise ValueError(
                    f"现金不足: 需要 ¥{cost:,.0f}, 可用 ¥{self._cash:,.0f}"
                )

        order_id = f"MOCK-{uuid.uuid4().hex[:8].upper()}"
        order = Order(
            order_id=order_id,
            stock_code=req.stock_code,
            stock_name=req.stock_name,
            direction=req.direction,
            price=req.price,
            volume=req.volume,
            status=OrderStatus.submitted,
            strategy=req.strategy,
        )
        self._orders[order_id] = order
        return order

    async def simulate_fill(self, order_id: str) -> Order | None:
        """模拟成交 — 0.3~0.8s 延迟, 微幅滑点"""
        await asyncio.sleep(random.uniform(0.3, 0.8))
        order = self._orders.get(order_id)
        if not order or order.status != OrderStatus.submitted:
            return None
        # 滑点 ±0.2%
        slip = random.uniform(-0.002, 0.002)
        filled_price = round(order.price * (1 + slip), 2)
        order.filled_volume = order.volume
        order.filled_price = filled_price
        order.status = OrderStatus.filled
        order.updated_at = datetime.now()
        self._update_position(order)
        asyncio.create_task(self._persist_fill(order))
        return order

    async def cancel_order(self, order_id: str) -> bool:
        order = self._orders.get(order_id)
        if not order or order.status != OrderStatus.submitted:
            return False
        order.status = OrderStatus.cancelled
        order.updated_at = datetime.now()
        return True

    def _update_position(self, order: Order) -> None:
        """成交后更新持仓和现金"""
        code = order.stock_code
        cost = order.filled_price * order.filled_volume

        if order.direction == Direction.buy:
            self._cash -= cost
            # 记录当日买入 (T+1 不可卖)
            today = date.today().isoformat()
            self._buy_dates.setdefault(code, {})[today] = (
                self._buy_dates.get(code, {}).get(today, 0) + order.filled_volume
            )
            if code in self._positions:
                pos = self._positions[code]
                total_vol = pos.volume + order.filled_volume
                avg = (pos.avg_cost * pos.volume + cost) / total_vol
                pos.volume = total_vol
                pos.avg_cost = round(avg, 4)
                pos.market_value = round(order.filled_price * total_vol, 2)
                pos.profit = round((order.filled_price - pos.avg_cost) * total_vol, 2)
                pos.profit_ratio = round(pos.profit / (pos.avg_cost * total_vol), 4) if pos.avg_cost else 0
            else:
                self._positions[code] = Position(
                    stock_code=code,
                    stock_name=order.stock_name,
                    volume=order.filled_volume,
                    available_volume=0,  # 当日买入不可卖
                    avg_cost=order.filled_price,
                    market_value=cost,
                    profit=0.0, profit_ratio=0.0,
                )
        else:
            # 卖出: 增加现金, 减少持仓
            self._cash += cost
            if code in self._positions:
                pos = self._positions[code]
                pos.volume -= order.filled_volume
                if pos.volume <= 0:
                    del self._positions[code]
                    self._buy_dates.pop(code, None)
                else:
                    pos.market_value = round(order.filled_price * pos.volume, 2)
                    pos.profit = round((order.filled_price - pos.avg_cost) * pos.volume, 2)
                    pos.profit_ratio = round(pos.profit / (pos.avg_cost * pos.volume), 4) if pos.avg_cost else 0

    def _refresh_available_volumes(self) -> None:
        """T+1: 当日买入的部分不可卖"""
        today = date.today().isoformat()
        for code, pos in self._positions.items():
            today_bought = self._buy_dates.get(code, {}).get(today, 0)
            pos.available_volume = max(0, pos.volume - today_bought)

    # ── DB 持久化 ──

    async def _load_from_db(self) -> None:
        """从 SQLite 加载持仓和现金"""
        try:
            db = await get_db()
            # 加载现金
            async with db.execute("SELECT cash FROM account WHERE id=1") as cur:
                row = await cur.fetchone()
                if row:
                    self._cash = row[0]
            # 加载持仓
            async with db.execute("SELECT * FROM positions") as cur:
                rows = await cur.fetchall()
                for r in rows:
                    self._positions[r[0]] = Position(
                        stock_code=r[0], stock_name=r[1],
                        volume=r[2], available_volume=r[3],
                        avg_cost=r[4], market_value=r[5],
                        profit=r[6], profit_ratio=r[7],
                    )
            logger.info("DB 加载: cash=%.0f, %d 个持仓", self._cash, len(self._positions))
        except Exception as e:
            logger.warning("DB 加载失败, 使用默认值: %s", e)

    async def _save_positions(self) -> None:
        db = await get_db()
        await db.execute("DELETE FROM positions")
        for pos in self._positions.values():
            await db.execute(
                "INSERT INTO positions VALUES (?,?,?,?,?,?,?,?)",
                (pos.stock_code, pos.stock_name, pos.volume,
                 pos.available_volume, pos.avg_cost, pos.market_value,
                 pos.profit, pos.profit_ratio),
            )
        await db.commit()

    async def _save_cash(self) -> None:
        db = await get_db()
        await db.execute("UPDATE account SET cash=? WHERE id=1", (self._cash,))
        await db.commit()

    async def _persist_fill(self, order: Order) -> None:
        """成交后持久化订单 + 持仓 + 现金"""
        try:
            db = await get_db()
            await db.execute(
                "INSERT OR REPLACE INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (order.order_id, order.stock_code, order.stock_name,
                 order.direction.value, order.price, order.volume,
                 order.filled_volume, order.filled_price,
                 order.status.value, order.strategy.value,
                 order.created_at.isoformat(), order.updated_at.isoformat()),
            )
            await self._save_positions()
            await self._save_cash()
            logger.info("持久化: %s %s x%d @%.2f",
                        order.direction.value, order.stock_code,
                        order.filled_volume, order.filled_price)
        except Exception as e:
            logger.error("持久化失败: %s", e)
