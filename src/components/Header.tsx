'use client';
import Link from 'next/link';
import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { Search, Sparkles, X, Database, Wifi, WifiOff } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { subscribeSourceStatus, getSourceSnapshot, getServerSnapshot } from '@/services/dataService';

export default function Header() {
  const { query, setQuery, results } = useSearch();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const status = useSyncExternalStore(subscribeSourceStatus, getSourceSnapshot, getServerSnapshot);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e293b] bg-[#0a0f1a]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px] px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-5 h-5 text-[#8b5cf6]" />
          <h1 className="text-base font-semibold tracking-tight">
            A-Share Quant<span className="text-[#64748b]"> & </span>Oracle
          </h1>
        </div>

        <div ref={wrapperRef} className="relative flex-1 max-w-xl">
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
            focused ? 'border-[#3b82f6] bg-[#111827]' : 'border-[#1e293b] bg-[#111827]/60'
          }`}>
            <Search className="w-4 h-4 text-[#64748b]" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="搜索股票代码、名称或策略关键词..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#475569]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-[#64748b] hover:text-[#e2e8f0]">
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="text-[10px] text-[#475569] border border-[#1e293b] rounded px-1.5 py-0.5">AI</span>
          </div>

          {focused && results.length > 0 && (
            <SearchDropdown results={results} onClose={() => setFocused(false)} />
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#64748b] shrink-0">
          <Link href="/history" className="flex items-center gap-1 hover:text-[#94a3b8] transition-colors">
            <Database className="w-3.5 h-3.5" />
            历史数据
          </Link>
          {status.overall === 'live' ? (
            <span className="flex items-center gap-1 text-[#10b981]">
              <Wifi className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse-dot" />
              实时数据
            </span>
          ) : status.overall === 'mock' ? (
            <span className="flex items-center gap-1 text-[#ef4444]">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse-dot" />
              模拟数据
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
              连接中
            </span>
          )}
          <span>2026</span>
        </div>
      </div>
    </header>
  );
}

function SearchDropdown({ results, onClose }: { results: ReturnType<typeof useSearch>['results']; onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[#1e293b] bg-[#111827] shadow-2xl overflow-hidden">
      {results.map((r, i) => (
        <button
          key={i}
          onClick={onClose}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#1e293b] transition-colors text-left"
        >
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            r.type === 'stock' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'bg-[#8b5cf6]/20 text-[#8b5cf6]'
          }`}>
            {r.type === 'stock' ? '股票' : '策略'}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {r.code && <span className="text-[#64748b] mr-2">{r.code}</span>}
              {r.name}
            </div>
            <div className="text-xs text-[#475569] truncate">{r.detail}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
