'use client';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Zap, ChevronRight } from 'lucide-react';
import InfoTip from './InfoTip';
import { useSWSectorFlows, useScannerStocks, useStrategySignals } from '@/hooks/useMarketData';
import type { SelectedStock, SectorRecommendationData, StockRecommendation } from '@/services/types';

interface Props {
  onSelectStock?: (s: SelectedStock) => void;
}

export default function SectorRecommendation({ onSelectStock }: Props) {
  const { data: sectors } = useSWSectorFlows();
  const { data: scannerStocks } = useScannerStocks();
  const { data: signals } = useStrategySignals();
  const [activeSector, setActiveSector] = useState<string | null>(null);

  const recommendations = useMemo(() => {
    if (!sectors || !scannerStocks) return [];
    const signalMap = new Map<string, { signal: string; confidence: number }>();
    (signals || []).forEach(s => {
      signalMap.set(s.stockCode, { signal: s.signal, confidence: s.confidence });
    });

    const sectorMap = new Map<string, SectorRecommendationData>();
    sectors.forEach(sec => {
      const stocks = scannerStocks.filter(s => s.sector === sec.name);
      const avgScore = stocks.length > 0
        ? stocks.reduce((a, s) => a + s.valueScore, 0) / stocks.length : 0;
      const buyCount = stocks.filter(s => {
        const sig = signalMap.get(s.code);
        return sig?.signal === 'buy';
      }).length;
      const buyRatio = stocks.length > 0 ? buyCount / stocks.length : 0;

      const changePct = sec.changePercent || 0;
      const inflow = sec.netInflow || 0;
      const maxInflow = Math.max(...sectors.map(s => Math.abs(s.netInflow || 1)));
      const normInflow = maxInflow > 0 ? inflow / maxInflow : 0;

      const score = changePct * 30 + normInflow * 25 + (avgScore / 100) * 25 + buyRatio * 20;
      const momentum: 'accelerating' | 'decelerating' | 'stable' =
        inflow > 0 && changePct > 0 ? 'accelerating' :
        inflow < 0 && changePct < 0 ? 'decelerating' : 'stable';

      const topStocks: StockRecommendation[] = stocks
        .sort((a, b) => b.valueScore - a.valueScore)
        .slice(0, 5)
        .map(s => {
          const sig = signalMap.get(s.code);
          return {
            code: s.code, name: s.name,
            signal: (sig?.signal as 'buy' | 'hold' | 'sell') || 'hold',
            confidence: sig?.confidence || 0.5,
            valueScore: s.valueScore,
            triggerReasons: [s.triggerReason],
            price: s.price,
            changePercent: s.changePercent,
            sector: sec.name,
          };
        });

      sectorMap.set(sec.name, {
        sectorName: sec.name, sectorScore: +score.toFixed(1),
        changePercent: changePct, netInflow: inflow,
        momentum, topStocks,
      });
    });

    return Array.from(sectorMap.values())
      .sort((a, b) => b.sectorScore - a.sectorScore);
  }, [sectors, scannerStocks, signals]);

  const active = activeSector
    ? recommendations.find(r => r.sectorName === activeSector)
    : recommendations[0];

  if (!sectors || !scannerStocks) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
        <div className="h-[300px] rounded-lg bg-[#0a0f1a] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        <SectorList
          items={recommendations}
          active={activeSector || recommendations[0]?.sectorName}
          onSelect={setActiveSector}
        />
        <StockDetail
          sector={active || null}
          onSelectStock={onSelectStock}
        />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-4 py-3 border-b border-[#1e293b] flex items-center gap-2">
      <Target className="w-4 h-4 text-[#f59e0b]" />
      <span className="text-sm font-medium">板块强度排行 · 购买建议</span>
      <InfoTip text="综合板块涨跌幅(30%)、资金流向(25%)、个股评分均值(25%)、买入信号占比(20%)四维度计算板块强度评分，按评分排序并展示板块内个股的买卖信号和置信度。" />
      <span className="text-[10px] text-[#475569] ml-auto">综合评分 = 涨幅×30 + 资金流×25 + 个股评分×25 + 买入信号占比×20</span>
    </div>
  );
}

function StockDetail({ sector, onSelectStock }: {
  sector: SectorRecommendationData | null;
  onSelectStock?: (s: SelectedStock) => void;
}) {
  if (!sector) {
    return (
      <div className="lg:col-span-3 p-4 flex items-center justify-center text-[#475569] text-xs">
        选择左侧板块查看详情
      </div>
    );
  }

  return (
    <div className="lg:col-span-3 p-3 space-y-2 max-h-[420px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">{sector.sectorName}</span>
        <MomentumBadge m={sector.momentum} />
        <span className={`text-xs ${sector.changePercent >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
          {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
        </span>
        <span className="text-[10px] text-[#475569] ml-auto">
          综合评分 {sector.sectorScore}
        </span>
      </div>

      {sector.topStocks.length === 0 ? (
        <div className="text-xs text-[#475569] py-4 text-center">该板块暂无推荐标的</div>
      ) : (
        sector.topStocks.map(stock => (
          <button
            key={stock.code}
            onClick={() => onSelectStock?.({ code: stock.code, name: stock.name })}
            className="w-full rounded-lg bg-[#0a0f1a] p-3 text-left hover:bg-[#0a0f1a]/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SignalBadge signal={stock.signal} />
              <span className="text-xs font-medium">{stock.code}</span>
              <span className="text-xs text-[#94a3b8]">{stock.name}</span>
              <span className={`text-xs ml-auto font-mono ${
                stock.changePercent >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'
              }`}>
                ¥{stock.price.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-[#475569]">
                置信度 <span className="text-[#94a3b8]">{(stock.confidence * 100).toFixed(0)}%</span>
              </span>
              <span className="text-[10px] text-[#475569]">
                评分 <span className="text-[#94a3b8]">{stock.valueScore}</span>
              </span>
              {stock.triggerReasons.map((r, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">
                  {r}
                </span>
              ))}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function MomentumBadge({ m }: { m: 'accelerating' | 'decelerating' | 'stable' }) {
  if (m === 'accelerating') return <TrendingUp className="w-3 h-3 text-[#ef4444]" />;
  if (m === 'decelerating') return <TrendingDown className="w-3 h-3 text-[#10b981]" />;
  return <Minus className="w-3 h-3 text-[#475569]" />;
}

function SignalBadge({ signal }: { signal: 'buy' | 'hold' | 'sell' }) {
  const cfg = {
    buy: { text: '买入', bg: 'bg-[#ef4444]/15', color: 'text-[#ef4444]' },
    hold: { text: '持有', bg: 'bg-[#f59e0b]/15', color: 'text-[#f59e0b]' },
    sell: { text: '卖出', bg: 'bg-[#10b981]/15', color: 'text-[#10b981]' },
  }[signal];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.text}
    </span>
  );
}

function SectorList({ items, active, onSelect }: {
  items: SectorRecommendationData[];
  active: string;
  onSelect: (name: string) => void;
}) {
  const accel = items.filter(i => i.momentum === 'accelerating').slice(0, 3);
  const decel = items.filter(i => i.momentum === 'decelerating').slice(0, 3);

  return (
    <div className="lg:col-span-2 border-r border-[#1e293b] p-3 space-y-1 max-h-[420px] overflow-y-auto">
      {items.slice(0, 12).map((sec, i) => (
        <button
          key={sec.sectorName}
          onClick={() => onSelect(sec.sectorName)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
            sec.sectorName === active
              ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/30'
              : 'hover:bg-[#1e293b]/50'
          }`}
        >
          <span className="text-[10px] text-[#475569] w-4">{i + 1}</span>
          <span className="text-xs flex-1 truncate">{sec.sectorName}</span>
          <MomentumBadge m={sec.momentum} />
          <span className={`text-xs font-mono ${sec.changePercent >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {sec.changePercent >= 0 ? '+' : ''}{sec.changePercent.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#475569] w-10 text-right">{sec.sectorScore}</span>
          <ChevronRight className="w-3 h-3 text-[#334155]" />
        </button>
      ))}

      {(accel.length > 0 || decel.length > 0) && (
        <div className="pt-2 mt-2 border-t border-[#1e293b]">
          <div className="text-[10px] text-[#475569] mb-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3" /> 板块轮动信号
          </div>
          {accel.map(s => (
            <div key={s.sectorName} className="text-[10px] text-[#ef4444] py-0.5">
              资金流入加速: {s.sectorName} ({s.netInflow > 0 ? '+' : ''}{(s.netInflow / 10000).toFixed(1)}万)
            </div>
          ))}
          {decel.map(s => (
            <div key={s.sectorName} className="text-[10px] text-[#10b981] py-0.5">
              资金流出加速: {s.sectorName} ({(s.netInflow / 10000).toFixed(1)}万)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
