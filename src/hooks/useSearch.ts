'use client';
import { useState, useMemo, useCallback } from 'react';
import type { StockInfo, StrategySignal } from '@/services/types';
import { getStockList } from '@/services/dataService';

export interface SearchResult {
  type: 'stock' | 'strategy';
  code?: string;
  name: string;
  detail: string;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const stocks = useMemo(() => getStockList(), []);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matched: SearchResult[] = [];

    for (const s of stocks) {
      if (s.code.includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)) {
        matched.push({
          type: 'stock',
          code: s.code,
          name: s.name,
          detail: `${s.sector} | ¥${s.price} | ${s.change > 0 ? '+' : ''}${s.change}%`,
        });
      }
    }

    // 策略关键词匹配
    const strategyKeywords: Record<string, string> = {
      '趋势': '趋势跟踪策略 — 基于价格动量和均线突破',
      '红利': '红利低波策略 — 高股息率 + 低波动率筛选',
      't+0': 'T+0日内策略 — 利用日内波动做高抛低吸',
      '均值': '均值回归策略 — 超跌反弹 + RSI极值捕捉',
      '多因子': '多因子模型 — 综合动量/价值/质量/成长因子',
      '指数增强': '指数增强策略 — 中证A500增强因子组合',
    };
    for (const [kw, desc] of Object.entries(strategyKeywords)) {
      if (kw.includes(q) || q.includes(kw)) {
        matched.push({ type: 'strategy', name: kw, detail: desc });
      }
    }

    return matched.slice(0, 8);
  }, [query, stocks]);

  return { query, setQuery, results };
}
