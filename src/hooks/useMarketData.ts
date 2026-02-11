'use client';
import { useState, useEffect, useCallback } from 'react';
import type {
  MarketOverview, OracleEvent, StrategySignal,
  KLineData, SectorFlow, RealTimeQuote, DataSource,
  ScannerStock, SWSector,
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
