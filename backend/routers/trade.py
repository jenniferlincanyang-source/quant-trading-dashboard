"""交易路由 — REST API"""
from __future__ import annotations
import math
from fastapi import APIRouter, HTTPException
from schemas import TradeRequest, TradeResponse, CancelRequest
from services.trader_factory import get_trader
from services.price_service import fetch_latest_price
from risk.risk_manager import risk_manager
from config import settings

router = APIRouter(prefix="/api/trade", tags=["trade"])


@router.post("/execute", response_model=TradeResponse)
async def execute_trade(req: TradeRequest):
    trader = await get_trader()

    # 自动取价: price=0 时从行情服务获取最新价
    if req.price <= 0:
        try:
            req.price = fetch_latest_price(req.stock_code)
        except Exception as e:
            return TradeResponse(success=False, message=f"取价失败: {e}")

    # 自动算量: volume=0 时根据资金和置信度计算
    if req.volume <= 0:
        risk_pct = 0.02 + req.confidence * 0.03  # 2~5% 仓位
        target_amount = min(
            trader.total_asset * risk_pct,
            settings.max_single_order_amount,
        )
        lot = settings.lot_size
        req.volume = max(lot, math.floor(target_amount / req.price / lot) * lot)

    # 风控校验
    positions = trader.get_positions()
    risk_result = risk_manager.check(
        req, positions, trader.total_asset, cash=trader.cash,
    )

    if not risk_result.passed:
        return TradeResponse(
            success=False,
            message="风控拦截",
            risk_check=risk_result,
        )

    # 下单
    try:
        order = await trader.submit_order(req)
        risk_manager.record_order()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"下单失败: {e}")

    # 异步触发模拟成交 (Mock 模式)
    if settings.mock_mode:
        import asyncio
        from routers.ws import broadcast

        async def _simulate():
            filled = await trader.simulate_fill(order.order_id)
            if filled:
                await broadcast({
                    "type": "trade_executed",
                    "order_id": filled.order_id,
                    "stock_code": filled.stock_code,
                    "stock_name": filled.stock_name,
                    "direction": filled.direction.value,
                    "filled_volume": filled.filled_volume,
                    "filled_price": filled.filled_price,
                    "status": filled.status.value,
                    "strategy": filled.strategy.value,
                    "timestamp": filled.updated_at.isoformat(),
                })

        asyncio.create_task(_simulate())

    return TradeResponse(
        success=True,
        order_id=order.order_id,
        message=f"委托已提交: {req.direction.value} {req.stock_code} ¥{req.price:.2f} x{req.volume}",
        risk_check=risk_result,
    )


@router.get("/positions")
async def get_positions():
    trader = await get_trader()
    return trader.get_positions()


@router.get("/orders")
async def get_orders(status: str = "all"):
    trader = await get_trader()
    return trader.get_orders(status)


@router.post("/cancel")
async def cancel_order(req: CancelRequest):
    trader = await get_trader()
    ok = await trader.cancel_order(req.order_id)
    if not ok:
        raise HTTPException(status_code=400, detail="撤单失败")
    return {"success": True, "order_id": req.order_id}
