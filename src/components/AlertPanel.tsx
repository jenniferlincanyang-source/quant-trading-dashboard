'use client';
import { useState } from 'react';
import { Bell, AlertTriangle, Info, XCircle, Check, Filter } from 'lucide-react';
import { useTradingAlerts } from '@/hooks/useMarketData';
import type { TradingAlert, AlertSeverity, AlertCategory, ALERT_CATEGORY_LABELS } from '@/services/types';

const severityConfig: Record<AlertSeverity, { color: string; bg: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-[#ef4444]', bg: 'border-l-[#ef4444] bg-[#ef4444]/5', icon: XCircle },
  warning: { color: 'text-amber-400', bg: 'border-l-amber-400 bg-amber-400/5', icon: AlertTriangle },
  info: { color: 'text-[#3b82f6]', bg: 'border-l-[#3b82f6] bg-[#3b82f6]/5', icon: Info },
};

const categoryLabels: Record<AlertCategory, string> = {
  price: '价格', volume: '成交量', fund_flow: '资金流',
  strategy: '策略', risk: '风控', system: '系统',
};

export default function AlertPanel() {
  const { data, loading } = useTradingAlerts();
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const alerts = data || [];
  const unacked = alerts.filter(a => !a.acknowledged && !acknowledged.has(a.id));
  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  const handleAck = (id: string) => {
    setAcknowledged(prev => new Set(prev).add(id));
  };

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 border-b border-[#1e293b] flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Bell className={`w-4 h-4 ${unacked.length > 0 ? 'text-[#ef4444] animate-pulse-dot' : 'text-[#475569]'}`} />
          <span className="text-sm font-medium">实时预警中心</span>
          {unacked.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ef4444] text-white font-bold">
              {unacked.length}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#475569]">{expanded ? '收起' : '展开'}</span>
      </button>

      {expanded && (
        <div className="p-3">
          <div className="flex gap-2 mb-3">
            {(['all', 'critical', 'warning', 'info'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                  filter === f ? 'bg-[#3b82f6] text-white' : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b]/80'
                }`}>
                {f === 'all' ? '全部' : f === 'critical' ? '紧急' : f === 'warning' ? '警告' : '提示'}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-[#0a0f1a] animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center text-[#475569] text-xs py-4">暂无预警</div>
            ) : (
              filtered.map(alert => {
                const cfg = severityConfig[alert.severity];
                const Icon = cfg.icon;
                const isAcked = alert.acknowledged || acknowledged.has(alert.id);
                return (
                  <div key={alert.id}
                    className={`rounded-lg border-l-2 ${cfg.bg} p-3 ${isAcked ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
                        <span className="text-sm font-medium">{alert.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#475569]">{alert.time}</span>
                        {!isAcked && (
                          <button onClick={() => handleAck(alert.id)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8] hover:text-white">
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-1 ml-5.5">{alert.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 ml-5.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">
                        {categoryLabels[alert.category]}
                      </span>
                      {alert.stockCode && (
                        <span className="text-[10px] text-[#475569]">{alert.stockCode} {alert.stockName}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}