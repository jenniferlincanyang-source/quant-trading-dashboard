'use client';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useOracleAccuracy } from '@/hooks/useMarketData';
import InfoTip from './InfoTip';

export default function OracleVerification() {
  const { data, loading } = useOracleAccuracy();

  const byTypeData = data ? Object.entries(data.byType).map(([type, stats]) => ({
    name: type === 'policy' ? '政策' : type === 'earnings' ? '财报' : type === 'analyst' ? '研报' :
      type === 'industry' ? '行业' : type === 'market' ? '市场' : type,
    accuracy: +(stats.accuracy * 100).toFixed(0),
    total: stats.total,
  })) : [];

  if (loading) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
        <div className="h-[200px] rounded-lg bg-[#0a0f1a] animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#8b5cf6]" />
          <span className="text-sm font-medium">Oracle 预言机历史验证</span>
          <InfoTip text="系统捕捉大单、涨停、放量等异常事件并预测影响方向（利好/利空），之后对比实际股价变化验证预测是否准确。按事件类型分别统计准确率，帮助评估信号可信度。" />
        </div>
        <span className={`text-xs font-medium ${data.overallAccuracy >= 0.6 ? 'text-[#10b981]' : 'text-amber-400'}`}>
          总准确率 {(data.overallAccuracy * 100).toFixed(0)}%
        </span>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <StatBox label="总预测数" value={data.totalPredictions} color="text-[#94a3b8]" />
          <StatBox label="正确预测" value={data.correctPredictions} color="text-[#10b981]" />
          <StatBox label="准确率" value={`${(data.overallAccuracy * 100).toFixed(0)}%`}
            color={data.overallAccuracy >= 0.6 ? 'text-[#10b981]' : 'text-amber-400'} />
        </div>

        {byTypeData.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-[#475569] mb-2">分类准确率</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={byTypeData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, '准确率']} />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {byTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.accuracy >= 60 ? '#10b981' : entry.accuracy >= 40 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-[10px] text-[#475569] mb-1">最近验证记录</div>
          {data.recentVerifications.slice(0, 5).map(v => (
            <div key={v.id} className="rounded-lg bg-[#0a0f1a] p-2.5 flex items-start gap-2">
              {v.isCorrect ? (
                <CheckCircle className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-[#ef4444] flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{v.originalEvent.description}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px]">
                  <span className="text-[#475569]">{v.originalEvent.stockName}</span>
                  <span className="text-[#475569]">
                    预测: {v.predictedImpact === 'positive' ? '利好' : v.predictedImpact === 'negative' ? '利空' : '中性'}
                  </span>
                  <span className={v.actualChange >= 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}>
                    实际: {v.actualChange >= 0 ? '+' : ''}{v.actualChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg bg-[#0a0f1a] p-3 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-[#475569]">{label}</div>
    </div>
  );
}