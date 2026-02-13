'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useHistoryQuery, usePersistConfig, useRetrospective } from '@/hooks/useHistoryData';
import { deleteHistory, deleteHistoryRecord } from '@/services/dataService';
import {
  Database, Search, ChevronLeft, ChevronRight, Settings, Trash2, X,
  TrendingUp, TrendingDown, Minus, ArrowLeft, Calendar, AlertTriangle,
  Building2, Briefcase, BarChart3, Zap,
} from 'lucide-react';
import DatePicker from '@/components/DatePicker';

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'oracle_event', label: 'Oracle事件' },
  { value: 'news', label: '财经新闻' },
  { value: 'insight_trend', label: '趋势洞察' },
  { value: 'insight_meanrev', label: '均值回归' },
  { value: 'insight_statarb', label: '统计套利' },
  { value: 'insight_hft', label: '高频交易' },
  { value: 'insight_mf', label: '多因子' },
  { value: 'quote', label: '行情快照' },
  { value: 'scanner', label: '异动扫描' },
  { value: 'sector', label: '板块资金' },
  { value: 'price_tick', label: '行情滚动' },
  { value: 'fund_flow', label: '资金流向' },
  { value: 'capital_alert', label: '大资金预警' },
  { value: 'trading_alert', label: '交易预警' },
  { value: 'huijin', label: '汇金监控' },
  { value: 'ssf', label: '社保基金' },
  { value: 'broker', label: '券商监控' },
];

const IMPACT_OPTIONS = [
  { value: '', label: '全部影响' },
  { value: 'positive', label: '利好' },
  { value: 'negative', label: '利空' },
  { value: 'neutral', label: '中性' },
  { value: 'bullish', label: '看多' },
  { value: 'bearish', label: '看空' },
];

const impactCfg: Record<string, { icon: typeof TrendingUp; color: string }> = {
  positive: { icon: TrendingUp, color: '#10b981' },
  bullish: { icon: TrendingUp, color: '#10b981' },
  negative: { icon: TrendingDown, color: '#ef4444' },
  bearish: { icon: TrendingDown, color: '#ef4444' },
  neutral: { icon: Minus, color: '#f59e0b' },
};

const typeLabel = (t: string) => TYPE_OPTIONS.find(o => o.value === t)?.label || t;

export default function HistoryPage() {
  const [tab, setTab] = useState<'query' | 'retro'>('query');
  const [showSettings, setShowSettings] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // query tab state
  const [dataType, setDataType] = useState('');
  const [search, setSearch] = useState('');
  const [impact, setImpact] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading } = useHistoryQuery({
    data_type: dataType || undefined,
    search: search || undefined,
    impact: impact || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    page,
    page_size: 20,
    _refresh: refreshKey,
  } as Parameters<typeof useHistoryQuery>[0]);

  // retro tab state
  const [retroDate, setRetroDate] = useState('');
  const { data: retroData, loading: retroLoading } = useRetrospective(retroDate || null);

  const handleDeleteRecord = useCallback(async (id: number) => {
    await deleteHistoryRecord(id);
    setRefreshKey(k => k + 1);
  }, []);

  const tabCls = (t: string) =>
    `px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
      tab === t ? 'bg-[#3b82f6] text-white' : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e293b]'
    }`;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1600px] px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#64748b] hover:text-[#94a3b8]"><ArrowLeft size={16} /></Link>
            <Database size={16} className="text-[#8b5cf6]" />
            <h2 className="text-lg font-semibold">历史数据库</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0a0f1a] rounded-lg p-1 border border-[#1e293b]">
              <button onClick={() => setTab('query')} className={tabCls('query')}>查询</button>
              <button onClick={() => setTab('retro')} className={tabCls('retro')}>
                <Calendar size={12} className="inline mr-1" />回溯
              </button>
            </div>
            <button onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg border border-[#1e293b] text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e293b]">
              <Settings size={14} />
            </button>
            <button onClick={() => setShowDelete(true)}
              className="p-2 rounded-lg border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {tab === 'query' && (
          <>
            <FilterBar
              dataType={dataType} setDataType={v => { setDataType(v); setPage(1); }}
              search={search} setSearch={v => { setSearch(v); setPage(1); }}
              impact={impact} setImpact={v => { setImpact(v); setPage(1); }}
              startDate={startDate} setStartDate={v => { setStartDate(v); setPage(1); }}
              endDate={endDate} setEndDate={v => { setEndDate(v); setPage(1); }}
            />
            <ResultTable data={data} loading={loading} onDelete={handleDeleteRecord} />
            {data && data.total_pages > 1 && (
              <Pagination page={page} totalPages={data.total_pages} setPage={setPage} />
            )}
          </>
        )}

        {tab === 'retro' && (
          <RetroView date={retroDate} setDate={setRetroDate} data={retroData} loading={retroLoading} />
        )}

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {showDelete && (
          <DeleteModal onClose={() => setShowDelete(false)} onDone={() => setRefreshKey(k => k + 1)} />
        )}
      </main>
    </div>
  );
}

// ── FilterBar ──────────────────────────────────────────

function FilterBar({
  dataType, setDataType, search, setSearch,
  impact, setImpact, startDate, setStartDate, endDate, setEndDate,
}: {
  dataType: string; setDataType: (v: string) => void;
  search: string; setSearch: (v: string) => void;
  impact: string; setImpact: (v: string) => void;
  startDate: string; setStartDate: (v: string) => void;
  endDate: string; setEndDate: (v: string) => void;
}) {
  const cls = "bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-[#3b82f6]";
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[#1e293b] bg-[#111827]/60">
      <select value={dataType} onChange={e => setDataType(e.target.value)} className={cls}>
        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select value={impact} onChange={e => setImpact(e.target.value)} className={cls}>
        {IMPACT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="flex items-center gap-1">
        <DatePicker value={startDate} onChange={setStartDate} placeholder="开始日期" />
        <span className="text-[#475569] text-xs">至</span>
        <DatePicker value={endDate} onChange={setEndDate} placeholder="结束日期" />
      </div>
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索关键词..." className={`${cls} w-full pl-8`} />
      </div>
    </div>
  );
}

// ── ResultTable ────────────────────────────────────────

function ResultTable({ data, loading, onDelete }: {
  data: ReturnType<typeof useHistoryQuery>['data'];
  loading: boolean;
  onDelete: (id: number) => void;
}) {
  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-[#0a0f1a] animate-pulse" />
      ))}
    </div>
  );

  if (!data || data.items.length === 0) return (
    <div className="text-center text-[#475569] text-sm py-16">暂无匹配的历史数据</div>
  );

  return (
    <div className="rounded-xl border border-[#1e293b] overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#0a0f1a] text-[#64748b]">
            <th className="text-left px-4 py-2.5 font-medium">时间</th>
            <th className="text-left px-4 py-2.5 font-medium">类型</th>
            <th className="text-left px-4 py-2.5 font-medium">股票</th>
            <th className="text-left px-4 py-2.5 font-medium">摘要</th>
            <th className="text-left px-4 py-2.5 font-medium">影响</th>
            <th className="px-4 py-2.5 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody>
          {data.items.map(item => {
            const c = impactCfg[item.impact || ''] || impactCfg.neutral;
            const Icon = c.icon;
            return (
              <tr key={item.id} className="border-t border-[#1e293b] hover:bg-[#111827] transition-colors">
                <td className="px-4 py-2.5 text-[#94a3b8] whitespace-nowrap">{item.snapshot_time?.slice(0, 16)}</td>
                <td className="px-4 py-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">{typeLabel(item.data_type)}</span>
                </td>
                <td className="px-4 py-2.5 text-[#e2e8f0]">
                  {item.stock_code && <span className="text-[#64748b] mr-1">{item.stock_code}</span>}
                  {item.stock_name || '-'}
                </td>
                <td className="px-4 py-2.5 text-[#94a3b8] max-w-xs truncate">{item.summary || '-'}</td>
                <td className="px-4 py-2.5"><Icon size={12} style={{ color: c.color }} /></td>
                <td className="px-4 py-2.5">
                  <button onClick={() => onDelete(item.id)}
                    className="text-[#475569] hover:text-[#ef4444] transition-colors" title="删除">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────

function Pagination({ page, totalPages, setPage }: {
  page: number; totalPages: number; setPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
        className="p-1.5 rounded-lg border border-[#1e293b] text-[#64748b] hover:text-[#e2e8f0] disabled:opacity-30">
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs text-[#94a3b8]">{page} / {totalPages}</span>
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
        className="p-1.5 rounded-lg border border-[#1e293b] text-[#64748b] hover:text-[#e2e8f0] disabled:opacity-30">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── RetroView ──────────────────────────────────────────

function RetroView({ date, setDate, data, loading }: {
  date: string; setDate: (d: string) => void;
  data: ReturnType<typeof useRetrospective>['data'];
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl border border-[#1e293b] bg-[#111827]/60">
        <Calendar size={14} className="text-[#8b5cf6]" />
        <span className="text-xs text-[#94a3b8]">选择回溯日期</span>
        <DatePicker value={date} onChange={setDate} placeholder="选择回溯日期" />
      </div>
      {loading && (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-[#0a0f1a] animate-pulse" />
          ))}
        </div>
      )}
      {!loading && !data && date && (
        <div className="text-center text-[#475569] text-sm py-16">该日期暂无历史数据</div>
      )}
      {data && <RetroGrid data={data} />}
    </div>
  );
}

// ── RetroGrid ──────────────────────────────────────────

function RetroGrid({ data }: { data: NonNullable<ReturnType<typeof useRetrospective>['data']> }) {
  const s = data.summary;
  return (
    <div className="space-y-4">
      {/* summary bar */}
      <div className="flex items-center gap-4 p-3 rounded-xl border border-[#1e293b] bg-[#111827]/60">
        <span className="text-sm font-medium">{data.date} 回溯总览</span>
        <span className="text-xs px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981]">看多 {s.bullish_count}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444]">看空 {s.bearish_count}</span>
        <span className="text-xs text-[#64748b]">共 {s.total_signals} 条信号</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 交易信号 */}
        <RetroCard title="交易信号" icon={<Zap size={14} className="text-[#f59e0b]" />}
          empty={data.signals.length === 0}>
          {data.signals.slice(0, 20).map((sig, i) => {
            const c = impactCfg[sig.impact || ''] || impactCfg.neutral;
            const Icon = c.icon;
            return (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#1e293b] last:border-0">
                <Icon size={12} style={{ color: c.color }} />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">{typeLabel(sig.data_type)}</span>
                {sig.stock_code && <span className="text-[10px] text-[#64748b]">{sig.stock_code}</span>}
                <span className="text-xs text-[#e2e8f0] truncate flex-1">{sig.summary || '-'}</span>
              </div>
            );
          })}
        </RetroCard>

        {/* 资金流向 */}
        <RetroCard title="资金流向" icon={<BarChart3 size={14} className="text-[#3b82f6]" />}
          empty={data.fund_flows.length === 0}>
          {s.top_inflow_stocks.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-[#475569] mb-1">Top 流入</div>
              {s.top_inflow_stocks.map((st, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <TrendingUp size={10} className="text-[#10b981]" />
                  <span className="text-[#64748b]">{st.code}</span>
                  <span className="text-[#e2e8f0]">{st.name}</span>
                  <span className="text-[#10b981] ml-auto">+{(st.amount / 1e8).toFixed(2)}亿</span>
                </div>
              ))}
            </div>
          )}
          {s.top_outflow_stocks.length > 0 && (
            <div>
              <div className="text-[10px] text-[#475569] mb-1">Top 流出</div>
              {s.top_outflow_stocks.map((st, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <TrendingDown size={10} className="text-[#ef4444]" />
                  <span className="text-[#64748b]">{st.code}</span>
                  <span className="text-[#e2e8f0]">{st.name}</span>
                  <span className="text-[#ef4444] ml-auto">{(st.amount / 1e8).toFixed(2)}亿</span>
                </div>
              ))}
            </div>
          )}
          {data.fund_flows.slice(0, 10).map((f, i) => (
            <div key={i} className="text-xs text-[#94a3b8] py-1 border-t border-[#1e293b]">
              {f.summary || typeLabel(f.data_type)}
            </div>
          ))}
        </RetroCard>

        {/* 板块表现 */}
        <RetroCard title="板块表现" icon={<AlertTriangle size={14} className="text-[#a855f7]" />}
          empty={data.sectors.length === 0}>
          {data.sectors.slice(0, 10).map((sec, i) => (
            <div key={i} className="text-xs text-[#94a3b8] py-1.5 border-b border-[#1e293b] last:border-0">
              {sec.summary || typeLabel(sec.data_type)}
            </div>
          ))}
        </RetroCard>

        {/* 机构动向 */}
        <RetroCard title="机构动向" icon={<Building2 size={14} className="text-[#ef4444]" />}
          empty={data.institutions.length === 0}>
          {data.institutions.slice(0, 15).map((inst, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#1e293b] last:border-0">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">{typeLabel(inst.data_type)}</span>
              <span className="text-xs text-[#e2e8f0] truncate flex-1">{inst.summary || '-'}</span>
            </div>
          ))}
        </RetroCard>
      </div>
    </div>
  );
}

function RetroCard({ title, icon, empty, children }: {
  title: string; icon: React.ReactNode; empty: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="p-3 max-h-[300px] overflow-y-auto">
        {empty ? <div className="text-center text-[#475569] text-xs py-8">暂无数据</div> : children}
      </div>
    </div>
  );
}

// ── SettingsModal ──────────────────────────────────────

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { config, loading, toggle } = usePersistConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[480px] max-h-[80vh] rounded-xl border border-[#1e293b] bg-[#111827] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-[#8b5cf6]" />
            <span className="text-sm font-medium">数据留存设置</span>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#e2e8f0]"><X size={14} /></button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
          <p className="text-[10px] text-[#475569] mb-3">关闭后该类型数据将不再写入历史数据库，已有数据不受影响。</p>
          {loading ? (
            <div className="h-32 rounded-lg bg-[#0a0f1a] animate-pulse" />
          ) : config && TYPE_OPTIONS.filter(o => o.value).map(o => (
            <label key={o.value}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#0a0f1a] cursor-pointer transition-colors">
              <span className="text-xs text-[#e2e8f0]">{o.label}</span>
              <button onClick={() => toggle(o.value, !config[o.value])}
                className={`w-9 h-5 rounded-full transition-colors relative ${config[o.value] ? 'bg-[#3b82f6]' : 'bg-[#1e293b]'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config[o.value] ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DeleteModal ───────────────────────────────────────

function DeleteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<'all' | 'type' | 'date'>('type');
  const [delType, setDelType] = useState('');
  const [beforeDate, setBeforeDate] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    if (mode === 'all') {
      await deleteHistory({ delete_all: true });
    } else if (mode === 'type' && delType) {
      await deleteHistory({ data_type: delType });
    } else if (mode === 'date' && beforeDate) {
      await deleteHistory({ before_date: beforeDate });
    }
    setBusy(false);
    onDone();
    onClose();
  };

  const cls = "bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-[#3b82f6]";
  const modeCls = (m: string) =>
    `px-3 py-1.5 text-xs rounded-lg transition-colors ${mode === m ? 'bg-[#ef4444] text-white' : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b]/80'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[420px] rounded-xl border border-[#1e293b] bg-[#111827] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 size={14} className="text-[#ef4444]" />
            <span className="text-sm font-medium">清空历史数据</span>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#e2e8f0]"><X size={14} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setMode('type')} className={modeCls('type')}>按类型</button>
            <button onClick={() => setMode('date')} className={modeCls('date')}>按日期</button>
            <button onClick={() => setMode('all')} className={modeCls('all')}>全部清空</button>
          </div>

          {mode === 'type' && (
            <select value={delType} onChange={e => setDelType(e.target.value)} className={`${cls} w-full`}>
              <option value="">选择要清空的类型</option>
              {TYPE_OPTIONS.filter(o => o.value).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}

          {mode === 'date' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94a3b8]">删除此日期之前的数据</span>
              <DatePicker value={beforeDate} onChange={setBeforeDate} placeholder="选择截止日期" />
            </div>
          )}

          {mode === 'all' && (
            <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30">
              <p className="text-xs text-[#ef4444]">此操作将删除所有历史数据，不可恢复。</p>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)}
              className="rounded border-[#1e293b]" />
            <span className="text-xs text-[#94a3b8]">我确认要执行此删除操作</span>
          </label>

          <button onClick={handleDelete}
            disabled={!confirm || busy || (mode === 'type' && !delType) || (mode === 'date' && !beforeDate)}
            className="w-full py-2 rounded-lg bg-[#ef4444] text-white text-xs font-medium disabled:opacity-30 hover:bg-[#dc2626] transition-colors">
            {busy ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
