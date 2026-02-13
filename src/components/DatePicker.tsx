'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;            // 'YYYY-MM-DD' or ''
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function fmt(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

export default function DatePicker({ value, onChange, placeholder = '选择日期', className = '' }: DatePickerProps) {
  const today = new Date();
  const init = value ? parseDate(value) : { year: today.getFullYear(), month: today.getMonth(), day: 0 };
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(init.year);
  const [viewMonth, setViewMonth] = useState(init.month);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // sync view when value changes externally
  useEffect(() => {
    if (value) {
      const p = parseDate(value);
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value]);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const select = (day: number) => {
    onChange(fmt(viewYear, viewMonth, day));
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  const days = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);
  const todayStr = fmt(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* trigger button */}
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none hover:border-[#3b82f6] focus:border-[#3b82f6] transition-colors min-w-[130px]">
        <Calendar size={12} className="text-[#64748b] shrink-0" />
        <span className={value ? 'text-[#e2e8f0]' : 'text-[#475569]'}>{value || placeholder}</span>
        {value && (
          <span onClick={clear} className="ml-auto text-[#475569] hover:text-[#ef4444] text-sm leading-none">&times;</span>
        )}
      </button>

      {/* dropdown calendar */}
      {open && (
        <div className="absolute top-full mt-1 z-50 w-[260px] rounded-xl border border-[#1e293b] bg-[#0f172a] shadow-2xl p-3 select-none">
          {/* header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth}
              className="p-1 rounded hover:bg-[#1e293b] text-[#64748b] hover:text-[#e2e8f0]">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium text-[#e2e8f0]">{viewYear}年 {viewMonth + 1}月</span>
            <button type="button" onClick={nextMonth}
              className="p-1 rounded hover:bg-[#1e293b] text-[#64748b] hover:text-[#e2e8f0]">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[10px] text-[#475569] py-1">{w}</div>
            ))}
          </div>

          {/* day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const d = i + 1;
              const dateStr = fmt(viewYear, viewMonth, d);
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <button key={d} type="button" onClick={() => select(d)}
                  className={`h-8 w-full rounded-lg text-xs transition-colors
                    ${isSelected
                      ? 'bg-[#3b82f6] text-white font-medium'
                      : isToday
                        ? 'text-[#3b82f6] font-medium hover:bg-[#1e293b]'
                        : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
                    }`}>
                  {d}
                </button>
              );
            })}
          </div>

          {/* today shortcut */}
          <div className="mt-2 pt-2 border-t border-[#1e293b] flex justify-center">
            <button type="button" onClick={() => { onChange(todayStr); setOpen(false); }}
              className="text-[10px] text-[#3b82f6] hover:text-[#60a5fa]">
              今天
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
