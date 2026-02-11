import type {
  MarketOverview, OracleEvent, StrategySignal, KLineData,
  StockInfo, DataSource, CrossValidated, RealTimeQuote, SectorFlow,
  ScannerStock, SWSector,
} from './types';
import * as mock from './mockData';

// === 数据服务 ===
// 主源: 腾讯财经 + 新浪财经 (Python 脚本内部双源降级)
// 兜底: Mock 数据

const API_BASE = '/api';

async function fetchLive<T>(endpoint: string): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`${API_BASE}/${endpoint}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data === 'object' && 'error' in data) return null;
    return data as T;
  } catch {
    return null;
  }
}

function withFallback<T>(live: T | null, fallback: T): CrossValidated<T> {
  if (live !== null) {
    return { value: live, sources: ['akshare'], confidence: 0.9 };
  }
  return { value: fallback, sources: ['mock'], confidence: 0.3 };
}

// === 公开 API ===

export async function getMarketOverview(): Promise<CrossValidated<MarketOverview>> {
  const data = await fetchLive<MarketOverview>('market?action=overview');
  return withFallback(data, mock.mockMarketOverview);
}

export async function getQuotes(codes?: string[]): Promise<CrossValidated<RealTimeQuote[]>> {
  const qs = codes ? `&codes=${codes.join(',')}` : '';
  const data = await fetchLive<RealTimeQuote[]>(`market?action=quotes${qs}`);
  return withFallback(data, mock.mockQuotes);
}

export async function getOracleEvents(): Promise<CrossValidated<OracleEvent[]>> {
  const data = await fetchLive<OracleEvent[]>('market?action=events');
  return withFallback(data, mock.mockOracleEvents);
}

export async function getStrategySignals(): Promise<CrossValidated<StrategySignal[]>> {
  try {
    const res = await fetchLive<{ signals: StrategySignal[]; count: number }>('strategy');
    if (res && res.signals && res.signals.length > 0) {
      return { value: res.signals, sources: ['akshare'], confidence: 0.9 };
    }
  } catch { /* fallback */ }
  return { value: mock.mockStrategySignals, sources: ['mock'], confidence: 0.3 };
}

export async function getKLineData(code: string): Promise<CrossValidated<KLineData[]>> {
  const data = await fetchLive<KLineData[]>(`market?action=kline&code=${code}`);
  return withFallback(data, mock.generateMockKLine(code));
}

export async function getSectorFlows(): Promise<CrossValidated<SectorFlow[]>> {
  const data = await fetchLive<SectorFlow[]>('market?action=sectors');
  return withFallback(data, mock.mockSectorFlows);
}

export function getStockList(): StockInfo[] {
  return mock.mockStocks;
}

export async function getScannerStocks(): Promise<CrossValidated<ScannerStock[]>> {
  const data = await fetchLive<ScannerStock[]>('market?action=scanner');
  return withFallback(data, mock.mockScannerStocks);
}

export async function getSWSectorFlows(): Promise<CrossValidated<SWSector[]>> {
  const data = await fetchLive<SWSector[]>('market?action=swsectors');
  return withFallback(data, mock.mockSWSectors);
}
