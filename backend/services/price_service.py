"""实时行情服务 — 腾讯财经 + 新浪财经"""
from __future__ import annotations
import json
import re
import sys
import os
from urllib.request import Request, urlopen

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Referer": "https://finance.sina.com.cn",
}

# 默认股票池
DEFAULT_CODES = [
    "600519", "000858", "601318", "000001", "600036",
    "300750", "002594", "688981", "603259", "000725",
    "002415", "600900", "601899", "000568", "600276",
    "002475", "601012", "600030", "002714", "601888",
    "000333", "600309", "601669", "002049", "600585",
    "601225", "002352", "300059", "688111", "002371",
]


def _code_to_symbol(code: str) -> str:
    return ("sh" if code.startswith(("6", "9")) else "sz") + code


def _http_get(url: str, timeout: int = 10) -> str:
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("gbk", errors="replace")


def fetch_latest_price(code: str) -> float:
    """获取单只股票最新价 — 腾讯优先, 新浪备用"""
    # 腾讯
    try:
        symbol = _code_to_symbol(code)
        raw = _http_get(f"http://qt.gtimg.cn/q={symbol}")
        fields = raw.split("~")
        if len(fields) > 3:
            price = float(fields[3])
            if price > 0:
                return price
    except Exception:
        pass
    # 新浪
    try:
        symbol = _code_to_symbol(code)
        raw = _http_get(f"http://hq.sinajs.cn/list={symbol}")
        m = re.search(r'"(.+)"', raw)
        if m:
            fields = m.group(1).split(",")
            price = float(fields[3])
            if price > 0:
                return price
    except Exception:
        pass
    raise ValueError(f"无法获取 {code} 最新价")


def fetch_stock_pool(codes: list = None) -> list:
    """批量获取股票池行情 — 供策略引擎使用"""
    target = codes or DEFAULT_CODES
    symbols = ",".join(_code_to_symbol(c) for c in target)
    url = f"http://qt.gtimg.cn/q={symbols}"
    raw = _http_get(url)
    results = []
    for line in raw.strip().split("\n"):
        m = re.match(r'v_(\w+)="(.+)";', line.strip())
        if not m:
            continue
        fields = m.group(2).split("~")
        if len(fields) < 50:
            continue
        try:
            results.append({
                "code": fields[2],
                "name": fields[1],
                "price": float(fields[3] or 0),
                "changePercent": float(fields[32] or 0),
                "volume": int(float(fields[36] or 0)),
                "amount": float(fields[37] or 0),
                "high": float(fields[33] or 0),
                "low": float(fields[34] or 0),
                "open": float(fields[5] or 0),
                "prevClose": float(fields[4] or 0),
                "turnoverRate": float(fields[38] or 0),
                "pe": float(fields[39] or 0),
            })
        except (ValueError, IndexError):
            continue
    return results


def fetch_kline(code: str, count: int = 30) -> list:
    """获取日K线 — 腾讯财经"""
    symbol = _code_to_symbol(code)
    url = f"http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={symbol},day,,,{count},qfq"
    raw = _http_get(url)
    data = json.loads(raw)
    days = data.get("data", {}).get(symbol, {}).get("qfqday", [])
    if not days:
        days = data.get("data", {}).get(symbol, {}).get("day", [])
    results = []
    for d in days:
        results.append({
            "date": d[0],
            "open": float(d[1]),
            "close": float(d[2]),
            "high": float(d[3]),
            "low": float(d[4]),
            "volume": int(float(d[5])) if len(d) > 5 else 0,
        })
    return results
