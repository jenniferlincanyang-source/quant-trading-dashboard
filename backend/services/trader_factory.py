"""交易服务工厂 — 根据配置返回 Mock 或 QMT 实例"""
from __future__ import annotations
from config import settings

# 统一接口类型 (duck typing)
_trader = None


async def get_trader():
    global _trader
    if _trader and _trader.is_connected:
        return _trader

    if settings.mock_mode:
        from services.mock_trader import MockTrader
        _trader = MockTrader()
    else:
        from services.qmt_trader import QmtTrader
        _trader = QmtTrader(settings.qmt_path, settings.qmt_account)

    await _trader.connect()
    return _trader
