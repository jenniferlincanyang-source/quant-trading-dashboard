"""xtquant (QMT) 真实交易封装"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime
from schemas import (
    TradeRequest, Order, Position, OrderStatus, Direction, PriceType,
)

logger = logging.getLogger(__name__)


def _to_market_code(code: str) -> str:
    """股票代码 → QMT 格式: 688981 → 688981.SH"""
    if code.startswith(("6", "9")):
        return f"{code}.SH"
    elif code.startswith(("0", "3")):
        return f"{code}.SZ"
    elif code.startswith(("4", "8")):
        return f"{code}.BJ"
    return f"{code}.SH"


class QmtTrader:
    def __init__(self, qmt_path: str, account: str) -> None:
        self._qmt_path = qmt_path
        self._account = account
        self._xt_trader = None
        self._connected = False
        self._callback_queue: asyncio.Queue | None = None
        self._orders: dict[int, Order] = {}

    async def connect(self) -> None:
        """连接 QMT mini"""
        try:
            from xtquant.xttrader import XtQuantTrader
            from xtquant.xttype import StockAccount
            from xtquant import xtconstant

            self._xt_trader = XtQuantTrader(self._qmt_path, "quant_monitor")
            self._account_obj = StockAccount(self._account)
            self._xtconstant = xtconstant

            self._xt_trader.register_callback(self._make_callback())
            self._xt_trader.start()

            result = await asyncio.to_thread(
                self._xt_trader.connect
            )
            if result == 0:
                await asyncio.to_thread(
                    self._xt_trader.subscribe_account, self._account_obj
                )
                self._connected = True
                logger.info("QMT 连接成功: %s", self._account)
            else:
                raise ConnectionError(f"QMT connect 返回 {result}")
        except ImportError:
            raise RuntimeError("xtquant 未安装，请在 QMT 环境下运行")

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def total_asset(self) -> float:
        if not self._xt_trader:
            return 0
        asset = self._xt_trader.query_stock_asset(self._account_obj)
        return asset.total_asset if asset else 0

    def get_positions(self) -> list[Position]:
        if not self._xt_trader:
            return []
        raw = self._xt_trader.query_stock_positions(self._account_obj)
        return [
            Position(
                stock_code=p.stock_code.split(".")[0],
                stock_name=getattr(p, "stock_name", ""),
                volume=p.volume,
                available_volume=p.can_use_volume,
                avg_cost=p.avg_price,
                market_value=p.market_value,
                profit=p.profit,
                profit_ratio=round(p.profit / max(p.market_value - p.profit, 1) * 100, 2),
            )
            for p in (raw or [])
            if p.volume > 0
        ]

    def get_orders(self, status: str | None = None) -> list[Order]:
        if not self._xt_trader:
            return []
        raw = self._xt_trader.query_stock_orders(self._account_obj)
        orders = []
        for o in (raw or []):
            s = self._map_status(o.order_status)
            if status and status != "all" and s.value != status:
                continue
            orders.append(Order(
                order_id=str(o.order_id),
                stock_code=o.stock_code.split(".")[0],
                direction=Direction.buy if o.order_type == 23 else Direction.sell,
                price=o.price,
                volume=o.order_volume,
                filled_volume=o.traded_volume,
                filled_price=o.traded_price,
                status=s,
            ))
        return orders

    async def submit_order(self, req: TradeRequest) -> Order:
        xt = self._xt_trader
        c = self._xtconstant
        market_code = _to_market_code(req.stock_code)

        if req.direction == Direction.buy:
            order_type = c.STOCK_BUY
        else:
            order_type = c.STOCK_SELL

        price_type = c.FIX_PRICE if req.price_type == PriceType.limit else c.LATEST_PRICE

        order_id = await asyncio.to_thread(
            xt.order_stock,
            self._account_obj,
            market_code,
            order_type,
            req.volume,
            price_type,
            req.price,
        )

        order = Order(
            order_id=str(order_id),
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
        """QMT 真实模式不需要模拟, 成交通过 callback 推送"""
        return self._orders.get(int(order_id))

    async def cancel_order(self, order_id: str) -> bool:
        if not self._xt_trader:
            return False
        result = await asyncio.to_thread(
            self._xt_trader.cancel_order_stock, self._account_obj, int(order_id)
        )
        return result == 0

    def set_callback_queue(self, q: asyncio.Queue) -> None:
        self._callback_queue = q

    def _make_callback(self):
        trader = self

        class _Cb:
            def on_order_stock_async(self, response):
                logger.info("委托回报: %s", response.order_id)

            def on_stock_trade(self, trade):
                logger.info("成交回报: %s vol=%s", trade.stock_code, trade.traded_volume)
                if trader._callback_queue:
                    trader._callback_queue.put_nowait({
                        "type": "trade_executed",
                        "order_id": str(trade.order_id),
                        "stock_code": trade.stock_code.split(".")[0],
                        "filled_volume": trade.traded_volume,
                        "filled_price": trade.traded_price,
                        "timestamp": datetime.now().isoformat(),
                    })

            def on_stock_order(self, order):
                logger.info("委托变动: %s status=%s", order.order_id, order.order_status)
                if trader._callback_queue:
                    trader._callback_queue.put_nowait({
                        "type": "order_update",
                        "order_id": str(order.order_id),
                        "stock_code": order.stock_code.split(".")[0],
                        "status": trader._map_status(order.order_status).value,
                        "filled_volume": order.traded_volume,
                        "timestamp": datetime.now().isoformat(),
                    })

            def on_disconnected(self):
                logger.warning("QMT 断开连接")
                trader._connected = False

        return _Cb()

    @staticmethod
    def _map_status(qmt_status: int) -> OrderStatus:
        mapping = {
            48: OrderStatus.submitted,
            49: OrderStatus.submitted,
            50: OrderStatus.partial_filled,
            51: OrderStatus.cancelled,
            52: OrderStatus.rejected,
            53: OrderStatus.submitted,
            54: OrderStatus.filled,
            56: OrderStatus.filled,
        }
        return mapping.get(qmt_status, OrderStatus.pending)
