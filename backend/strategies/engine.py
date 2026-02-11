"""策略引擎 — 管理所有策略, 聚合信号"""
from __future__ import annotations
import logging
import uuid
from datetime import datetime
from strategies.base import BaseStrategy, StrategySignal
from strategies.dividend_low_vol import DividendLowVolStrategy
from services.price_service import fetch_stock_pool

logger = logging.getLogger(__name__)


class StrategyEngine:
    def __init__(self) -> None:
        self._strategies: list[BaseStrategy] = [
            DividendLowVolStrategy(),
        ]
        self._cached_signals: list[dict] = []
        self._last_run: str = ""

    async def run_all(self) -> list[dict]:
        """运行所有策略, 返回前端格式信号"""
        try:
            stock_pool = fetch_stock_pool()
        except Exception as e:
            logger.error("获取股票池失败: %s", e)
            return self._cached_signals

        all_signals: list[StrategySignal] = []
        for strat in self._strategies:
            try:
                sigs = await strat.generate_signals(stock_pool)
                all_signals.extend(sigs)
                logger.info("%s 产生 %d 个信号", strat.name, len(sigs))
            except Exception as e:
                logger.error("策略 %s 异常: %s", strat.name, e)

        self._cached_signals = [self._to_frontend(s) for s in all_signals]
        self._last_run = datetime.now().isoformat()
        logger.info("策略引擎完成, 共 %d 个信号", len(self._cached_signals))
        return self._cached_signals

    def get_cached_signals(self) -> list[dict]:
        return self._cached_signals

    @property
    def last_run(self) -> str:
        return self._last_run

    @staticmethod
    def _to_frontend(sig: StrategySignal) -> dict:
        return {
            "id": f"sig-{uuid.uuid4().hex[:8]}",
            "stockCode": sig.stock_code,
            "stockName": sig.stock_name,
            "strategy": sig.strategy,
            "signal": sig.signal,
            "confidence": sig.confidence,
            "expectedReturn": sig.expected_return,
            "riskLevel": sig.risk_level,
            "factors": sig.factors,
            "time": datetime.now().strftime("%H:%M:%S"),
        }


engine = StrategyEngine()
