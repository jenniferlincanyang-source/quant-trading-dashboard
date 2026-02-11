"""红利低波策略 — 高股息 + 低波动率"""
from __future__ import annotations
import math
import logging
from strategies.base import BaseStrategy, StrategySignal
from services.price_service import fetch_kline

logger = logging.getLogger(__name__)

# 公开数据: 30 只常见高股息股票的近 12 个月股息率 (%)
DIVIDEND_YIELDS = {
    "600519": 1.8, "000858": 2.5, "601318": 3.2, "000001": 5.1, "600036": 4.8,
    "300750": 0.3, "002594": 0.1, "688981": 0.5, "603259": 1.2, "000725": 2.8,
    "002415": 1.5, "600900": 4.5, "601899": 3.8, "000568": 2.2, "600276": 1.0,
    "002475": 0.8, "601012": 2.0, "600030": 3.0, "002714": 1.6, "601888": 1.4,
    "000333": 3.5, "600309": 2.6, "601669": 4.0, "002049": 1.1, "600585": 3.3,
    "601225": 5.5, "002352": 0.6, "300059": 0.4, "688111": 0.7, "002371": 1.3,
}


def _calc_volatility(klines: list[dict]) -> float:
    """计算 20 日年化波动率"""
    closes = [k["close"] for k in klines if k["close"] > 0]
    if len(closes) < 5:
        return 999.0  # 数据不足, 给极高波动率
    returns = []
    for i in range(1, len(closes)):
        r = math.log(closes[i] / closes[i - 1])
        returns.append(r)
    if not returns:
        return 999.0
    mean = sum(returns) / len(returns)
    var = sum((r - mean) ** 2 for r in returns) / len(returns)
    daily_vol = math.sqrt(var)
    return daily_vol * math.sqrt(252)  # 年化


class DividendLowVolStrategy(BaseStrategy):
    name = "dividend_low_vol"

    async def generate_signals(self, stock_pool: list[dict]) -> list[StrategySignal]:
        scored = []
        for stock in stock_pool:
            code = stock.get("code", "")
            div_yield = DIVIDEND_YIELDS.get(code)
            if div_yield is None:
                continue
            # 获取 K 线计算波动率
            try:
                klines = fetch_kline(code, count=25)
            except Exception:
                klines = []
            vol = _calc_volatility(klines)
            scored.append({
                "code": code,
                "name": stock.get("name", ""),
                "price": stock.get("price", 0),
                "div_yield": div_yield,
                "volatility": vol,
                "change": stock.get("changePercent", 0),
            })

        if len(scored) < 3:
            logger.warning("红利低波: 有效股票不足 %d", len(scored))
            return []

        # 排名打分
        scored.sort(key=lambda x: x["div_yield"], reverse=True)
        for i, s in enumerate(scored):
            s["div_rank"] = i / max(len(scored) - 1, 1)

        scored.sort(key=lambda x: x["volatility"])
        for i, s in enumerate(scored):
            s["vol_rank"] = i / max(len(scored) - 1, 1)

        for s in scored:
            s["score"] = s["div_rank"] * 0.5 + s["vol_rank"] * 0.5

        scored.sort(key=lambda x: x["score"])
        return self._build_signals(scored)

    def _build_signals(self, scored: list[dict]) -> list[StrategySignal]:
        signals = []
        n = len(scored)
        top5 = max(1, n // 5)

        for i, s in enumerate(scored):
            if i < top5:
                sig = "buy"
                conf = round(0.7 + 0.2 * (1 - i / top5), 2)
                exp_ret = round(s["div_yield"] * 0.8, 1)
                risk = "low"
                factors = [
                    f"股息率 {s['div_yield']:.1f}%",
                    f"波动率 {s['volatility']:.1%}",
                    "高股息低波动",
                ]
            elif i >= n - top5:
                sig = "sell"
                conf = round(0.5 + 0.2 * ((i - n + top5) / top5), 2)
                exp_ret = round(-s["volatility"] * 10, 1)
                risk = "high"
                factors = [
                    f"股息率 {s['div_yield']:.1f}%",
                    f"波动率 {s['volatility']:.1%}",
                    "低股息高波动",
                ]
            else:
                sig = "hold"
                conf = 0.4
                exp_ret = round(s["div_yield"] * 0.3, 1)
                risk = "medium"
                factors = [f"股息率 {s['div_yield']:.1f}%", "中性"]

            signals.append(StrategySignal(
                stock_code=s["code"],
                stock_name=s["name"],
                strategy="dividend_low_vol",
                signal=sig,
                confidence=conf,
                expected_return=exp_ret,
                risk_level=risk,
                factors=factors,
            ))
        return signals
