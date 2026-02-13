'use client';
import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface Props {
  text: string;
}

export default function InfoTip({ text }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-[#475569] hover:text-[#94a3b8] transition-colors p-0.5"
        aria-label="说明"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-64 rounded-lg bg-[#1e293b] border border-[#334155] shadow-xl p-2.5 text-[11px] text-[#94a3b8] leading-relaxed">
          {text}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#1e293b] border-l border-t border-[#334155]" />
        </div>
      )}
    </div>
  );
}
