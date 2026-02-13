'use client';
import { useState } from 'react';
import { Shield, TrendingUp, TrendingDown, Zap, ArrowDownRight, ChevronDown, ChevronRight } from 'lucide-react';
import InfoTip from './InfoTip';
import { useCapitalAlerts } from '@/hooks/useMarketData';
import type { CapitalAlertType, CapitalAlert } from '@/services/types';

const typeConfig: Record<CapitalAlertType, { label: string; icon: typeof Zap; color: string }> = {
  building: { label: '主力建仓', icon: TrendingUp, color: 'text-[#ef4444]' },
  reducing: { label: '主力减仓', icon: TrendingDown, color: 'text-[#10b981]' },
  sudden_inflow: { label: '资金突增', icon: Zap, color: 'text-[#3b82f6]' },
  sudden_outflow: { label: '资金突减', icon: ArrowDownRight, color: 'text-amber-400' },
};

const severityBorder: Record<string, string> = {
  critical: 'border-l-[#ef4444]',
  warning: 'border-l-amber-400',
  info: 'border-l-[#3b82f6]',
};

export default function CapitalAlertPanel() {
  const { data, loading } = useCapitalAlerts();
  const [filter, setFilter] = useState<CapitalAlertType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const alerts = data || [];
  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.alertType === filter);

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">大资金异动预警</span>
          <InfoTip text="分析个股连续多日主力资金流向，识别主力建仓（连续3+天净流入）、减仓（连续3+天净流出）、资金突增/突减等异常模式，按严重程度分级预警。" />
        </div>
        <span className="text-[10px] text-[#475569]">{alerts.length} 条预警</span>
      </div>

      <div className="px-3 pt-3 flex gap-1.5 flex-wrap">
        {(['all', 'building', 'reducing', 'sudden_inflow', 'sudden_outflow'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
              filter === f ? 'bg-[#3b82f6] text-white' : 'bg-[#1e293b] text-[#94a3b8]'
            }`}>
            {f === 'all' ? '全部' : typeConfig[f].label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-[#0a0f1a] animate-pulse" />
          ))
        ) : (
          filtered.map(alert => {
            const cfg = typeConfig[alert.alertType];
            const Icon = cfg.icon;
            const isExpanded = expandedId === alert.id;
            return (
              <div key={alert.id}
                className={`rounded-lg bg-[#0a0f1a] border-l-2 ${severityBorder[alert.severity]} p-3 cursor-pointer`}
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <span className="text-xs text-[#94a3b8]">{alert.code}</span>
                    <span className="text-sm font-medium">{alert.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#475569]">{alert.time}</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-[#475569]" /> : <ChevronRight className="w-3 h-3 text-[#475569]" />}
                  </div>
                </div>
                <p className="text-xs text-[#94a3b8]">{alert.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.color} bg-current/10`}>
                    <span className="text-current">{cfg.label}</span>
                  </span>
                  <span className="text-[10px] text-[#475569]">
                    置信度 {(alert.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                {isExpanded && Object.keys(alert.relatedMetrics).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#1e293b] grid grid-cols-2 gap-1">
                    {Object.entries(alert.relatedMetrics).map(([k, v]) => (
                      <div key={k} className="text-[10px]">
                        <span className="text-[#475569]">{k}: </span>
                        <span className="text-[#94a3b8]">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
