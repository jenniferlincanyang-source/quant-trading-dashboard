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
  datetime: string;   // 完整日期时间 YYYY-MM-DD HH:mm:ss
  lagDays: number;     // 数据滞后天数，0=实时
  verifiedDate: string; // 验证日期 YYYY-MM-DD
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
export type DataSource = 'akshare' | 'eastmoney' | 'sina' | 'mock';

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

// === 实时行情 (多源验证) ===
export interface PriceTick {
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
  sources: DataSource[];
  divergence?: string;
  timestamp: number;
}

// === 交易所资金流 ===
export interface ExchangeFundFlow {
  code: string;
  name: string;
  mainNetInflow: number;
  superLargeInflow: number;
  superLargePercent: number;
  largeInflow: number;
  largePercent: number;
  mediumInflow: number;
  mediumPercent: number;
  smallInflow: number;
  smallPercent: number;
  totalAmount: number;
  timestamp: string;
}

export interface MarketFundFlowSummary {
  totalMainInflow: number;
  totalSuperLarge: number;
  totalLarge: number;
  totalMedium: number;
  totalSmall: number;
  topInflows: ExchangeFundFlow[];
  topOutflows: ExchangeFundFlow[];
  timestamp: string;
}

// === K线+资金流叠加 ===
export interface KLineWithFlow extends KLineData {
  mainInflow: number;
  retailInflow: number;
}

// === 大资金建仓减仓预警 ===
export type CapitalAlertType = 'building' | 'reducing' | 'sudden_inflow' | 'sudden_outflow';

export interface CapitalAlert {
  id: string;
  time: string;
  datetime: string;
  code: string;
  name: string;
  alertType: CapitalAlertType;
  description: string;
  amount: number;
  daysAccumulated: number;
  confidence: number;
  severity: 'critical' | 'warning' | 'info';
  relatedMetrics: Record<string, string>;
}

export const CAPITAL_ALERT_LABELS: Record<CapitalAlertType, string> = {
  building: '主力建仓',
  reducing: '主力减仓',
  sudden_inflow: '资金突增',
  sudden_outflow: '资金突减',
};

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

// === 事件驱动 — 新闻来源 + 机构分析 ===
export type EventCategory = 'earnings' | 'policy' | 'merger' | 'rating' | 'macro' | 'industry';

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  earnings: '业绩',
  policy: '政策',
  merger: '并购',
  rating: '评级',
  macro: '宏观',
  industry: '行业',
};

export interface AnalystView {
  institution: string;
  analyst: string;
  rating: 'buy' | 'hold' | 'sell' | 'overweight' | 'underweight';
  targetPrice?: number;
  summary: string;
  datetime?: string;   // 研报发布日期 YYYY-MM-DD
  lagDays?: number;    // 研报滞后天数
}

export const RATING_LABELS: Record<AnalystView['rating'], string> = {
  buy: '买入',
  hold: '持有',
  sell: '卖出',
  overweight: '增持',
  underweight: '减持',
};

export interface EventNews {
  id: string;
  time: string;
  datetime: string;    // 完整日期时间 YYYY-MM-DD HH:mm:ss
  lagDays: number;     // 信息滞后天数
  verifiedDate: string; // 验证日期 YYYY-MM-DD
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  relatedStocks: string[];
  category: EventCategory;
  analystViews: AnalystView[];
  impact: 'positive' | 'negative' | 'neutral';
}

// === 策略洞察 ===
export type InsightType = 'trend_follow' | 'mean_reversion' | 'stat_arb' | 'hft' | 'multi_factor';

export interface StrategyInsight {
  id: string;
  time: string;
  datetime: string;    // 完整日期时间 YYYY-MM-DD HH:mm:ss
  lagDays: number;     // 数据滞后天数
  verifiedDate: string; // 验证日期 YYYY-MM-DD
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  relatedStocks: string[];
  insightType: InsightType;
  analystViews: AnalystView[];
  signal: 'bullish' | 'bearish' | 'neutral';
  keyMetrics?: Record<string, string>;
}

// === 多周期趋势预测 ===
export type TrendPeriod = 'daily' | 'weekly' | 'monthly';

export interface TrendPrediction {
  code: string;
  name: string;
  period: TrendPeriod;
  direction: 'up' | 'down' | 'sideways';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  supportLevel: number;
  resistanceLevel: number;
  keyFactors: string[];
  updatedAt: string;
}

export interface MultiPeriodTrend {
  code: string;
  name: string;
  daily: TrendPrediction;
  weekly: TrendPrediction;
  monthly: TrendPrediction;
  consensus: 'bullish' | 'bearish' | 'mixed';
}

export const TREND_PERIOD_LABELS: Record<TrendPeriod, string> = {
  daily: '日线',
  weekly: '周线',
  monthly: '月线',
};

// === Oracle 历史验证 ===
export interface OracleVerification {
  id: string;
  originalEvent: {
    id: string;
    datetime: string;
    stockCode: string;
    stockName: string;
    type: OracleEvent['type'];
    description: string;
    impact: OracleEvent['impact'];
  };
  verificationDate: string;
  priceAtEvent: number;
  priceAtVerification: number;
  actualChange: number;
  predictedImpact: OracleEvent['impact'];
  actualImpact: 'positive' | 'negative' | 'neutral';
  isCorrect: boolean;
  accuracy: number;
  notes: string;
}

export interface OracleAccuracyStats {
  totalPredictions: number;
  correctPredictions: number;
  overallAccuracy: number;
  byType: Record<string, { total: number; correct: number; accuracy: number }>;
  recentVerifications: OracleVerification[];
}

// === 增强持仓卡片 ===
export interface EnhancedPosition {
  stockCode: string;
  stockName: string;
  volume: number;
  availableVolume: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  profit: number;
  profitRatio: number;
  todayProfit: number;
  todayProfitRatio: number;
  allocationPercent: number;
  holdingDays: number;
  sector: string;
  riskLevel: RiskLevel;
  recentPrices: number[];
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  totalProfitRatio: number;
  todayProfit: number;
  todayProfitRatio: number;
  positions: EnhancedPosition[];
}

// === 实时预警面板 ===
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'price' | 'volume' | 'fund_flow' | 'strategy' | 'risk' | 'system';

export interface TradingAlert {
  id: string;
  time: string;
  datetime: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  stockCode?: string;
  stockName?: string;
  actionRequired: boolean;
  acknowledged: boolean;
  relatedData?: Record<string, string>;
}

export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  price: '价格',
  volume: '成交量',
  fund_flow: '资金流',
  strategy: '策略',
  risk: '风控',
  system: '系统',
};

// === 板块购买建议 ===
export interface StockRecommendation {
  code: string;
  name: string;
  signal: 'buy' | 'hold' | 'sell';
  confidence: number;
  valueScore: number;
  triggerReasons: string[];
  price: number;
  changePercent: number;
  sector: string;
}

export interface SectorRecommendationData {
  sectorName: string;
  sectorScore: number;
  changePercent: number;
  netInflow: number;
  momentum: 'accelerating' | 'decelerating' | 'stable';
  topStocks: StockRecommendation[];
}

// === 中央汇金动向监控 ===
export interface HuijinHolding {
  code: string;
  name: string;
  category: 'bank' | 'insurance' | 'securities';
  holdPercent: number;
  price: number;
  changePercent: number;
  volume: number;
  amount: number;
  mainNetInflow: number;
  superLargeInflow: number;
  largeInflow: number;
}

export interface HuijinETF {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  amount: number;
}

export interface HuijinSignal {
  type: 'inflow' | 'outflow';
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface HuijinSummary {
  totalMainInflow: number;
  bankMainInflow: number;
  avgChangePercent: number;
  signalCount: number;
}

export interface HuijinMonitorData {
  holdings: HuijinHolding[];
  etfs: HuijinETF[];
  summary: HuijinSummary;
  signals: HuijinSignal[];
  timestamp: string;
}

// === 社保基金动向监控 ===
export type SSFCategory = 'pharma' | 'tech' | 'consumer' | 'finance' | 'energy';

export interface SSFHolding {
  code: string;
  name: string;
  category: SSFCategory;
  price: number;
  changePercent: number;
  volume: number;
  amount: number;
  mainNetInflow: number;
  superLargeInflow: number;
  largeInflow: number;
}

export interface SSFSectorSummary {
  category: SSFCategory;
  label: string;
  totalInflow: number;
  avgChange: number;
  stockCount: number;
}

export interface SSFSignal {
  type: 'inflow' | 'outflow';
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface SSFSummary {
  totalMainInflow: number;
  avgChangePercent: number;
  signalCount: number;
  holdingCount: number;
}

export interface SSFMonitorData {
  holdings: SSFHolding[];
  sectorSummary: SSFSectorSummary[];
  summary: SSFSummary;
  signals: SSFSignal[];
  timestamp: string;
}

// === 头部券商建仓减仓监控 ===
export type BrokerAction = 'building' | 'reducing' | 'sudden_inflow' | 'sudden_outflow' | 'neutral';

export interface BrokerDayFlow {
  date: string;
  main: number;
}

export interface BrokerStock {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  amount: number;
  todayMainInflow: number;
  todaySuperLarge: number;
  todayLarge: number;
  fiveDayTotal: number;
  consecutiveDays: number;
  accumulatedFlow: number;
  action: BrokerAction;
  dayFlows: BrokerDayFlow[];
}

export interface BrokerSignal {
  type: 'building' | 'reducing' | 'sudden_inflow' | 'sudden_outflow';
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface BrokerSummary {
  totalTodayInflow: number;
  buildingCount: number;
  reducingCount: number;
  brokerCount: number;
}

export interface BrokerMonitorData {
  brokers: BrokerStock[];
  summary: BrokerSummary;
  signals: BrokerSignal[];
  timestamp: string;
}

export const BROKER_ACTION_LABELS: Record<BrokerAction, string> = {
  building: '建仓',
  reducing: '减仓',
  sudden_inflow: '资金突增',
  sudden_outflow: '资金突减',
  neutral: '观望',
};
