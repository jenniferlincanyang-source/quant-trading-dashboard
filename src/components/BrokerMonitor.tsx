'use client';
import { useState } from 'react';
import { Building, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import InfoTip from './InfoTip';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useBrokerMonitor } from '@/hooks/useMarketData';
import type { BrokerStock, BrokerSignal, BrokerAction } from '@/services/types';

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e8) return (n / 1e8).toLocaleString('zh-CN', { maximumFractionDigits: 2 }) + '亿';
  if (abs >= 1e4) return (n / 1e4).toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + '万';
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

const ACTION_CFG: Record<BrokerAction, { label: string; color: string; bg: string }> = {
  building:       { label: '建仓', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/15' },
  reducing:       { label: '减仓', color: 'text-[#10b981]', bg: 'bg-[#10b981]/15' },
  sudden_inflow:  { label: '突增', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/15' },
  sudden_outflow: { label: '突减', color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/15' },
  neutral:        { label: '观望', color: 'text-[#475569]', bg: 'bg-[#475569]/15' },
};

export default function BrokerMonitor() {
  const { data, loading } = useBrokerMonitor();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading || !data) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building className="w-4 h-4 text-[#a855f7]" />
          <span className="text-sm font-medium">头部券商建仓减仓监控</span>
        </div>
        <div className="h-[300px] rounded-lg bg-[#0a0f1a] animate-pulse" />
      </div>
    );
  }

  const { brokers, summary, signals } = data;
  const actionBrokers = brokers.filter(b => b.action !== 'neutral');
  const neutralBrokers = brokers.filter(b => b.action === 'neutral');

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      <Header summary={summary} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
        <SignalPanel signals={signals} summary={summary} />
        <div className="lg:col-span-3 p-3">
          <div className="text-[10px] text-[#475569] mb-2 font-medium">
            券商明细 (点击展开5日资金流)
          </div>
          <div className="rounded-lg bg-[#0a0f1a] overflow-hidden">
            <TableHeader />
            {actionBrokers.map(b => (
              <BrokerRow key={b.code} item={b}
                expanded={expanded === b.code}
                onToggle={() => setExpanded(expanded === b.code ? null : b.code)} />
            ))}
            {neutralBrokers.map(b => (
              <BrokerRow key={b.code} item={b}
                expanded={expanded === b.code}
                onToggle={() => setExpanded(expanded === b.code ? null : b.code)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ summary }: { summary: { totalTodayInflow: number; buildingCount: number; reducingCount: number } }) {
  return (
    <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Building className="w-4 h-4 text-[#a855f7]" />
        <span className="text-sm font-medium">头部券商建仓减仓监控</span>
        <InfoTip text="监控10家头部券商（中信、海通、国泰君安、华泰等）的主力资金流向，通过5日资金流趋势判断建仓/减仓动作。券商板块是市场风向标，其资金动向对大盘走势有重要参考价值。" />
        <span className="text-[10px] text-[#475569]">多日资金流分析</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${summary.totalTodayInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
          今日净{summary.totalTodayInflow >= 0 ? '流入' : '流出'} {fmt(Math.abs(summary.totalTodayInflow))}
        </span>
        {summary.buildingCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/15 text-[#ef4444]">
            {summary.buildingCount}只建仓
          </span>
        )}
        {summary.reducingCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981]">
            {summary.reducingCount}只减仓
          </span>
        )}
      </div>
    </div>
  );
}

function SignalPanel({ signals, summary }: { signals: BrokerSignal[]; summary: { totalTodayInflow: number } }) {
  return (
    <div className="border-r border-[#1e293b] p-3 space-y-2">
      <div className="text-[10px] text-[#475569] mb-2 font-medium flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" /> 建仓减仓信号
      </div>
      {signals.length === 0 ? (
        <div className="text-xs text-[#475569] py-4 text-center">暂无建仓减仓信号</div>
      ) : (
        signals.map((s, i) => (
          <div key={i} className={`rounded-lg p-2 text-xs ${
            s.type === 'building' ? 'bg-[#ef4444]/10 border border-[#ef4444]/20' :
            s.type === 'reducing' ? 'bg-[#10b981]/10 border border-[#10b981]/20' :
            'bg-[#f59e0b]/10 border border-[#f59e0b]/20'
          }`}>
            <div className="flex items-start gap-1.5">
              {(s.type === 'building' || s.type === 'sudden_inflow')
                ? <TrendingUp className="w-3 h-3 mt-0.5 text-[#ef4444] flex-shrink-0" />
                : <TrendingDown className="w-3 h-3 mt-0.5 text-[#10b981] flex-shrink-0" />}
              <span className={
                s.type === 'building' ? 'text-[#ef4444]' :
                s.type === 'reducing' ? 'text-[#10b981]' : 'text-[#f59e0b]'
              }>{s.message}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TableHeader() {
  return (
    <div className="grid grid-cols-7 gap-1 px-2.5 py-1.5 text-[10px] text-[#475569] border-b border-[#1e293b]">
      <span className="col-span-2">券商</span>
      <span className="text-right">涨跌</span>
      <span className="text-right">今日主力</span>
      <span className="text-right">5日累计</span>
      <span className="text-right">连续天数</span>
      <span className="text-center">动作</span>
    </div>
  );
}

function BrokerRow({ item, expanded, onToggle }: {
  item: BrokerStock; expanded: boolean; onToggle: () => void;
}) {
  const pctColor = item.changePercent >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  const flowColor = item.todayMainInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  const fiveColor = item.fiveDayTotal >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  const cfg = ACTION_CFG[item.action];
  const Icon = item.action === 'building' || item.action === 'sudden_inflow'
    ? ArrowUpRight : item.action === 'reducing' || item.action === 'sudden_outflow'
    ? ArrowDownRight : Minus;

  return (
    <div className="border-b border-[#1e293b]/50 last:border-0">
      <button onClick={onToggle}
        className="w-full grid grid-cols-7 gap-1 px-2.5 py-2 text-xs hover:bg-[#1e293b]/30 transition-colors items-center">
        <div className="col-span-2 flex items-center gap-1.5 min-w-0">
          <Icon className={`w-3 h-3 flex-shrink-0 ${cfg.color}`} />
          <span className="text-[#94a3b8] truncate">{item.name}</span>
          <span className="text-[10px] text-[#334155]">¥{item.price.toFixed(2)}</span>
        </div>
        <span className={`text-right font-mono ${pctColor}`}>
          {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
        </span>
        <span className={`text-right font-mono ${flowColor}`}>{fmt(item.todayMainInflow)}</span>
        <span className={`text-right font-mono ${fiveColor}`}>{fmt(item.fiveDayTotal)}</span>
        <span className="text-right font-mono text-[#94a3b8]">
          {item.consecutiveDays > 0 ? `${item.consecutiveDays}天` : '-'}
        </span>
        <span className="flex justify-center">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
        </span>
      </button>
      {expanded && item.dayFlows.length > 0 && (
        <div className="px-3 pb-2">
          <MiniFlowChart flows={item.dayFlows} />
        </div>
      )}
    </div>
  );
}

function MiniFlowChart({ flows }: { flows: { date: string; main: number }[] }) {
  const chartData = flows.map(f => ({
    date: f.date.slice(5),
    value: f.main / 1e4,
  }));
  return (
    <div className="rounded-lg bg-[#111827] p-2">
      <div className="text-[10px] text-[#475569] mb-1">近5日主力净额 (万元)</div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={chartData}>
          <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9 }} />
          <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 11 }}
            formatter={(v) => [`${Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}万`, '净额']} />
          <ReferenceLine y={0} stroke="#334155" />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.value >= 0 ? '#ef4444' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
