'use client';
import { Radio, ArrowUpCircle, ArrowDownCircle, Zap, BarChart3, Repeat } from 'lucide-react';
import { useOracleEvents } from '@/hooks/useMarketData';
import type { OracleEvent } from '@/services/types';

const typeIcons: Record<OracleEvent['type'], typeof Zap> = {
  big_order: Zap,
  limit_up_seal: ArrowUpCircle,
  limit_down_seal: ArrowDownCircle,
  volume_spike: BarChart3,
  block_trade: Repeat,
};

const typeLabels: Record<OracleEvent['type'], string> = {
  big_order: '大单',
  limit_up_seal: '封涨停',
  limit_down_seal: '封跌停',
  volume_spike: '放量',
  block_trade: '大宗',
};

const impactColors: Record<OracleEvent['impact'], string> = {
  positive: 'text-[#10b981]',
  negative: 'text-[#ef4444]',
  neutral: 'text-[#64748b]',
};

export default function OracleStream({ stockCode }: { stockCode?: string }) {
  const { data, sources, confidence, loading } = useOracleEvents();

  const filtered = stockCode && data
    ? data.filter(e => e.stockCode === stockCode)
    : data;

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#ef4444] animate-pulse-dot" />
          <span className="text-sm font-medium">Oracle 真相流</span>
          {stockCode && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6]">
              {stockCode}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#475569]">实时成交异常</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-[#0a0f1a] animate-pulse" />
          ))
        ) : (
          (filtered || []).map(event => {
            const Icon = typeIcons[event.type];
            return (
              <div
                key={event.id}
                className={`rounded-lg bg-[#0a0f1a] p-3 ${
                  confidence >= 0.8 ? 'confidence-high' : confidence >= 0.5 ? 'confidence-medium' : 'confidence-low'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${impactColors[event.impact]}`} />
                    <span className="text-xs text-[#64748b]">{event.stockCode}</span>
                    <span className="text-sm font-medium">{event.stockName}</span>
                  </div>
                  <span className="text-[10px] text-[#475569]">{event.time}</span>
                </div>
                <p className="text-xs text-[#94a3b8] mb-1">{event.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    event.impact === 'positive' ? 'bg-[#10b981]/10 text-[#10b981]' :
                    event.impact === 'negative' ? 'bg-[#ef4444]/10 text-[#ef4444]' :
                    'bg-[#64748b]/10 text-[#64748b]'
                  }`}>
                    {typeLabels[event.type]}
                  </span>
                  <span className="text-[10px] text-[#475569]">
                    ¥{(event.amount / 10000).toFixed(1)}亿
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
