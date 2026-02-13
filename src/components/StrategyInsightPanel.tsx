'use client';
import { useState } from 'react';
import {
  ExternalLink, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Building2, BarChart3,
} from 'lucide-react';
import { useStrategyInsights } from '@/hooks/useMarketData';
import { RATING_LABELS } from '@/services/types';
import type { StrategyInsight, AnalystView, InsightType } from '@/services/types';

const signalConfig = {
  bullish: { icon: TrendingUp, color: '#10b981', label: '看多', bg: 'bg-emerald-500/10' },
  bearish: { icon: TrendingDown, color: '#ef4444', label: '看空', bg: 'bg-red-500/10' },
  neutral: { icon: Minus, color: '#f59e0b', label: '中性', bg: 'bg-amber-500/10' },
};

const typeLabels: Record<InsightType, string> = {
  trend_follow: '趋势跟踪',
  mean_reversion: '均值回归',
  stat_arb: '统计套利',
  hft: '高频交易',
  multi_factor: '多因子模型',
};

function RatingBadge({ rating }: { rating: AnalystView['rating'] }) {
  const colors: Record<string, string> = {
    buy: 'bg-emerald-500/15 text-emerald-400',
    overweight: 'bg-emerald-500/10 text-emerald-300',
    hold: 'bg-amber-500/10 text-amber-400',
    underweight: 'bg-red-500/10 text-red-300',
    sell: 'bg-red-500/15 text-red-400',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[rating]}`}>
      {RATING_LABELS[rating]}
    </span>
  );
}

function AnalystSection({ views }: { views: AnalystView[] }) {
  if (views.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5 pl-3 border-l border-white/5">
      {views.map((v, i) => (
        <div key={i} className="flex items-start gap-2 text-[11px]">
          <Building2 size={12} className="text-[#64748b] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#94a3b8] font-medium">{v.institution}</span>
              <span className="text-[#475569]">{v.analyst}</span>
              <RatingBadge rating={v.rating} />
              {v.targetPrice && (
                <span className="text-[#64748b]">目标价 ¥{v.targetPrice}</span>
              )}
              {v.datetime && (
                <span className="text-[#475569]">{v.datetime}</span>
              )}
              {v.lagDays !== undefined && v.lagDays > 0 && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400">
                  滞后{v.lagDays}天
                </span>
              )}
            </div>
            <p className="text-[#64748b] mt-0.5 leading-relaxed">{v.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricsBar({ metrics }: { metrics: Record<string, string> }) {
  return (
    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
      {Object.entries(metrics).map(([k, v]) => (
        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">
          <span className="text-[#475569]">{k}</span> {v}
        </span>
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: StrategyInsight }) {
  const [expanded, setExpanded] = useState(false);
  const sig = signalConfig[insight.signal];
  const SigIcon = sig.icon;

  return (
    <div className="p-3 rounded-lg bg-[#0a0f1a]/60 hover:bg-[#0a0f1a] transition-colors">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          <SigIcon size={14} style={{ color: sig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${sig.bg}`}
              style={{ color: sig.color }}>
              {sig.label}
            </span>
            <span className="text-[10px] text-[#475569]">{insight.datetime || insight.time}</span>
            {insight.lagDays > 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400">
                滞后{insight.lagDays}天
              </span>
            )}
            {insight.lagDays === 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                实时
              </span>
            )}
          </div>
          <p className="text-sm text-white leading-snug">{insight.title}</p>
          <p className="text-[11px] text-[#64748b] mt-1 leading-relaxed">{insight.summary}</p>

          {insight.keyMetrics && <MetricsBar metrics={insight.keyMetrics} />}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <a href={insight.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
              {insight.source} <ExternalLink size={10} />
            </a>
            {insight.verifiedDate && (
              <span className="text-[10px] text-[#475569]">验证 {insight.verifiedDate}</span>
            )}
          </div>

          {insight.analystViews.length > 0 && (
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-[10px] text-[#64748b] hover:text-[#94a3b8] transition-colors">
              <Building2 size={10} />
              {insight.analystViews.length} 家机构分析
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {expanded && <AnalystSection views={insight.analystViews} />}
        </div>
      </div>
    </div>
  );
}

export default function StrategyInsightPanel({ type }: { type: InsightType }) {
  const { data: insights, loading } = useStrategyInsights(type);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-[#0a0f1a] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center text-[#475569] text-sm py-8">
        暂无{typeLabels[type]}洞察
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 size={12} className="text-[#64748b]" />
        <span className="text-xs text-[#64748b]">{typeLabels[type]}洞察</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#94a3b8]">
          {insights.length} 条
        </span>
      </div>
      {insights.map(insight => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
