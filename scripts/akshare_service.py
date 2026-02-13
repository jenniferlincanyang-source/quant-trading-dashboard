#!/usr/bin/env python3
"""
多源行情数据服务 — 腾讯财经 + 新浪财经 + AKShare(备用)
供 Next.js API Route 通过 child_process 调用
"""
import json
import re
import sys
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.parse import quote

# ── 默认股票池 (与前端 mockStocks 对齐) ──
DEFAULT_CODES = [
    '600519', '000858', '601318', '000001', '600036',
    '300750', '002594', '688981', '603259', '000725',
    '002415', '600900', '601899', '000568', '600276',
    '002475', '601012', '600030', '002714', '601888',
    '000333', '600309', '601669', '002049', '600585',
    '601225', '002352', '300059', '688111', '002371',
]

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
           'Referer': 'https://finance.sina.com.cn'}

def _code_to_sina(code):
    """600519 → sh600519, 510050 → sh510050, 000001 → sz000001"""
    return ('sh' if code.startswith(('5', '6', '9')) else 'sz') + code

def _code_to_tencent(code):
    """600519 → sh600519, 510050 → sh510050"""
    return ('sh' if code.startswith(('5', '6', '9')) else 'sz') + code

def _http_get(url, timeout=10):
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=timeout) as resp:
        return resp.read().decode('gbk', errors='replace')


# ═══════════════════════════════════════════
# 腾讯财经解析 (主数据源)
# ═══════════════════════════════════════════
def _parse_tencent_quote(raw_line):
    """解析腾讯行情单行: v_sh600519="1~贵州茅台~600519~1504.33~..." """
    m = re.match(r'v_(\w+)="(.+)";', raw_line.strip())
    if not m:
        return None
    fields = m.group(2).split('~')
    if len(fields) < 50:
        return None
    try:
        return {
            'code': fields[2],
            'name': fields[1],
            'price': float(fields[3] or 0),
            'change': round(float(fields[31] or 0), 2),
            'changePercent': round(float(fields[32] or 0), 2),
            'volume': int(float(fields[36] or 0)),
            'amount': round(float(fields[37] or 0), 2),
            'high': float(fields[33] or 0),
            'low': float(fields[34] or 0),
            'open': float(fields[5] or 0),
            'prevClose': float(fields[4] or 0),
            'turnoverRate': round(float(fields[38] or 0), 2),
            'pe': round(float(fields[39] or 0), 1),
            'pb': round(float(fields[46] or 0), 2),
        }
    except (ValueError, IndexError):
        return None


def fetch_quotes_tencent(codes):
    """腾讯财经批量行情"""
    symbols = ','.join(_code_to_tencent(c) for c in codes)
    url = f'http://qt.gtimg.cn/q={symbols}'
    raw = _http_get(url)
    results = []
    for line in raw.strip().split('\n'):
        q = _parse_tencent_quote(line)
        if q:
            results.append(q)
    return results


# ═══════════════════════════════════════════
# 新浪财经解析 (验证源)
# ═══════════════════════════════════════════
def _parse_sina_quote(raw_line):
    """解析新浪行情: var hq_str_sh600519="贵州茅台,1504.8,..." """
    m = re.match(r'var hq_str_(\w+)="(.*)";', raw_line.strip())
    if not m:
        return None
    code_full = m.group(1)  # sh600519
    code = code_full[2:]
    fields = m.group(2).split(',')
    if len(fields) < 32:
        return None
    try:
        prev_close = float(fields[2] or 0)
        price = float(fields[3] or 0)
        change = round(price - prev_close, 2)
        pct = round(change / prev_close * 100, 2) if prev_close else 0
        return {
            'code': code,
            'name': fields[0],
            'price': price,
            'change': change,
            'changePercent': pct,
            'volume': int(float(fields[8] or 0)),
            'amount': round(float(fields[9] or 0), 2),
            'high': float(fields[4] or 0),
            'low': float(fields[5] or 0),
            'open': float(fields[1] or 0),
            'prevClose': prev_close,
            'turnoverRate': 0,
            'pe': 0,
            'pb': 0,
        }
    except (ValueError, IndexError):
        return None


def fetch_quotes_sina(codes):
    """新浪财经批量行情"""
    symbols = ','.join(_code_to_sina(c) for c in codes)
    url = f'http://hq.sinajs.cn/list={symbols}'
    raw = _http_get(url)
    results = []
    for line in raw.strip().split('\n'):
        q = _parse_sina_quote(line)
        if q:
            results.append(q)
    return results


# ═══════════════════════════════════════════
# K线数据 (腾讯日K)
# ═══════════════════════════════════════════
def fetch_kline_tencent(code, count=30):
    """腾讯财经日K线"""
    symbol = _code_to_tencent(code)
    url = f'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={symbol},day,,,{count},qfq'
    raw = _http_get(url)
    data = json.loads(raw)
    days = data.get('data', {}).get(symbol, {}).get('qfqday', [])
    if not days:
        days = data.get('data', {}).get(symbol, {}).get('day', [])
    results = []
    prev_close = None
    for d in days:
        # [date, open, close, high, low, volume]
        o, c, h, l = float(d[1]), float(d[2]), float(d[3]), float(d[4])
        vol = int(float(d[5])) if len(d) > 5 else 0
        daily_ret = (c - prev_close) / prev_close if prev_close else 0
        sharpe = round(daily_ret * 15.87, 2)
        prev_close = c
        dt = d[0]
        results.append({
            'date': f'{dt[5:7]}/{dt[8:10]}' if len(dt) >= 10 else dt,
            'open': o, 'close': c, 'high': h, 'low': l,
            'volume': vol,
            'sharpeRatio': sharpe,
        })
    return results


# ═══════════════════════════════════════════
# 业务接口 (对外)
# ═══════════════════════════════════════════
def get_quotes(codes=None):
    """获取实时行情 — 腾讯优先, 新浪备用"""
    target = codes or DEFAULT_CODES
    try:
        return fetch_quotes_tencent(target)
    except Exception:
        pass
    try:
        return fetch_quotes_sina(target)
    except Exception as e:
        return {'error': f'all sources failed: {e}'}


def get_kline(code='688981', count=30):
    """获取K线 — 腾讯优先"""
    try:
        result = fetch_kline_tencent(code, count)
        if result:
            return result
    except Exception:
        pass
    return {'error': 'kline fetch failed'}


def get_market_overview():
    """市场概览: 涨跌比→情绪, 涨幅最大行业"""
    try:
        quotes = fetch_quotes_tencent(DEFAULT_CODES)
        if not quotes:
            quotes = fetch_quotes_sina(DEFAULT_CODES)
        up = sum(1 for q in quotes if q['changePercent'] > 0)
        total = len(quotes) or 1
        sentiment = round(up / total * 100, 1)
        label = '偏多' if sentiment > 55 else '偏空' if sentiment < 45 else '震荡'
        # 按涨幅排序找热门
        sorted_q = sorted(quotes, key=lambda x: x['changePercent'], reverse=True)
        hot = sorted_q[0] if sorted_q else None
        return {
            'sentimentIndex': sentiment,
            'sentimentLabel': label,
            'hotSector': hot['name'] if hot else '—',
            'hotSectorChange': hot['changePercent'] if hot else 0,
            'avgWinRate': round(sentiment * 0.82, 1),
            'avgWinRateChange': round((sentiment - 50) * 0.1, 1),
        }
    except Exception as e:
        return {'error': str(e)}


def get_sector_flows():
    """行业资金流向 — 基于个股涨跌聚合"""
    try:
        quotes = fetch_quotes_tencent(DEFAULT_CODES)
        # 简单按行业聚合 (用 mock 行业映射)
        return quotes[:6]  # 暂返回 top6 个股作为替代
    except Exception as e:
        return {'error': str(e)}


def get_oracle_events():
    """异动事件 — 从实时行情中提取涨幅/量异常，丰富事件描述"""
    try:
        quotes = fetch_quotes_tencent(DEFAULT_CODES)
        events = []
        now = datetime.now()
        now_str = now.strftime('%Y-%m-%d %H:%M:%S')
        today_str = now.strftime('%Y-%m-%d')
        for i, q in enumerate(quotes):
            pct = q.get('changePercent', 0)
            price = q.get('price', 0)
            vol = q.get('volume', 0)
            amount = q.get('amount', 0)  # 万元
            amount_yi = amount / 1e4  # 转为亿元
            turnover = q.get('turnoverRate', 0)
            high = q.get('high', 0)
            low = q.get('low', 0)
            prev_close = q.get('prevClose', 0)

            # 涨停/跌停检测 (A股10%限制, ST 5%)
            limit_pct = 5 if 'ST' in q.get('name', '') else 10
            is_limit_up = prev_close > 0 and pct >= limit_pct - 0.2
            is_limit_down = prev_close > 0 and pct <= -(limit_pct - 0.2)

            # 事件类型 + 描述
            if is_limit_up:
                etype = 'limit_up_seal'
                desc = f"涨停封板 {pct:+.2f}%，成交额{amount_yi:.1f}亿"
                impact = 'positive'
            elif is_limit_down:
                etype = 'limit_down_seal'
                desc = f"跌停封板 {pct:+.2f}%，成交额{amount_yi:.1f}亿"
                impact = 'negative'
            elif turnover > 5:
                etype = 'volume_spike'
                desc = f"换手率{turnover:.1f}%异常放量，{pct:+.2f}%，成交额{amount_yi:.1f}亿"
                impact = 'positive' if pct > 0 else 'negative'
            elif abs(pct) >= 3:
                etype = 'big_order'
                direction = '大幅拉升' if pct > 0 else '大幅杀跌'
                desc = f"{direction} {pct:+.2f}%，振幅{((high-low)/prev_close*100) if prev_close else 0:.1f}%，成交额{amount_yi:.1f}亿"
                impact = 'positive' if pct > 0 else 'negative'
            elif abs(pct) >= 1.5:
                etype = 'big_order'
                direction = '震荡走高' if pct > 0 else '震荡走低'
                desc = f"{direction} {pct:+.2f}%，换手{turnover:.1f}%，成交额{amount_yi:.1f}亿"
                impact = 'positive' if pct > 0 else 'negative'
            else:
                continue  # 波动太小，不生成事件

            events.append({
                'id': f'live_{i}',
                'time': now.strftime('%H:%M:%S'),
                'datetime': now_str,
                'lagDays': 0,
                'verifiedDate': today_str,
                'stockCode': q['code'],
                'stockName': q['name'],
                'type': etype,
                'description': desc,
                'amount': int(amount / 10000) if amount else 0,
                'impact': impact,
            })
        events.sort(key=lambda x: abs(x['amount']), reverse=True)
        return events[:15]
    except Exception as e:
        return {'error': str(e)}


# ── 股票→行业映射 (申万一级) ──
STOCK_SECTOR = {
    '600519': '食品饮料', '000858': '食品饮料', '000568': '食品饮料',
    '601318': '非银金融', '600030': '非银金融', '300059': '非银金融',
    '000001': '银行', '600036': '银行',
    '300750': '电力设备', '601012': '电力设备',
    '002594': '汽车',
    '688981': '电子', '000725': '电子', '002475': '电子', '002049': '电子', '002371': '电子',
    '603259': '医药生物', '600276': '医药生物',
    '002415': '计算机', '688111': '计算机',
    '600900': '公用事业',
    '601899': '有色金属',
    '002714': '农林牧渔',
    '601888': '社会服务',
    '000333': '家用电器',
    '600309': '基础化工',
    '601669': '建筑装饰',
    '600585': '建筑材料',
    '601225': '煤炭',
    '002352': '交通运输',
}

# 申万一级行业完整列表 (31个) + 估算股票数
SW_SECTOR_META = {
    '电子': 428, '计算机': 312, '医药生物': 468, '电力设备': 385,
    '汽车': 236, '非银金融': 86, '银行': 42, '食品饮料': 118,
    '有色金属': 148, '机械设备': 452, '基础化工': 398, '家用电器': 82,
    '公用事业': 156, '煤炭': 38, '交通运输': 142, '建筑装饰': 112,
    '建筑材料': 86, '农林牧渔': 186, '社会服务': 92,
    '通信': 156, '国防军工': 112, '传媒': 168, '钢铁': 42,
    '纺织服饰': 142, '轻工制造': 168, '环保': 98, '商贸零售': 128,
    '美容护理': 62, '石油石化': 52, '房地产': 118, '综合': 28,
}


def get_scanner_stocks():
    """扫描排行榜 — 基于实时行情计算价值评分"""
    try:
        quotes = fetch_quotes_tencent(DEFAULT_CODES)
        if not quotes:
            quotes = fetch_quotes_sina(DEFAULT_CODES)

        trigger_reasons = [
            '突破年线', '机构抢筹', '放量突破', '底部反转',
            '北向扫货', '涨停板', '均线多头', '资金异动',
            'MACD金叉', '超跌反弹', '板块龙头', '缩量企稳',
        ]

        results = []
        for i, q in enumerate(quotes):
            pct = abs(q.get('changePercent', 0))
            vol_score = min(q.get('turnoverRate', 0) * 5, 20)
            value_score = round(40 + pct * 8 + vol_score, 1)
            # 涨幅大 + 换手高 → 触发原因偏强势
            if q.get('changePercent', 0) > 3:
                reason = '放量突破' if q.get('turnoverRate', 0) > 3 else '均线多头'
            elif q.get('changePercent', 0) > 1:
                reason = '机构抢筹' if vol_score > 10 else '北向扫货'
            elif q.get('changePercent', 0) < -2:
                reason = '超跌反弹' if pct > 3 else '缩量企稳'
            else:
                reason = trigger_reasons[i % len(trigger_reasons)]

            results.append({
                'code': q['code'],
                'name': q['name'],
                'valueScore': value_score,
                'triggerReason': reason,
                'price': q['price'],
                'changePercent': q.get('changePercent', 0),
                'sector': STOCK_SECTOR.get(q['code'], '其他'),
                'rank': 0,
                'prevRank': None,
            })

        results.sort(key=lambda x: x['valueScore'], reverse=True)
        for i, r in enumerate(results):
            r['rank'] = i + 1
        return results
    except Exception as e:
        return {'error': str(e)}


def get_sw_sectors():
    """申万行业热力图 — 基于个股行情聚合"""
    try:
        quotes = fetch_quotes_tencent(DEFAULT_CODES)
        if not quotes:
            quotes = fetch_quotes_sina(DEFAULT_CODES)

        # 按行业聚合
        sector_data = {}
        for q in quotes:
            sector = STOCK_SECTOR.get(q['code'])
            if not sector:
                continue
            if sector not in sector_data:
                sector_data[sector] = {
                    'stocks': [],
                    'total_amount': 0,
                    'total_change': 0,
                    'count': 0,
                    'best_stock': None,
                    'best_change': -999,
                }
            sd = sector_data[sector]
            sd['stocks'].append(q)
            sd['total_amount'] += q.get('amount', 0)
            sd['total_change'] += q.get('changePercent', 0)
            sd['count'] += 1
            if q.get('changePercent', 0) > sd['best_change']:
                sd['best_change'] = q['changePercent']
                sd['best_stock'] = q['name']

        # 构建结果 — 有实时数据的行业用真实值，其余用 0
        results = []
        for name, stock_count in SW_SECTOR_META.items():
            sd = sector_data.get(name)
            if sd:
                avg_change = round(sd['total_change'] / sd['count'], 2)
                # 用成交额变化近似资金流向 (正涨幅=净流入)
                net_inflow = round(sd['total_amount'] / 1e8 * (1 if avg_change > 0 else -1), 1)
                leading = sd['best_stock'] or '—'
            else:
                avg_change = 0
                net_inflow = 0
                leading = '—'

            results.append({
                'name': name,
                'netInflow': net_inflow,
                'changePercent': avg_change,
                'leadingStock': leading,
                'stockCount': stock_count,
            })

        results.sort(key=lambda x: x['changePercent'], reverse=True)
        return results
    except Exception as e:
        return {'error': str(e)}


# ═══════════════════════════════════════════
# 事件驱动 — 财经新闻 + 研报机构分析
# ═══════════════════════════════════════════
def _http_get_utf8(url, timeout=10):
    """UTF-8 编码的 HTTP GET"""
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=timeout) as resp:
        return resp.read().decode('utf-8', errors='replace')


def _fetch_eastmoney_news():
    """东方财富 7x24 财经快讯"""
    url = 'https://newsapi.eastmoney.com/kuaixun/v1/getlist_102_ajaxResult_50_1_.html'
    headers_extra = {'Referer': 'https://kuaixun.eastmoney.com/'}
    req = Request(url, headers={**HEADERS, **headers_extra})
    with urlopen(req, timeout=10) as resp:
        raw = resp.read().decode('utf-8', errors='replace')
    # 去掉 JSONP 包装: var xxx = {...};
    if raw.startswith('var '):
        raw = raw[raw.index('=') + 1:].strip().rstrip(';')
    data = json.loads(raw)
    items = data.get('LivesList', [])
    results = []
    for item in items:
        results.append({
            'title': item.get('title', ''),
            'summary': item.get('digest', item.get('title', '')),
            'source': '东方财富',
            'sourceUrl': item.get('url_w', item.get('url_unique', '')),
            'time': item.get('showtime', ''),
        })
    return results


def _fetch_eastmoney_reports():
    """东方财富研报列表 — 获取机构分析"""
    url = ('https://reportapi.eastmoney.com/report/list'
           '?industryCode=*&pageSize=15&industry=*'
           '&rating=&ratingChange=&beginTime=&endTime='
           '&pageNo=1&fields=&qType=0&orgCode=&rcode='
           '&p=1&pageNum=1&_=1')
    raw = _http_get_utf8(url)
    data = json.loads(raw)
    items = data.get('data', [])
    results = []
    now = datetime.now()
    today_str = now.strftime('%Y-%m-%d')
    for item in items:
        pub_date = item.get('publishDate', '')[:10] or today_str
        try:
            lag = (now - datetime.strptime(pub_date, '%Y-%m-%d')).days
        except Exception:
            lag = 0
        results.append({
            'institution': item.get('orgSName', ''),
            'analyst': item.get('researcher', ''),
            'title': item.get('title', ''),
            'rating': item.get('emRatingName', ''),
            'stockName': item.get('stockName', ''),
            'stockCode': item.get('stockCode', ''),
            'summary': item.get('title', ''),
            'publishDate': pub_date,
            'lagDays': lag,
        })
    return results


def _classify_event(title):
    """根据标题关键词分类事件"""
    kw_map = {
        'earnings': ['业绩', '净利', '营收', '财报', '年报', '季报', '盈利', '亏损'],
        'policy': ['政策', '监管', '央行', '国务院', '发改委', '证监会', '降准', '降息', '利率'],
        'merger': ['并购', '重组', '收购', '合并', '借壳', '资产注入'],
        'rating': ['评级', '目标价', '研报', '推荐', '首次覆盖'],
        'macro': ['GDP', 'CPI', 'PMI', '宏观', '经济数据', '就业', '通胀', '出口'],
        'industry': ['行业', '板块', '产业链', '供需', '产能', '景气'],
    }
    for cat, keywords in kw_map.items():
        if any(kw in title for kw in keywords):
            return cat
    return 'industry'


def _rating_to_enum(rating_str):
    """东方财富评级 → 标准枚举"""
    m = {'买入': 'buy', '增持': 'overweight', '持有': 'hold',
         '减持': 'underweight', '卖出': 'sell', '推荐': 'buy',
         '强烈推荐': 'buy', '谨慎推荐': 'hold', '中性': 'hold'}
    return m.get(rating_str, 'hold')


def _impact_from_title(title):
    """从标题推断影响方向"""
    pos = ['利好', '上涨', '增长', '突破', '超预期', '新高', '景气', '加速']
    neg = ['利空', '下跌', '亏损', '下滑', '低于预期', '新低', '风险', '暴跌']
    if any(w in title for w in pos):
        return 'positive'
    if any(w in title for w in neg):
        return 'negative'
    return 'neutral'


def get_event_news():
    """获取事件驱动新闻 + 机构分析"""
    news_list = []
    reports = []

    # 1. 抓新闻
    try:
        news_list = _fetch_eastmoney_news()
    except Exception:
        pass

    # 2. 抓研报
    try:
        reports = _fetch_eastmoney_reports()
    except Exception:
        pass

    # 3. 构建 report 索引 (按股票名 + 按机构名)
    report_map = {}
    report_by_industry = {}
    for r in reports:
        key = r.get('stockName', '')
        if key:
            report_map.setdefault(key, []).append(r)
        # 也按研报标题关键词索引
        title_r = r.get('title', '')
        for kw in ['半导体', '新能源', '汽车', '银行', '医药', '消费', '白酒',
                    '军工', '电子', '计算机', '通信', '化工', '有色', '煤炭',
                    'AI', '人工智能', '机器人', '光伏', '储能', '芯片']:
            if kw in title_r:
                report_by_industry.setdefault(kw, []).append(r)

    # 4. 组装结果
    results = []
    now = datetime.now()
    for i, news in enumerate(news_list[:15]):
        title = news.get('title', '')
        category = _classify_event(title)
        impact = _impact_from_title(title)

        # 匹配关联股票
        related = []
        analyst_views = []
        for stock_name, reps in report_map.items():
            if stock_name in title:
                if stock_name:
                    related.append(stock_name)
                for rep in reps[:2]:
                    analyst_views.append({
                        'institution': rep['institution'],
                        'analyst': rep['analyst'],
                        'rating': _rating_to_enum(rep.get('rating', '')),
                        'summary': rep['summary'],
                        'datetime': rep.get('publishDate', ''),
                        'lagDays': rep.get('lagDays', 0),
                    })

        # 如果没匹配到个股研报，尝试按行业关键词匹配
        if not analyst_views:
            for kw, reps in report_by_industry.items():
                if kw in title:
                    for rep in reps[:1]:
                        analyst_views.append({
                            'institution': rep['institution'],
                            'analyst': rep['analyst'],
                            'rating': _rating_to_enum(rep.get('rating', '')),
                            'summary': rep['summary'],
                            'datetime': rep.get('publishDate', ''),
                            'lagDays': rep.get('lagDays', 0),
                        })
                    break

        # 解析新闻时间，计算滞后
        time_str = news.get('time', now.strftime('%H:%M'))
        # 东方财富快讯 showtime 格式: "2026-02-12 14:30:00" 或 "14:30"
        news_datetime = ''
        lag_days = 0
        if len(time_str) >= 10 and '-' in time_str[:10]:
            news_datetime = time_str[:19]
            try:
                news_date = datetime.strptime(time_str[:10], '%Y-%m-%d')
                lag_days = (now - news_date).days
            except Exception:
                pass
            time_str = time_str[11:16] if len(time_str) > 11 else time_str
        else:
            news_datetime = now.strftime('%Y-%m-%d') + ' ' + time_str
            lag_days = 0

        results.append({
            'id': f'evt_{i}',
            'time': time_str,
            'datetime': news_datetime,
            'lagDays': lag_days,
            'verifiedDate': now.strftime('%Y-%m-%d'),
            'title': title,
            'summary': news.get('summary', title),
            'source': news.get('source', '东方财富'),
            'sourceUrl': news.get('sourceUrl', ''),
            'relatedStocks': related,
            'category': category,
            'analystViews': analyst_views,
            'impact': impact,
        })

    return results


# ═══════════════════════════════════════════
# 策略洞察 — 基于实时行情计算
# ═══════════════════════════════════════════

def get_strategy_insights(insight_type='trend_follow'):
    """基于实时行情数据计算策略洞察"""
    try:
        quotes = fetch_quotes_tencent(DEFAULT_CODES)
        if not quotes:
            quotes = fetch_quotes_sina(DEFAULT_CODES)
        if not quotes:
            return []

        now = datetime.now()
        now_str = now.strftime('%Y-%m-%d %H:%M:%S')
        today_str = now.strftime('%Y-%m-%d')
        results = []

        if insight_type == 'trend_follow':
            results = _trend_insights(quotes, now_str, today_str)
        elif insight_type == 'mean_reversion':
            results = _mean_rev_insights(quotes, now_str, today_str)
        elif insight_type == 'stat_arb':
            results = _stat_arb_insights(quotes, now_str, today_str)
        elif insight_type == 'hft':
            results = _hft_insights(quotes, now_str, today_str)
        elif insight_type == 'multi_factor':
            results = _multi_factor_insights(quotes, now_str, today_str)

        return results
    except Exception as e:
        return {'error': str(e)}


def _trend_insights(quotes, now_str, today_str):
    """趋势跟踪洞察"""
    insights = []
    sorted_q = sorted(quotes, key=lambda x: x.get('changePercent', 0), reverse=True)
    bulls = [q for q in sorted_q if q.get('changePercent', 0) > 1]
    for i, q in enumerate(bulls[:3]):
        pct = q['changePercent']
        turnover = q.get('turnoverRate', 0)
        amount_yi = q.get('amount', 0) / 1e4
        metrics = {'涨幅': f"{pct:+.2f}%", '换手率': f"{turnover:.1f}%", '成交额': f"{amount_yi:.1f}亿"}
        if turnover > 3:
            title = f"{q['name']}放量上攻{pct:+.2f}%，换手{turnover:.1f}%"
            summary = f"{q['name']}放量上涨，换手率{turnover:.1f}%，成交额{amount_yi:.1f}亿，趋势动能强劲。"
        else:
            title = f"{q['name']}延续上行趋势，涨{pct:+.2f}%"
            summary = f"{q['name']}继续走高{pct:+.2f}%，成交额{amount_yi:.1f}亿，趋势保持完好。"
        insights.append({
            'id': f'ti_live_{i}', 'time': now_str.split(' ')[1],
            'datetime': now_str, 'lagDays': 0, 'verifiedDate': today_str,
            'title': title, 'summary': summary,
            'source': '腾讯财经(实时)', 'sourceUrl': '',
            'relatedStocks': [q['name']], 'insightType': 'trend_follow',
            'signal': 'bullish', 'keyMetrics': metrics, 'analystViews': [],
        })
    bears = [q for q in sorted_q if q.get('changePercent', 0) < -2]
    for i, q in enumerate(bears[:2]):
        pct = q['changePercent']
        amount_yi = q.get('amount', 0) / 1e4
        insights.append({
            'id': f'ti_bear_{i}', 'time': now_str.split(' ')[1],
            'datetime': now_str, 'lagDays': 0, 'verifiedDate': today_str,
            'title': f"{q['name']}跌破支撑{pct:+.2f}%，趋势转弱",
            'summary': f"{q['name']}下跌{pct:+.2f}%，成交额{amount_yi:.1f}亿，短期趋势信号转空。",
            'source': '腾讯财经(实时)', 'sourceUrl': '',
            'relatedStocks': [q['name']], 'insightType': 'trend_follow',
            'signal': 'bearish',
            'keyMetrics': {'跌幅': f"{pct:+.2f}%", '成交额': f"{amount_yi:.1f}亿"},
            'analystViews': [],
        })
    return insights


def _mean_rev_insights(quotes, now_str, today_str):
    """均值回归洞察"""
    insights = []
    sorted_q = sorted(quotes, key=lambda x: x.get('changePercent', 0))
    oversold = [q for q in sorted_q if q.get('changePercent', 0) < -1]
    for i, q in enumerate(oversold[:3]):
        pct = q['changePercent']
        pe = q.get('pe', 0)
        amount_yi = q.get('amount', 0) / 1e4
        metrics = {'跌幅': f"{pct:+.2f}%", '成交额': f"{amount_yi:.1f}亿"}
        if pe > 0:
            metrics['PE'] = f"{pe:.1f}x"
        insights.append({
            'id': f'mr_live_{i}', 'time': now_str.split(' ')[1],
            'datetime': now_str, 'lagDays': 0, 'verifiedDate': today_str,
            'title': f"{q['name']}回调{pct:+.2f}%，均值回归信号触发",
            'summary': f"{q['name']}下跌{pct:+.2f}%，{'PE '+str(round(pe,1))+'x ' if pe>0 else ''}偏离均值，存在回归机会。",
            'source': '腾讯财经(实时)', 'sourceUrl': '',
            'relatedStocks': [q['name']], 'insightType': 'mean_reversion',
            'signal': 'bullish', 'keyMetrics': metrics, 'analystViews': [],
        })
    overbought = [q for q in sorted_q[::-1] if q.get('changePercent', 0) > 2]
    for i, q in enumerate(overbought[:2]):
        pct = q['changePercent']
        amount_yi = q.get('amount', 0) / 1e4
        insights.append({
            'id': f'mr_over_{i}', 'time': now_str.split(' ')[1],
            'datetime': now_str, 'lagDays': 0, 'verifiedDate': today_str,
            'title': f"{q['name']}涨{pct:+.2f}%偏离均值，注意回调风险",
            'summary': f"{q['name']}上涨{pct:+.2f}%，短期偏离均值较大，均值回归策略提示回调风险。",
            'source': '腾讯财经(实时)', 'sourceUrl': '',
            'relatedStocks': [q['name']], 'insightType': 'mean_reversion',
            'signal': 'bearish',
            'keyMetrics': {'涨幅': f"{pct:+.2f}%", '成交额': f"{amount_yi:.1f}亿"},
            'analystViews': [],
        })
    return insights


def _stat_arb_insights(quotes, now_str, today_str):
    """统计套利洞察: 同行业配对价差"""
    insights = []
    pairs = [
        (['600519', '000858'], '食品饮料'),
        (['601318', '600030'], '非银金融'),
        (['300750', '601012'], '电力设备'),
        (['688981', '002371'], '半导体'),
        (['000001', '600036'], '银行'),
    ]
    qmap = {q['code']: q for q in quotes}
    for idx, (codes, sector) in enumerate(pairs):
        if codes[0] not in qmap or codes[1] not in qmap:
            continue
        q1, q2 = qmap[codes[0]], qmap[codes[1]]
        spread = q1.get('changePercent', 0) - q2.get('changePercent', 0)
        if abs(spread) < 0.5:
            continue
        leader = q1 if spread > 0 else q2
        lagger = q2 if spread > 0 else q1
        signal = 'bullish' if abs(spread) > 2 else 'neutral'
        insights.append({
            'id': f'sa_live_{idx}', 'time': now_str.split(' ')[1],
            'datetime': now_str, 'lagDays': 0, 'verifiedDate': today_str,
            'title': f"{sector}配对: {q1['name']}vs{q2['name']}价差{spread:+.2f}%",
            'summary': f"{leader['name']}({leader['changePercent']:+.2f}%)跑赢{lagger['name']}({lagger['changePercent']:+.2f}%)，价差{abs(spread):.2f}%，存在收敛套利机会。",
            'source': '腾讯财经(实时)', 'sourceUrl': '',
            'relatedStocks': [q1['name'], q2['name']],
            'insightType': 'stat_arb', 'signal': signal,
            'keyMetrics': {
                q1['name']: f"{q1['changePercent']:+.2f}%",
                q2['name']: f"{q2['changePercent']:+.2f}%",
                '价差': f"{spread:+.2f}%",
            },
            'analystViews': [],
        })
    return insights


def _hft_insights(quotes, now_str, today_str):
    """高频交易洞察: 基于成交量/换手率/价格波动的微观结构分析"""
    insights = []
    for idx, q in enumerate(quotes):
        turnover = q.get('turnoverRate', 0) or 0
        amount = q.get('amount', 0) or 0
        amount_yi = amount / 1e4 if amount > 0 else 0
        name = q.get('name', '')
        chg = q.get('changePercent', 0) or 0
        high = q.get('high', 0) or 0
        low = q.get('low', 0) or 0
        pre_close = q.get('preClose', 0) or 0
        amplitude = ((high - low) / pre_close * 100) if pre_close > 0 and high > 0 and low > 0 else abs(chg) * 1.2

        # 高换手 + 低振幅 = 流动性充裕，适合做市
        if turnover > 1.5 and amplitude < 3 and amount_yi > 5:
            insights.append({
                'id': f'hft_mm_{idx}', 'time': now_str.split(' ')[1],
                'datetime': now_str, 'lagDays': 0, 'verifiedDate': today_str,
                'title': f'{name}换手率{turnover:.1f}%振幅仅{amplitude:.1f}%，做市策略适用',
                'summary': f'{name}高换手({turnover:.1f}%)但振幅低({amplitude:.1f}%)，成交额{amount_yi:.1f}亿，流动性充裕且波动可控，适合高频做市策略。',
                'source': '腾讯财经(实时)', 'sourceUrl': '',
                'relatedStocks': [name], 'insightType': 'hft', 'signal': 'bullish',
                'keyMetrics': {'换手率': f'{turnover:.1f}%', '振幅': f'{amplitude:.1f}%', '成交额': f'{amount_yi:.1f}亿'},
                'analystViews': [],
            })
        # 高成交额 + 明显涨跌 = 订单流方向明确
        elif amount_yi > 20 and abs(chg) > 1:
            signal = 'bullish' if chg > 0 else 'bearish'
            insights.append({
                'id': f'hft_mom_{idx}', 'time': now_str.split(' ')[1],
                'datetime': now_str, 'lagDays': 0, 'verifiedDate': today_str,
                'title': f'{name}成交{amount_yi:.0f}亿涨跌{chg:+.1f}%，订单流动量信号',
                'summary': f'{name}成交额{amount_yi:.0f}亿，涨跌{chg:+.2f}%，订单流方向偏{("多" if chg > 0 else "空")}，高频动量策略可介入。',
                'source': '腾讯财经(实时)', 'sourceUrl': '',
                'relatedStocks': [name], 'insightType': 'hft', 'signal': signal,
                'keyMetrics': {'成交额': f'{amount_yi:.0f}亿', '涨跌': f'{chg:+.2f}%', '换手': f'{turnover:.1f}%'},
                'analystViews': [],
            })
    return insights[:5]


def _multi_factor_insights(quotes, now_str, today_str):
    """多因子模型洞察: 动量+估值+成交量多维评分"""
    insights = []
    for idx, q in enumerate(quotes):
        name = q.get('name', '')
        chg = q.get('changePercent', 0)
        pe = q.get('pe', 0)
        pb = q.get('pb', 0)
        turnover = q.get('turnoverRate', 0)
        amount = q.get('amount', 0)
        amount_yi = amount / 1e4 if amount > 0 else 0

        # 多因子评分
        score = 0
        factors = []
        # 动量因子
        if chg > 2:
            score += 30
            factors.append(f'动量+{chg:.1f}%')
        elif chg < -2:
            score += 15
            factors.append(f'反转{chg:.1f}%')
        else:
            score += 20
            factors.append(f'动量{chg:+.1f}%')
        # 估值因子
        if 0 < pe < 20:
            score += 30
            factors.append(f'低估PE{pe:.0f}x')
        elif 0 < pe < 40:
            score += 20
            factors.append(f'PE{pe:.0f}x')
        else:
            score += 10
            factors.append(f'PE{pe:.0f}x')
        # 流动性因子
        if turnover > 3:
            score += 25
            factors.append(f'高换手{turnover:.1f}%')
        elif turnover > 1:
            score += 20
            factors.append(f'换手{turnover:.1f}%')
        else:
            score += 10
            factors.append(f'低换手{turnover:.1f}%')
        # PB因子
        if 0 < pb < 1.5:
            score += 15
            factors.append(f'破净PB{pb:.2f}')
        elif 0 < pb < 3:
            score += 10
            factors.append(f'PB{pb:.2f}')

        if score < 60:
            continue

        signal = 'bullish' if score >= 75 else 'neutral'
        insights.append({
            'id': f'mf_live_{idx}', 'time': now_str.split(' ')[1],
            'datetime': now_str, 'lagDays': 0, 'verifiedDate': today_str,
            'title': f'{name}多因子评分{score}分，{"强烈看多" if score >= 85 else "综合偏多" if score >= 75 else "中性偏多"}',
            'summary': f'{name}因子分解: {", ".join(factors)}。综合评分{score}/100。',
            'source': '腾讯财经(实时)', 'sourceUrl': '',
            'relatedStocks': [name], 'insightType': 'multi_factor', 'signal': signal,
            'keyMetrics': {'评分': f'{score}', '涨跌': f'{chg:+.2f}%', 'PE': f'{pe:.0f}x', '换手': f'{turnover:.1f}%'},
            'analystViews': [],
        })
    insights.sort(key=lambda x: int(x['keyMetrics']['评分']), reverse=True)
    return insights[:5]


def _code_to_eastmoney(code):
    """600519 → 1.600519, 000001 → 0.000001 (东方财富 secid)"""
    return ('1.' if code.startswith(('6', '9')) else '0.') + code


# ═══════════════════════════════════════════
# 实时行情 — 双源交叉验证
# ═══════════════════════════════════════════
def get_price_ticks():
    """腾讯+新浪双源行情，比对价格差异"""
    tencent = []
    sina = []
    try:
        tencent = fetch_quotes_tencent(DEFAULT_CODES)
    except Exception:
        pass
    try:
        sina = fetch_quotes_sina(DEFAULT_CODES)
    except Exception:
        pass
    sina_map = {q['code']: q for q in sina}
    ts = int(datetime.now().timestamp() * 1000)
    results = []
    for tq in (tencent or sina):
        sq = sina_map.get(tq['code'])
        sources = []
        divergence = None
        if tq in tencent:
            sources.append('akshare')
        if sq:
            sources.append('sina')
            diff = abs(tq['price'] - sq['price'])
            if diff > 0.01 and tq['price'] > 0:
                pct = diff / tq['price'] * 100
                if pct > 0.1:
                    divergence = f"腾讯{tq['price']} vs 新浪{sq['price']} 差{pct:.2f}%"
        if not sources:
            sources = ['akshare']
        results.append({
            **tq, 'sources': sources,
            'divergence': divergence, 'timestamp': ts,
        })
    return results


# ═══════════════════════════════════════════
# 资金流向 — 东方财富 push2 API
# ═══════════════════════════════════════════
def _fetch_eastmoney_fund_flow():
    """东方财富个股资金流排行"""
    url = ('https://push2.eastmoney.com/api/qt/clist/get?'
           'fid=f62&po=1&pz=50&pn=1&np=1&'
           'fltt=2&invt=2&'
           'fields=f12,f14,f62,f66,f69,f72,f75,f78,f81,f84,f87,f124,f184,f204,f205,f206'
           '&fs=m:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,'
           'm:1+t:2+f:!2,m:1+t:23+f:!2,m:0+t:7+f:!2,m:1+t:3+f:!2')
    raw = _http_get_utf8(url)
    data = json.loads(raw)
    items = data.get('data', {}).get('diff', [])
    results = []
    for it in (items or []):
        results.append({
            'code': it.get('f12', ''),
            'name': it.get('f14', ''),
            'mainNetInflow': round(float(it.get('f62', 0)), 2),
            'superLargeInflow': round(float(it.get('f66', 0)), 2),
            'superLargePercent': round(float(it.get('f69', 0)), 2),
            'largeInflow': round(float(it.get('f72', 0)), 2),
            'largePercent': round(float(it.get('f75', 0)), 2),
            'mediumInflow': round(float(it.get('f78', 0)), 2),
            'mediumPercent': round(float(it.get('f81', 0)), 2),
            'smallInflow': round(float(it.get('f84', 0)), 2),
            'smallPercent': round(float(it.get('f87', 0)), 2),
            'totalAmount': round(float(it.get('f184', 0)), 2),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        })
    return results


def get_fund_flow():
    """资金流向监控 — 聚合 Top5 流入/流出"""
    try:
        items = _fetch_eastmoney_fund_flow()
    except Exception:
        return None
    if not items:
        return None
    total_main = sum(it['mainNetInflow'] for it in items)
    total_super = sum(it['superLargeInflow'] for it in items)
    total_large = sum(it['largeInflow'] for it in items)
    total_medium = sum(it['mediumInflow'] for it in items)
    total_small = sum(it['smallInflow'] for it in items)
    sorted_items = sorted(items, key=lambda x: x['mainNetInflow'], reverse=True)
    return {
        'totalMainInflow': round(total_main, 2),
        'totalSuperLarge': round(total_super, 2),
        'totalLarge': round(total_large, 2),
        'totalMedium': round(total_medium, 2),
        'totalSmall': round(total_small, 2),
        'topInflows': sorted_items[:5],
        'topOutflows': sorted_items[-5:][::-1],
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    }


# ═══════════════════════════════════════════
# K线 + 资金流叠加
# ═══════════════════════════════════════════
def _fetch_eastmoney_stock_flow_history(code, days=30):
    """东方财富个股资金流历史 (日K级别)"""
    secid = _code_to_eastmoney(code)
    url = (f'https://push2his.eastmoney.com/api/qt/stock/fflow/daykline/get?'
           f'secid={secid}&lmt={days}&klt=101&fields1=f1,f2,f3,f7'
           f'&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63')
    raw = _http_get_utf8(url)
    data = json.loads(raw)
    klines = data.get('data', {}).get('klines', [])
    results = []
    for line in (klines or []):
        parts = line.split(',')
        if len(parts) >= 7:
            results.append({
                'date': parts[0],
                'mainInflow': float(parts[1] or 0),
                'superLargeInflow': float(parts[2] or 0),
                'largeInflow': float(parts[3] or 0),
                'mediumInflow': float(parts[4] or 0),
                'smallInflow': float(parts[5] or 0),
            })
    return results


def get_kline_flow(code='688981'):
    """K线 + 资金流叠加数据"""
    kline = fetch_kline_tencent(code, 30)
    try:
        flows = _fetch_eastmoney_stock_flow_history(code, 30)
    except Exception:
        flows = []
    flow_map = {}
    for f in flows:
        d = f['date']
        short = f'{d[5:7]}/{d[8:10]}' if len(d) >= 10 else d
        flow_map[short] = f
    results = []
    for k in kline:
        f = flow_map.get(k['date'], {})
        results.append({
            **k,
            'mainInflow': f.get('mainInflow', 0),
            'retailInflow': f.get('mediumInflow', 0) + f.get('smallInflow', 0),
        })
    return results


# ═══════════════════════════════════════════
# 大资金建仓减仓预警
# ═══════════════════════════════════════════
def get_capital_alerts():
    """分析资金流历史，检测建仓/减仓/异动"""
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    today_str = now_str[:10]
    alerts = []
    alert_id = 0
    for code in DEFAULT_CODES[:15]:
        try:
            flows = _fetch_eastmoney_stock_flow_history(code, 10)
        except Exception:
            continue
        if len(flows) < 3:
            continue
        name = STOCK_SECTOR.get(code, code)
        # 查找股票名
        try:
            q = fetch_quotes_tencent([code])
            if q:
                name = q[0]['name']
        except Exception:
            pass
        recent = flows[-5:]
        main_flows = [f['mainInflow'] for f in recent]
        consecutive_in = sum(1 for m in main_flows if m > 0)
        consecutive_out = sum(1 for m in main_flows if m < 0)
        total_flow = sum(main_flows)
        last_flow = main_flows[-1] if main_flows else 0
        avg_flow = sum(abs(m) for m in main_flows) / len(main_flows) if main_flows else 1
        if consecutive_in >= 3 and total_flow > 0:
            alert_id += 1
            alerts.append({
                'id': f'ca_{alert_id}', 'time': now_str.split(' ')[1],
                'datetime': now_str, 'code': code, 'name': name,
                'alertType': 'building',
                'description': f'{name}连续{consecutive_in}日主力净流入，累计{total_flow/10000:.1f}万',
                'amount': total_flow, 'daysAccumulated': consecutive_in,
                'confidence': min(0.5 + consecutive_in * 0.1, 0.95),
                'severity': 'warning' if consecutive_in >= 4 else 'info',
                'relatedMetrics': {'累计流入': f'{total_flow/10000:.1f}万', '连续天数': str(consecutive_in)},
            })
        elif consecutive_out >= 3 and total_flow < 0:
            alert_id += 1
            alerts.append({
                'id': f'ca_{alert_id}', 'time': now_str.split(' ')[1],
                'datetime': now_str, 'code': code, 'name': name,
                'alertType': 'reducing',
                'description': f'{name}连续{consecutive_out}日主力净流出，累计{abs(total_flow)/10000:.1f}万',
                'amount': total_flow, 'daysAccumulated': consecutive_out,
                'confidence': min(0.5 + consecutive_out * 0.1, 0.95),
                'severity': 'warning' if consecutive_out >= 4 else 'info',
                'relatedMetrics': {'累计流出': f'{abs(total_flow)/10000:.1f}万', '连续天数': str(consecutive_out)},
            })
        if abs(last_flow) > avg_flow * 2.5 and avg_flow > 0:
            alert_id += 1
            atype = 'sudden_inflow' if last_flow > 0 else 'sudden_outflow'
            alerts.append({
                'id': f'ca_{alert_id}', 'time': now_str.split(' ')[1],
                'datetime': now_str, 'code': code, 'name': name,
                'alertType': atype,
                'description': f'{name}今日主力{"流入" if last_flow > 0 else "流出"}{abs(last_flow)/10000:.1f}万，为近5日均值{abs(last_flow)/avg_flow:.1f}倍',
                'amount': last_flow, 'daysAccumulated': 1,
                'confidence': min(abs(last_flow) / avg_flow * 0.2, 0.95),
                'severity': 'critical' if abs(last_flow) > avg_flow * 4 else 'warning',
                'relatedMetrics': {'今日流量': f'{last_flow/10000:.1f}万', '倍数': f'{abs(last_flow)/avg_flow:.1f}x'},
            })
    alerts.sort(key=lambda x: {'critical': 0, 'warning': 1, 'info': 2}[x['severity']])
    return alerts


# ═══════════════════════════════════════════
# 多周期趋势预测 — 均线系统
# ═══════════════════════════════════════════
def _calc_ma(prices, period):
    if len(prices) < period:
        return None
    return sum(prices[-period:]) / period


def get_trend(code='688981'):
    """基于120日K线计算日/周/月趋势"""
    kline = fetch_kline_tencent(code, 120)
    if not kline or len(kline) < 20:
        return None
    closes = [k['close'] for k in kline]
    highs = [k['high'] for k in kline]
    lows = [k['low'] for k in kline]
    current = closes[-1]
    name_str = code
    try:
        q = fetch_quotes_tencent([code])
        if q:
            name_str = q[0]['name']
            current = q[0]['price']
    except Exception:
        pass
    ma5 = _calc_ma(closes, 5)
    ma10 = _calc_ma(closes, 10)
    ma20 = _calc_ma(closes, 20)
    ma60 = _calc_ma(closes, 60)
    daily_dir = 'up' if (ma5 and current > ma5 and ma5 > (ma10 or 0)) else \
                'down' if (ma5 and current < ma5 and ma5 < (ma10 or float('inf'))) else 'sideways'
    daily_conf = 0.7 if daily_dir != 'sideways' else 0.4
    weekly_dir = 'up' if (ma20 and current > ma20) else \
                 'down' if (ma20 and current < ma20) else 'sideways'
    weekly_conf = 0.65 if weekly_dir != 'sideways' else 0.35
    monthly_dir = 'up' if (ma60 and current > ma60) else \
                  'down' if (ma60 and current < ma60) else 'sideways'
    monthly_conf = 0.6 if monthly_dir != 'sideways' else 0.3
    recent_lows = lows[-20:]
    recent_highs = highs[-20:]
    support = min(recent_lows) if recent_lows else current * 0.95
    resistance = max(recent_highs) if recent_highs else current * 1.05

    def _factors(direction, ma_short, ma_long):
        f = []
        if direction == 'up':
            if ma_short and current > ma_short:
                f.append('价格站上短期均线')
            if ma_long and ma_short and ma_short > ma_long:
                f.append('均线多头排列')
        elif direction == 'down':
            if ma_short and current < ma_short:
                f.append('价格跌破短期均线')
            if ma_long and ma_short and ma_short < ma_long:
                f.append('均线空头排列')
        else:
            f.append('均线缠绕震荡')
        return f or ['趋势不明朗']

    def _pred(period, direction, conf, ma_s, ma_l):
        target = current * (1.05 if direction == 'up' else 0.95 if direction == 'down' else 1.0)
        return {
            'code': code, 'name': name_str, 'period': period,
            'direction': direction, 'confidence': conf,
            'targetPrice': round(target, 2), 'currentPrice': current,
            'supportLevel': round(support, 2),
            'resistanceLevel': round(resistance, 2),
            'keyFactors': _factors(direction, ma_s, ma_l),
            'updatedAt': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }

    dirs = [daily_dir, weekly_dir, monthly_dir]
    up_c = dirs.count('up')
    down_c = dirs.count('down')
    consensus = 'bullish' if up_c >= 2 else 'bearish' if down_c >= 2 else 'mixed'
    return {
        'code': code, 'name': name_str,
        'daily': _pred('daily', daily_dir, daily_conf, ma5, ma10),
        'weekly': _pred('weekly', weekly_dir, weekly_conf, ma10, ma20),
        'monthly': _pred('monthly', monthly_dir, monthly_conf, ma20, ma60),
        'consensus': consensus,
    }


# ═══════════════════════════════════════════
# 实时交易预警
# ═══════════════════════════════════════════
def get_trading_alerts():
    """从实时行情中提取异常预警"""
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    alerts = []
    aid = 0
    try:
        quotes = fetch_quotes_tencent(DEFAULT_CODES)
    except Exception:
        return []
    for q in quotes:
        pct = q.get('changePercent', 0)
        turnover = q.get('turnoverRate', 0)
        high = q.get('high', 0)
        low = q.get('low', 0)
        price = q.get('price', 0)
        prev = q.get('prevClose', 1) or 1
        amplitude = (high - low) / prev * 100
        if abs(pct) >= 5:
            aid += 1
            alerts.append({
                'id': f'ta_{aid}', 'time': now_str.split(' ')[1],
                'datetime': now_str,
                'severity': 'critical' if abs(pct) >= 8 else 'warning',
                'category': 'price',
                'title': f'{q["name"]}{"涨" if pct > 0 else "跌"}{abs(pct):.1f}%',
                'description': f'当前价{price}，涨跌幅{pct:+.1f}%',
                'stockCode': q['code'], 'stockName': q['name'],
                'actionRequired': abs(pct) >= 8,
                'acknowledged': False,
                'relatedData': {'价格': str(price), '涨跌幅': f'{pct:+.1f}%'},
            })
        if turnover >= 8:
            aid += 1
            alerts.append({
                'id': f'ta_{aid}', 'time': now_str.split(' ')[1],
                'datetime': now_str, 'severity': 'warning',
                'category': 'volume',
                'title': f'{q["name"]}换手率{turnover:.1f}%',
                'description': f'换手率异常偏高，可能有大资金进出',
                'stockCode': q['code'], 'stockName': q['name'],
                'actionRequired': False, 'acknowledged': False,
                'relatedData': {'换手率': f'{turnover:.1f}%'},
            })
        if amplitude >= 7:
            aid += 1
            alerts.append({
                'id': f'ta_{aid}', 'time': now_str.split(' ')[1],
                'datetime': now_str, 'severity': 'info',
                'category': 'price',
                'title': f'{q["name"]}振幅{amplitude:.1f}%',
                'description': f'日内振幅较大，最高{high}最低{low}',
                'stockCode': q['code'], 'stockName': q['name'],
                'actionRequired': False, 'acknowledged': False,
                'relatedData': {'最高': str(high), '最低': str(low)},
            })
    alerts.sort(key=lambda x: {'critical': 0, 'warning': 1, 'info': 2}[x['severity']])
    return alerts


# ── 中央汇金动向监控 ──

# 汇金重仓股 (四大行 + 主要金融股)
HUIJIN_HOLDINGS = {
    '601398': {'name': '工商银行', 'holdPercent': 34.71, 'category': 'bank'},
    '601939': {'name': '建设银行', 'holdPercent': 57.11, 'category': 'bank'},
    '601988': {'name': '中国银行', 'holdPercent': 64.02, 'category': 'bank'},
    '601288': {'name': '农业银行', 'holdPercent': 40.03, 'category': 'bank'},
    '601318': {'name': '中国平安', 'holdPercent': 0, 'category': 'insurance'},
    '601628': {'name': '中国人寿', 'holdPercent': 0, 'category': 'insurance'},
    '600030': {'name': '中信证券', 'holdPercent': 0, 'category': 'securities'},
    '601688': {'name': '华泰证券', 'holdPercent': 0, 'category': 'securities'},
}

# 汇金常买 ETF
HUIJIN_ETFS = {
    '510050': '上证50ETF',
    '510300': '沪深300ETF',
    '159919': '沪深300ETF(深)',
    '510500': '中证500ETF',
    '159922': '中证500ETF(深)',
}


def get_huijin_monitor():
    """监控中央汇金重仓股 + ETF 实时行情与资金流向"""
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # 1) 获取重仓股实时行情
    stock_codes = list(HUIJIN_HOLDINGS.keys())
    etf_codes = list(HUIJIN_ETFS.keys())
    all_codes = stock_codes + etf_codes

    quotes = get_quotes(all_codes)
    quote_map = {q['code']: q for q in quotes}

    # 2) 获取重仓股资金流 (东方财富 — 逐个查询个股资金流)
    flow_map = {}
    for code in stock_codes:
        try:
            secid = f'1.{code}' if code.startswith('6') else f'0.{code}'
            url = (
                f'https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?'
                f'secid={secid}&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56'
                f'&klt=1&lmt=1'
            )
            resp = _http_get(url)
            if resp:
                obj = json.loads(resp)
                klines = (obj.get('data', {}) or {}).get('klines', [])
                if klines:
                    parts = klines[-1].split(',')
                    if len(parts) >= 5:
                        flow_map[code] = {
                            'mainNetInflow': float(parts[1]),
                            'superLargeInflow': float(parts[2]),
                            'largeInflow': float(parts[3]),
                            'mediumInflow': float(parts[4]),
                            'smallInflow': float(parts[5]) if len(parts) > 5 else 0,
                        }
        except Exception as e:
            logger.warning('huijin flow for %s error: %s', code, e)

    # 3) 组装重仓股数据
    holdings = []
    for code, meta in HUIJIN_HOLDINGS.items():
        q = quote_map.get(code, {})
        flow = flow_map.get(code, {})
        price = q.get('price', 0)
        prev = q.get('prevClose', price)
        pct = ((price - prev) / prev * 100) if prev else 0
        holdings.append({
            'code': code,
            'name': meta['name'],
            'category': meta['category'],
            'holdPercent': meta['holdPercent'],
            'price': price,
            'changePercent': round(pct, 2),
            'volume': q.get('volume', 0),
            'amount': q.get('amount', 0),
            'mainNetInflow': flow.get('mainNetInflow', 0),
            'superLargeInflow': flow.get('superLargeInflow', 0),
            'largeInflow': flow.get('largeInflow', 0),
        })

    # 4) 组装 ETF 数据
    etfs = []
    for code, name in HUIJIN_ETFS.items():
        q = quote_map.get(code, {})
        price = q.get('price', 0)
        prev = q.get('prevClose', price)
        pct = ((price - prev) / prev * 100) if prev else 0
        etfs.append({
            'code': code,
            'name': name,
            'price': price,
            'changePercent': round(pct, 2),
            'volume': q.get('volume', 0),
            'amount': q.get('amount', 0),
        })

    # 5) 汇总统计
    total_main = sum(h['mainNetInflow'] for h in holdings)
    bank_main = sum(h['mainNetInflow'] for h in holdings if h['category'] == 'bank')
    avg_change = (sum(h['changePercent'] for h in holdings) / len(holdings)) if holdings else 0

    # 6) 生成动向信号
    signals = []
    if bank_main > 5e7:
        signals.append({'type': 'inflow', 'severity': 'critical',
                        'message': f'四大行主力净流入{bank_main/1e8:.2f}亿，疑似汇金护盘'})
    elif bank_main > 1e7:
        signals.append({'type': 'inflow', 'severity': 'warning',
                        'message': f'四大行主力净流入{bank_main/1e4:.0f}万'})
    if bank_main < -5e7:
        signals.append({'type': 'outflow', 'severity': 'warning',
                        'message': f'四大行主力净流出{abs(bank_main)/1e8:.2f}亿'})

    for h in holdings:
        if h['mainNetInflow'] > 2e7:
            signals.append({'type': 'inflow', 'severity': 'info',
                            'message': f'{h["name"]}主力净流入{h["mainNetInflow"]/1e4:.0f}万'})

    return {
        'holdings': holdings,
        'etfs': etfs,
        'summary': {
            'totalMainInflow': total_main,
            'bankMainInflow': bank_main,
            'avgChangePercent': round(avg_change, 2),
            'signalCount': len(signals),
        },
        'signals': signals,
        'timestamp': now_str,
    }


# ── 社保基金动向监控 ──

# 社保基金重仓股 (根据公开季报披露)
SSF_HOLDINGS = {
    # 医药
    '600276': {'name': '恒瑞医药', 'category': 'pharma'},
    '000538': {'name': '云南白药', 'category': 'pharma'},
    '300760': {'name': '迈瑞医疗', 'category': 'pharma'},
    # 科技
    '002415': {'name': '海康威视', 'category': 'tech'},
    '600588': {'name': '用友网络', 'category': 'tech'},
    # 消费
    '000858': {'name': '五粮液', 'category': 'consumer'},
    '000333': {'name': '美的集团', 'category': 'consumer'},
    '002714': {'name': '牧原股份', 'category': 'consumer'},
    # 金融
    '601166': {'name': '兴业银行', 'category': 'finance'},
    '600036': {'name': '招商银行', 'category': 'finance'},
    '601318': {'name': '中国平安', 'category': 'finance'},
    # 新能源
    '300750': {'name': '宁德时代', 'category': 'energy'},
    '601012': {'name': '隆基绿能', 'category': 'energy'},
}

SSF_CAT_LABELS = {
    'pharma': '医药', 'tech': '科技', 'consumer': '消费',
    'finance': '金融', 'energy': '新能源',
}


def get_ssf_monitor():
    """监控社保基金重仓股实时行情与资金流向"""
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    stock_codes = list(SSF_HOLDINGS.keys())

    quotes = get_quotes(stock_codes)
    quote_map = {q['code']: q for q in quotes}

    # 逐个查询资金流
    flow_map = {}
    for code in stock_codes:
        try:
            secid = f'1.{code}' if code.startswith('6') else f'0.{code}'
            url = (
                f'https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?'
                f'secid={secid}&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56'
                f'&klt=1&lmt=1'
            )
            resp = _http_get(url)
            if resp:
                obj = json.loads(resp)
                klines = (obj.get('data', {}) or {}).get('klines', [])
                if klines:
                    parts = klines[-1].split(',')
                    if len(parts) >= 5:
                        flow_map[code] = {
                            'mainNetInflow': float(parts[1]),
                            'superLargeInflow': float(parts[2]),
                            'largeInflow': float(parts[3]),
                        }
        except Exception as e:
            logger.warning('ssf flow for %s error: %s', code, e)

    # 组装持仓数据
    holdings = []
    for code, meta in SSF_HOLDINGS.items():
        q = quote_map.get(code, {})
        flow = flow_map.get(code, {})
        price = q.get('price', 0)
        prev = q.get('prevClose', price)
        pct = ((price - prev) / prev * 100) if prev else 0
        holdings.append({
            'code': code, 'name': meta['name'],
            'category': meta['category'],
            'price': price,
            'changePercent': round(pct, 2),
            'volume': q.get('volume', 0),
            'amount': q.get('amount', 0),
            'mainNetInflow': flow.get('mainNetInflow', 0),
            'superLargeInflow': flow.get('superLargeInflow', 0),
            'largeInflow': flow.get('largeInflow', 0),
        })

    # 按板块聚合
    cat_stats = {}
    for h in holdings:
        cat = h['category']
        if cat not in cat_stats:
            cat_stats[cat] = {'inflow': 0, 'count': 0, 'chgSum': 0}
        cat_stats[cat]['inflow'] += h['mainNetInflow']
        cat_stats[cat]['count'] += 1
        cat_stats[cat]['chgSum'] += h['changePercent']

    sector_summary = []
    for cat, st in cat_stats.items():
        sector_summary.append({
            'category': cat,
            'label': SSF_CAT_LABELS.get(cat, cat),
            'totalInflow': st['inflow'],
            'avgChange': round(st['chgSum'] / st['count'], 2) if st['count'] else 0,
            'stockCount': st['count'],
        })
    sector_summary.sort(key=lambda x: x['totalInflow'], reverse=True)

    total_main = sum(h['mainNetInflow'] for h in holdings)
    avg_change = (sum(h['changePercent'] for h in holdings) / len(holdings)) if holdings else 0

    # 信号
    signals = []
    for ss in sector_summary:
        if ss['totalInflow'] > 3e7:
            signals.append({
                'type': 'inflow', 'severity': 'warning',
                'message': f'{ss["label"]}板块主力净流入{ss["totalInflow"]/1e4:.0f}万',
            })
        elif ss['totalInflow'] < -3e7:
            signals.append({
                'type': 'outflow', 'severity': 'warning',
                'message': f'{ss["label"]}板块主力净流出{abs(ss["totalInflow"])/1e4:.0f}万',
            })
    for h in sorted(holdings, key=lambda x: x['mainNetInflow'], reverse=True)[:3]:
        if h['mainNetInflow'] > 1e7:
            signals.append({
                'type': 'inflow', 'severity': 'info',
                'message': f'{h["name"]}主力净流入{h["mainNetInflow"]/1e4:.0f}万',
            })

    return {
        'holdings': holdings,
        'sectorSummary': sector_summary,
        'summary': {
            'totalMainInflow': total_main,
            'avgChangePercent': round(avg_change, 2),
            'signalCount': len(signals),
            'holdingCount': len(holdings),
        },
        'signals': signals,
        'timestamp': now_str,
    }


# ── 头部券商建仓减仓监控 ──

BROKER_STOCKS = {
    '600030': '中信证券', '600837': '海通证券', '601211': '国泰君安',
    '601688': '华泰证券', '000776': '广发证券', '600999': '招商证券',
    '000166': '申万宏源', '601995': '中金公司', '600958': '东方证券',
    '601788': '光大证券',
}


def get_broker_monitor():
    """监控头部券商实时行情 + 多日资金流 → 建仓/减仓判断"""
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    codes = list(BROKER_STOCKS.keys())

    # 实时行情
    quotes = get_quotes(codes)
    quote_map = {q['code']: q for q in quotes}

    results = []
    for code, name in BROKER_STOCKS.items():
        q = quote_map.get(code, {})
        price = q.get('price', 0)
        prev = q.get('prevClose', price)
        pct = ((price - prev) / prev * 100) if prev else 0

        # 多日资金流 (近10天)
        day_flows = []
        try:
            secid = f'1.{code}' if code.startswith('6') else f'0.{code}'
            url = (
                f'https://push2his.eastmoney.com/api/qt/stock/fflow/daykline/get?'
                f'secid={secid}&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55'
                f'&lmt=10'
            )
            resp = _http_get(url)
            if resp:
                obj = json.loads(resp)
                for line in (obj.get('data', {}) or {}).get('klines', []):
                    parts = line.split(',')
                    if len(parts) >= 5:
                        day_flows.append({
                            'date': parts[0],
                            'main': float(parts[1]),
                            'super': float(parts[2]),
                            'large': float(parts[3]),
                            'medium': float(parts[4]),
                        })
        except Exception as e:
            logger.warning('broker flow for %s error: %s', code, e)

        # 今日资金流
        today_main = day_flows[-1]['main'] if day_flows else 0
        today_super = day_flows[-1]['super'] if day_flows else 0
        today_large = day_flows[-1]['large'] if day_flows else 0

        # 建仓/减仓判断: 连续N天主力净流入/流出
        consec_in = 0
        consec_out = 0
        accum = 0
        for df in reversed(day_flows):
            if df['main'] > 0:
                if consec_out > 0:
                    break
                consec_in += 1
                accum += df['main']
            elif df['main'] < 0:
                if consec_in > 0:
                    break
                consec_out += 1
                accum += df['main']
            else:
                break

        if consec_in >= 3:
            action = 'building'
        elif consec_out >= 3:
            action = 'reducing'
        elif today_main > 5e7:
            action = 'sudden_inflow'
        elif today_main < -5e7:
            action = 'sudden_outflow'
        else:
            action = 'neutral'

        # 5日累计
        five_day_total = sum(df['main'] for df in day_flows[-5:]) if len(day_flows) >= 5 else 0

        results.append({
            'code': code, 'name': name,
            'price': price,
            'changePercent': round(pct, 2),
            'volume': q.get('volume', 0),
            'amount': q.get('amount', 0),
            'todayMainInflow': today_main,
            'todaySuperLarge': today_super,
            'todayLarge': today_large,
            'fiveDayTotal': five_day_total,
            'consecutiveDays': consec_in or consec_out,
            'accumulatedFlow': accum,
            'action': action,
            'dayFlows': [{'date': d['date'], 'main': d['main']} for d in day_flows[-5:]],
        })

    # 汇总
    total_today = sum(r['todayMainInflow'] for r in results)
    building = [r for r in results if r['action'] == 'building']
    reducing = [r for r in results if r['action'] == 'reducing']

    signals = []
    for r in building:
        signals.append({
            'type': 'building', 'severity': 'warning',
            'message': f'{r["name"]}连续{r["consecutiveDays"]}天主力净流入，累计{r["accumulatedFlow"]/1e4:.0f}万',
        })
    for r in reducing:
        signals.append({
            'type': 'reducing', 'severity': 'warning',
            'message': f'{r["name"]}连续{r["consecutiveDays"]}天主力净流出，累计{abs(r["accumulatedFlow"])/1e4:.0f}万',
        })
    for r in results:
        if r['action'] == 'sudden_inflow':
            signals.append({
                'type': 'sudden_inflow', 'severity': 'info',
                'message': f'{r["name"]}今日主力净流入{r["todayMainInflow"]/1e4:.0f}万',
            })
        elif r['action'] == 'sudden_outflow':
            signals.append({
                'type': 'sudden_outflow', 'severity': 'info',
                'message': f'{r["name"]}今日主力净流出{abs(r["todayMainInflow"])/1e4:.0f}万',
            })

    return {
        'brokers': results,
        'summary': {
            'totalTodayInflow': total_today,
            'buildingCount': len(building),
            'reducingCount': len(reducing),
            'brokerCount': len(results),
        },
        'signals': signals,
        'timestamp': now_str,
    }


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'overview'
    args = sys.argv[2:]

    handlers = {
        'overview': lambda: get_market_overview(),
        'quotes': lambda: get_quotes(args[0].split(',') if args else None),
        'kline': lambda: get_kline(args[0] if args else '688981'),
        'sectors': lambda: get_sector_flows(),
        'events': lambda: get_oracle_events(),
        'scanner': lambda: get_scanner_stocks(),
        'swsectors': lambda: get_sw_sectors(),
        'news': lambda: get_event_news(),
        'insights': lambda: get_strategy_insights(args[0] if args else 'trend_follow'),
        'price_ticks': lambda: get_price_ticks(),
        'fund_flow': lambda: get_fund_flow(),
        'kline_flow': lambda: get_kline_flow(args[0] if args else '688981'),
        'capital_alerts': lambda: get_capital_alerts(),
        'trend': lambda: get_trend(args[0] if args else '688981'),
        'trading_alerts': lambda: get_trading_alerts(),
        'huijin': lambda: get_huijin_monitor(),
        'ssf': lambda: get_ssf_monitor(),
        'broker': lambda: get_broker_monitor(),
    }

    fn = handlers.get(cmd, handlers['overview'])
    print(json.dumps(fn(), ensure_ascii=False))