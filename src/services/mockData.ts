import type {
  MarketOverview, OracleEvent, StrategySignal,
  KLineData, StockInfo, RealTimeQuote, SectorFlow,
  ScannerStock, SWSector, TriggerReason,
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
  { code: '600519', name: '贵州茅台', sector: '食品饮料', price: 1680.00, change: 1.25, strategies: ['dividend_low_vol', 'multi_factor'] },
  { code: '000858', name: '五粮液', sector: '食品饮料', price: 142.50, change: -0.35, strategies: ['mean_reversion', 'dividend_low_vol'] },
  { code: '601318', name: '中国平安', sector: '非银金融', price: 52.80, change: 2.10, strategies: ['trend_follow', 'multi_factor'] },
  { code: '000001', name: '平安银行', sector: '银行', price: 12.35, change: 0.82, strategies: ['dividend_low_vol', 't_plus_0'] },
  { code: '600036', name: '招商银行', sector: '银行', price: 38.20, change: 1.05, strategies: ['dividend_low_vol', 'index_enhance'] },
  { code: '300750', name: '宁德时代', sector: '电力设备', price: 218.50, change: -1.80, strategies: ['trend_follow', 'multi_factor'] },
  { code: '002594', name: '比亚迪', sector: '汽车', price: 285.00, change: 3.20, strategies: ['trend_follow', 'index_enhance'] },
  { code: '688981', name: '中芯国际', sector: '电子', price: 78.60, change: 4.15, strategies: ['multi_factor', 'mean_reversion'] },
  { code: '603259', name: '药明康德', sector: '医药生物', price: 62.30, change: -2.40, strategies: ['mean_reversion', 't_plus_0'] },
  { code: '000725', name: '京东方A', sector: '电子', price: 4.85, change: 1.68, strategies: ['t_plus_0', 'trend_follow'] },
  { code: '002415', name: '海康威视', sector: '计算机', price: 35.20, change: 2.85, strategies: ['multi_factor', 'index_enhance'] },
  { code: '600900', name: '长江电力', sector: '公用事业', price: 28.90, change: 0.52, strategies: ['dividend_low_vol'] },
  { code: '601899', name: '紫金矿业', sector: '有色金属', price: 16.80, change: 3.45, strategies: ['trend_follow', 'multi_factor'] },
  { code: '000568', name: '泸州老窖', sector: '食品饮料', price: 168.30, change: -0.92, strategies: ['dividend_low_vol', 'mean_reversion'] },
  { code: '600276', name: '恒瑞医药', sector: '医药生物', price: 48.50, change: 1.38, strategies: ['multi_factor', 'index_enhance'] },
  { code: '002475', name: '立讯精密', sector: '电子', price: 32.60, change: 2.72, strategies: ['trend_follow', 'multi_factor'] },
  { code: '601012', name: '隆基绿能', sector: '电力设备', price: 22.10, change: -3.15, strategies: ['mean_reversion', 't_plus_0'] },
  { code: '600030', name: '中信证券', sector: '非银金融', price: 22.85, change: 1.92, strategies: ['trend_follow', 'index_enhance'] },
  { code: '002714', name: '牧原股份', sector: '农林牧渔', price: 42.30, change: -1.25, strategies: ['mean_reversion'] },
  { code: '601888', name: '中国中免', sector: '社会服务', price: 78.90, change: 0.68, strategies: ['multi_factor', 'trend_follow'] },
  { code: '000333', name: '美的集团', sector: '家用电器', price: 62.40, change: 1.15, strategies: ['dividend_low_vol', 'index_enhance'] },
  { code: '600309', name: '万华化学', sector: '基础化工', price: 82.70, change: 2.38, strategies: ['trend_follow', 'multi_factor'] },
  { code: '601669', name: '中国电建', sector: '建筑装饰', price: 6.85, change: 0.44, strategies: ['dividend_low_vol'] },
  { code: '002049', name: '紫光国微', sector: '电子', price: 128.50, change: 5.20, strategies: ['trend_follow', 'multi_factor'] },
  { code: '600585', name: '海螺水泥', sector: '建筑材料', price: 24.30, change: -0.82, strategies: ['dividend_low_vol', 'mean_reversion'] },
  { code: '601225', name: '陕西煤业', sector: '煤炭', price: 22.60, change: 1.78, strategies: ['dividend_low_vol'] },
  { code: '002352', name: '顺丰控股', sector: '交通运输', price: 38.90, change: 0.92, strategies: ['index_enhance'] },
  { code: '300059', name: '东方财富', sector: '非银金融', price: 18.20, change: 3.68, strategies: ['trend_follow', 't_plus_0'] },
  { code: '688111', name: '金山办公', sector: '计算机', price: 268.50, change: 2.15, strategies: ['multi_factor', 'trend_follow'] },
  { code: '002371', name: '北方华创', sector: '电子', price: 320.80, change: 4.82, strategies: ['trend_follow', 'multi_factor'] },
];

export const mockOracleEvents: OracleEvent[] = [
  { id: 'o1', time: '14:32:15', stockCode: '688981', stockName: '中芯国际', type: 'big_order', description: '主力大单净买入 2.3亿', amount: 23000, impact: 'positive' },
  { id: 'o2', time: '14:28:03', stockCode: '002594', stockName: '比亚迪', type: 'volume_spike', description: '成交量突增 380%，突破5日均量', amount: 18500, impact: 'positive' },
  { id: 'o3', time: '14:25:41', stockCode: '300750', stockName: '宁德时代', type: 'limit_down_seal', description: '封单减少至 1.2亿，有开板迹象', amount: 12000, impact: 'negative' },
  { id: 'o4', time: '14:20:18', stockCode: '600519', stockName: '贵州茅台', type: 'block_trade', description: '大宗交易成交 5.8亿，折价 2.1%', amount: 58000, impact: 'neutral' },
  { id: 'o5', time: '14:15:22', stockCode: '000725', stockName: '京东方A', type: 'limit_up_seal', description: '涨停封单 8.5亿，封单比 3.2', amount: 85000, impact: 'positive' },
  { id: 'o6', time: '14:10:05', stockCode: '601318', stockName: '中国平安', type: 'big_order', description: '北向资金净买入 1.8亿', amount: 18000, impact: 'positive' },
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
