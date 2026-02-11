'use client';
import { Filter } from 'lucide-react';
import { STRATEGY_LABELS, RISK_LABELS } from '@/services/types';
import type { StrategyType, RiskLevel } from '@/services/types';

interface Props {
  strategy: StrategyType | 'all';
  risk: RiskLevel | 'all';
  onStrategyChange: (v: StrategyType | 'all') => void;
  onRiskChange: (v: RiskLevel | 'all') => void;
}

export default function StrategyFilter({ strategy, risk, onStrategyChange, onRiskChange }: Props) {
  const strategies: (StrategyType | 'all')[] = ['all', 'trend_follow', 't_plus_0', 'dividend_low_vol', 'mean_reversion', 'multi_factor', 'index_enhance'];
  const risks: (RiskLevel | 'all')[] = ['all', 'low', 'medium', 'high'];

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-[#3b82f6]" />
        <span className="text-sm font-medium">策略过滤器</span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-[#475569] mb-1.5 uppercase tracking-wider">策略类型</div>
          <div className="flex flex-wrap gap-1.5">
            {strategies.map(s => (
              <button
                key={s}
                onClick={() => onStrategyChange(s)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  strategy === s
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-[#0a0f1a] text-[#94a3b8] hover:bg-[#1e293b]'
                }`}
              >
                {s === 'all' ? '全部' : STRATEGY_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-[#475569] mb-1.5 uppercase tracking-wider">风险等级</div>
          <div className="flex gap-1.5">
            {risks.map(r => (
              <button
                key={r}
                onClick={() => onRiskChange(r)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  risk === r
                    ? 'bg-[#8b5cf6] text-white'
                    : 'bg-[#0a0f1a] text-[#94a3b8] hover:bg-[#1e293b]'
                }`}
              >
                {r === 'all' ? '全部' : RISK_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
