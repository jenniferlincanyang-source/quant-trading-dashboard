'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import { AlertTriangle, Wifi, WifiOff, X, ChevronDown, ChevronUp } from 'lucide-react';
import { subscribeSourceStatus, getSourceSnapshot, getServerSnapshot } from '@/services/dataService';
import type { DataSourceStatus } from '@/services/dataService';

function useSourceStatus() {
  return useSyncExternalStore(subscribeSourceStatus, getSourceSnapshot, getServerSnapshot);
}

export default function DataSourceGuard() {
  const status = useSourceStatus();
  const [dismissed, setDismissed] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // 从 mock 恢复到 live 时自动重新显示
  useEffect(() => {
    if (status.overall === 'live') setDismissed(false);
  }, [status.overall]);

  if (status.overall === 'unknown') return null;
  if (status.overall === 'live' && !dismissed) {
    return <LiveBadge liveCount={status.liveCount} />;
  }
  if (status.overall === 'live') return null;
  if (dismissed) return <DismissedHint onClick={() => setDismissed(false)} mockCount={status.mockCount} />;

  return (
    <div className="sticky top-[57px] z-40">
      <div className="bg-[#ef4444]/95 backdrop-blur-sm border-b border-[#ef4444]">
        <div className="mx-auto max-w-[1600px] px-4 py-2.5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-white flex-shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                数据源异常 — 部分数据已降级为模拟数据
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/20 text-white font-mono">
                {status.mockCount}/{status.mockCount + status.liveCount} 模拟
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              模拟数据不反映真实市场行情，请勿据此做出交易决策。请检查后端服务是否正常运行。
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowDetail(!showDetail)}
              className="text-xs text-white/80 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors">
              详情 {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showDetail && (
          <MockDetail mockActions={status.mockActions} liveCount={status.liveCount} />
        )}
      </div>
    </div>
  );
}

function LiveBadge({ liveCount }: { liveCount: number }) {
  return null; // Header 里的指示灯已经够了，live 时不额外显示
}

function DismissedHint({ onClick, mockCount }: { onClick: () => void; mockCount: number }) {
  return (
    <button onClick={onClick}
      className="sticky top-[57px] z-40 w-full bg-[#ef4444]/20 border-b border-[#ef4444]/30 px-4 py-1.5 flex items-center justify-center gap-2 hover:bg-[#ef4444]/30 transition-colors">
      <WifiOff className="w-3 h-3 text-[#ef4444]" />
      <span className="text-[11px] text-[#ef4444] font-medium">
        {mockCount} 个数据源使用模拟数据 — 点击查看详情
      </span>
    </button>
  );
}

function MockDetail({ mockActions, liveCount }: { mockActions: string[]; liveCount: number }) {
  const ACTION_LABELS: Record<string, string> = {
    overview: '市场概览', quotes: '实时行情', events: 'Oracle事件',
    kline: 'K线数据', sector_flows: '板块资金流', scanner: '排行榜',
    sw_sectors: '申万行业', event_news: '事件新闻', insights: '策略洞察',
    price_ticks: '行情滚动', fund_flow: '资金流向', kline_flow: 'K线资金流',
    capital_alerts: '大资金预警', trend: '趋势预测', oracle_accuracy: 'Oracle验证',
    portfolio: '持仓组合', trading_alerts: '交易预警',
    huijin: '汇金监控', ssf: '社保基金', broker: '券商监控',
  };
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-2.5">
      <div className="flex flex-wrap gap-1.5 mt-1">
        {mockActions.map(a => (
          <span key={a} className="text-[10px] px-2 py-0.5 rounded bg-white/15 text-white/90 font-medium">
            <WifiOff className="w-2.5 h-2.5 inline mr-1" />
            {ACTION_LABELS[a] || a}
          </span>
        ))}
        {liveCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/30 text-white/90 font-medium">
            <Wifi className="w-2.5 h-2.5 inline mr-1" />
            {liveCount} 个数据源正常
          </span>
        )}
      </div>
    </div>
  );
}
