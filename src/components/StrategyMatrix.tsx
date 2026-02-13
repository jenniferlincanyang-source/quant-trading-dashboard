'use client';
import { useMemo, useState } from 'react';
import {
  TrendingUp, GitCompare, Scale, Zap, Layers, Newspaper,
  Play, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useStrategySignals } from '@/hooks/useMarketData';
import { executeTrade } from '@/services/tradeService';
import EventNewsPanel from './EventNewsPanel';
import StrategyInsightPanel from './StrategyInsightPanel';
import InfoTip from './InfoTip';
import type { InsightType } from '@/services/types';
import {
  STRATEGY_CATEGORIES, STRATEGY_CATEGORY_MAP, RISK_LABELS,
} from '@/services/types';
import type {
  StrategyCategory, StrategySignal, RiskLevel,
} from '@/services/types';

const ICONS: Record<StrategyCategory, typeof TrendingUp> = {
  trend_follow: TrendingUp,
  mean_reversion: GitCompare,
  stat_arb: Scale,
  hft: Zap,
  multi_factor: Layers,
  event_driven: Newspaper,
};

const signalColors = {
  buy: { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', label: '买入' },
  sell: { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', label: '卖出' },
  hold: { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', label: '持有' },
};

const INSIGHT_TYPES: InsightType[] = ['trend_follow', 'mean_reversion', 'stat_arb', 'hft', 'multi_factor'];

export default function StrategyMatrix() {
  const { data: allSignals, loading } = useStrategySignals();
  const [executing, setExecuting] = useState<Record<string, 'idle' | 'loading' | 'success' | 'fail'>>({});

  const grouped = useMemo(() => {
    const map: Record<StrategyCategory, StrategySignal[]> = {
      trend_follow: [], mean_reversion: [], stat_arb: [],
      hft: [], multi_factor: [], event_driven: [],
    };
    for (const sig of allSignals || []) {
      const cat = STRATEGY_CATEGORY_MAP[sig.strategy];
      if (cat) map[cat].push(sig);
    }
    return map;
  }, [allSignals]);

  const handleExecute = async (sig: StrategySignal) => {
    if (sig.signal === 'hold') return;
    setExecuting(prev => ({ ...prev, [sig.id]: 'loading' }));
    try {
      const res = await executeTrade({
        signal_id: sig.id, stock_code: sig.stockCode,
        stock_name: sig.stockName, direction: sig.signal as 'buy' | 'sell',
        price: 0, volume: 0, strategy: sig.strategy, confidence: sig.confidence,
      });
      setExecuting(prev => ({ ...prev, [sig.id]: res.success ? 'success' : 'fail' }));
      setTimeout(() => setExecuting(prev => ({ ...prev, [sig.id]: 'idle' })), 3000);
    } catch {
      setExecuting(prev => ({ ...prev, [sig.id]: 'fail' }));
      setTimeout(() => setExecuting(prev => ({ ...prev, [sig.id]: 'idle' })), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm font-medium">六大量化策略信号总览</span>
        <InfoTip text="展示趋势跟踪、均值回归、统计套利、高频交易、多因子、事件驱动六大策略的实时信号，全部平铺一目了然。每个策略卡片包含信号列表和策略洞察分析。" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {STRATEGY_CATEGORIES.map(cat => (
          <StrategyCard
            key={cat.key}
            cat={cat}
            signals={grouped[cat.key]}
            loading={loading}
            executing={executing}
            onExecute={handleExecute}
          />
        ))}
      </div>
    </div>
  );
}

function StrategyCard({ cat, signals, loading, executing, onExecute }: {
  cat: typeof STRATEGY_CATEGORIES[number];
  signals: StrategySignal[];
  loading: boolean;
  executing: Record<string, 'idle' | 'loading' | 'success' | 'fail'>;
  onExecute: (sig: StrategySignal) => void;
}) {
  const Icon = ICONS[cat.key];
  const avgConf = signals.length
    ? signals.reduce((s, x) => s + x.confidence, 0) / signals.length : 0;
  const avgReturn = signals.length
    ? signals.reduce((s, x) => s + x.expectedReturn, 0) / signals.length : 0;
  const sparkData = signals.map((s, i) => ({ i, v: s.confidence }));
  const buyCount = signals.filter(s => s.signal === 'buy').length;
  const sellCount = signals.filter(s => s.signal === 'sell').length;

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] flex flex-col">
      {/* header */}
      <div className="px-4 py-3 border-b border-[#1e293b]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: cat.color }} />
            <span className="text-sm font-medium">{cat.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#64748b]">{signals.length} 信号</span>
          </div>
          {sparkData.length >= 2 && (
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line type="monotone" dataKey="v" stroke={cat.color} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <p className="text-[10px] text-[#475569] mb-2">{cat.logic}</p>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[#94a3b8]">置信度 <span className="font-medium text-[#e2e8f0]">{(avgConf * 100).toFixed(0)}%</span></span>
          <span className={avgReturn >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}>
            预期 {avgReturn > 0 ? '+' : ''}{avgReturn.toFixed(1)}%
          </span>
          {buyCount > 0 && <span className="text-[#10b981]">买入 {buyCount}</span>}
          {sellCount > 0 && <span className="text-[#ef4444]">卖出 {sellCount}</span>}
        </div>
      </div>

      {/* insight panel */}
      {cat.key === 'event_driven' ? (
        <div className="px-3 pt-2"><EventNewsPanel /></div>
      ) : INSIGHT_TYPES.includes(cat.key as InsightType) ? (
        <div className="px-3 pt-2"><StrategyInsightPanel type={cat.key as InsightType} /></div>
      ) : null}

      {/* signal list */}
      <div className="flex-1 overflow-y-auto max-h-[240px] p-3 space-y-1.5">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[#0a0f1a] animate-pulse" />
          ))
        ) : signals.length === 0 ? (
          <div className="text-center text-[#475569] text-xs py-6">暂无信号</div>
        ) : (
          signals.map(sig => {
            const sc = signalColors[sig.signal];
            const st = executing[sig.id] || 'idle';
            return (
              <div key={sig.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0a0f1a]/60 hover:bg-[#0a0f1a] transition-colors">
                <div className="w-1 h-10 rounded-full" style={{ background: cat.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white">{sig.stockName}</span>
                    <span className="text-[10px] text-[#475569]">{sig.stockCode}</span>
                    <span className={`text-[10px] px-1 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    <span className="text-[10px] text-[#475569]">{RISK_LABELS[sig.riskLevel]}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#64748b]">
                    <span>{(sig.confidence * 100).toFixed(0)}%</span>
                    <span>{sig.expectedReturn > 0 ? '+' : ''}{sig.expectedReturn.toFixed(1)}%</span>
                    <span className="truncate">{sig.factors.slice(0, 2).join(' · ')}</span>
                  </div>
                </div>
                {sig.signal !== 'hold' && (
                  <button onClick={() => onExecute(sig)} disabled={st === 'loading'}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background: st === 'success' ? '#10b98120' : st === 'fail' ? '#ef444420' : `${cat.color}15`,
                      color: st === 'success' ? '#10b981' : st === 'fail' ? '#ef4444' : cat.color,
                    }}>
                    {st === 'loading' ? <Loader2 size={12} className="animate-spin" /> :
                     st === 'success' ? <CheckCircle2 size={12} /> :
                     st === 'fail' ? <XCircle size={12} /> :
                     <Play size={12} />}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
