"""策略路由"""
from __future__ import annotations
from fastapi import APIRouter
from strategies.engine import engine

router = APIRouter(prefix="/api/strategy", tags=["strategy"])


@router.get("/signals")
async def get_signals():
    return {
        "signals": engine.get_cached_signals(),
        "last_run": engine.last_run,
        "count": len(engine.get_cached_signals()),
    }


@router.post("/run")
async def run_strategies():
    signals = await engine.run_all()
    return {
        "signals": signals,
        "last_run": engine.last_run,
        "count": len(signals),
    }
