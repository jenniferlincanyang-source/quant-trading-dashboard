"""风控校验链 — 7 条规则"""
from __future__ import annotations
from datetime import datetime, time
from config import settings
from schemas import TradeRequest, RiskCheck, RiskCheckResult, Position


class RiskManager:
    def __init__(self) -> None:
        self._daily_order_count: int = 0
        self._last_reset_date: str = ""

    def _reset_daily_if_needed(self) -> None:
        today = datetime.now().strftime("%Y-%m-%d")
        if today != self._last_reset_date:
            self._daily_order_count = 0
            self._last_reset_date = today

    def check(
        self,
        req: TradeRequest,
        positions: list[Position],
        total_asset: float,
        cash: float = 0.0,
    ) -> RiskCheckResult:
        self._reset_daily_if_needed()
        checks: list[RiskCheck] = [
            self._check_amount(req),
            self._check_lot_size(req),
            self._check_position_ratio(req, positions, total_asset),
            self._check_daily_limit(),
            self._check_trading_hours(),
            self._check_st(req),
            self._check_sell_available(req, positions),
            self._check_cash_sufficient(req, cash),
        ]
        passed = all(c.passed for c in checks)
        return RiskCheckResult(passed=passed, checks=checks)

    def record_order(self) -> None:
        self._daily_order_count += 1

    # ── 规则实现 ──

    def _check_amount(self, req: TradeRequest) -> RiskCheck:
        amount = req.price * req.volume
        limit = settings.max_single_order_amount
        ok = amount <= limit
        return RiskCheck(
            rule="单笔金额上限",
            passed=ok,
            detail=f"¥{amount:,.0f} {'≤' if ok else '>'} ¥{limit:,.0f}",
        )

    def _check_lot_size(self, req: TradeRequest) -> RiskCheck:
        lot = settings.lot_size
        ok = req.volume % lot == 0
        return RiskCheck(
            rule="手数整数倍",
            passed=ok,
            detail=f"{req.volume} {'是' if ok else '不是'} {lot} 的整数倍",
        )

    def _check_position_ratio(
        self, req: TradeRequest, positions: list[Position], total_asset: float,
    ) -> RiskCheck:
        if req.direction.value == "sell" or total_asset <= 0:
            return RiskCheck(rule="单票仓位上限", passed=True, detail="卖出/无资产，跳过")
        current_mv = sum(p.market_value for p in positions if p.stock_code == req.stock_code)
        new_mv = current_mv + req.price * req.volume
        ratio = new_mv / total_asset
        limit = settings.max_position_ratio
        ok = ratio <= limit
        return RiskCheck(
            rule="单票仓位上限",
            passed=ok,
            detail=f"{ratio:.1%} {'≤' if ok else '>'} {limit:.0%}",
        )

    def _check_daily_limit(self) -> RiskCheck:
        limit = settings.max_daily_orders
        ok = self._daily_order_count < limit
        return RiskCheck(
            rule="日内下单上限",
            passed=ok,
            detail=f"已下 {self._daily_order_count}/{limit} 笔",
        )

    def _check_trading_hours(self) -> RiskCheck:
        if settings.skip_trading_hours_check:
            return RiskCheck(rule="交易时段", passed=True, detail="开发模式跳过时段检查")
        now = datetime.now().time()
        morning = time(9, 15) <= now <= time(11, 30)
        afternoon = time(13, 0) <= now <= time(15, 0)
        ok = morning or afternoon
        return RiskCheck(
            rule="交易时段",
            passed=ok,
            detail=f"当前 {now:%H:%M} {'在' if ok else '不在'}交易时段",
        )

    def _check_st(self, req: TradeRequest) -> RiskCheck:
        is_st = "ST" in req.stock_name.upper()
        ok = not (settings.block_st and is_st)
        return RiskCheck(
            rule="ST 拦截",
            passed=ok,
            detail="ST 股票已拦截" if not ok else "非 ST",
        )

    def _check_sell_available(
        self, req: TradeRequest, positions: list[Position],
    ) -> RiskCheck:
        if req.direction.value == "buy":
            return RiskCheck(rule="可卖数量", passed=True, detail="买入，跳过")
        pos = next((p for p in positions if p.stock_code == req.stock_code), None)
        avail = pos.available_volume if pos else 0
        ok = req.volume <= avail
        return RiskCheck(
            rule="可卖数量",
            passed=ok,
            detail=f"卖 {req.volume} {'≤' if ok else '>'} 可用 {avail}",
        )


    def _check_cash_sufficient(self, req: TradeRequest, cash: float) -> RiskCheck:
        if req.direction.value == "sell":
            return RiskCheck(rule="现金充足", passed=True, detail="卖出，跳过")
        amount = req.price * req.volume
        ok = amount <= cash
        return RiskCheck(
            rule="现金充足",
            passed=ok,
            detail=f"需 ¥{amount:,.0f} {'≤' if ok else '>'} 可用 ¥{cash:,.0f}",
        )


risk_manager = RiskManager()
