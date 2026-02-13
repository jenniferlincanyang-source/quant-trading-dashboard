'use client';
import { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, Wallet, ClipboardList, PieChart } from 'lucide-react';
import InfoTip from './InfoTip';
import { useTradeWebSocket } from '@/hooks/useTradeWebSocket';
import { getPositions, getOrders } from '@/services/tradeService';
import { usePortfolioSummary } from '@/hooks/useMarketData';
import type { Position, OrderInfo } from '@/services/tradeService';
import type { EnhancedPosition } from '@/services/types';

export default function TradePanel() {
  const { connected, executions } = useTradeWebSocket();
  const [tab, setTab] = useState<'executions' | 'positions' | 'orders' | 'portfolio'>('executions');
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const { data: portfolio } = usePortfolioSummary();

  useEffect(() => {
    if (tab === 'positions') {
      getPositions().then(setPositions).catch(() => {});
    } else if (tab === 'orders') {
      getOrders().then(setOrders).catch(() => {});
    }
  }, [tab, executions.length]);

  const tabs = [
    { key: 'executions' as const, label: '实时成交', icon: Activity, count: executions.length },
    { key: 'positions' as const, label: '持仓', icon: Wallet, count: positions.length },
    { key: 'orders' as const, label: '委托', icon: ClipboardList, count: orders.length },
    { key: 'portfolio' as const, label: '组合', icon: PieChart, count: portfolio?.positions.length || 0 },
  ];

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <InfoTip text="通过 WebSocket 实时接收交易执行回报，展示成交明细、当前持仓、委托状态和组合概览。WS 连接状态显示在右侧，断开时自动重连。" />
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
                tab === t.key ? 'bg-[#1e293b] text-white' : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className="text-[10px] bg-[#3b82f6]/20 text-[#3b82f6] px-1 rounded">{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          {connected ? (
            <><Wifi className="w-3 h-3 text-[#10b981]" /><span className="text-[#10b981]">WS 已连接</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-[#ef4444]" /><span className="text-[#ef4444]">WS 断开</span></>
          )}
        </div>
      </div>

      <div className="p-3 max-h-[300px] overflow-y-auto">
        {tab === 'executions' && <ExecutionList executions={executions} />}
        {tab === 'positions' && <PositionList positions={positions} />}
        {tab === 'orders' && <OrderList orders={orders} />}
        {tab === 'portfolio' && portfolio && <PortfolioView portfolio={portfolio} />}
      </div>
    </div>
  );
}

function ExecutionList({ executions }: { executions: any[] }) {
  if (executions.length === 0) {
    return <div className="text-center text-[#475569] text-xs py-6">暂无成交记录 — 点击信号流中的"执行"按钮下单</div>;
  }
  return (
    <div className="space-y-1.5">
      {executions.map((e, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-[#0a0f1a] px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${e.type === 'trade_executed' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`} />
            <span className="text-[#64748b]">{e.stock_code}</span>
            <span>{e.stock_name || ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={e.direction === 'buy' ? 'text-[#10b981]' : 'text-[#ef4444]'}>
              {e.direction === 'buy' ? '买' : '卖'} {e.filled_volume}股
            </span>
            <span className="text-[#94a3b8]">¥{e.filled_price}</span>
            <span className="text-[10px] text-[#475569]">{e.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PositionList({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return <div className="text-center text-[#475569] text-xs py-6">暂无持仓</div>;
  }
  return (
    <div className="space-y-1.5">
      {positions.map(p => (
        <div key={p.stock_code} className="flex items-center justify-between rounded-lg bg-[#0a0f1a] px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#64748b]">{p.stock_code}</span>
            <span>{p.stock_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#94a3b8]">{p.volume}股</span>
            <span className="text-[#94a3b8]">成本 ¥{p.avg_cost}</span>
            <span className={p.profit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}>
              {p.profit >= 0 ? '+' : ''}{p.profit_ratio}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderList({ orders }: { orders: OrderInfo[] }) {
  if (orders.length === 0) {
    return <div className="text-center text-[#475569] text-xs py-6">暂无委托</div>;
  }
  const statusColors: Record<string, string> = {
    filled: 'text-[#10b981]', submitted: 'text-[#3b82f6]',
    cancelled: 'text-[#64748b]', rejected: 'text-[#ef4444]',
    partial_filled: 'text-[#f59e0b]', pending: 'text-[#94a3b8]',
  };
  return (
    <div className="space-y-1.5">
      {orders.map(o => (
        <div key={o.order_id} className="flex items-center justify-between rounded-lg bg-[#0a0f1a] px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={o.direction === 'buy' ? 'text-[#10b981]' : 'text-[#ef4444]'}>
              {o.direction === 'buy' ? '买' : '卖'}
            </span>
            <span className="text-[#64748b]">{o.stock_code}</span>
            <span>{o.stock_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#94a3b8]">¥{o.price} x{o.volume}</span>
            <span className="text-[#94a3b8]">成交 {o.filled_volume}</span>
            <span className={statusColors[o.status] || 'text-[#94a3b8]'}>{o.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioView({ portfolio }: { portfolio: import('@/services/types').PortfolioSummary }) {
  const fmt = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(2)}万` : n.toFixed(2);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-[#0a0f1a] p-2.5 text-center">
          <div className="text-sm font-bold text-[#94a3b8]">{fmt(portfolio.totalValue)}</div>
          <div className="text-[10px] text-[#475569]">总市值</div>
        </div>
        <div className="rounded-lg bg-[#0a0f1a] p-2.5 text-center">
          <div className={`text-sm font-bold ${portfolio.totalProfit >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {portfolio.totalProfit >= 0 ? '+' : ''}{fmt(portfolio.totalProfit)}
          </div>
          <div className="text-[10px] text-[#475569]">总盈亏 ({portfolio.totalProfitRatio}%)</div>
        </div>
        <div className="rounded-lg bg-[#0a0f1a] p-2.5 text-center">
          <div className={`text-sm font-bold ${portfolio.todayProfit >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {portfolio.todayProfit >= 0 ? '+' : ''}{fmt(portfolio.todayProfit)}
          </div>
          <div className="text-[10px] text-[#475569]">今日盈亏</div>
        </div>
      </div>
      <div className="space-y-2">
        {portfolio.positions.map(p => (
          <PositionCard key={p.stockCode} position={p} />
        ))}
      </div>
    </div>
  );
}

function PositionCard({ position: p }: { position: EnhancedPosition }) {
  const sparkW = 60;
  const sparkH = 20;
  const prices = p.recentPrices;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const points = prices.map((v, i) =>
    `${(i / (prices.length - 1)) * sparkW},${sparkH - ((v - min) / range) * sparkH}`
  ).join(' ');

  return (
    <div className="rounded-lg bg-[#0a0f1a] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">{p.stockCode}</span>
          <span className="text-sm font-medium">{p.stockName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">{p.sector}</span>
        </div>
        <svg width={sparkW} height={sparkH}>
          <polyline points={points} fill="none"
            stroke={p.profit >= 0 ? '#ef4444' : '#10b981'} strokeWidth="1.5" />
        </svg>
      </div>
      <div className="grid grid-cols-4 gap-2 text-[10px]">
        <div><span className="text-[#475569]">现价 </span><span className="text-[#94a3b8]">{p.currentPrice}</span></div>
        <div><span className="text-[#475569]">成本 </span><span className="text-[#94a3b8]">{p.avgCost}</span></div>
        <div><span className="text-[#475569]">持仓 </span><span className="text-[#94a3b8]">{p.volume}股</span></div>
        <div><span className="text-[#475569]">占比 </span><span className="text-[#94a3b8]">{p.allocationPercent}%</span></div>
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px]">
        <div className="flex items-center gap-3">
          <span className={p.profit >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}>
            盈亏 {p.profit >= 0 ? '+' : ''}{p.profit.toFixed(0)} ({p.profitRatio}%)
          </span>
          <span className={p.todayProfit >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}>
            今日 {p.todayProfit >= 0 ? '+' : ''}{p.todayProfit.toFixed(0)}
          </span>
        </div>
        <span className="text-[#475569]">持有{p.holdingDays}天</span>
      </div>
    </div>
  );
}
