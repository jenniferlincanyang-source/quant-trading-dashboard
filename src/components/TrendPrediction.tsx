'use client';
import { TrendingUp, TrendingDown, Minus, Target, BarChart3 } from 'lucide-react';
import InfoTip from './InfoTip';
import { useMultiPeriodTrend } from '@/hooks/useMarketData';
import type { TrendPrediction as TrendPredictionType, TrendPeriod } from '@/services/types';

const periodLabels: Record<TrendPeriod, string> = { daily: '日线', weekly: '周线', monthly: '月线' };

const dirConfig = {
  up: { icon: TrendingUp, color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', label: '看多' },
  down: { icon: TrendingDown, color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', label: '看空' },
  sideways: { icon: Minus, color: 'text-[#94a3b8]', bg: 'bg-[#94a3b8]/10', label: '震荡' },
};

const consensusConfig = {
  bullish: { color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', label: '多周期共振看多' },
  bearish: { color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', label: '多周期共振看空' },
  mixed: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: '多空分歧' },
};

function TrendCard({ trend }: { trend: TrendPredictionType }) {
  const cfg = dirConfig[trend.direction];
  const Icon = cfg.icon;
  return (
    <div className="rounded-lg bg-[#0a0f1a] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#94a3b8] font-medium">{periodLabels[trend.period]}</span>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${cfg.bg}`}>
          <Icon className={`w-3 h-3 ${cfg.color}`} />
          <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[#475569]">置信度</span>
          <span className="text-[#94a3b8]">{(trend.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#1e293b]">
          <div className={`h-full rounded-full ${cfg.color.replace('text-', 'bg-')}`}
            style={{ width: `${trend.confidence * 100}%` }} />
        </div>
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-[#475569]">目标价</span>
          <span className={cfg.color}>{trend.targetPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#475569]">支撑位</span>
          <span className="text-[#94a3b8]">{trend.supportLevel.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#475569]">阻力位</span>
          <span className="text-[#94a3b8]">{trend.resistanceLevel.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {trend.keyFactors.map(f => (
          <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">{f}</span>
        ))}
      </div>
    </div>
  );
}

export default function TrendPrediction({ stockCode }: { stockCode: string }) {
  const { data, loading } = useMultiPeriodTrend(stockCode);

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#6366f1]" />
          <span className="text-sm font-medium">多周期趋势预测</span>
          <InfoTip text="基于 MA5/10/20/60 均线系统，分别计算日线、周线、月线三个周期的趋势方向和置信度。当多周期共振（同时看多或看空）时信号更强，同时标注关键支撑位和阻力位。" />
          {data && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6]">
              {data.name}
            </span>
          )}
        </div>
        {data && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${consensusConfig[data.consensus].bg}`}>
            <BarChart3 className={`w-3 h-3 ${consensusConfig[data.consensus].color}`} />
            <span className={`text-[10px] font-medium ${consensusConfig[data.consensus].color}`}>
              {consensusConfig[data.consensus].label}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 flex-1">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[200px] rounded-lg bg-[#0a0f1a] animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-3 gap-3">
            <TrendCard trend={data.daily} />
            <TrendCard trend={data.weekly} />
            <TrendCard trend={data.monthly} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
