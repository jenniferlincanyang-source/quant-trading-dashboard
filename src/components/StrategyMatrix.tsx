'use client';
import { TrendingUp, GitCompare, Scale, Zap, Layers, Newspaper } from 'lucide-react';
import EventNewsPanel from './EventNewsPanel';
import StrategyInsightPanel from './StrategyInsightPanel';
import InfoTip from './InfoTip';
import type { InsightType } from '@/services/types';
import { STRATEGY_CATEGORIES } from '@/services/types';
import type { StrategyCategory } from '@/services/types';

const ICONS: Record<StrategyCategory, typeof TrendingUp> = {
  trend_follow: TrendingUp,
  mean_reversion: GitCompare,
  stat_arb: Scale,
  hft: Zap,
  multi_factor: Layers,
  event_driven: Newspaper,
};

const INSIGHT_TYPES: InsightType[] = ['trend_follow', 'mean_reversion', 'stat_arb', 'hft', 'multi_factor'];

export default function StrategyMatrix() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm font-medium">六大量化策略洞察</span>
        <InfoTip text="展示趋势跟踪、均值回归、统计套利、高频交易、多因子、事件驱动六大策略的实时洞察分析，包含机构观点、市场事件等真实信息。" />
      </div>
      <div
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[800px] overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
      >
        {STRATEGY_CATEGORIES.map(cat => (
          <StrategyCard key={cat.key} cat={cat} />
        ))}
      </div>
    </div>
  );
}

function StrategyCard({ cat }: { cat: typeof STRATEGY_CATEGORIES[number] }) {
  const Icon = ICONS[cat.key];

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] flex flex-col">
      {/* header */}
      <div className="px-4 py-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} style={{ color: cat.color }} />
          <span className="text-sm font-medium">{cat.label}</span>
        </div>
        <p className="text-[10px] text-[#475569]">{cat.logic}</p>
      </div>

      {/* insight only */}
      <div className="p-3">
        {cat.key === 'event_driven' ? (
          <EventNewsPanel />
        ) : INSIGHT_TYPES.includes(cat.key as InsightType) ? (
          <StrategyInsightPanel type={cat.key as InsightType} />
        ) : null}
      </div>
    </div>
  );
}
