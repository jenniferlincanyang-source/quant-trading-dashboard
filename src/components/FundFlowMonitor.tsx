'use client';
import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import InfoTip from './InfoTip';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMarketFundFlow } from '@/hooks/useMarketData';
import type { ExchangeFundFlow } from '@/services/types';

/** 千分位格式化 */
function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e8) return (n / 1e8).toLocaleString('zh-CN', { maximumFractionDigits: 2 }) + '亿';
  if (abs >= 1e4) return (n / 1e4).toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + '万';
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

export default function FundFlowMonitor() {
  const { data, loading } = useMarketFundFlow();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const chartData = data ? [
    { name: '超大单', value: data.totalSuperLarge / 1e8, fill: data.totalSuperLarge >= 0 ? '#3b82f6' : '#ef4444' },
    { name: '大单', value: data.totalLarge / 1e8, fill: data.totalLarge >= 0 ? '#6366f1' : '#f97316' },
    { name: '中单', value: data.totalMedium / 1e8, fill: data.totalMedium >= 0 ? '#10b981' : '#eab308' },
    { name: '小单', value: data.totalSmall / 1e8, fill: data.totalSmall >= 0 ? '#94a3b8' : '#94a3b8' },
  ] : [];

  const allStocks = data
    ? [...data.topInflows, ...data.topOutflows]
        .filter((v, i, a) => a.findIndex(x => x.code === v.code) === i)
        .sort((a, b) => b.mainNetInflow - a.mainNetInflow)
    : [];
  const visibleStocks = showAll ? allStocks : allStocks.slice(0, 10);

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#3b82f6]" />
          <span className="text-sm font-medium">资金流向监控</span>
          <InfoTip text="实时监控全市场超大单、大单、中单、小单资金净流入/流出，展示 Top 流入和流出个股明细。数据来自东方财富 Level-2 资金流接口，帮助判断主力资金动向。" />
        </div>
        {data && (
          <span className={`text-xs font-medium ${data.totalMainInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            主力净{data.totalMainInflow >= 0 ? '流入' : '流出'} {fmt(Math.abs(data.totalMainInflow))}
          </span>
        )}
      </div>

      <div className="p-3">
        {loading ? (
          <div className="h-[160px] rounded-lg bg-[#0a0f1a] animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }}
                tickFormatter={v => `${Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 1 })}亿`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={50} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}亿`, '净额']} />
              <ReferenceLine x={0} stroke="#334155" />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 个股资金流明细 */}
      {data && allStocks.length > 0 && (
        <div className="px-3 pb-3">
          <div className="text-[10px] text-[#475569] mb-2 font-medium">个股资金流明细</div>
          <div className="rounded-lg bg-[#0a0f1a] overflow-hidden">
            <FlowHeader />
            {visibleStocks.map(f => (
              <FlowRow key={f.code} item={f}
                expanded={expanded === f.code}
                onToggle={() => setExpanded(expanded === f.code ? null : f.code)} />
            ))}
          </div>
          {allStocks.length > 10 && (
            <button onClick={() => setShowAll(!showAll)}
              className="w-full mt-1.5 text-[10px] text-[#475569] hover:text-[#94a3b8] flex items-center justify-center gap-1 py-1">
              {showAll ? <><ChevronUp className="w-3 h-3" />收起</> : <><ChevronDown className="w-3 h-3" />展开全部 {allStocks.length} 只</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FlowHeader() {
  return (
    <div className="grid grid-cols-6 gap-1 px-2.5 py-1.5 text-[10px] text-[#475569] border-b border-[#1e293b]">
      <span className="col-span-2">股票</span>
      <span className="text-right">主力净额</span>
      <span className="text-right">超大单</span>
      <span className="text-right">大单</span>
      <span className="text-right">中小单</span>
    </div>
  );
}

function FlowRow({ item, expanded, onToggle }: {
  item: ExchangeFundFlow; expanded: boolean; onToggle: () => void;
}) {
  const isIn = item.mainNetInflow >= 0;
  const color = isIn ? 'text-[#ef4444]' : 'text-[#10b981]';
  const Icon = isIn ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="border-b border-[#1e293b]/50 last:border-0">
      <button onClick={onToggle}
        className="w-full grid grid-cols-6 gap-1 px-2.5 py-1.5 text-xs hover:bg-[#1e293b]/30 transition-colors items-center">
        <div className="col-span-2 flex items-center gap-1.5 min-w-0">
          <Icon className={`w-3 h-3 flex-shrink-0 ${color}`} />
          <span className="text-[#94a3b8] truncate">{item.name}</span>
          <span className="text-[10px] text-[#334155]">{item.code}</span>
        </div>
        <span className={`text-right font-mono ${color}`}>{fmt(item.mainNetInflow)}</span>
        <span className={`text-right font-mono text-[10px] ${item.superLargeInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
          {fmt(item.superLargeInflow)}
        </span>
        <span className={`text-right font-mono text-[10px] ${item.largeInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
          {fmt(item.largeInflow)}
        </span>
        <span className={`text-right font-mono text-[10px] ${(item.mediumInflow + item.smallInflow) >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
          {fmt(item.mediumInflow + item.smallInflow)}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-2 grid grid-cols-4 gap-2 text-[10px]">
          <Detail label="超大单" value={item.superLargeInflow} pct={item.superLargePercent} />
          <Detail label="大单" value={item.largeInflow} pct={item.largePercent} />
          <Detail label="中单" value={item.mediumInflow} pct={item.mediumPercent} />
          <Detail label="小单" value={item.smallInflow} pct={item.smallPercent} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, pct }: { label: string; value: number; pct: number }) {
  const color = value >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  return (
    <div className="rounded bg-[#111827] p-1.5 text-center">
      <div className="text-[#475569] mb-0.5">{label}</div>
      <div className={`font-mono ${color}`}>{fmt(value)}</div>
      <div className="text-[#475569]">{pct >= 0 ? '+' : ''}{pct.toFixed(1)}%</div>
    </div>
  );
}