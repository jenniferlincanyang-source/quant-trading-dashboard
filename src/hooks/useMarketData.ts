'use client';
import { useState, useEffect, useCallback } from 'react';
import type {
  MarketOverview, OracleEvent, StrategySignal,
  KLineData, SectorFlow, RealTimeQuote, DataSource,
  ScannerStock, SWSector, EventNews, StrategyInsight, InsightType,
  PriceTick, MarketFundFlowSummary, KLineWithFlow,
  CapitalAlert, MultiPeriodTrend, OracleAccuracyStats,
  PortfolioSummary, TradingAlert, HuijinMonitorData, SSFMonitorData,
  BrokerMonitorData,
} from '@/services/types';
import * as api from '@/services/dataService';

interface DataState<T> {
  data: T | null;
  sources: DataSource[];
  confidence: number;
  loading: boolean;
  error: string | null;
}

function useDataFetcher<T>(
  fetcher: () => Promise<{ value: T; sources: DataSource[]; confidence: number }>,
  interval?: number,
): DataState<T> & { refresh: () => void } {
  const [state, setState] = useState<DataState<T>>({
    data: null, sources: [], confidence: 0, loading: true, error: null,
  });

  const load = useCallback(async () => {
    try {
      const result = await fetcher();
      setState({ data: result.value, sources: result.sources, confidence: result.confidence, loading: false, error: null });
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: (e as Error).message }));
    }
  }, [fetcher]);

  useEffect(() => {
    load();
    if (interval) {
      const id = setInterval(load, interval);
      return () => clearInterval(id);
    }
  }, [load, interval]);

  return { ...state, refresh: load };
}

export function useMarketOverview() {
  return useDataFetcher<MarketOverview>(api.getMarketOverview, 30000);
}

export function useQuotes(codes?: string[]) {
  const fetcher = useCallback(() => api.getQuotes(codes), [codes]);
  return useDataFetcher<RealTimeQuote[]>(fetcher, 10000);
}

export function useOracleEvents() {
  return useDataFetcher<OracleEvent[]>(api.getOracleEvents, 15000);
}

export function useStrategySignals() {
  return useDataFetcher<StrategySignal[]>(api.getStrategySignals, 30000);
}

export function useKLineData(code: string) {
  const fetcher = useCallback(() => api.getKLineData(code), [code]);
  return useDataFetcher<KLineData[]>(fetcher);
}

export function useSectorFlows() {
  return useDataFetcher<SectorFlow[]>(api.getSectorFlows, 30000);
}

export function useScannerStocks() {
  return useDataFetcher<ScannerStock[]>(api.getScannerStocks, 15000);
}

export function useSWSectorFlows() {
  return useDataFetcher<SWSector[]>(api.getSWSectorFlows, 30000);
}

export function useEventNews() {
  return useDataFetcher<EventNews[]>(api.getEventNews, 60000);
}

export function useStrategyInsights(type: InsightType) {
  const fetcher = useCallback(() => api.getStrategyInsights(type), [type]);
  return useDataFetcher<StrategyInsight[]>(fetcher, 60000);
}

// === 新增: 交易指挥中心 Hooks ===

export function usePriceTicks() {
  return useDataFetcher<PriceTick[]>(api.getPriceTicks, 5000);
}

export function useMarketFundFlow() {
  return useDataFetcher<MarketFundFlowSummary>(api.getMarketFundFlow, 30000);
}

export function useKLineWithFlow(code: string) {
  const fetcher = useCallback(() => api.getKLineWithFlow(code), [code]);
  return useDataFetcher<KLineWithFlow[]>(fetcher);
}

export function useCapitalAlerts() {
  return useDataFetcher<CapitalAlert[]>(api.getCapitalAlerts, 15000);
}

export function useMultiPeriodTrend(code: string) {
  const fetcher = useCallback(() => api.getMultiPeriodTrend(code), [code]);
  return useDataFetcher<MultiPeriodTrend>(fetcher, 60000);
}

export function useOracleAccuracy() {
  return useDataFetcher<OracleAccuracyStats>(api.getOracleAccuracy, 60000);
}

export function usePortfolioSummary() {
  return useDataFetcher<PortfolioSummary>(api.getPortfolioSummary, 30000);
}

export function useTradingAlerts() {
  return useDataFetcher<TradingAlert[]>(api.getTradingAlerts, 10000);
}

export function useHuijinMonitor() {
  return useDataFetcher<HuijinMonitorData>(api.getHuijinMonitor, 60000);
}

export function useSSFMonitor() {
  return useDataFetcher<SSFMonitorData>(api.getSSFMonitor, 60000);
}

export function useBrokerMonitor() {
  return useDataFetcher<BrokerMonitorData>(api.getBrokerMonitor, 60000);
}
