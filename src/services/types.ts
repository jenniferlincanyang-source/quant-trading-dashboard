export interface MarketOverview {
  sentimentIndex: number;
  sentimentLabel: string;
  hotSector: string;
  hotSectorChange: number;
  avgWinRate: number;
  avgWinRateChange: number;
}

export interface OracleEvent {
  id: string;
  time: string;
  stockCode: string;
  stockName: string;
  type: 'big_order' | 'limit_up_seal' | 'limit_down_seal' | 'volume_spike' | 'block_trade';
  description: string;
  amount: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface StrategySignal {
  id: string;
  time: string;
  stockCode: string;
  stockName: string;
  strategy: StrategyType;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  expectedReturn: number;
  riskLevel: RiskLevel;
  factors: string[];
}

export type StrategyType = 'trend_follow' | 't_plus_0' | 'dividend_low_vol' | 'mean_reversion' | 'multi_factor' | 'index_enhance' | 'stat_arb' | 'hft' | 'event_driven';
export type RiskLevel = 'low' | 'medium' | 'high';

// === 6 大策略分类 ===
export type StrategyCategory = 'trend_follow' | 'mean_reversion' | 'stat_arb' | 'hft' | 'multi_factor' | 'event_driven';

export const STRATEGY_CATEGORY_MAP: Record<StrategyType, StrategyCategory> = {
  trend_follow: 'trend_follow',
  t_plus_0: 'hft',
  dividend_low_vol: 'mean_reversion',
  mean_reversion: 'mean_reversion',
  multi_factor: 'multi_factor',
  index_enhance: 'multi_factor',
  stat_arb: 'stat_arb',
  hft: 'hft',
  event_driven: 'event_driven',
};

export interface StrategyCategoryMeta {
  key: StrategyCategory;
  label: string;
  color: string;
  logic: string;
  applicable: string;
  cases: string[];
  subStrategies: StrategyType[];
}

export const STRATEGY_CATEGORIES: StrategyCategoryMeta[] = [
  {
    key: 'trend_follow', label: '趋势跟踪', color: '#3b82f6',
    logic: '强者恒强，追随市场趋势方向',
    applicable: '单边牛/熊市',
    cases: ['均线金叉', '海龟法则', '动量突破'],
    subStrategies: ['trend_follow'],
  },
  {
    key: 'mean_reversion', label: '均值回归', color: '#06b6d4',
    logic: '价格终将回归均值',
    applicable: '震荡市',
    cases: ['布林带超买超卖', '红利低波'],
    subStrategies: ['mean_reversion', 'dividend_low_vol'],
  },
  {
    key: 'stat_arb', label: '统计套利', color: '#10b981',
    logic: '利用资产价差波动获利',
    applicable: '关联性强市场',
    cases: ['配对交易', '跨品种套利'],
    subStrategies: ['stat_arb'],
  },
  {
    key: 'hft', label: '高频交易', color: '#a855f7',
    logic: '捕捉毫秒级价差',
    applicable: '高波动/高流动性',
    cases: ['做市商策略', 'T+0回转'],
    subStrategies: ['hft', 't_plus_0'],
  },
  {
    key: 'multi_factor', label: '多因子模型', color: '#f59e0b',
    logic: '多维度因子寻找超额收益',
    applicable: '长期稳健增长',
    cases: ['中证A500指增', '指数增强'],
    subStrategies: ['multi_factor', 'index_enhance'],
  },
  {
    key: 'event_driven', label: '事件驱动', color: '#f43f5e',
    logic: '捕捉特定消息带来的波动',
    applicable: '特定消息发布期',
    cases: ['业绩超预期', '重组并购'],
    subStrategies: ['event_driven'],
  },
];

export interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  sharpeRatio: number;
}

export interface StockInfo {
  code: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  strategies: StrategyType[];
}

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  trend_follow: '趋势跟踪',
  t_plus_0: 'T+0',
  dividend_low_vol: '红利低波',
  mean_reversion: '均值回归',
  multi_factor: '多因子',
  index_enhance: '指数增强',
  stat_arb: '统计套利',
  hft: '高频交易',
  event_driven: '事件驱动',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

// === 三源交叉验证 ===
export type DataSource = 'akshare' | 'eastmoney' | 'mock';

export interface DataPoint<T> {
  data: T;
  source: DataSource;
  timestamp: number;
  confidence: number; // 0-1, 三源一致=1, 两源一致=0.7, 单源=0.4
}

export interface CrossValidated<T> {
  value: T;
  sources: DataSource[];
  confidence: number;
  divergence?: string; // 数据分歧描述
}

export interface RealTimeQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  amount: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  turnoverRate: number;
  pe: number;
  pb: number;
}

export interface SectorFlow {
  sector: string;
  netInflow: number;
  changePercent: number;
  leadingStock: string;
}

export interface MoneyFlow {
  code: string;
  name: string;
  mainNetInflow: number;
  superLargeInflow: number;
  largeInflow: number;
  mediumInflow: number;
  smallInflow: number;
}

// === Scanner 排行榜 ===
export type TriggerReason =
  | '突破年线' | '机构抢筹' | '放量突破' | '底部反转'
  | '北向扫货' | '涨停板' | '均线多头' | '资金异动'
  | 'MACD金叉' | '超跌反弹' | '板块龙头' | '缩量企稳';

export interface ScannerStock {
  code: string;
  name: string;
  valueScore: number;
  triggerReason: TriggerReason;
  price: number;
  changePercent: number;
  sector: string;
  rank: number;
  prevRank: number | null;
}

// === 申万一级行业热力图 ===
export interface SWSector {
  name: string;
  netInflow: number;
  changePercent: number;
  leadingStock: string;
  stockCount: number;
}

// === 联动选中 ===
export interface SelectedStock {
  code: string;
  name: string;
}
