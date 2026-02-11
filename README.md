# Quant Trading Dashboard

A-股量化交易监控仪表盘，实时数据 + 策略引擎 + 风控下单。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8)

## 功能

- **策略矩阵** — 6 大策略分类（趋势跟踪 / 均值回归 / 统计套利 / 高频交易 / 多因子 / 事件驱动），侧边栏切换 + 信号卡片 + Sparkline
- **实时行情** — 腾讯财经 + 新浪财经双源数据，Mock 自动降级
- **Oracle 事件流** — 大单异动、涨跌停封单、成交量突增等实时推送
- **策略引擎** — 红利低波策略已实现，因子打分 + 信号生成
- **风控系统** — 7 条规则链（金额 / 手数 / 仓位 / 日限 / 时段 / ST / 可卖量）
- **交易执行** — Mock 模拟盘 / QMT 实盘切换，T+1 结算
- **市场扫描** — 个股价值评分排行榜 + 申万一级行业热力图
- **K 线图表** — 30 日 K 线 + 夏普比率，支持联动选股
- **数据持久化** — SQLite 存储订单、持仓、账户快照

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16 · React 19 · TypeScript · Tailwind v4 · Recharts · Lucide |
| 后端 | FastAPI · Pydantic · WebSocket · aiosqlite |
| 数据 | 腾讯财经 · 新浪财经 · AKShare · Mock 降级 |
| 交易 | QMT (xtquant) / Mock 模式 |

## 快速开始

### 前端

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 后端

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

> macOS 默认 Mock 模式（`QMT_MOCK_MODE=true`），无需 QMT 客户端。

## 项目结构

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API 代理 (market / oracle / strategy)
│   │   └── page.tsx      # 主仪表盘
│   ├── components/       # UI 组件
│   │   ├── StrategyMatrix.tsx   # 策略矩阵（核心）
│   │   ├── OracleStream.tsx     # Oracle 事件流
│   │   ├── KLineChart.tsx       # K 线图
│   │   ├── MarketScanner.tsx    # 市场扫描排行
│   │   ├── SectorHeatmap.tsx    # 行业热力图
│   │   └── TradePanel.tsx       # 交易面板
│   ├── hooks/            # 数据 hooks
│   └── services/         # 数据服务 + 类型定义
├── backend/
│   ├── main.py           # FastAPI 入口
│   ├── routers/          # 路由 (trade / strategy / ws)
│   ├── risk/             # 风控引擎
│   ├── services/         # 交易服务 (mock / qmt)
│   ├── strategies/       # 策略引擎
│   └── db.py             # SQLite 持久化
└── scripts/
    └── akshare_service.py  # AKShare 数据采集
```

## License

MIT
