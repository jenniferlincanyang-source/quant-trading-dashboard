import type {
  MarketOverview, OracleEvent, StrategySignal, KLineData,
  StockInfo, DataSource, CrossValidated, RealTimeQuote, SectorFlow,
  ScannerStock, SWSector, EventNews, StrategyInsight, InsightType,
  PriceTick, MarketFundFlowSummary, KLineWithFlow,
  CapitalAlert, MultiPeriodTrend, OracleAccuracyStats,
  PortfolioSummary, TradingAlert, HuijinMonitorData, SSFMonitorData,
  BrokerMonitorData,
} from './types';
import * as mock from './mockData';

// === 数据服务 ===
// 主源: 腾讯财经 + 新浪财经 (Python 脚本内部双源降级)
// 兜底: Mock 数据

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = `${BACKEND_URL}/api`;

// === 全局数据源状态追踪 ===
export type DataSourceStatus = 'live' | 'mock' | 'unknown';

interface SourceReport {
  action: string;
  status: DataSourceStatus;
  timestamp: number;
}

const _sourceReports = new Map<string, SourceReport>();
const _listeners = new Set<() => void>();

type SourceSnap = { overall: DataSourceStatus; mockActions: string[]; liveCount: number; mockCount: number; lastUpdate: number };

const _serverSnap: SourceSnap = { overall: 'unknown', mockActions: [], liveCount: 0, mockCount: 0, lastUpdate: 0 };
let _cachedSnap: SourceSnap = _serverSnap;

function _buildSnapshot(): SourceSnap {
  let liveCount = 0, mockCount = 0;
  const mockActions: string[] = [];
  let lastUpdate = 0;
  _sourceReports.forEach(r => {
    if (r.status === 'live') liveCount++;
    else if (r.status === 'mock') { mockCount++; mockActions.push(r.action); }
    if (r.timestamp > lastUpdate) lastUpdate = r.timestamp;
  });
  const overall: DataSourceStatus =
    _sourceReports.size === 0 ? 'unknown' : mockCount === 0 ? 'live' : 'mock';
  return { overall, mockActions, liveCount, mockCount, lastUpdate };
}

function reportSource(action: string, status: DataSourceStatus) {
  _sourceReports.set(action, { action, status, timestamp: Date.now() });
  _cachedSnap = _buildSnapshot();
  _listeners.forEach(fn => fn());
}

export function subscribeSourceStatus(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getSourceSnapshot(): SourceSnap {
  return _cachedSnap;
}

export function getServerSnapshot(): SourceSnap {
  return _serverSnap;
}

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

function withFallback<T>(live: T | null, fallback: T, action?: string): CrossValidated<T> {
  const key = action || 'unknown';
  if (live !== null) {
    reportSource(key, 'live');
    return { value: live, sources: ['akshare'], confidence: 0.9 };
  }
  reportSource(key, 'mock');
  return { value: fallback, sources: ['mock'], confidence: 0.3 };
}

// === 公开 API ===

export async function getMarketOverview(): Promise<CrossValidated<MarketOverview>> {
  const data = await fetchLive<MarketOverview>('history/market?action=overview');
  return withFallback(data, mock.mockMarketOverview, 'overview');
}

export async function getQuotes(codes?: string[]): Promise<CrossValidated<RealTimeQuote[]>> {
  const qs = codes ? `&codes=${codes.join(',')}` : '';
  const data = await fetchLive<RealTimeQuote[]>(`history/market?action=quotes${qs}`);
  return withFallback(data, mock.mockQuotes, 'quotes');
}

export async function getOracleEvents(): Promise<CrossValidated<OracleEvent[]>> {
  const data = await fetchLive<OracleEvent[]>('history/market?action=events');
  return withFallback(data, mock.mockOracleEvents, 'events');
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
  const data = await fetchLive<KLineData[]>(`history/market?action=kline&code=${code}`);
  return withFallback(data, mock.generateMockKLine(code), 'kline');
}

export async function getSectorFlows(): Promise<CrossValidated<SectorFlow[]>> {
  const data = await fetchLive<SectorFlow[]>('history/market?action=sectors');
  return withFallback(data, mock.mockSectorFlows, 'sector_flows');
}

export function getStockList(): StockInfo[] {
  return mock.mockStocks;
}

export async function getScannerStocks(): Promise<CrossValidated<ScannerStock[]>> {
  const data = await fetchLive<ScannerStock[]>('history/market?action=scanner');
  return withFallback(data, mock.mockScannerStocks, 'scanner');
}

export async function getSWSectorFlows(): Promise<CrossValidated<SWSector[]>> {
  const data = await fetchLive<SWSector[]>('history/market?action=swsectors');
  return withFallback(data, mock.mockSWSectors, 'sw_sectors');
}

export async function getEventNews(): Promise<CrossValidated<EventNews[]>> {
  const data = await fetchLive<EventNews[]>('history/market?action=news');
  return withFallback(data, mock.mockEventNews, 'event_news');
}

const insightMockMap: Record<InsightType, StrategyInsight[]> = {
  trend_follow: mock.mockTrendInsights,
  mean_reversion: mock.mockMeanRevInsights,
  stat_arb: mock.mockStatArbInsights,
  hft: mock.mockHftInsights,
  multi_factor: mock.mockMultiFactorInsights,
};

export async function getStrategyInsights(type: InsightType): Promise<CrossValidated<StrategyInsight[]>> {
  const data = await fetchLive<StrategyInsight[]>(`history/market?action=insights&type=${type}`);
  return withFallback(data, insightMockMap[type] || [], 'insights');
}

// === 历史数据查询 ===

export interface HistoryQuery {
  data_type?: string;
  stock_code?: string;
  search?: string;
  impact?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface HistoryItem {
  id: number;
  data_type: string;
  data_id: string | null;
  snapshot_time: string;
  stock_code: string | null;
  stock_name: string | null;
  summary: string | null;
  impact: string | null;
  data: Record<string, unknown> | null;
}

export interface HistoryResult {
  items: HistoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface HistoryStats {
  type_counts: Record<string, number>;
  recent: { time: string; type: string; summary: string; impact: string }[];
  total_records: number;
}

export async function queryHistory(params: HistoryQuery): Promise<HistoryResult | null> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  return fetchLive<HistoryResult>(`history?${qs.toString()}`);
}

export async function getHistoryStats(): Promise<HistoryStats | null> {
  return fetchLive<HistoryStats>('history/stats');
}

// === 历史数据管理 ===

export type PersistConfig = Record<string, boolean>;

export interface RetrospectiveSignal {
  data_type: string;
  summary: string | null;
  impact: string | null;
  stock_code: string | null;
  stock_name: string | null;
  data: Record<string, unknown> | null;
}

export interface RetrospectiveData {
  date: string;
  signals: RetrospectiveSignal[];
  fund_flows: RetrospectiveSignal[];
  sectors: RetrospectiveSignal[];
  institutions: RetrospectiveSignal[];
  summary: {
    total_signals: number;
    bullish_count: number;
    bearish_count: number;
    top_inflow_stocks: { code: string; name: string; amount: number }[];
    top_outflow_stocks: { code: string; name: string; amount: number }[];
  };
}

export async function getPersistConfig(): Promise<PersistConfig | null> {
  return fetchLive<PersistConfig>('history/persist-config');
}

export async function updatePersistConfig(cfg: PersistConfig) {
  await fetch(`${API_BASE}/history/persist-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  });
}

export async function deleteHistory(params: {
  data_type?: string; before_date?: string; delete_all?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params.data_type) qs.set('data_type', params.data_type);
  if (params.before_date) qs.set('before_date', params.before_date);
  if (params.delete_all) qs.set('delete_all', 'true');
  const res = await fetch(`${API_BASE}/history?${qs}`, { method: 'DELETE' });
  return res.json() as Promise<{ deleted: number | string }>;
}

export async function deleteHistoryRecord(id: number) {
  await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
}

export async function getRetrospective(date: string) {
  return fetchLive<RetrospectiveData>(`history/retrospective?date=${date}`);
}

// === 新增: 交易指挥中心 API ===

export async function getPriceTicks(): Promise<CrossValidated<PriceTick[]>> {
  const data = await fetchLive<PriceTick[]>('history/market?action=price_ticks');
  return withFallback(data, mock.generateMockPriceTicks(), 'price_ticks');
}

export async function getMarketFundFlow(): Promise<CrossValidated<MarketFundFlowSummary>> {
  const data = await fetchLive<MarketFundFlowSummary>('history/market?action=fund_flow');
  return withFallback(data, mock.generateMockFundFlow(), 'fund_flow');
}

export async function getKLineWithFlow(code: string): Promise<CrossValidated<KLineWithFlow[]>> {
  const data = await fetchLive<KLineWithFlow[]>(`history/market?action=kline_flow&code=${code}`);
  return withFallback(data, mock.generateMockKLineWithFlow(code), 'kline_flow');
}

export async function getCapitalAlerts(): Promise<CrossValidated<CapitalAlert[]>> {
  const data = await fetchLive<CapitalAlert[]>('history/market?action=capital_alerts');
  return withFallback(data, mock.generateMockCapitalAlerts(), 'capital_alerts');
}

export async function getMultiPeriodTrend(code: string): Promise<CrossValidated<MultiPeriodTrend>> {
  const data = await fetchLive<MultiPeriodTrend>(`history/market?action=trend&code=${code}`);
  return withFallback(data, mock.generateMockMultiPeriodTrend(code), 'trend');
}

export async function getOracleAccuracy(): Promise<CrossValidated<OracleAccuracyStats>> {
  const data = await fetchLive<OracleAccuracyStats>('history/market?action=oracle_accuracy');
  return withFallback(data, mock.generateMockOracleAccuracy(), 'oracle_accuracy');
}

export async function getPortfolioSummary(): Promise<CrossValidated<PortfolioSummary>> {
  const data = await fetchLive<PortfolioSummary>('history/market?action=portfolio');
  return withFallback(data, mock.generateMockPortfolio(), 'portfolio');
}

export async function getTradingAlerts(): Promise<CrossValidated<TradingAlert[]>> {
  const data = await fetchLive<TradingAlert[]>('history/market?action=trading_alerts');
  return withFallback(data, mock.generateMockTradingAlerts(), 'trading_alerts');
}

export async function getHuijinMonitor(): Promise<CrossValidated<HuijinMonitorData>> {
  const data = await fetchLive<HuijinMonitorData>('history/market?action=huijin');
  return withFallback(data, mock.generateMockHuijinMonitor(), 'huijin');
}

export async function getSSFMonitor(): Promise<CrossValidated<SSFMonitorData>> {
  const data = await fetchLive<SSFMonitorData>('history/market?action=ssf');
  return withFallback(data, mock.generateMockSSFMonitor(), 'ssf');
}

export async function getBrokerMonitor(): Promise<CrossValidated<BrokerMonitorData>> {
  const data = await fetchLive<BrokerMonitorData>('history/market?action=broker');
  return withFallback(data, mock.generateMockBrokerMonitor(), 'broker');
}
