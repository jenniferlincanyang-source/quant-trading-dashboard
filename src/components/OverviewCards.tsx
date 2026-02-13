'use client';
import { TrendingUp, Flame, Target, ShieldCheck } from 'lucide-react';
import InfoTip from './InfoTip';
import { useMarketOverview } from '@/hooks/useMarketData';
import type { DataSource } from '@/services/types';

function SourceBadge({ sources, confidence }: { sources: DataSource[]; confidence: number }) {
  const color = confidence >= 0.8 ? 'text-[#10b981]' : confidence >= 0.5 ? 'text-[#f59e0b]' : 'text-[#ef4444]';
  return (
    <div className="flex items-center gap-1 mt-2">
      <ShieldCheck className={`w-3 h-3 ${color}`} />
      <span className={`text-[10px] ${color}`}>
        {sources.join(' + ')} · {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}

export default function OverviewCards() {
  const { data, sources, confidence, loading } = useMarketOverview();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-[#1e293b] bg-[#111827] p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: TrendingUp,
      label: '市场情绪指数',
      value: data.sentimentIndex.toFixed(1),
      sub: data.sentimentLabel,
      color: data.sentimentIndex > 50 ? '#10b981' : '#ef4444',
    },
    {
      icon: Flame,
      label: 'Oracle 最热行业',
      value: data.hotSector,
      sub: `${data.hotSectorChange > 0 ? '+' : ''}${data.hotSectorChange}%`,
      color: '#f59e0b',
    },
    {
      icon: Target,
      label: '量化平均胜率',
      value: `${data.avgWinRate}%`,
      sub: `${data.avgWinRateChange > 0 ? '↑' : '↓'}${Math.abs(data.avgWinRateChange)}%`,
      color: '#3b82f6',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl border border-[#1e293b] bg-[#111827] p-5 hover:border-[#334155] transition-colors">
          <div className="flex items-center gap-2 text-[#64748b] text-xs mb-3">
            <c.icon className="w-4 h-4" style={{ color: c.color }} />
            {c.label}
            {i === 0 && <InfoTip text="市场情绪指数综合涨跌家数比、涨停/跌停数量、成交量变化等指标计算，0-100 区间，>50 偏多，<50 偏空。Oracle 最热行业和量化胜率来自三源交叉验证数据。" />}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</span>
            <span className="text-sm text-[#64748b]">{c.sub}</span>
          </div>
          <SourceBadge sources={sources} confidence={confidence} />
        </div>
      ))}
    </div>
  );
}
