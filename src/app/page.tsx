'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import OverviewCards from '@/components/OverviewCards';
import OracleStream from '@/components/OracleStream';
import StrategyMatrix from '@/components/StrategyMatrix';
import KLineChart from '@/components/KLineChart';
import TradePanel from '@/components/TradePanel';
import MarketScanner from '@/components/MarketScanner';
import SectorHeatmap from '@/components/SectorHeatmap';
import type { SelectedStock } from '@/services/types';

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1600px] px-4 py-6 space-y-6">
        <OverviewCards />

        {/* 策略矩阵 + Oracle 流 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ minHeight: '520px' }}>
          <div className="lg:col-span-3">
            <StrategyMatrix />
          </div>
          <OracleStream stockCode={selectedStock?.code} />
        </div>

        {/* Scanner 排行榜 + 行业热力图 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MarketScanner
            onSelectStock={setSelectedStock}
            selectedCode={selectedStock?.code}
          />
          <div className="lg:col-span-2">
            <SectorHeatmap />
          </div>
        </div>

        {/* 选中股票提示 */}
        {selectedStock && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <span>当前联动:</span>
            <span className="px-2 py-0.5 rounded text-[#3b82f6] bg-[#3b82f6]/10 font-medium">
              {selectedStock.code} {selectedStock.name}
            </span>
            <button
              onClick={() => setSelectedStock(null)}
              className="text-[#475569] hover:text-[#94a3b8] transition-colors"
            >
              清除
            </button>
          </div>
        )}

        <KLineChart
          code={selectedStock?.code ?? '688981'}
          stockName={selectedStock?.name ?? '中芯国际'}
        />

        <TradePanel />

        <footer className="text-center text-[10px] text-[#475569] py-4 border-t border-[#1e293b]">
          2026 A-Share Quant &amp; Oracle Monitor · 三源交叉验证 + QMT 实盘 · 数据仅供研究参考
        </footer>
      </main>
    </div>
  );
}
