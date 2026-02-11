"""全局配置"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- QMT ---
    qmt_path: str = r"D:\国金QMT\userdata_mini"
    qmt_account: str = ""
    qmt_account_type: str = "STOCK"  # STOCK / CREDIT

    # --- 运行模式 ---
    mock_mode: bool = True  # macOS 开发默认 Mock

    # --- 风控参数 ---
    max_single_order_amount: float = 50_000.0   # 单笔 ≤ 5万
    max_position_ratio: float = 0.20            # 单票 ≤ 总资产 20%
    max_daily_orders: int = 50                  # 日内 ≤ 50笔
    block_st: bool = True                       # 拦截 ST
    lot_size: int = 100                         # A股最小手数
    skip_trading_hours_check: bool = False       # 开发模式跳过时段检查

    # --- 服务 ---
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: List[str] = ["http://localhost:3000"]

    model_config = {"env_prefix": "QMT_", "env_file": ".env"}


settings = Settings()
