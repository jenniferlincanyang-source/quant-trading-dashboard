'use client';
import { useState } from 'react';
import {
  ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Building2,
} from 'lucide-react';
import { useEventNews } from '@/hooks/useMarketData';
import {
  EVENT_CATEGORY_LABELS, RATING_LABELS,
} from '@/services/types';
import type { EventNews, AnalystView } from '@/services/types';

const impactConfig = {
  positive: { icon: TrendingUp, color: '#10b981', label: '利好', bg: 'bg-emerald-500/10' },
  negative: { icon: TrendingDown, color: '#ef4444', label: '利空', bg: 'bg-red-500/10' },
  neutral: { icon: Minus, color: '#f59e0b', label: '中性', bg: 'bg-amber-500/10' },
};

const categoryColors: Record<string, string> = {
  earnings: '#8b5cf6', policy: '#ef4444', merger: '#f59e0b',
  rating: '#3b82f6', macro: '#06b6d4', industry: '#10b981',
};

function RatingBadge({ rating }: { rating: AnalystView['rating'] }) {
  const colors: Record<string, string> = {
    buy: 'bg-emerald-500/15 text-emerald-400',
    overweight: 'bg-emerald-500/10 text-emerald-300',
    hold: 'bg-amber-500/10 text-amber-400',
    underweight: 'bg-red-500/10 text-red-300',
    sell: 'bg-red-500/15 text-red-400',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[rating]}`}>
      {RATING_LABELS[rating]}
    </span>
  );
}

function AnalystSection({ views }: { views: AnalystView[] }) {
  if (views.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5 pl-3 border-l border-white/5">
      {views.map((v, i) => (
        <div key={i} className="flex items-start gap-2 text-[11px]">
          <Building2 size={12} className="text-[#64748b] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#94a3b8] font-medium">{v.institution}</span>
              <span className="text-[#475569]">{v.analyst}</span>
              <RatingBadge rating={v.rating} />
              {v.targetPrice && (
                <span className="text-[#64748b]">目标价 ¥{v.targetPrice}</span>
              )}
              {v.datetime && (
                <span className="text-[#475569]">{v.datetime}</span>
              )}
              {v.lagDays !== undefined && v.lagDays > 0 && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400">
                  滞后{v.lagDays}天
                </span>
              )}
            </div>
            <p className="text-[#64748b] mt-0.5 leading-relaxed">{v.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsCard({ news }: { news: EventNews }) {
  const [expanded, setExpanded] = useState(false);
  const impact = impactConfig[news.impact];
  const ImpactIcon = impact.icon;
  const catColor = categoryColors[news.category] || '#64748b';

  return (
    <div className="p-3 rounded-lg bg-[#0a0f1a]/60 hover:bg-[#0a0f1a] transition-colors">
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          <ImpactIcon size={14} style={{ color: impact.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: `${catColor}20`, color: catColor }}>
              {EVENT_CATEGORY_LABELS[news.category]}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${impact.bg}`}
              style={{ color: impact.color }}>
              {impact.label}
            </span>
            <span className="text-[10px] text-[#475569]">{news.datetime || news.time}</span>
            {news.lagDays > 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400">
                滞后{news.lagDays}天
              </span>
            )}
            {news.lagDays === 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                实时
              </span>
            )}
          </div>
          <p className="text-sm text-white leading-snug">{news.title}</p>
          <p className="text-[11px] text-[#64748b] mt-1 leading-relaxed">{news.summary}</p>

          {/* Source + stocks */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {news.sourceUrl ? (
              <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
                {news.source} ↗
              </a>
            ) : (
              <span className="text-[10px] text-[#475569]">{news.source}</span>
            )}
            {news.verifiedDate && (
              <span className="text-[10px] text-[#475569]">验证 {news.verifiedDate}</span>
            )}
          </div>

          {/* Analyst toggle */}
          {news.analystViews.length > 0 && (
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-[10px] text-[#64748b] hover:text-[#94a3b8] transition-colors">
              <Building2 size={10} />
              {news.analystViews.length} 家机构分析
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {expanded && <AnalystSection views={news.analystViews} />}
        </div>
      </div>
    </div>
  );
}

export default function EventNewsPanel() {
  const { data: newsList, loading } = useEventNews();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-[#0a0f1a] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!newsList || newsList.length === 0) {
    return (
      <div className="text-center text-[#475569] text-sm py-8">
        暂无事件新闻
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-[#64748b]">实时财经事件</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#94a3b8]">
          {newsList.length} 条
        </span>
      </div>
      {newsList.map(news => (
        <NewsCard key={news.id} news={news} />
      ))}
    </div>
  );
}
