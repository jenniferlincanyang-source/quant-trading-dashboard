'use client';
import { useState, useMemo } from 'react';
import {
  TrendingUp, GitCompare, Scale, Zap, Layers, Newspaper,
  Play, Loader2, CheckCircle2, XCircle, Activity,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useStrategySignals } from '@/hooks/useMarketData';
import { executeTrade } from '@/services/tradeService';
import {
  STRATEGY_CATEGORIES, STRATEGY_CATEGORY_MAP, RISK_LABELS,
} from '@/services/types';
import type {
  StrategyCategory, StrategyCategoryMeta, StrategySignal, RiskLevel,
} from '@/services/types';
import type { TradeResponse } from '@/services/tradeService';

const ICONS: Record<StrategyCategory, typeof TrendingUp> = {
  trend_follow: TrendingUp,
  mean_reversion: GitCompare,
  stat_arb: Scale,
  hft: Zap,
  multi_factor: Layers,
  event_driven: Newspaper,
};

type ActivityLevel = 'active' | 'moderate' | 'inactive';

function getActivity(signals: StrategySignal[]): ActivityLevel {
  if (signals.length === 0) return 'inactive';
  const avg = signals.reduce((s, x) => s + x.confidence, 0) / signals.length;
  if (signals.length >= 3 && avg > 0.6) return 'active';
  return 'moderate';
}

const activityColors: Record<ActivityLevel, string> = {
  active: 'bg-emerald-400',
  moderate: 'bg-amber-400',
  inactive: 'bg-slate-600',
};

const signalColors = {
  buy: { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', label: '买入' },
  sell: { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', label: '卖出' },
  hold: { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', label: '持有' },
};

/* ── Sidebar ── */
function Sidebar({
  active, onSelect, grouped, loading,
}: {
  active: StrategyCategory;
  onSelect: (c: StrategyCategory) => void;
  grouped: Record<StrategyCategory, StrategySignal[]>;
  loading: boolean;
}) {
  return (
    <div className="w-[200px] shrink-0 border-r border-white/5 py-3 flex flex-col gap-1">
      {STRATEGY_CATEGORIES.map(cat => {
        const Icon = ICONS[cat.key];
        const sigs = grouped[cat.key];
        const act = getActivity(sigs);
        const isActive = active === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 text-left transition-all rounded-r-lg mx-1 ${
              isActive
                ? 'bg-white/5 border-l-2'
                : 'hover:bg-white/[0.03] border-l-2 border-transparent'
            }`}
            style={isActive ? {
              borderColor: cat.color,
              boxShadow: `0 0 15px ${cat.color}33`,
            } : undefined}
          >
            <Icon size={16} style={{ color: isActive ? cat.color : '#64748b' }} />
            <span className={`text-sm flex-1 truncate ${isActive ? 'text-white' : 'text-[#94a3b8]'}`}>
              {cat.label}
            </span>
            <span className={`w-2 h-2 rounded-full ${activityColors[act]} ${act === 'active' ? 'animate-pulse-dot' : ''}`} />
            {!loading && sigs.length > 0 && (
              <span className="text-[10px] text-[#64748b] min-w-[16px] text-right">{sigs.length}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── DetailHeader ── */
function DetailHeader({
  meta, signals, avgConf, avgReturn,
}: {
  meta: StrategyCategoryMeta;
  signals: StrategySignal[];
  avgConf: number;
  avgReturn: number;
}) {
  const sparkData = signals.map((s, i) => ({ i, v: s.confidence }));
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </h3>
          <p className="text-xs text-[#64748b] mt-0.5">{meta.logic}</p>
        </div>
        <div className="flex gap-1">
          {meta.cases.map(c => (
            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#94a3b8]">{c}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <Stat label="信号数" value={String(signals.length)} />
        <Stat label="平均置信度" value={`${(avgConf * 100).toFixed(0)}%`} />
        <Stat label="平均预期收益" value={`${avgReturn.toFixed(1)}%`} color={avgReturn >= 0 ? '#10b981' : '#ef4444'} />
        <Stat label="适用行情" value={meta.applicable} />
        {sparkData.length >= 2 && (
          <div className="w-20 h-8 ml-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={meta.color} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[#475569]">{label}</div>
      <div className="font-medium mt-0.5" style={{ color: color || '#e2e8f0' }}>{value}</div>
    </div>
  );
}

/* ── RiskFilter ── */
function RiskFilter({ value, onChange }: { value: RiskLevel | 'all'; onChange: (v: RiskLevel | 'all') => void }) {
  const opts: { key: RiskLevel | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'low', label: '低风险' },
    { key: 'medium', label: '中风险' },
    { key: 'high', label: '高风险' },
  ];
  return (
    <div className="flex gap-1.5 mt-3">
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`text-[11px] px-2 py-1 rounded transition-colors ${
            value === o.key ? 'bg-white/10 text-white' : 'text-[#64748b] hover:text-[#94a3b8]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── SignalCard ── */
function SignalCard({
  sig, color, state, onExecute,
}: {
  sig: StrategySignal;
  color: string;
  state: 'idle' | 'loading' | 'success' | 'fail';
  onExecute: () => void;
}) {
  const sc = signalColors[sig.signal];
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0f1a]/60 hover:bg-[#0a0f1a] transition-colors group">
      <div className="w-1 h-12 rounded-full" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{sig.stockName}</span>
          <span className="text-[10px] text-[#475569]">{sig.stockCode}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
          <span className="text-[10px] text-[#475569]">{RISK_LABELS[sig.riskLevel]}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-[#64748b]">
          <span>置信度 {(sig.confidence * 100).toFixed(0)}%</span>
          <span>预期 {sig.expectedReturn > 0 ? '+' : ''}{sig.expectedReturn.toFixed(1)}%</span>
          <span className="truncate">{sig.factors.slice(0, 2).join(' · ')}</span>
        </div>
      </div>
      {sig.signal !== 'hold' && (
        <button
          onClick={onExecute}
          disabled={state === 'loading'}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: state === 'success' ? '#10b98120' : state === 'fail' ? '#ef444420' : `${color}15`,
            color: state === 'success' ? '#10b981' : state === 'fail' ? '#ef4444' : color,
          }}
        >
          {state === 'loading' ? <Loader2 size={14} className="animate-spin" /> :
           state === 'success' ? <CheckCircle2 size={14} /> :
           state === 'fail' ? <XCircle size={14} /> :
           <Play size={14} />}
        </button>
      )}
    </div>
  );
}

export default function StrategyMatrix() {
  const { data: allSignals, loading } = useStrategySignals();
  const [active, setActive] = useState<StrategyCategory>('trend_follow');
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'all'>('all');
  const [executing, setExecuting] = useState<Record<string, 'idle' | 'loading' | 'success' | 'fail'>>({});

  // 按分类分组信号
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

  const currentMeta = STRATEGY_CATEGORIES.find(c => c.key === active)!;
  const currentSignals = grouped[active];
  const filtered = filterRisk === 'all'
    ? currentSignals
    : currentSignals.filter(s => s.riskLevel === filterRisk);

  const avgConf = currentSignals.length
    ? currentSignals.reduce((s, x) => s + x.confidence, 0) / currentSignals.length
    : 0;
  const avgReturn = currentSignals.length
    ? currentSignals.reduce((s, x) => s + x.expectedReturn, 0) / currentSignals.length
    : 0;

  const handleExecute = async (sig: StrategySignal) => {
    if (sig.signal === 'hold') return;
    setExecuting(prev => ({ ...prev, [sig.id]: 'loading' }));
    try {
      const res = await executeTrade({
        signal_id: sig.id,
        stock_code: sig.stockCode,
        stock_name: sig.stockName,
        direction: sig.signal as 'buy' | 'sell',
        price: 0, volume: 0,
        strategy: sig.strategy,
        confidence: sig.confidence,
      });
      setExecuting(prev => ({ ...prev, [sig.id]: res.success ? 'success' : 'fail' }));
      setTimeout(() => setExecuting(prev => ({ ...prev, [sig.id]: 'idle' })), 3000);
    } catch {
      setExecuting(prev => ({ ...prev, [sig.id]: 'fail' }));
      setTimeout(() => setExecuting(prev => ({ ...prev, [sig.id]: 'idle' })), 3000);
    }
  };

  return (
    <div className="glass-card rounded-xl flex h-full min-h-[520px]">
      {/* 左侧栏 */}
      <Sidebar
        active={active}
        onSelect={setActive}
        grouped={grouped}
        loading={loading}
      />
      {/* 右侧详情 */}
      <div className="flex-1 flex flex-col min-w-0 p-4">
        <DetailHeader meta={currentMeta} signals={currentSignals} avgConf={avgConf} avgReturn={avgReturn} />
        <RiskFilter value={filterRisk} onChange={setFilterRisk} />
        <div className="flex-1 overflow-y-auto mt-3 space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-[#0a0f1a] animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center text-[#475569] text-sm py-12">
              该策略暂无{filterRisk !== 'all' ? ` ${RISK_LABELS[filterRisk]}` : ''}信号
            </div>
          ) : (
            filtered.map(sig => (
              <SignalCard
                key={sig.id}
                sig={sig}
                color={currentMeta.color}
                state={executing[sig.id] || 'idle'}
                onExecute={() => handleExecute(sig)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
