/**
 * 交易服务 — 对接 FastAPI 后端
 */

const TRADE_API = 'http://localhost:8000';

export interface TradeRequest {
  signal_id: string;
  stock_code: string;
  stock_name: string;
  direction: 'buy' | 'sell';
  price: number;
  volume: number;
  strategy: string;
  price_type?: 'limit' | 'market';
  confidence?: number;
}

export interface RiskCheck {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface TradeResponse {
  success: boolean;
  order_id: string;
  message: string;
  risk_check: { passed: boolean; checks: RiskCheck[] } | null;
  timestamp: string;
}

export interface Position {
  stock_code: string;
  stock_name: string;
  volume: number;
  available_volume: number;
  avg_cost: number;
  market_value: number;
  profit: number;
  profit_ratio: number;
}

export interface OrderInfo {
  order_id: string;
  stock_code: string;
  stock_name: string;
  direction: 'buy' | 'sell';
  price: number;
  volume: number;
  filled_volume: number;
  filled_price: number;
  status: string;
  strategy: string;
  created_at: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${TRADE_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || '请求失败');
  }
  return res.json();
}

export async function executeTrade(req: TradeRequest): Promise<TradeResponse> {
  return request('/api/trade/execute', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function getPositions(): Promise<Position[]> {
  return request('/api/trade/positions');
}

export async function getOrders(status = 'all'): Promise<OrderInfo[]> {
  return request(`/api/trade/orders?status=${status}`);
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean }> {
  return request('/api/trade/cancel', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });
}
