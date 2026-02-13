import type {
  MarketOverview, OracleEvent, StrategySignal,
  KLineData, StockInfo, RealTimeQuote, SectorFlow,
  ScannerStock, SWSector, TriggerReason, EventNews, StrategyInsight,
  PriceTick, MarketFundFlowSummary, ExchangeFundFlow, KLineWithFlow,
  CapitalAlert, MultiPeriodTrend, TrendPrediction, TrendPeriod,
  OracleVerification, OracleAccuracyStats, EnhancedPosition, PortfolioSummary,
  TradingAlert, HuijinMonitorData, SSFMonitorData, BrokerMonitorData,
} from './types';

// === 模拟数据: 2026 A股环境 (三源验证兜底层) ===

export const mockMarketOverview: MarketOverview = {
  sentimentIndex: 72.5,
  sentimentLabel: '偏多',
  hotSector: '人工智能',
  hotSectorChange: 3.82,
  avgWinRate: 58.3,
  avgWinRateChange: 1.2,
};

export const mockStocks: StockInfo[] = [
  { code: '600519', name: '贵州茅台', sector: '食品饮料', price: 1483.00, change: -1.42, strategies: ['dividend_low_vol', 'multi_factor'] },
  { code: '000858', name: '五粮液', sector: '食品饮料', price: 104.79, change: -1.18, strategies: ['mean_reversion', 'dividend_low_vol'] },
  { code: '601318', name: '中国平安', sector: '非银金融', price: 66.80, change: -1.04, strategies: ['trend_follow', 'multi_factor'] },
  { code: '000001', name: '平安银行', sector: '银行', price: 10.96, change: -0.99, strategies: ['dividend_low_vol', 't_plus_0'] },
  { code: '600036', name: '招商银行', sector: '银行', price: 38.77, change: -1.60, strategies: ['dividend_low_vol', 'index_enhance'] },
  { code: '300750', name: '宁德时代', sector: '电力设备', price: 377.46, change: 2.57, strategies: ['trend_follow', 'multi_factor'] },
  { code: '002594', name: '比亚迪', sector: '汽车', price: 91.44, change: -0.91, strategies: ['trend_follow', 'index_enhance'] },
  { code: '688981', name: '中芯国际', sector: '电子', price: 116.82, change: 1.57, strategies: ['multi_factor', 'mean_reversion'] },
  { code: '603259', name: '药明康德', sector: '医药生物', price: 105.95, change: 3.73, strategies: ['mean_reversion', 't_plus_0'] },
  { code: '000725', name: '京东方A', sector: '电子', price: 4.25, change: -0.93, strategies: ['t_plus_0', 'trend_follow'] },
  { code: '002415', name: '海康威视', sector: '计算机', price: 32.60, change: 0.62, strategies: ['multi_factor', 'index_enhance'] },
  { code: '600900', name: '长江电力', sector: '公用事业', price: 26.10, change: -0.65, strategies: ['dividend_low_vol'] },
  { code: '601899', name: '紫金矿业', sector: '有色金属', price: 40.15, change: 1.70, strategies: ['trend_follow', 'multi_factor'] },
  { code: '000568', name: '泸州老窖', sector: '食品饮料', price: 115.96, change: -1.68, strategies: ['dividend_low_vol', 'mean_reversion'] },
  { code: '600276', name: '恒瑞医药', sector: '医药生物', price: 58.68, change: -0.37, strategies: ['multi_factor', 'index_enhance'] },
  { code: '002475', name: '立讯精密', sector: '电子', price: 50.63, change: -0.71, strategies: ['trend_follow', 'multi_factor'] },
  { code: '601012', name: '隆基绿能', sector: '电力设备', price: 18.54, change: -0.27, strategies: ['mean_reversion', 't_plus_0'] },
  { code: '600030', name: '中信证券', sector: '非银金融', price: 27.85, change: -0.68, strategies: ['trend_follow', 'index_enhance'] },
  { code: '002714', name: '牧原股份', sector: '农林牧渔', price: 45.39, change: -1.39, strategies: ['mean_reversion'] },
  { code: '601888', name: '中国中免', sector: '社会服务', price: 94.34, change: -2.74, strategies: ['multi_factor', 'trend_follow'] },
  { code: '000333', name: '美的集团', sector: '家用电器', price: 79.75, change: 0.08, strategies: ['dividend_low_vol', 'index_enhance'] },
  { code: '600309', name: '万华化学', sector: '基础化工', price: 88.53, change: -0.36, strategies: ['trend_follow', 'multi_factor'] },
  { code: '601669', name: '中国电建', sector: '建筑装饰', price: 5.56, change: 1.28, strategies: ['dividend_low_vol'] },
  { code: '002049', name: '紫光国微', sector: '电子', price: 78.32, change: 1.31, strategies: ['trend_follow', 'multi_factor'] },
  { code: '600585', name: '海螺水泥', sector: '建筑材料', price: 25.41, change: 0.20, strategies: ['dividend_low_vol', 'mean_reversion'] },
  { code: '601225', name: '陕西煤业', sector: '煤炭', price: 23.42, change: 0.64, strategies: ['dividend_low_vol'] },
  { code: '002352', name: '顺丰控股', sector: '交通运输', price: 38.20, change: -0.93, strategies: ['index_enhance'] },
  { code: '300059', name: '东方财富', sector: '非银金融', price: 22.69, change: -0.35, strategies: ['trend_follow', 't_plus_0'] },
  { code: '688111', name: '金山办公', sector: '计算机', price: 309.85, change: -0.27, strategies: ['multi_factor', 'trend_follow'] },
  { code: '002371', name: '北方华创', sector: '电子', price: 472.20, change: -0.59, strategies: ['trend_follow', 'multi_factor'] },
];

export const mockOracleEvents: OracleEvent[] = [
  { id: 'o1', time: '14:32:15', datetime: '2026-02-12 14:32:15', lagDays: 0, verifiedDate: '2026-02-12', stockCode: '688981', stockName: '中芯国际', type: 'big_order', description: '主力大单净买入 2.3亿', amount: 23000, impact: 'positive' },
  { id: 'o2', time: '14:28:03', datetime: '2026-02-12 14:28:03', lagDays: 0, verifiedDate: '2026-02-12', stockCode: '002594', stockName: '比亚迪', type: 'volume_spike', description: '成交量突增 380%，突破5日均量', amount: 18500, impact: 'positive' },
  { id: 'o3', time: '14:25:41', datetime: '2026-02-12 14:25:41', lagDays: 0, verifiedDate: '2026-02-12', stockCode: '300750', stockName: '宁德时代', type: 'limit_down_seal', description: '封单减少至 1.2亿，有开板迹象', amount: 12000, impact: 'negative' },
  { id: 'o4', time: '14:20:18', datetime: '2026-02-12 14:20:18', lagDays: 0, verifiedDate: '2026-02-12', stockCode: '600519', stockName: '贵州茅台', type: 'block_trade', description: '大宗交易成交 5.8亿，折价 2.1%', amount: 58000, impact: 'neutral' },
  { id: 'o5', time: '14:15:22', datetime: '2026-02-12 14:15:22', lagDays: 0, verifiedDate: '2026-02-12', stockCode: '000725', stockName: '京东方A', type: 'limit_up_seal', description: '涨停封单 8.5亿，封单比 3.2', amount: 85000, impact: 'positive' },
  { id: 'o6', time: '14:10:05', datetime: '2026-02-12 14:10:05', lagDays: 0, verifiedDate: '2026-02-12', stockCode: '601318', stockName: '中国平安', type: 'big_order', description: '北向资金净买入 1.8亿', amount: 18000, impact: 'positive' },
];

export const mockStrategySignals: StrategySignal[] = [
  { id: 's1', time: '14:30:00', stockCode: '688981', stockName: '中芯国际', strategy: 'multi_factor', signal: 'buy', confidence: 0.85, expectedReturn: 8.2, riskLevel: 'high', factors: ['动量因子突破', '资金流入加速', 'PE分位<30%'] },
  { id: 's2', time: '14:28:00', stockCode: '600519', stockName: '贵州茅台', strategy: 'dividend_low_vol', signal: 'hold', confidence: 0.92, expectedReturn: 3.5, riskLevel: 'low', factors: ['股息率>2.5%', '波动率历史低位', '机构持仓稳定'] },
  { id: 's3', time: '14:25:00', stockCode: '000725', stockName: '京东方A', strategy: 't_plus_0', signal: 'buy', confidence: 0.78, expectedReturn: 1.2, riskLevel: 'medium', factors: ['日内振幅>5%', '量价背离修复', '支撑位确认'] },
  { id: 's4', time: '14:22:00', stockCode: '300750', stockName: '宁德时代', strategy: 'mean_reversion', signal: 'buy', confidence: 0.71, expectedReturn: 12.5, riskLevel: 'high', factors: ['RSI超卖<25', '偏离20日均线-8%', '行业景气度回升'] },
  { id: 's5', time: '14:18:00', stockCode: '002594', stockName: '比亚迪', strategy: 'trend_follow', signal: 'buy', confidence: 0.88, expectedReturn: 6.8, riskLevel: 'medium', factors: ['突破60日新高', 'MACD金叉', '北向资金连续流入'] },
  { id: 's6', time: '14:15:00', stockCode: '600036', stockName: '招商银行', strategy: 'index_enhance', signal: 'hold', confidence: 0.82, expectedReturn: 4.1, riskLevel: 'low', factors: ['中证A500权重股', '超额收益因子正', 'ROE>15%'] },
  { id: 's7', time: '14:12:00', stockCode: '601318', stockName: '中国平安', strategy: 'stat_arb', signal: 'buy', confidence: 0.76, expectedReturn: 2.8, riskLevel: 'medium', factors: ['A/H价差扩大至15%', '协整关系偏离2σ', '均值回归概率82%'] },
  { id: 's8', time: '14:08:00', stockCode: '000725', stockName: '京东方A', strategy: 'hft', signal: 'buy', confidence: 0.68, expectedReturn: 0.8, riskLevel: 'high', factors: ['盘口价差0.03元', '微观结构异常', '高频动量信号'] },
  { id: 's9', time: '14:05:00', stockCode: '002049', stockName: '紫光国微', strategy: 'event_driven', signal: 'buy', confidence: 0.83, expectedReturn: 15.2, riskLevel: 'high', factors: ['业绩预增120%', '机构上调评级', '行业政策利好'] },
  { id: 's10', time: '14:02:00', stockCode: '600030', stockName: '中信证券', strategy: 'stat_arb', signal: 'sell', confidence: 0.72, expectedReturn: -1.5, riskLevel: 'low', factors: ['券商板块内价差收敛', '配对交易平仓信号'] },
  { id: 's11', time: '13:58:00', stockCode: '601899', stockName: '紫金矿业', strategy: 'event_driven', signal: 'buy', confidence: 0.79, expectedReturn: 9.5, riskLevel: 'medium', factors: ['金价突破历史新高', '资源品重估逻辑', '北向资金加仓'] },
  { id: 's12', time: '13:55:00', stockCode: '300059', stockName: '东方财富', strategy: 'hft', signal: 'sell', confidence: 0.65, expectedReturn: -0.5, riskLevel: 'high', factors: ['日内高点回落', '量能衰减', '微观反转信号'] },
];

// 按股票代码动态生成 30日K线 + 夏普比率
// 用 code 做种子，保证同一 code 每次生成一致的数据
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function generateMockKLine(code: string): KLineData[] {
  const stock = mockStocks.find(s => s.code === code);
  const basePrice = stock?.price ?? 78.6;
  const seed = parseInt(code, 10) || 688981;
  const rand = seededRandom(seed);
  const swing = basePrice * 0.08; // 8% 振幅区间

  return Array.from({ length: 30 }, (_, i) => {
    const base = basePrice + Math.sin(i / 5) * swing;
    const volatility = (rand() - 0.5) * swing * 0.5;
    const open = +(base + volatility).toFixed(2);
    const close = +(open + (rand() - 0.45) * swing * 0.4).toFixed(2);
    const high = +(Math.max(open, close) + rand() * swing * 0.2).toFixed(2);
    const low = +(Math.min(open, close) - rand() * swing * 0.2).toFixed(2);
    const d = new Date(2026, 0, 6 + i);
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      open, close, high, low,
      volume: Math.round(800000 + rand() * 600000),
      sharpeRatio: +(0.8 + Math.sin(i / 3) * 0.6 + (rand() - 0.5) * 0.3).toFixed(2),
    };
  });
}

// 默认 K 线 (兼容旧引用)
export const mockKLineData: KLineData[] = generateMockKLine('688981');

export const mockSectorFlows: SectorFlow[] = [
  { sector: '人工智能', netInflow: 42.5, changePercent: 3.82, leadingStock: '科大讯飞' },
  { sector: '半导体', netInflow: 28.3, changePercent: 2.65, leadingStock: '中芯国际' },
  { sector: '新能源汽车', netInflow: 15.8, changePercent: 1.92, leadingStock: '比亚迪' },
  { sector: '白酒', netInflow: -8.2, changePercent: -0.45, leadingStock: '贵州茅台' },
  { sector: '医药', netInflow: -18.6, changePercent: -1.73, leadingStock: '药明康德' },
  { sector: '银行', netInflow: 6.1, changePercent: 0.88, leadingStock: '招商银行' },
];

export const mockQuotes: RealTimeQuote[] = mockStocks.map(s => ({
  code: s.code, name: s.name, price: s.price, change: +(s.price * s.change / 100).toFixed(2),
  changePercent: s.change, volume: Math.round(Math.random() * 5000000),
  amount: Math.round(Math.random() * 500000), high: +(s.price * 1.02).toFixed(2),
  low: +(s.price * 0.98).toFixed(2), open: +(s.price * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2),
  prevClose: +(s.price / (1 + s.change / 100)).toFixed(2),
  turnoverRate: +(Math.random() * 5).toFixed(2), pe: +(10 + Math.random() * 40).toFixed(1),
  pb: +(0.8 + Math.random() * 4).toFixed(2),
}));

// === Scanner 排行榜 ===
const triggerReasons: TriggerReason[] = [
  '突破年线', '机构抢筹', '放量突破', '底部反转',
  '北向扫货', '涨停板', '均线多头', '资金异动',
  'MACD金叉', '超跌反弹', '板块龙头', '缩量企稳',
];

export const mockScannerStocks: ScannerStock[] = mockStocks
  .map((s, i) => ({
    code: s.code,
    name: s.name,
    valueScore: +(40 + Math.abs(s.change) * 8 + Math.random() * 20).toFixed(1),
    triggerReason: triggerReasons[i % triggerReasons.length],
    price: s.price,
    changePercent: s.change,
    sector: s.sector,
    rank: 0,
    prevRank: null,
  }))
  .sort((a, b) => b.valueScore - a.valueScore)
  .map((s, i) => ({ ...s, rank: i + 1 }));

// === 申万一级行业 (31个) ===
export const mockSWSectors: SWSector[] = [
  { name: '电子', netInflow: 38.2, changePercent: 3.45, leadingStock: '中芯国际', stockCount: 428 },
  { name: '计算机', netInflow: 32.5, changePercent: 2.92, leadingStock: '海康威视', stockCount: 312 },
  { name: '汽车', netInflow: 22.8, changePercent: 2.15, leadingStock: '比亚迪', stockCount: 236 },
  { name: '有色金属', netInflow: 18.6, changePercent: 1.88, leadingStock: '紫金矿业', stockCount: 148 },
  { name: '非银金融', netInflow: 15.3, changePercent: 1.62, leadingStock: '中信证券', stockCount: 86 },
  { name: '电力设备', netInflow: 12.1, changePercent: 1.35, leadingStock: '宁德时代', stockCount: 385 },
  { name: '通信', netInflow: 10.8, changePercent: 1.22, leadingStock: '中兴通讯', stockCount: 156 },
  { name: '国防军工', netInflow: 9.5, changePercent: 1.08, leadingStock: '中航沈飞', stockCount: 112 },
  { name: '传媒', netInflow: 8.2, changePercent: 0.95, leadingStock: '芒果超媒', stockCount: 168 },
  { name: '机械设备', netInflow: 6.8, changePercent: 0.78, leadingStock: '三一重工', stockCount: 452 },
  { name: '基础化工', netInflow: 5.5, changePercent: 0.62, leadingStock: '万华化学', stockCount: 398 },
  { name: '家用电器', netInflow: 4.2, changePercent: 0.48, leadingStock: '美的集团', stockCount: 82 },
  { name: '银行', netInflow: 3.8, changePercent: 0.35, leadingStock: '招商银行', stockCount: 42 },
  { name: '煤炭', netInflow: 3.2, changePercent: 0.28, leadingStock: '陕西煤业', stockCount: 38 },
  { name: '公用事业', netInflow: 2.5, changePercent: 0.18, leadingStock: '长江电力', stockCount: 156 },
  { name: '交通运输', netInflow: 1.2, changePercent: 0.08, leadingStock: '顺丰控股', stockCount: 142 },
  { name: '石油石化', netInflow: -0.5, changePercent: -0.12, leadingStock: '中国石油', stockCount: 52 },
  { name: '综合', netInflow: -1.2, changePercent: -0.22, leadingStock: '中国中化', stockCount: 28 },
  { name: '轻工制造', netInflow: -2.5, changePercent: -0.38, leadingStock: '欧派家居', stockCount: 168 },
  { name: '纺织服饰', netInflow: -3.2, changePercent: -0.52, leadingStock: '海澜之家', stockCount: 142 },
  { name: '环保', netInflow: -3.8, changePercent: -0.65, leadingStock: '碧水源', stockCount: 98 },
  { name: '建筑装饰', netInflow: -4.5, changePercent: -0.78, leadingStock: '中国电建', stockCount: 112 },
  { name: '建筑材料', netInflow: -5.2, changePercent: -0.88, leadingStock: '海螺水泥', stockCount: 86 },
  { name: '钢铁', netInflow: -6.8, changePercent: -1.05, leadingStock: '宝钢股份', stockCount: 42 },
  { name: '美容护理', netInflow: -7.5, changePercent: -1.18, leadingStock: '珀莱雅', stockCount: 62 },
  { name: '商贸零售', netInflow: -8.2, changePercent: -1.32, leadingStock: '永辉超市', stockCount: 128 },
  { name: '社会服务', netInflow: -9.5, changePercent: -1.48, leadingStock: '中国中免', stockCount: 92 },
  { name: '农林牧渔', netInflow: -10.8, changePercent: -1.65, leadingStock: '牧原股份', stockCount: 186 },
  { name: '食品饮料', netInflow: -12.5, changePercent: -1.82, leadingStock: '贵州茅台', stockCount: 118 },
  { name: '医药生物', netInflow: -15.2, changePercent: -2.15, leadingStock: '药明康德', stockCount: 468 },
  { name: '房地产', netInflow: -22.8, changePercent: -3.25, leadingStock: '万科A', stockCount: 118 },
];

// === 事件驱动 — 新闻来源 + 机构分析 ===
export const mockEventNews: EventNews[] = [
  {
    id: 'evt_1', time: '14:30', datetime: '2026-02-12 14:30:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '中芯国际Q4营收超预期增长35%',
    summary: '中芯国际发布2025年Q4财报，营收同比增长35%，超市场预期。先进制程产能利用率提升至90%以上。',
    source: '东方财富', sourceUrl: 'https://finance.eastmoney.com/',
    relatedStocks: ['中芯国际', '北方华创'], category: 'earnings',
    impact: 'positive',
    analystViews: [
      { institution: '中信证券', analyst: '徐涛', rating: 'buy', targetPrice: 95.0, summary: '业绩超预期验证国产替代逻辑，上调目标价至95元', datetime: '2026-02-12', lagDays: 0 },
      { institution: '国泰君安', analyst: '王聪', rating: 'overweight', summary: '先进制程突破带来估值重塑，维持增持评级', datetime: '2026-02-11', lagDays: 1 },
    ],
  },
  {
    id: 'evt_2', time: '13:45', datetime: '2026-02-12 13:45:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '国务院发布新能源汽车产业支持政策',
    summary: '国务院常务会议审议通过新能源汽车产业高质量发展若干措施，包括延长购置税减免、加快充电基础设施建设。',
    source: '新华社', sourceUrl: 'https://www.xinhuanet.com/',
    relatedStocks: ['比亚迪', '宁德时代'], category: 'policy',
    impact: 'positive',
    analystViews: [
      { institution: '华泰证券', analyst: '申建国', rating: 'buy', summary: '政策超预期利好，新能源车渗透率有望加速提升至50%', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
  {
    id: 'evt_3', time: '11:20', datetime: '2026-02-12 11:20:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '紫金矿业拟收购海外铜矿资产',
    summary: '紫金矿业公告拟以28亿美元收购刚果(金)某大型铜钴矿项目80%股权，预计年增铜产量15万吨。',
    source: '证券时报', sourceUrl: 'https://www.stcn.com/',
    relatedStocks: ['紫金矿业'], category: 'merger',
    impact: 'positive',
    analystViews: [
      { institution: '招商证券', analyst: '刘文平', rating: 'buy', targetPrice: 22.0, summary: '收购标的资源禀赋优异，将显著增厚公司铜矿储量和产量', datetime: '2026-02-12', lagDays: 0 },
      { institution: '中金公司', analyst: '齐丁', rating: 'overweight', summary: '全球化布局再下一城，资源龙头地位进一步巩固', datetime: '2026-02-11', lagDays: 1 },
    ],
  },
  {
    id: 'evt_4', time: '10:15', datetime: '2026-02-12 10:15:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '央行下调MLF利率10个基点',
    summary: '中国人民银行开展5000亿元MLF操作，中标利率2.40%，较上期下降10个基点，释放宽松信号。',
    source: '中国人民银行', sourceUrl: 'http://www.pbc.gov.cn/',
    relatedStocks: ['平安银行', '招商银行'], category: 'macro',
    impact: 'positive',
    analystViews: [
      { institution: '中信建投', analyst: '黄文涛', rating: 'hold', summary: '降息符合预期，银行净息差短期承压但信贷需求有望回暖', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
  {
    id: 'evt_5', time: '09:30', datetime: '2026-02-12 09:30:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '半导体行业景气度持续回升',
    summary: 'SEMI最新报告显示全球半导体设备销售额连续三个季度环比增长，中国大陆市场增速领先。',
    source: '财联社', sourceUrl: 'https://www.cls.cn/',
    relatedStocks: ['北方华创', '中芯国际', '立讯精密'], category: 'industry',
    impact: 'positive',
    analystViews: [
      { institution: '海通证券', analyst: '陈平', rating: 'buy', summary: '半导体周期拐点确认，设备和材料环节弹性最大', datetime: '2026-02-10', lagDays: 2 },
    ],
  },
];

// === 策略洞察 — 趋势跟踪 ===
export const mockTrendInsights: StrategyInsight[] = [
  {
    id: 'ti_1', time: '14:20', datetime: '2026-02-12 14:20:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '比亚迪突破60日新高，MACD周线金叉确认',
    summary: '比亚迪股价放量突破前期平台高点285元，周线MACD金叉形成，北向资金连续5日净买入超12亿。技术面多头排列完整。',
    source: '同花顺iFinD', sourceUrl: 'https://www.10jqka.com.cn/',
    relatedStocks: ['比亚迪'], insightType: 'trend_follow', signal: 'bullish',
    keyMetrics: { '突破位': '285.00', 'MACD': '周线金叉', '北向净买入': '12.3亿/5日' },
    analystViews: [
      { institution: '中信证券', analyst: '尹欣驰', rating: 'buy', targetPrice: 350.0, summary: '智驾+出海双轮驱动，上调目标价至350元', datetime: '2026-02-12', lagDays: 0 },
      { institution: '华泰证券', analyst: '林志轩', rating: 'overweight', summary: '技术突破确认上升趋势，量价配合良好', datetime: '2026-02-11', lagDays: 1 },
    ],
  },
  {
    id: 'ti_2', time: '13:50', datetime: '2026-02-12 13:50:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '紫金矿业沿20日均线稳步上行，趋势延续',
    summary: '紫金矿业股价沿20日均线稳步攀升，均线系统多头排列。伦敦金价突破2800美元/盎司，资源股趋势行情延续。',
    source: '东方财富Choice', sourceUrl: 'https://choice.eastmoney.com/',
    relatedStocks: ['紫金矿业'], insightType: 'trend_follow', signal: 'bullish',
    keyMetrics: { '均线': '5/10/20/60多头', '金价': '$2,812', '趋势强度': '82/100' },
    analystViews: [
      { institution: '国泰君安', analyst: '李鑫', rating: 'buy', targetPrice: 22.0, summary: '金价上行周期中，资源龙头估值仍有空间', datetime: '2026-02-11', lagDays: 1 },
    ],
  },
  {
    id: 'ti_3', time: '11:30', datetime: '2026-02-12 11:30:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '创业板指跌破60日均线，短期趋势转弱',
    summary: '创业板指数跌破60日均线支撑，成交量萎缩至近20日低点。短期趋势信号转为看空，建议趋势策略减仓观望。',
    source: 'Wind万得', sourceUrl: 'https://www.wind.com.cn/',
    relatedStocks: ['宁德时代', '东方财富'], insightType: 'trend_follow', signal: 'bearish',
    keyMetrics: { '创业板指': '跌破60日线', '成交额': '缩量30%', 'ADX': '18(弱趋势)' },
    analystViews: [
      { institution: '招商证券', analyst: '张夏', rating: 'hold', summary: '短期调整压力增大，建议等待企稳信号再介入', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
];

// === 策略洞察 — 均值回归 ===
export const mockMeanRevInsights: StrategyInsight[] = [
  {
    id: 'mr_1', time: '14:10', datetime: '2026-02-12 14:10:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '宁德时代RSI跌至22，偏离20日均线-8.5%',
    summary: '宁德时代连续调整后RSI降至22超卖区域，股价偏离20日均线达-8.5%。历史回测显示类似偏离后20日内回归概率78%。',
    source: '同花顺iFinD', sourceUrl: 'https://www.10jqka.com.cn/',
    relatedStocks: ['宁德时代'], insightType: 'mean_reversion', signal: 'bullish',
    keyMetrics: { 'RSI(14)': '22', '偏离20日线': '-8.5%', '回归概率': '78%' },
    analystViews: [
      { institution: '天风证券', analyst: '孙潇雅', rating: 'buy', targetPrice: 260.0, summary: '短期超跌提供布局机会，储能需求支撑长期逻辑', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
  {
    id: 'mr_2', time: '13:20', datetime: '2026-02-12 13:20:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '贵州茅台PE分位降至近3年15%，股息率2.8%',
    summary: '贵州茅台当前PE 25倍，处于近3年15%分位。股息率升至2.8%，为近5年最高。价值回归信号明显。',
    source: '东方财富Choice', sourceUrl: 'https://choice.eastmoney.com/',
    relatedStocks: ['贵州茅台', '泸州老窖'], insightType: 'mean_reversion', signal: 'bullish',
    keyMetrics: { 'PE分位': '15%(3年)', '股息率': '2.8%', '布林带': '下轨附近' },
    analystViews: [
      { institution: '中金公司', analyst: '邢庭志', rating: 'buy', targetPrice: 1950.0, summary: '估值已充分反映悲观预期，当前价位具备安全边际', datetime: '2026-02-11', lagDays: 1 },
      { institution: '广发证券', analyst: '王永锋', rating: 'overweight', summary: '白酒龙头估值修复空间大，维持增持', datetime: '2026-02-10', lagDays: 2 },
    ],
  },
  {
    id: 'mr_3', time: '10:45', datetime: '2026-02-12 10:45:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '药明康德布林带收窄至历史极值，变盘在即',
    summary: '药明康德布林带宽度收窄至近2年最低，股价在中轨附近窄幅震荡。历史统计显示布林带极度收窄后30日内波动率放大概率85%。',
    source: 'Wind万得', sourceUrl: 'https://www.wind.com.cn/',
    relatedStocks: ['药明康德'], insightType: 'mean_reversion', signal: 'neutral',
    keyMetrics: { '布林带宽': '历史5%分位', '波动率': '年化18%', '变盘概率': '85%' },
    analystViews: [
      { institution: '海通证券', analyst: '余文心', rating: 'hold', summary: '等待方向选择，布林带突破后跟随操作', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
];

// === 策略洞察 — 统计套利 ===
export const mockStatArbInsights: StrategyInsight[] = [
  {
    id: 'sa_1', time: '14:05', datetime: '2026-02-12 14:05:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '中国平安A/H价差扩大至15.2%，偏离2.1σ',
    summary: '中国平安A股相对H股溢价扩大至15.2%，超过历史均值+2.1个标准差。协整检验显示配对关系稳定，均值回归概率82%。',
    source: '东方财富Choice', sourceUrl: 'https://choice.eastmoney.com/',
    relatedStocks: ['中国平安'], insightType: 'stat_arb', signal: 'bearish',
    keyMetrics: { 'A/H溢价': '15.2%', '偏离σ': '2.1', '协整p值': '0.003' },
    analystViews: [
      { institution: '中信证券', analyst: '邵子钦', rating: 'hold', summary: 'A/H价差处于历史高位，建议关注港股配置机会', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
  {
    id: 'sa_2', time: '13:30', datetime: '2026-02-12 13:30:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '中信证券vs海通证券价差偏离，配对交易机会',
    summary: '中信证券/海通证券价格比值升至1.85，偏离60日均值1.72达1.8σ。券商板块内配对交易信号触发：做空中信、做多海通。',
    source: '同花顺iFinD', sourceUrl: 'https://www.10jqka.com.cn/',
    relatedStocks: ['中信证券'], insightType: 'stat_arb', signal: 'bearish',
    keyMetrics: { '价格比': '1.85 vs 均值1.72', '偏离σ': '1.8', '半衰期': '8.5天' },
    analystViews: [
      { institution: '国泰君安', analyst: '刘欣琦', rating: 'hold', summary: '券商板块分化加剧，头部券商估值溢价有收敛趋势', datetime: '2026-02-11', lagDays: 1 },
    ],
  },
  {
    id: 'sa_3', time: '11:00', datetime: '2026-02-12 11:00:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '沪深300期现基差走阔至-0.8%，期现套利窗口',
    summary: '沪深300股指期货当月合约贴水扩大至-0.8%，年化收益约9.6%。基差偏离历史均值1.5σ，期现套利窗口打开。',
    source: 'Wind万得', sourceUrl: 'https://www.wind.com.cn/',
    relatedStocks: [], insightType: 'stat_arb', signal: 'bullish',
    keyMetrics: { '基差': '-0.8%', '年化收益': '9.6%', '偏离σ': '1.5' },
    analystViews: [
      { institution: '华泰证券', analyst: '林晓明', rating: 'buy', summary: '贴水幅度提供较好的期现套利安全垫，建议把握窗口期', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
];

export const mockHftInsights: StrategyInsight[] = [
  {
    id: 'hft_1', time: '14:22', datetime: '2026-02-12 14:22:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '中芯国际盘口买卖价差收窄至0.01%，流动性异常充裕',
    summary: 'Level-2数据显示买一卖一价差持续收窄至0.01%，挂单深度较昨日增加230%，大单频率提升。高频做市策略可捕获微小价差。',
    source: 'Level-2行情', sourceUrl: 'https://www.sse.com.cn/',
    relatedStocks: ['中芯国际'], insightType: 'hft', signal: 'bullish',
    keyMetrics: { '买卖价差': '0.01%', '挂单深度': '+230%', '大单频率': '12笔/分' },
    analystViews: [
      { institution: '中金公司', analyst: '黄乐平', rating: 'buy', summary: '半导体设备国产化加速，产能利用率回升', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
  {
    id: 'hft_2', time: '13:45', datetime: '2026-02-12 13:45:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '宁德时代订单簿不平衡度达0.73，短期看涨信号',
    summary: '买方挂单量/卖方挂单量比值达0.73（阈值0.65），订单流不平衡持续15分钟以上。历史回测显示该信号5分钟胜率68%。',
    source: '同花顺Level-2', sourceUrl: 'https://www.10jqka.com.cn/',
    relatedStocks: ['宁德时代'], insightType: 'hft', signal: 'bullish',
    keyMetrics: { '订单不平衡': '0.73', '持续时间': '15min', '5min胜率': '68%' },
    analystViews: [
      { institution: '高盛', analyst: 'Tina Hou', rating: 'buy', targetPrice: 420, summary: '全球储能需求超预期，上调目标价至420元', datetime: '2026-02-11', lagDays: 1 },
    ],
  },
  {
    id: 'hft_3', time: '10:15', datetime: '2026-02-12 10:15:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '贵州茅台逐笔成交检测到冰山订单，隐含大买单',
    summary: '逐笔成交分析显示在1480-1485区间出现典型冰山订单模式：连续小单买入，总量已达2.3亿元。机构隐蔽建仓概率高。',
    source: 'Wind万得', sourceUrl: 'https://www.wind.com.cn/',
    relatedStocks: ['贵州茅台'], insightType: 'hft', signal: 'bullish',
    keyMetrics: { '冰山单量': '2.3亿', '价格区间': '1480-1485', '置信度': '87%' },
    analystViews: [
      { institution: '瑞银', analyst: 'Luo Ji', rating: 'buy', targetPrice: 1650, summary: '春节旺季动销良好，维持买入评级', datetime: '2026-02-10', lagDays: 2 },
    ],
  },
];

export const mockMultiFactorInsights: StrategyInsight[] = [
  {
    id: 'mf_1', time: '14:30', datetime: '2026-02-12 14:30:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '比亚迪多因子综合评分92.3，位列全市场Top 5',
    summary: '动量因子(+8.2%)、质量因子(ROE 21.3%)、估值因子(PE 25x vs行业35x)、成长因子(营收+38%)四维共振，综合评分92.3/100。',
    source: '东方财富Choice', sourceUrl: 'https://choice.eastmoney.com/',
    relatedStocks: ['比亚迪'], insightType: 'multi_factor', signal: 'bullish',
    keyMetrics: { '综合评分': '92.3', '动量': '+8.2%', 'ROE': '21.3%', 'PE': '25x' },
    analystViews: [
      { institution: '摩根士丹利', analyst: 'Tim Hsiao', rating: 'overweight', targetPrice: 105, summary: '海外市场拓展超预期，上调至增持', datetime: '2026-02-12', lagDays: 0 },
    ],
  },
  {
    id: 'mf_2', time: '11:20', datetime: '2026-02-12 11:20:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '招商银行价值因子突出，低波动+高股息组合首选',
    summary: '股息率5.8%位列银行板块前三，波动率12.3%为同业最低。Barra风险模型显示低波动+高股息因子暴露度最优。',
    source: 'Wind万得', sourceUrl: 'https://www.wind.com.cn/',
    relatedStocks: ['招商银行'], insightType: 'multi_factor', signal: 'bullish',
    keyMetrics: { '股息率': '5.8%', '波动率': '12.3%', 'PB': '0.92x', '因子暴露': '2.1σ' },
    analystViews: [
      { institution: '中信证券', analyst: '肖斐斐', rating: 'buy', targetPrice: 42, summary: '零售银行龙头，资产质量持续改善', datetime: '2026-02-11', lagDays: 1 },
    ],
  },
  {
    id: 'mf_3', time: '09:45', datetime: '2026-02-12 09:45:00', lagDays: 0, verifiedDate: '2026-02-12',
    title: '药明康德反转因子触发，超跌后多因子模型看多',
    summary: '近20日跌幅-12.8%触发反转因子，同时盈利预期上修(EPS+15%)、机构持仓增加(+3.2%)。多因子模型综合信号转多。',
    source: '同花顺iFinD', sourceUrl: 'https://www.10jqka.com.cn/',
    relatedStocks: ['药明康德'], insightType: 'multi_factor', signal: 'bullish',
    keyMetrics: { '反转因子': '-12.8%', 'EPS上修': '+15%', '机构增持': '+3.2%', '综合评分': '78.5' },
    analystViews: [
      { institution: '花旗', analyst: 'Yao Lu', rating: 'buy', targetPrice: 68, summary: 'CXO行业拐点临近，订单回暖趋势明确', datetime: '2026-02-10', lagDays: 2 },
    ],
  },
];

// === 实时行情 (多源验证) ===
export function generateMockPriceTicks(): PriceTick[] {
  return mockStocks.slice(0, 15).map(s => {
    const rand = seededRandom(parseInt(s.code, 10) || 1);
    const divergence = rand() > 0.85 ? '东财/新浪价格偏差 0.02%' : undefined;
    return {
      code: s.code, name: s.name, price: s.price,
      change: +(s.price * s.change / 100).toFixed(2),
      changePercent: s.change,
      volume: Math.round(800000 + rand() * 5000000),
      amount: Math.round(s.price * 800000 + rand() * 50000000),
      high: +(s.price * 1.02).toFixed(2),
      low: +(s.price * 0.98).toFixed(2),
      open: +(s.price * (1 + (rand() - 0.5) * 0.01)).toFixed(2),
      prevClose: +(s.price / (1 + s.change / 100)).toFixed(2),
      sources: divergence ? ['akshare', 'eastmoney', 'sina'] : ['akshare', 'eastmoney'],
      divergence,
      timestamp: Date.now(),
    };
  });
}

// === 交易所资金流 ===
export function generateMockFundFlow(): MarketFundFlowSummary {
  const flows: ExchangeFundFlow[] = mockStocks.slice(0, 20).map(s => {
    const rand = seededRandom(parseInt(s.code, 10) + 100);
    const total = 50000 + rand() * 200000;
    const superLarge = (rand() - 0.4) * total * 0.3;
    const large = (rand() - 0.45) * total * 0.25;
    const medium = (rand() - 0.5) * total * 0.25;
    const small = -superLarge - large - medium + (rand() - 0.5) * total * 0.1;
    const main = superLarge + large;
    return {
      code: s.code, name: s.name, mainNetInflow: +main.toFixed(0),
      superLargeInflow: +superLarge.toFixed(0), superLargePercent: +(superLarge / total * 100).toFixed(1),
      largeInflow: +large.toFixed(0), largePercent: +(large / total * 100).toFixed(1),
      mediumInflow: +medium.toFixed(0), mediumPercent: +(medium / total * 100).toFixed(1),
      smallInflow: +small.toFixed(0), smallPercent: +(small / total * 100).toFixed(1),
      totalAmount: +total.toFixed(0), timestamp: '2026-02-12 14:30:00',
    };
  });
  const sorted = [...flows].sort((a, b) => b.mainNetInflow - a.mainNetInflow);
  return {
    totalMainInflow: +flows.reduce((s, f) => s + f.mainNetInflow, 0).toFixed(0),
    totalSuperLarge: +flows.reduce((s, f) => s + f.superLargeInflow, 0).toFixed(0),
    totalLarge: +flows.reduce((s, f) => s + f.largeInflow, 0).toFixed(0),
    totalMedium: +flows.reduce((s, f) => s + f.mediumInflow, 0).toFixed(0),
    totalSmall: +flows.reduce((s, f) => s + f.smallInflow, 0).toFixed(0),
    topInflows: sorted.slice(0, 5),
    topOutflows: sorted.slice(-5).reverse(),
    timestamp: '2026-02-12 14:30:00',
  };
}

// === K线+资金流叠加 ===
export function generateMockKLineWithFlow(code: string): KLineWithFlow[] {
  const kline = generateMockKLine(code);
  const rand = seededRandom(parseInt(code, 10) + 200);
  return kline.map(k => ({
    ...k,
    mainInflow: +((rand() - 0.45) * 50000).toFixed(0),
    retailInflow: +((rand() - 0.55) * 30000).toFixed(0),
  }));
}

// === 大资金建仓减仓预警 ===
export function generateMockCapitalAlerts(): CapitalAlert[] {
  const types: CapitalAlert['alertType'][] = ['building', 'reducing', 'sudden_inflow', 'sudden_outflow'];
  const severities: CapitalAlert['severity'][] = ['critical', 'warning', 'info'];
  return mockStocks.slice(0, 8).map((s, i) => {
    const t = types[i % 4];
    const sev = severities[i % 3];
    const descs: Record<string, string> = {
      building: `主力连续${3 + i}日净买入，累计${(1.5 + i * 0.8).toFixed(1)}亿`,
      reducing: `主力连续${2 + i}日净卖出，累计${(0.8 + i * 0.5).toFixed(1)}亿`,
      sudden_inflow: `15分钟内主力净流入${(0.5 + i * 0.3).toFixed(1)}亿，超过日均3倍`,
      sudden_outflow: `30分钟内主力净流出${(0.6 + i * 0.2).toFixed(1)}亿，异常放量`,
    };
    return {
      id: `ca_${i}`, time: `14:${30 - i * 3}:00`,
      datetime: `2026-02-12 14:${30 - i * 3}:00`,
      code: s.code, name: s.name, alertType: t,
      description: descs[t], amount: +(15000 + i * 8000),
      daysAccumulated: t === 'building' || t === 'reducing' ? 3 + i : 0,
      confidence: +(0.7 + Math.random() * 0.25).toFixed(2) as number,
      severity: sev,
      relatedMetrics: { '换手率': `${(2 + i * 0.5).toFixed(1)}%`, '量比': `${(1.5 + i * 0.3).toFixed(1)}` },
    };
  });
}

// === 多周期趋势预测 ===
function makeTrend(s: StockInfo, period: TrendPeriod, seed: number): TrendPrediction {
  const rand = seededRandom(seed);
  const dirs: TrendPrediction['direction'][] = ['up', 'down', 'sideways'];
  const dir = dirs[Math.floor(rand() * 3)];
  const conf = +(0.5 + rand() * 0.45).toFixed(2);
  const factors = ['MACD金叉', '量价背离', '均线多头', 'RSI超卖', '布林突破', '资金流入'];
  const picked = factors.filter(() => rand() > 0.5).slice(0, 3);
  if (picked.length === 0) picked.push('技术面中性');
  return {
    code: s.code, name: s.name, period, direction: dir,
    confidence: conf, currentPrice: s.price,
    targetPrice: +(s.price * (dir === 'up' ? 1.08 : dir === 'down' ? 0.93 : 1.01)).toFixed(2),
    supportLevel: +(s.price * 0.95).toFixed(2),
    resistanceLevel: +(s.price * 1.06).toFixed(2),
    keyFactors: picked, updatedAt: '2026-02-12 15:00:00',
  };
}

export function generateMockMultiPeriodTrend(code: string): MultiPeriodTrend {
  const s = mockStocks.find(x => x.code === code) || mockStocks[0];
  const base = parseInt(s.code, 10) || 1;
  const daily = makeTrend(s, 'daily', base + 300);
  const weekly = makeTrend(s, 'weekly', base + 400);
  const monthly = makeTrend(s, 'monthly', base + 500);
  const ups = [daily, weekly, monthly].filter(t => t.direction === 'up').length;
  return {
    code: s.code, name: s.name, daily, weekly, monthly,
    consensus: ups >= 2 ? 'bullish' : ups === 0 ? 'bearish' : 'mixed',
  };
}

// === Oracle 历史验证 ===
export function generateMockOracleAccuracy(): OracleAccuracyStats {
  const events = mockOracleEvents.slice(0, 6);
  const verifications: OracleVerification[] = events.map((e, i) => {
    const rand = seededRandom(i + 600);
    const priceAtEvent = 50 + rand() * 100;
    const actualChange = (rand() - 0.4) * 15;
    const isCorrect = (e.impact === 'positive' && actualChange > 0) ||
      (e.impact === 'negative' && actualChange < 0) || (e.impact === 'neutral' && Math.abs(actualChange) < 3);
    return {
      id: `ov_${i}`, originalEvent: {
        id: e.id, datetime: e.datetime, stockCode: e.stockCode || '000001',
        stockName: e.stockName || '平安银行', type: e.type,
        description: e.description, impact: e.impact,
      },
      verificationDate: '2026-02-12', priceAtEvent: +priceAtEvent.toFixed(2),
      priceAtVerification: +(priceAtEvent * (1 + actualChange / 100)).toFixed(2),
      actualChange: +actualChange.toFixed(2),
      predictedImpact: e.impact,
      actualImpact: actualChange > 3 ? 'positive' : actualChange < -3 ? 'negative' : 'neutral',
      isCorrect, accuracy: isCorrect ? 1 : 0,
      notes: isCorrect ? '预测方向正确' : '预测方向偏差',
    };
  });
  const correct = verifications.filter(v => v.isCorrect).length;
  const byType: OracleAccuracyStats['byType'] = {};
  verifications.forEach(v => {
    const t = v.originalEvent.type;
    if (!byType[t]) byType[t] = { total: 0, correct: 0, accuracy: 0 };
    byType[t].total++;
    if (v.isCorrect) byType[t].correct++;
    byType[t].accuracy = +(byType[t].correct / byType[t].total).toFixed(2);
  });
  return {
    totalPredictions: verifications.length, correctPredictions: correct,
    overallAccuracy: +(correct / verifications.length).toFixed(2),
    byType, recentVerifications: verifications,
  };
}

// === 增强持仓卡片 ===
export function generateMockPortfolio(): PortfolioSummary {
  const positions: EnhancedPosition[] = mockStocks.slice(0, 5).map((s, i) => {
    const rand = seededRandom(parseInt(s.code, 10) + 700);
    const volume = (i + 1) * 200;
    const avgCost = +(s.price * (1 + (rand() - 0.5) * 0.1)).toFixed(2);
    const marketValue = +(s.price * volume).toFixed(2);
    const totalCost = +(avgCost * volume).toFixed(2);
    const profit = +(marketValue - totalCost).toFixed(2);
    const todayChange = s.change / 100;
    const recentPrices: number[] = [];
    let p = s.price * 0.95;
    for (let j = 0; j < 7; j++) { p += (rand() - 0.45) * s.price * 0.02; recentPrices.push(+p.toFixed(2)); }
    const sectors = ['半导体', '新能源', '医药', '消费', '金融'];
    const risks: EnhancedPosition['riskLevel'][] = ['low', 'medium', 'high', 'low', 'medium'];
    return {
      stockCode: s.code, stockName: s.name, volume, availableVolume: volume,
      avgCost, currentPrice: s.price, marketValue, totalCost, profit,
      profitRatio: +((profit / totalCost) * 100).toFixed(2),
      todayProfit: +(marketValue * todayChange).toFixed(2),
      todayProfitRatio: +(todayChange * 100).toFixed(2),
      allocationPercent: 0, holdingDays: Math.floor(5 + rand() * 60),
      sector: sectors[i], riskLevel: risks[i], recentPrices,
    };
  });
  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  positions.forEach(p => { p.allocationPercent = +((p.marketValue / totalValue) * 100).toFixed(1); });
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
  const totalProfit = totalValue - totalCost;
  const todayProfit = positions.reduce((s, p) => s + p.todayProfit, 0);
  return {
    totalValue: +totalValue.toFixed(2), totalCost: +totalCost.toFixed(2),
    totalProfit: +totalProfit.toFixed(2), totalProfitRatio: +((totalProfit / totalCost) * 100).toFixed(2),
    todayProfit: +todayProfit.toFixed(2), todayProfitRatio: +((todayProfit / totalValue) * 100).toFixed(2),
    positions,
  };
}

// === 实时预警面板 ===
export function generateMockTradingAlerts(): TradingAlert[] {
  const alerts: TradingAlert[] = [
    { id: 'ta_1', time: '14:28', datetime: '2026-02-12 14:28:00', severity: 'critical', category: 'price',
      title: '贵州茅台触及涨停价', description: '当前价格1849.00，距涨停仅0.3%，成交量放大至日均3.2倍',
      stockCode: '600519', stockName: '贵州茅台', actionRequired: true, acknowledged: false },
    { id: 'ta_2', time: '14:15', datetime: '2026-02-12 14:15:00', severity: 'critical', category: 'fund_flow',
      title: '宁德时代主力资金异常流出', description: '30分钟内主力净流出2.3亿，超过近20日均值5倍',
      stockCode: '300750', stockName: '宁德时代', actionRequired: true, acknowledged: false },
    { id: 'ta_3', time: '14:05', datetime: '2026-02-12 14:05:00', severity: 'warning', category: 'strategy',
      title: '比亚迪MACD死叉信号', description: '日线MACD出现死叉，DIF下穿DEA，建议关注支撑位',
      stockCode: '002594', stockName: '比亚迪', actionRequired: false, acknowledged: false },
    { id: 'ta_4', time: '13:50', datetime: '2026-02-12 13:50:00', severity: 'warning', category: 'volume',
      title: '中芯国际成交量异常', description: '当前成交量已达昨日全天的180%，换手率8.5%',
      stockCode: '688981', stockName: '中芯国际', actionRequired: false, acknowledged: false },
    { id: 'ta_5', time: '13:30', datetime: '2026-02-12 13:30:00', severity: 'info', category: 'risk',
      title: '持仓集中度预警', description: '贵州茅台仓位占比35%，超过单只股票30%上限',
      stockCode: '600519', stockName: '贵州茅台', actionRequired: true, acknowledged: false },
    { id: 'ta_6', time: '11:20', datetime: '2026-02-12 11:20:00', severity: 'info', category: 'system',
      title: '数据源切换通知', description: '东方财富API响应超时，已自动切换至AKShare备用源',
      actionRequired: false, acknowledged: true },
  ];
  return alerts;
}

export function generateMockHuijinMonitor(): HuijinMonitorData {
  return {
    holdings: [
      { code: '601398', name: '工商银行', category: 'bank', holdPercent: 34.71, price: 6.28, changePercent: 0.48, volume: 285000000, amount: 1789800000, mainNetInflow: 32000000, superLargeInflow: 18000000, largeInflow: 14000000 },
      { code: '601939', name: '建设银行', category: 'bank', holdPercent: 57.11, price: 8.15, changePercent: 0.62, volume: 198000000, amount: 1613700000, mainNetInflow: 45000000, superLargeInflow: 28000000, largeInflow: 17000000 },
      { code: '601988', name: '中国银行', category: 'bank', holdPercent: 64.02, price: 4.92, changePercent: 0.20, volume: 320000000, amount: 1574400000, mainNetInflow: 18000000, superLargeInflow: 12000000, largeInflow: 6000000 },
      { code: '601288', name: '农业银行', category: 'bank', holdPercent: 40.03, price: 4.56, changePercent: -0.22, volume: 245000000, amount: 1117200000, mainNetInflow: -8000000, superLargeInflow: -3000000, largeInflow: -5000000 },
      { code: '601318', name: '中国平安', category: 'insurance', holdPercent: 0, price: 66.80, changePercent: -1.04, volume: 42000000, amount: 2805600000, mainNetInflow: -15000000, superLargeInflow: -8000000, largeInflow: -7000000 },
      { code: '601628', name: '中国人寿', category: 'insurance', holdPercent: 0, price: 42.50, changePercent: 0.95, volume: 35000000, amount: 1487500000, mainNetInflow: 12000000, superLargeInflow: 8000000, largeInflow: 4000000 },
      { code: '600030', name: '中信证券', category: 'securities', holdPercent: 0, price: 25.30, changePercent: 1.20, volume: 68000000, amount: 1720400000, mainNetInflow: 22000000, superLargeInflow: 15000000, largeInflow: 7000000 },
      { code: '601688', name: '华泰证券', category: 'securities', holdPercent: 0, price: 18.90, changePercent: 0.53, volume: 45000000, amount: 850500000, mainNetInflow: 5000000, superLargeInflow: 3000000, largeInflow: 2000000 },
    ],
    etfs: [
      { code: '510050', name: '上证50ETF', price: 3.125, changePercent: 0.35, volume: 580000000, amount: 1812500000 },
      { code: '510300', name: '沪深300ETF', price: 4.082, changePercent: 0.42, volume: 420000000, amount: 1714440000 },
      { code: '159919', name: '沪深300ETF(深)', price: 4.078, changePercent: 0.39, volume: 310000000, amount: 1264180000 },
      { code: '510500', name: '中证500ETF', price: 6.215, changePercent: -0.18, volume: 180000000, amount: 1118700000 },
      { code: '159922', name: '中证500ETF(深)', price: 6.208, changePercent: -0.21, volume: 95000000, amount: 589760000 },
    ],
    summary: { totalMainInflow: 111000000, bankMainInflow: 87000000, avgChangePercent: 0.34, signalCount: 2 },
    signals: [
      { type: 'inflow', severity: 'critical', message: '四大行主力净流入0.87亿，疑似汇金护盘' },
      { type: 'inflow', severity: 'info', message: '建设银行主力净流入4500万' },
    ],
    timestamp: '2026-02-13 14:30:00',
  };
}

export function generateMockSSFMonitor(): SSFMonitorData {
  return {
    holdings: [
      { code: '600276', name: '恒瑞医药', category: 'pharma', price: 42.50, changePercent: 1.20, volume: 38000000, amount: 1615000000, mainNetInflow: 25000000, superLargeInflow: 15000000, largeInflow: 10000000 },
      { code: '000538', name: '云南白药', category: 'pharma', price: 58.30, changePercent: -0.34, volume: 12000000, amount: 699600000, mainNetInflow: -5000000, superLargeInflow: -2000000, largeInflow: -3000000 },
      { code: '300760', name: '迈瑞医疗', category: 'pharma', price: 285.00, changePercent: 0.88, volume: 5000000, amount: 1425000000, mainNetInflow: 18000000, superLargeInflow: 12000000, largeInflow: 6000000 },
      { code: '002415', name: '海康威视', category: 'tech', price: 32.80, changePercent: 2.18, volume: 65000000, amount: 2132000000, mainNetInflow: 42000000, superLargeInflow: 28000000, largeInflow: 14000000 },
      { code: '000858', name: '五粮液', category: 'consumer', price: 148.50, changePercent: -0.67, volume: 18000000, amount: 2673000000, mainNetInflow: -12000000, superLargeInflow: -8000000, largeInflow: -4000000 },
      { code: '000333', name: '美的集团', category: 'consumer', price: 68.20, changePercent: 0.44, volume: 28000000, amount: 1909600000, mainNetInflow: 8000000, superLargeInflow: 5000000, largeInflow: 3000000 },
      { code: '601166', name: '兴业银行', category: 'finance', price: 22.80, changePercent: 0.88, volume: 42000000, amount: 957600000, mainNetInflow: 15000000, superLargeInflow: 10000000, largeInflow: 5000000 },
      { code: '600036', name: '招商银行', category: 'finance', price: 38.50, changePercent: 0.52, volume: 35000000, amount: 1347500000, mainNetInflow: 20000000, superLargeInflow: 13000000, largeInflow: 7000000 },
      { code: '300750', name: '宁德时代', category: 'energy', price: 218.00, changePercent: 1.86, volume: 22000000, amount: 4796000000, mainNetInflow: 55000000, superLargeInflow: 35000000, largeInflow: 20000000 },
    ],
    sectorSummary: [
      { category: 'energy', label: '新能源', totalInflow: 55000000, avgChange: 1.86, stockCount: 2 },
      { category: 'tech', label: '科技', totalInflow: 42000000, avgChange: 2.18, stockCount: 2 },
      { category: 'pharma', label: '医药', totalInflow: 38000000, avgChange: 0.58, stockCount: 3 },
      { category: 'finance', label: '金融', totalInflow: 35000000, avgChange: 0.70, stockCount: 3 },
      { category: 'consumer', label: '消费', totalInflow: -4000000, avgChange: -0.12, stockCount: 3 },
    ],
    summary: { totalMainInflow: 166000000, avgChangePercent: 0.77, signalCount: 3, holdingCount: 9 },
    signals: [
      { type: 'inflow', severity: 'warning', message: '新能源板块主力净流入5500万' },
      { type: 'inflow', severity: 'info', message: '宁德时代主力净流入5500万' },
      { type: 'inflow', severity: 'info', message: '海康威视主力净流入4200万' },
    ],
    timestamp: '2026-02-13 14:30:00',
  };
}

export function generateMockBrokerMonitor(): BrokerMonitorData {
  const flows = [
    { date: '2026-02-07', main: 12000000 },
    { date: '2026-02-10', main: 18000000 },
    { date: '2026-02-11', main: 15000000 },
    { date: '2026-02-12', main: 22000000 },
    { date: '2026-02-13', main: 28000000 },
  ];
  return {
    brokers: [
      { code: '600030', name: '中信证券', price: 25.30, changePercent: 1.20, volume: 68000000, amount: 1720400000, todayMainInflow: 28000000, todaySuperLarge: 18000000, todayLarge: 10000000, fiveDayTotal: 95000000, consecutiveDays: 5, accumulatedFlow: 95000000, action: 'building', dayFlows: flows },
      { code: '601688', name: '华泰证券', price: 18.90, changePercent: 0.53, volume: 45000000, amount: 850500000, todayMainInflow: -15000000, todaySuperLarge: -8000000, todayLarge: -7000000, fiveDayTotal: -42000000, consecutiveDays: 3, accumulatedFlow: -42000000, action: 'reducing', dayFlows: flows.map(f => ({ ...f, main: -f.main * 0.5 })) },
      { code: '601211', name: '国泰君安', price: 16.50, changePercent: -0.30, volume: 52000000, amount: 858000000, todayMainInflow: 8000000, todaySuperLarge: 5000000, todayLarge: 3000000, fiveDayTotal: 12000000, consecutiveDays: 1, accumulatedFlow: 8000000, action: 'neutral', dayFlows: flows.map(f => ({ ...f, main: f.main * 0.3 })) },
    ],
    summary: { totalTodayInflow: 21000000, buildingCount: 1, reducingCount: 1, brokerCount: 10 },
    signals: [
      { type: 'building', severity: 'warning', message: '中信证券连续5天主力净流入，累计9500万' },
      { type: 'reducing', severity: 'warning', message: '华泰证券连续3天主力净流出，累计4200万' },
    ],
    timestamp: '2026-02-13 14:30:00',
  };
}
