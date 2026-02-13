'use client';
import { Activity, AlertTriangle } from 'lucide-react';
import { usePriceTicks } from '@/hooks/useMarketData';

export default function PriceTicker() {
  const { data, loading } = usePriceTicks();

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#3b82f6] animate-pulse-dot" />
          <span className="text-sm font-medium">实时行情 · 多源验证</span>
        </div>
        <span className="text-[10px] text-[#475569]">
          {data?.length || 0} 只标的
        </span>
      </div>
      <div className="flex overflow-x-auto gap-3 p-3 scrollbar-thin">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="min-w-[140px] h-[72px] rounded-lg bg-[#0a0f1a] animate-pulse" />
          ))
        ) : (
          (data || []).map(tick => {
            const isUp = tick.changePercent >= 0;
            const color = isUp ? 'text-[#ef4444]' : 'text-[#10b981]';
            const bg = isUp ? 'bg-[#ef4444]/5' : 'bg-[#10b981]/5';
            return (
              <div key={tick.code} className={`min-w-[140px] rounded-lg ${bg} p-3 flex-shrink-0`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#94a3b8] truncate">{tick.name}</span>
                  <span className="text-[10px] text-[#475569]">{tick.code}</span>
                </div>
                <div className={`text-lg font-bold ${color}`}>
                  {tick.price.toFixed(2)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${color}`}>
                    {isUp ? '+' : ''}{tick.changePercent.toFixed(2)}%
                  </span>
                  {tick.divergence ? (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  ) : (
                    <span className="text-[10px] text-[#475569]">
                      {tick.sources.length}源✓
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
