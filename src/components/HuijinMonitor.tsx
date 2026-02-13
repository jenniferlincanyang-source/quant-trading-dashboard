'use client';
import { useState } from 'react';
import { Shield, TrendingUp, TrendingDown, AlertTriangle, Building2, Landmark, ChevronDown, ChevronUp } from 'lucide-react';
import InfoTip from './InfoTip';
import { useHuijinMonitor } from '@/hooks/useMarketData';
import type { HuijinHolding, HuijinETF, HuijinSignal } from '@/services/types';

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e8) return (n / 1e8).toLocaleString('zh-CN', { maximumFractionDigits: 2 }) + '亿';
  if (abs >= 1e4) return (n / 1e4).toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + '万';
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

const CAT_LABELS: Record<string, string> = {
  bank: '银行', insurance: '保险', securities: '券商',
};
const CAT_COLORS: Record<string, string> = {
  bank: 'text-[#3b82f6]', insurance: 'text-[#f59e0b]', securities: 'text-[#a855f7]',
};

export default function HuijinMonitor() {
  const { data, loading } = useHuijinMonitor();
  const [showAllHoldings, setShowAllHoldings] = useState(false);

  if (loading || !data) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#ef4444]" />
          <span className="text-sm font-medium">中央汇金动向监控</span>
        </div>
        <div className="h-[300px] rounded-lg bg-[#0a0f1a] animate-pulse" />
      </div>
    );
  }

  const { holdings, etfs, summary, signals } = data;
  const visibleHoldings = showAllHoldings ? holdings : holdings.slice(0, 4);

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#ef4444]" />
          <span className="text-sm font-medium">中央汇金动向监控</span>
          <InfoTip text="实时追踪中央汇金持有的四大行（工建中农）、保险、券商股及宽基ETF的资金流向。通过分析主力资金连续流入/流出模式，识别国家队增减仓信号，为判断市场底部/顶部提供参考。" />
          <span className="text-[10px] text-[#475569]">实时追踪国家队资金动向</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${summary.bankMainInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            四大行主力净{summary.bankMainInflow >= 0 ? '流入' : '流出'} {fmt(Math.abs(summary.bankMainInflow))}
          </span>
          <span className={`text-xs ${summary.avgChangePercent >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            均涨幅 {summary.avgChangePercent >= 0 ? '+' : ''}{summary.avgChangePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* 左: 信号面板 */}
        <SignalPanel signals={signals} summary={summary} />

        {/* 中: 重仓股 */}
        <div className="border-r border-[#1e293b] p-3">
          <div className="text-[10px] text-[#475569] mb-2 font-medium flex items-center gap-1">
            <Landmark className="w-3 h-3" /> 汇金重仓股
          </div>
          <HoldingHeader />
          {visibleHoldings.map(h => <HoldingRow key={h.code} item={h} />)}
          {holdings.length > 4 && (
            <button onClick={() => setShowAllHoldings(!showAllHoldings)}
              className="w-full mt-1 text-[10px] text-[#475569] hover:text-[#94a3b8] flex items-center justify-center gap-1 py-1">
              {showAllHoldings ? <><ChevronUp className="w-3 h-3" />收起</> : <><ChevronDown className="w-3 h-3" />展开全部</>}
            </button>
          )}
        </div>

        {/* 右: ETF */}
        <div className="p-3">
          <div className="text-[10px] text-[#475569] mb-2 font-medium flex items-center gap-1">
            <Building2 className="w-3 h-3" /> 汇金常买ETF
          </div>
          <ETFHeader />
          {etfs.map(e => <ETFRow key={e.code} item={e} />)}
        </div>
      </div>
    </div>
  );
}

function SignalPanel({ signals, summary }: { signals: HuijinSignal[]; summary: { totalMainInflow: number; bankMainInflow: number } }) {
  return (
    <div className="border-r border-[#1e293b] p-3 space-y-2">
      <div className="text-[10px] text-[#475569] mb-2 font-medium flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" /> 动向信号
      </div>
      {signals.length === 0 ? (
        <div className="text-xs text-[#475569] py-4 text-center">暂无异常信号</div>
      ) : (
        signals.map((s, i) => (
          <div key={i} className={`rounded-lg p-2.5 text-xs ${
            s.severity === 'critical' ? 'bg-[#ef4444]/10 border border-[#ef4444]/20' :
            s.severity === 'warning' ? 'bg-[#f59e0b]/10 border border-[#f59e0b]/20' :
            'bg-[#3b82f6]/10 border border-[#3b82f6]/20'
          }`}>
            <div className="flex items-center gap-1.5">
              {s.type === 'inflow'
                ? <TrendingUp className={`w-3 h-3 ${s.severity === 'critical' ? 'text-[#ef4444]' : 'text-[#3b82f6]'}`} />
                : <TrendingDown className="w-3 h-3 text-[#10b981]" />}
              <span className={
                s.severity === 'critical' ? 'text-[#ef4444] font-medium' :
                s.severity === 'warning' ? 'text-[#f59e0b]' : 'text-[#94a3b8]'
              }>{s.message}</span>
            </div>
          </div>
        ))
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#0a0f1a] p-2 text-center">
          <div className="text-[10px] text-[#475569]">总主力净额</div>
          <div className={`text-sm font-mono font-medium ${summary.totalMainInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {fmt(summary.totalMainInflow)}
          </div>
        </div>
        <div className="rounded-lg bg-[#0a0f1a] p-2 text-center">
          <div className="text-[10px] text-[#475569]">四大行净额</div>
          <div className={`text-sm font-mono font-medium ${summary.bankMainInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {fmt(summary.bankMainInflow)}
          </div>
        </div>
      </div>
    </div>
  );
}

function HoldingHeader() {
  return (
    <div className="grid grid-cols-5 gap-1 px-2 py-1 text-[10px] text-[#475569] border-b border-[#1e293b]">
      <span className="col-span-2">股票</span>
      <span className="text-right">涨跌</span>
      <span className="text-right">主力净额</span>
      <span className="text-right">成交额</span>
    </div>
  );
}

function HoldingRow({ item }: { item: HuijinHolding }) {
  const pctColor = item.changePercent >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  const flowColor = item.mainNetInflow >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  return (
    <div className="grid grid-cols-5 gap-1 px-2 py-1.5 text-xs border-b border-[#1e293b]/50 last:border-0 hover:bg-[#1e293b]/30 transition-colors">
      <div className="col-span-2 flex items-center gap-1 min-w-0">
        <span className={`text-[9px] px-1 rounded ${CAT_COLORS[item.category]} bg-current/10`}>
          {CAT_LABELS[item.category]}
        </span>
        <span className="text-[#94a3b8] truncate">{item.name}</span>
      </div>
      <span className={`text-right font-mono ${pctColor}`}>
        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
      </span>
      <span className={`text-right font-mono ${flowColor}`}>{fmt(item.mainNetInflow)}</span>
      <span className="text-right font-mono text-[#475569]">{fmt(item.amount)}</span>
    </div>
  );
}

function ETFHeader() {
  return (
    <div className="grid grid-cols-4 gap-1 px-2 py-1 text-[10px] text-[#475569] border-b border-[#1e293b]">
      <span className="col-span-2">ETF</span>
      <span className="text-right">涨跌</span>
      <span className="text-right">成交额</span>
    </div>
  );
}

function ETFRow({ item }: { item: HuijinETF }) {
  const pctColor = item.changePercent >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  return (
    <div className="grid grid-cols-4 gap-1 px-2 py-1.5 text-xs border-b border-[#1e293b]/50 last:border-0 hover:bg-[#1e293b]/30 transition-colors">
      <div className="col-span-2 flex items-center gap-1 min-w-0">
        <span className="text-[#94a3b8] truncate">{item.name}</span>
        <span className="text-[10px] text-[#334155]">{item.code}</span>
      </div>
      <span className={`text-right font-mono ${pctColor}`}>
        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
      </span>
      <span className="text-right font-mono text-[#475569]">{fmt(item.amount)}</span>
    </div>
  );
}
