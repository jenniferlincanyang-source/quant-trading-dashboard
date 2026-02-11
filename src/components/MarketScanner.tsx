'use client';
import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { useScannerStocks } from '@/hooks/useMarketData';
import type { SelectedStock } from '@/services/types';

interface Props {
  onSelectStock: (s: SelectedStock) => void;
  selectedCode?: string;
}

export default function MarketScanner({ onSelectStock, selectedCode }: Props) {
  const { data: stocks, loading } = useScannerStocks();
  const prevTop10 = useRef<Set<string>>(new Set());
  const [flashCodes, setFlashCodes] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!stocks || stocks.length === 0) return;
    const top10 = new Set(stocks.slice(0, 10).map(s => s.code));

    if (!initialized.current) {
      prevTop10.current = top10;
      initialized.current = true;
      return;
    }

    const newEntries = new Set<string>();
    top10.forEach(code => {
      if (!prevTop10.current.has(code)) newEntries.add(code);
    });

    if (newEntries.size > 0) {
      setFlashCodes(newEntries);
      setTimeout(() => setFlashCodes(new Set()), 2100);
    }
    prevTop10.current = top10;
  }, [stocks]);

  if (loading || !stocks) {
    return (
      <div className="rounded-xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} style={{ color: 'var(--accent-amber)' }} />
          <span className="text-sm font-semibold">全市场扫描</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: 'var(--accent-amber)' }} />
          <span className="text-sm font-semibold">全市场扫描 Top30</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {stocks.length} 只
        </span>
      </div>

      <div className="space-y-0.5 max-h-[420px] overflow-y-auto">
        {stocks.map((s, i) => {
          const isSelected = s.code === selectedCode;
          const isFlash = flashCodes.has(s.code);
          const isUp = s.changePercent >= 0;
          return (
            <div
              key={s.code}
              onClick={() => onSelectStock({ code: s.code, name: s.name })}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${isFlash ? 'animate-gold-flash' : ''}`}
              style={{
                background: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
                borderLeft: isSelected ? '2px solid var(--accent-blue)' : '2px solid transparent',
              }}
            >
              <span className="w-5 text-xs font-mono text-right" style={{
                color: i < 3 ? 'var(--accent-amber)' : 'var(--muted)',
                fontWeight: i < 3 ? 700 : 400,
              }}>{i + 1}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">{s.name}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{s.code}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{s.triggerReason}</span>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono flex items-center gap-0.5">
                  <TrendingUp size={10} style={{ color: 'var(--accent-amber)' }} />
                  <span style={{ color: 'var(--accent-amber)' }}>{s.valueScore}</span>
                </div>
                <span className="text-xs font-mono" style={{
                  color: isUp ? 'var(--accent-red)' : 'var(--accent-green)',
                }}>
                  {isUp ? '+' : ''}{s.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
