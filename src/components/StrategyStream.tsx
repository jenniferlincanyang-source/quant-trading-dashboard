'use client';
import { useState } from 'react';
import { BrainCircuit, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useStrategySignals } from '@/hooks/useMarketData';
import { STRATEGY_LABELS, RISK_LABELS } from '@/services/types';
import { executeTrade } from '@/services/tradeService';
import type { StrategySignal, StrategyType, RiskLevel } from '@/services/types';
import type { TradeResponse } from '@/services/tradeService';

interface Props {
  filterStrategy: StrategyType | 'all';
  filterRisk: RiskLevel | 'all';
}

const signalColors = {
  buy: { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', label: '买入' },
  sell: { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', label: '卖出' },
  hold: { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', label: '持有' },
};

export default function StrategyStream({ filterStrategy, filterRisk }: Props) {
  const { data, loading } = useStrategySignals();
  const [executing, setExecuting] = useState<Record<string, 'idle' | 'loading' | 'success' | 'fail'>>({});
  const [lastResult, setLastResult] = useState<TradeResponse | null>(null);

  const handleExecute = async (sig: StrategySignal) => {
    if (sig.signal === 'hold') return;
    setExecuting(prev => ({ ...prev, [sig.id]: 'loading' }));
    try {
      const res = await executeTrade({
        signal_id: sig.id,
        stock_code: sig.stockCode,
        stock_name: sig.stockName,
        direction: sig.signal as 'buy' | 'sell',
        price: 0, // 由后端取最新价
        volume: 0, // 由后端根据账户和置信度计算
        strategy: sig.strategy,
        confidence: sig.confidence,
      });
      setLastResult(res);
      setExecuting(prev => ({ ...prev, [sig.id]: res.success ? 'success' : 'fail' }));
      setTimeout(() => setExecuting(prev => ({ ...prev, [sig.id]: 'idle' })), 3000);
    } catch {
      setExecuting(prev => ({ ...prev, [sig.id]: 'fail' }));
      setTimeout(() => setExecuting(prev => ({ ...prev, [sig.id]: 'idle' })), 3000);
    }
  };

  const filtered = (data || []).filter(s => {
    if (filterStrategy !== 'all' && s.strategy !== filterStrategy) return false;
    if (filterRisk !== 'all' && s.riskLevel !== filterRisk) return false;
    return true;
  });

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[#8b5cf6]" />
          <span className="text-sm font-medium">Strategy 信号流</span>
        </div>
        <span className="text-[10px] text-[#475569]">趋势判断</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-[#0a0f1a] animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center text-[#475569] text-sm py-8">无匹配信号</div>
        ) : (
          filtered.map(sig => {
            const sc = signalColors[sig.signal];
            return (
              <div key={sig.id} className="rounded-lg bg-[#0a0f1a] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sc.bg} ${sc.text}`}>
                      {sc.label}
                    </span>
                    <span className="text-xs text-[#64748b]">{sig.stockCode}</span>
                    <span className="text-sm font-medium">{sig.stockName}</span>
                  </div>
                  <span className="text-[10px] text-[#475569]">{sig.time}</span>
                </div>
                <div className="flex items-center gap-3 mb-2 text-xs">
                  <span className="text-[#8b5cf6]">{STRATEGY_LABELS[sig.strategy]}</span>
                  <span className="text-[#475569]">|</span>
                  <span className="text-[#64748b]">{RISK_LABELS[sig.riskLevel]}</span>
                  <span className="text-[#475569]">|</span>
                  <span className="text-[#3b82f6]">置信度 {(sig.confidence * 100).toFixed(0)}%</span>
                  <span className="text-[#475569]">|</span>
                  <span className="text-[#10b981]">预期 +{sig.expectedReturn}%</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1">
                    {sig.factors.map((f, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">
                        {f}
                      </span>
                    ))}
                  </div>
                  {sig.signal !== 'hold' && (
                    <ExecuteButton
                      state={executing[sig.id] || 'idle'}
                      direction={sig.signal}
                      onClick={() => handleExecute(sig)}
                    />
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

function ExecuteButton({ state, direction, onClick }: {
  state: 'idle' | 'loading' | 'success' | 'fail';
  direction: 'buy' | 'sell';
  onClick: () => void;
}) {
  if (state === 'loading') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[#f59e0b] px-2 py-1">
        <Loader2 className="w-3 h-3 animate-spin" /> 执行中
      </span>
    );
  }
  if (state === 'success') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[#10b981] px-2 py-1">
        <CheckCircle2 className="w-3 h-3" /> 已委托
      </span>
    );
  }
  if (state === 'fail') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[#ef4444] px-2 py-1">
        <XCircle className="w-3 h-3" /> 失败
      </span>
    );
  }
  const color = direction === 'buy' ? 'bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30' : 'bg-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/30';
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors shrink-0 ${color}`}
    >
      <Play className="w-3 h-3" />
      执行{direction === 'buy' ? '买入' : '卖出'}
    </button>
  );
}
