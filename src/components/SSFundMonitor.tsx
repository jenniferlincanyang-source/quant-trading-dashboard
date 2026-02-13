'use client';
import { useState } from 'react';
import { Briefcase, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import InfoTip from './InfoTip';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSSFMonitor } from '@/hooks/useMarketData';
import type { SSFHolding, SSFSectorSummary, SSFSignal } from '@/services/types';

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e8) return (n / 1e8).toLocaleString('zh-CN', { maximumFractionDigits: 2 }) + '亿';
  if (abs >= 1e4) return (n / 1e4).toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + '万';
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

const CAT_COLORS: Record<string, string> = {
  pharma: '#06b6d4', tech: '#a855f7', consumer: '#f59e0b',
  finance: '#3b82f6', energy: '#10b981',
};

export default function SSFundMonitor() {
  const { data, loading } = useSSFMonitor();
  const [showAll, setShowAll] = useState(false);

  if (loading || !data) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-[#f59e0b]" />
          <span className="text-sm font-medium">社保基金动向监控</span>
        </div>
        <div className="h-[300px] rounded-lg bg-[#0a0f1a] animate-pulse" />
      </div>
    );
  }

  const { holdings, sectorSummary, summary, signals } = data;
  const visibleHoldings = showAll ? holdings : holdings.slice(0, 8);

  const chartData = sectorSummary.map(s => ({
    name: s.label,
    value: s.totalInflow / 1e4,
    fill: s.totalInflow >= 0 ? (CAT_COLORS[s.category] || '#3b82f6') : '#ef4444',
  }));

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#f59e0b]" />
          <span className="text-sm font-medium">社保基金动向监控</span>
          <InfoTip text="追踪社保基金重仓的13只核心持股（覆盖医药、科技、消费、金融、新能源五大板块），监控主力资金流入/流出动态，识别社保基金增减仓信号。" />
          <span className="text-[10px] text-[#475569]">追踪社保重仓股资金动向</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${summary.totalMainInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            主力净{summary.totalMainInflow >= 0 ? '流入' : '流出'} {fmt(Math.abs(summary.totalMainInflow))}
          </span>
          <span className="text-[10px] text-[#475569]">{summary.holdingCount}只重仓股</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        <LeftPanel signals={signals} sectorSummary={sectorSummary} chartData={chartData} />
        <RightPanel
          holdings={visibleHoldings}
          allCount={holdings.length}
          showAll={showAll}
          onToggle={() => setShowAll(!showAll)}
        />
      </div>
    </div>
  );
}

function LeftPanel({ signals, sectorSummary, chartData }: {
  signals: SSFSignal[];
  sectorSummary: SSFSectorSummary[];
  chartData: { name: string; value: number; fill: string }[];
}) {
  return (
    <div className="border-r border-[#1e293b] p-3 space-y-3">
      {/* 板块资金流图 */}
      <div>
        <div className="text-[10px] text-[#475569] mb-1.5 font-medium">板块资金流向 (万元)</div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }}
              tickFormatter={v => `${Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={50} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}万`, '净额']} />
            <ReferenceLine x={0} stroke="#334155" />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 信号 */}
      <div>
        <div className="text-[10px] text-[#475569] mb-1.5 font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> 动向信号
        </div>
        {signals.length === 0 ? (
          <div className="text-xs text-[#475569] py-2 text-center">暂无异常信号</div>
        ) : (
          <div className="space-y-1.5">
            {signals.map((s, i) => (
              <div key={i} className={`rounded-lg p-2 text-xs ${
                s.severity === 'critical' ? 'bg-[#ef4444]/10 border border-[#ef4444]/20' :
                s.severity === 'warning' ? 'bg-[#f59e0b]/10 border border-[#f59e0b]/20' :
                'bg-[#3b82f6]/10 border border-[#3b82f6]/20'
              }`}>
                <div className="flex items-center gap-1.5">
                  {s.type === 'inflow'
                    ? <TrendingUp className="w-3 h-3 text-[#ef4444]" />
                    : <TrendingDown className="w-3 h-3 text-[#10b981]" />}
                  <span className={
                    s.severity === 'warning' ? 'text-[#f59e0b]' : 'text-[#94a3b8]'
                  }>{s.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RightPanel({ holdings, allCount, showAll, onToggle }: {
  holdings: SSFHolding[];
  allCount: number;
  showAll: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="lg:col-span-2 p-3">
      <div className="text-[10px] text-[#475569] mb-2 font-medium">社保重仓股明细</div>
      <div className="rounded-lg bg-[#0a0f1a] overflow-hidden">
        <div className="grid grid-cols-6 gap-1 px-2.5 py-1.5 text-[10px] text-[#475569] border-b border-[#1e293b]">
          <span className="col-span-2">股票</span>
          <span className="text-right">现价</span>
          <span className="text-right">涨跌</span>
          <span className="text-right">主力净额</span>
          <span className="text-right">成交额</span>
        </div>
        {holdings.map(h => (
          <HoldingRow key={h.code} item={h} />
        ))}
      </div>
      {allCount > 8 && (
        <button onClick={onToggle}
          className="w-full mt-1.5 text-[10px] text-[#475569] hover:text-[#94a3b8] flex items-center justify-center gap-1 py-1">
          {showAll ? <><ChevronUp className="w-3 h-3" />收起</> : <><ChevronDown className="w-3 h-3" />展开全部 {allCount} 只</>}
        </button>
      )}
    </div>
  );
}

function HoldingRow({ item }: { item: SSFHolding }) {
  const pctColor = item.changePercent >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  const flowColor = item.mainNetInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  const catColor = CAT_COLORS[item.category] || '#94a3b8';
  return (
    <div className="grid grid-cols-6 gap-1 px-2.5 py-1.5 text-xs border-b border-[#1e293b]/50 last:border-0 hover:bg-[#1e293b]/30 transition-colors">
      <div className="col-span-2 flex items-center gap-1.5 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
        <span className="text-[#94a3b8] truncate">{item.name}</span>
        <span className="text-[10px] text-[#334155]">{item.code}</span>
      </div>
      <span className="text-right font-mono text-[#94a3b8]">{item.price.toFixed(2)}</span>
      <span className={`text-right font-mono ${pctColor}`}>
        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
      </span>
      <span className={`text-right font-mono ${flowColor}`}>{fmt(item.mainNetInflow)}</span>
      <span className="text-right font-mono text-[10px] text-[#475569]">{fmt(item.amount)}</span>
    </div>
  );
}
