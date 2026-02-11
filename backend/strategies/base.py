"""策略基类"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List


@dataclass
class StrategySignal:
    stock_code: str
    stock_name: str
    strategy: str
    signal: str  # buy / sell / hold
    confidence: float  # 0~1
    expected_return: float  # 百分比
    risk_level: str  # low / medium / high
    factors: List[str] = field(default_factory=list)


class BaseStrategy(ABC):
    name: str = "base"

    @abstractmethod
    async def generate_signals(self, stock_pool: list[dict]) -> list[StrategySignal]:
        """根据股票池行情生成信号"""
        ...
