'use client';
import { Flame } from 'lucide-react';
import InfoTip from './InfoTip';
import { useSWSectorFlows } from '@/hooks/useMarketData';

function intensityColor(netInflow: number): string {
  const cap = 50; // 50亿为满强度
  const ratio = Math.min(Math.abs(netInflow) / cap, 1);
  const opacity = 0.15 + ratio * 0.65;
  return netInflow >= 0
    ? `rgba(239, 68, 68, ${opacity})`   // 红 = 流入 (A股惯例)
    : `rgba(16, 185, 129, ${opacity})`; // 绿 = 流出
}

export default function SectorHeatmap() {
  const { data: sectors, loading } = useSWSectorFlows();

  if (loading || !sectors) {
    return (
      <div className="rounded-xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} style={{ color: 'var(--accent-red)' }} />
          <span className="text-sm font-semibold">申万行业热力图</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} style={{ color: 'var(--accent-red)' }} />
          <span className="text-sm font-semibold">申万行业热力图</span>
          <InfoTip text="以色块面积和颜色深浅展示申万一级行业的资金流向强度。红色代表资金净流入，绿色代表净流出，颜色越深表示资金流动越剧烈，帮助快速识别当日热门和冷门板块。" />
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.6)' }} />
            流入
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.6)' }} />
            流出
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {sectors.map(s => (
          <div
            key={s.name}
            className="rounded-lg p-2 text-center cursor-default transition-transform hover:scale-105"
            style={{ background: intensityColor(s.netInflow) }}
            title={`${s.name} | 净流入: ${s.netInflow > 0 ? '+' : ''}${s.netInflow.toFixed(1)}亿 | 涨跌: ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}% | 龙头: ${s.leadingStock}`}
          >
            <div className="text-xs font-medium truncate">{s.name}</div>
            <div className="text-xs font-mono mt-0.5" style={{
              color: s.changePercent >= 0 ? 'var(--accent-red)' : 'var(--accent-green)',
            }}>
              {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
            </div>
            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)', fontSize: '10px' }}>
              {s.netInflow > 0 ? '+' : ''}{s.netInflow.toFixed(1)}亿
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
