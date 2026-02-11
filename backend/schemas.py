"""Pydantic 数据模型 — 对齐前端 types.ts"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


# ── 枚举 ──
class Direction(str, Enum):
    buy = "buy"
    sell = "sell"

class OrderStatus(str, Enum):
    pending = "pending"
    submitted = "submitted"
    partial_filled = "partial_filled"
    filled = "filled"
    cancelled = "cancelled"
    rejected = "rejected"

class PriceType(str, Enum):
    limit = "limit"
    market = "market"

class StrategyType(str, Enum):
    trend_follow = "trend_follow"
    t_plus_0 = "t_plus_0"
    dividend_low_vol = "dividend_low_vol"
    mean_reversion = "mean_reversion"
    multi_factor = "multi_factor"
    index_enhance = "index_enhance"


# ── 请求 ──
class TradeRequest(BaseModel):
    signal_id: str
    stock_code: str = Field(..., pattern=r"^\d{6}$")
    stock_name: str = ""
    direction: Direction
    price: float = Field(default=0, ge=0)
    volume: int = Field(default=0, ge=0)
    strategy: StrategyType = StrategyType.multi_factor
    price_type: PriceType = PriceType.limit
    confidence: float = Field(default=0.5, ge=0, le=1)

class CancelRequest(BaseModel):
    order_id: str


# ── 风控 ──
class RiskCheck(BaseModel):
    rule: str
    passed: bool
    detail: str

class RiskCheckResult(BaseModel):
    passed: bool
    checks: List[RiskCheck]


# ── 响应 ──
class TradeResponse(BaseModel):
    success: bool
    order_id: str = ""
    message: str = ""
    risk_check: Optional[RiskCheckResult] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class Position(BaseModel):
    stock_code: str
    stock_name: str = ""
    volume: int = 0
    available_volume: int = 0
    avg_cost: float = 0.0
    market_value: float = 0.0
    profit: float = 0.0
    profit_ratio: float = 0.0

class Order(BaseModel):
    order_id: str
    stock_code: str
    stock_name: str = ""
    direction: Direction
    price: float
    volume: int
    filled_volume: int = 0
    filled_price: float = 0.0
    status: OrderStatus = OrderStatus.pending
    strategy: StrategyType = StrategyType.multi_factor
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
