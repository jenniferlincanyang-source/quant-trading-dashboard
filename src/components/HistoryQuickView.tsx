'use client';
import { Database, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import InfoTip from './InfoTip';
import { useHistoryStats } from '@/hooks/useHistoryData';

const TYPE_LABELS: Record<string, string> = {
  oracle_event: 'Oracle事件',
  news: '财经新闻',
  insight_trend: '趋势洞察',
  insight_meanrev: '均值回归',
  insight_statarb: '统计套利',
  insight_hft: '高频交易',
  insight_mf: '多因子',
  quote: '行情快照',
  scanner: '异动扫描',
  sector: '板块资金',
};

const impactIcon: Record<string, typeof TrendingUp> = {
  positive: TrendingUp,
  bullish: TrendingUp,
  negative: TrendingDown,
  bearish: TrendingDown,
};

const impactColor: Record<string, string> = {
  positive: '#10b981',
  bullish: '#10b981',
  negative: '#ef4444',
  bearish: '#ef4444',
};

export default function HistoryQuickView() {
  const { data: stats, loading } = useHistoryStats();

  if (loading) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#111827]/60 p-4 animate-pulse h-40" />
    );
  }

  if (!stats || stats.total_records === 0) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#111827]/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database size={14} className="text-[#64748b]" />
          <span className="text-xs text-[#64748b]">历史数据库</span>
        </div>
        <p className="text-sm text-[#475569] text-center py-4">
          暂无历史数据，启动后端后将自动采集
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-[#8b5cf6]" />
          <span className="text-xs text-[#94a3b8]">历史数据库</span>
          <InfoTip text="后端自动采集并持久化存储 Oracle 事件、行情快照、策略洞察、板块资金等历史数据，支持回溯分析和策略验证。点击「查看全部」进入完整历史数据页面。" />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8b5cf6]/10 text-[#8b5cf6]">
            {stats.total_records} 条
          </span>
        </div>
        <a href="/history"
          className="flex items-center gap-1 text-[10px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
          查看全部 <ArrowRight size={10} />
        </a>
      </div>

      {/* 24h 类型统计 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(stats.type_counts).map(([type, count]) => (
          <span key={type}
            className="text-[10px] px-2 py-1 rounded bg-[#0a0f1a] text-[#94a3b8]">
            {TYPE_LABELS[type] || type}
            <span className="ml-1 text-white">{count}</span>
          </span>
        ))}
      </div>

      {/* 最近事件 */}
      <div className="space-y-1.5">
        {stats.recent.map((item, i) => {
          const Icon = impactIcon[item.impact] || Minus;
          const color = impactColor[item.impact] || '#f59e0b';
          return (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <Icon size={10} style={{ color }} className="shrink-0" />
              <span className="text-[#475569] shrink-0 w-12">
                {item.time?.slice(11, 16) || '--:--'}
              </span>
              <span className="text-[#94a3b8] truncate flex-1">
                {item.summary || TYPE_LABELS[item.type] || item.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
