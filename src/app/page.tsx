'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import DataSourceGuard from '@/components/DataSourceGuard';
import OverviewCards from '@/components/OverviewCards';
import OracleStream from '@/components/OracleStream';
import StrategyMatrix from '@/components/StrategyMatrix';
import KLineChart from '@/components/KLineChart';
import TradePanel from '@/components/TradePanel';
import MarketScanner from '@/components/MarketScanner';
import SectorHeatmap from '@/components/SectorHeatmap';
import HistoryQuickView from '@/components/HistoryQuickView';
import AlertPanel from '@/components/AlertPanel';
import PriceTicker from '@/components/PriceTicker';
import FundFlowMonitor from '@/components/FundFlowMonitor';
import CapitalAlertPanel from '@/components/CapitalAlertPanel';
import TrendPrediction from '@/components/TrendPrediction';
import OracleVerification from '@/components/OracleVerification';
import SectorRecommendation from '@/components/SectorRecommendation';
import HuijinMonitor from '@/components/HuijinMonitor';
import SSFundMonitor from '@/components/SSFundMonitor';
import BrokerMonitor from '@/components/BrokerMonitor';
import type { SelectedStock } from '@/services/types';

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);

  return (
    <div className="min-h-screen">
      <Header />
      <DataSourceGuard />

      <main className="mx-auto max-w-[1600px] px-4 py-6 space-y-6">
        {/* 实时预警面板 */}
        <AlertPanel />

        <OverviewCards />

        {/* 实时行情滚动条 */}
        <PriceTicker />

        {/* 策略矩阵（六大策略平铺） */}
        <StrategyMatrix />

        {/* Oracle 真相流 + 历史验证 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: '360px' }}>
          <OracleStream stockCode={selectedStock?.code} />
          <OracleVerification />
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

        {/* 板块强度排行 · 购买建议 */}
        <SectorRecommendation onSelectStock={setSelectedStock} />

        {/* 资金流向 + 大资金预警 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: '400px' }}>
          <FundFlowMonitor />
          <CapitalAlertPanel />
        </div>

        {/* 中央汇金动向监控 */}
        <HuijinMonitor />

        {/* 社保基金动向监控 */}
        <SSFundMonitor />

        {/* 头部券商建仓减仓监控 */}
        <BrokerMonitor />

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

        {/* K线图(含资金流叠加) + 多周期趋势预测 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <KLineChart
              code={selectedStock?.code ?? '688981'}
              stockName={selectedStock?.name ?? '中芯国际'}
            />
          </div>
          <TrendPrediction stockCode={selectedStock?.code ?? '688981'} />
        </div>

        <HistoryQuickView />

        <TradePanel />

        <footer className="text-center text-[10px] text-[#475569] py-4 border-t border-[#1e293b]">
          2026 A-Share Quant &amp; Oracle Monitor · 三源交叉验证 + QMT 实盘 · 数据仅供研究参考
        </footer>
      </main>
    </div>
  );
}