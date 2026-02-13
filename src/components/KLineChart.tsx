'use client';
import { useState } from 'react';
import { BarChart2, Waves } from 'lucide-react';
import InfoTip from './InfoTip';
import { useKLineWithFlow } from '@/hooks/useMarketData';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Bar, Cell,
} from 'recharts';

export default function KLineChart({ code = '688981', stockName = '中芯国际' }: { code?: string; stockName?: string }) {
  const { data, sources, confidence, loading } = useKLineWithFlow(code);
  const [showFlow, setShowFlow] = useState(true);

  if (loading || !data) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5 h-[500px] flex items-center justify-center">
        <div className="text-[#475569] text-sm animate-pulse">加载K线数据...</div>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    isUp: d.close >= d.open,
    changePercent: (((d.close - d.open) / d.open) * 100).toFixed(2),
    vol: Math.round(d.volume / 10000),
    netFlow: (d.mainInflow || 0) / 10000,
  }));

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#f59e0b]" />
          <span className="text-sm font-medium">{code} {stockName}</span>
          <InfoTip text="展示个股日K线（收盘价走势）、成交量柱状图和主力资金流向叠加图。可切换显示/隐藏资金流层，红色柱体为阳线（收盘>开盘），绿色为阴线。" />
          <span className="text-xs text-[#475569]">收盘价 + 成交量 + 夏普比率</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFlow(!showFlow)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors ${
              showFlow ? 'bg-[#3b82f6] text-white' : 'bg-[#1e293b] text-[#94a3b8]'
            }`}>
            <Waves className="w-3 h-3" /> 资金流
          </button>
          <Legend />
        </div>
      </div>

      {/* 价格 + SR 图 */}
      <div className="px-4 pt-4 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 50, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} />
            <YAxis yAxisId="price" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} />
            <YAxis yAxisId="sr" orientation="right" domain={[0, 2]} tick={{ fill: '#f59e0b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} />
            <Tooltip content={<KLineTooltip />} />
            <ReferenceLine yAxisId="sr" y={1} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.3} label={{ value: 'SR=1', fill: '#f59e0b', fontSize: 9 }} />
            <Area yAxisId="price" type="monotone" dataKey="close" stroke="#3b82f6" fill="url(#priceGradient)" strokeWidth={2} />
            <Line yAxisId="sr" type="monotone" dataKey="sharpeRatio" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 成交量柱状图 */}
      <div className="px-4 pb-4 h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 0, right: 50, bottom: 0, left: 10 }}>
            <XAxis dataKey="date" tick={false} axisLine={{ stroke: '#1e293b' }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e293b' }} />
            <Bar dataKey="vol" barSize={8} isAnimationActive={false}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.isUp ? '#10b98166' : '#ef444466'} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 主力资金流向 */}
      {showFlow && (
        <div className="px-4 pb-2 h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 50, bottom: 0, left: 10 }}>
              <XAxis dataKey="date" tick={false} axisLine={{ stroke: '#1e293b' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e293b' }} tickFormatter={v => `${v}万`} />
              <ReferenceLine y={0} stroke="#334155" />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 11 }}
                formatter={(v) => [`${Number(v).toFixed(0)}万`, '主力净流入']} />
              <Bar dataKey="netFlow" barSize={6} isAnimationActive={false}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.netFlow >= 0 ? '#3b82f6' : '#ef4444'} fillOpacity={0.7} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[10px]">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> 收盘价
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[#10b981]" /> 阳量
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> 阴量
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> SR
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> 流入
      </span>
    </div>
  );
}

function KLineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const color = d.isUp ? 'text-[#10b981]' : 'text-[#ef4444]';
  return (
    <div className="rounded-lg border border-[#1e293b] bg-[#0a0f1a] p-3 text-xs shadow-xl">
      <div className="font-medium mb-1.5">{label}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[#94a3b8]">
        <span>开盘</span><span className="text-right">{d.open}</span>
        <span>收盘</span><span className={`text-right ${color}`}>{d.close}</span>
        <span>最高</span><span className="text-right">{d.high}</span>
        <span>最低</span><span className="text-right">{d.low}</span>
        <span>涨跌</span>
        <span className={`text-right ${color}`}>{d.changePercent}%</span>
        <span>成交量</span>
        <span className="text-right">{d.vol}万手</span>
        <span className="text-[#f59e0b]">SR</span>
        <span className="text-right text-[#f59e0b]">{d.sharpeRatio}</span>
        {d.netFlow !== undefined && (
          <>
            <span className="text-[#3b82f6]">主力净流入</span>
            <span className={`text-right ${d.netFlow >= 0 ? 'text-[#3b82f6]' : 'text-[#ef4444]'}`}>
              {d.netFlow.toFixed(0)}万
            </span>
          </>
        )}
      </div>
    </div>
  );
}
