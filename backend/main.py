"""FastAPI 入口"""
from __future__ import annotations
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import trade, ws
from routers.strategy import router as strategy_router
from routers.history import router as history_router
from services.trader_factory import get_trader
from services.scheduler import scheduler
from strategies.engine import engine as strategy_engine
from db import close_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动: 预连接交易服务
    mode = "Mock" if settings.mock_mode else "QMT"
    logger.info("启动交易服务 [%s 模式]", mode)
    try:
        await get_trader()
        logger.info("交易服务连接成功")
    except Exception as e:
        logger.error("交易服务连接失败: %s", e)

    # 启动策略引擎后台任务
    async def _strategy_loop():
        while True:
            try:
                await strategy_engine.run_all()
            except Exception as e:
                logger.error("策略引擎异常: %s", e)
            await asyncio.sleep(300)  # 每 5 分钟

    task = asyncio.create_task(_strategy_loop())

    # 启动数据采集调度器
    await scheduler.start()
    logger.info("数据采集调度器已启动")

    yield
    task.cancel()
    await scheduler.stop()
    await close_db()
    logger.info("交易服务关闭")


app = FastAPI(
    title="2026 A-Share Quant Trading Backend",
    description="量化交易执行服务 — 三源验证 + QMT 实盘",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
app.include_router(trade.router)
app.include_router(ws.router)
app.include_router(strategy_router)
app.include_router(history_router)


@app.get("/health")
async def health():
    trader = await get_trader()
    return {
        "status": "ok",
        "mode": "mock" if settings.mock_mode else "qmt",
        "connected": trader.is_connected,
    }


@app.get("/api/quote/{code}")
async def get_quote(code: str):
    """获取单只股票最新价"""
    from services.price_service import fetch_latest_price
    try:
        price = fetch_latest_price(code)
        return {"code": code, "price": price}
    except Exception as e:
        return {"code": code, "price": 0, "error": str(e)}


@app.get("/api/account")
async def get_account():
    """获取账户概览"""
    trader = await get_trader()
    return {
        "cash": trader.cash,
        "total_asset": trader.total_asset,
        "positions": len(trader.get_positions()),
    }
