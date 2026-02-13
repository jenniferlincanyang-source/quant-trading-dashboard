'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  queryHistory, getHistoryStats,
  getPersistConfig, updatePersistConfig, getRetrospective,
  type HistoryQuery, type HistoryResult, type HistoryStats,
  type PersistConfig, type RetrospectiveData,
} from '@/services/dataService';

export function useHistoryQuery(filters: HistoryQuery) {
  const [data, setData] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetch = useCallback(async () => {
    setLoading(true);
    const result = await queryHistory(filters);
    setData(result);
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetch, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useHistoryStats() {
  const [data, setData] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await getHistoryStats();
      if (active) {
        setData(result);
        setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  return { data, loading };
}

export function usePersistConfig() {
  const [config, setConfig] = useState<PersistConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersistConfig().then(c => { setConfig(c); setLoading(false); });
  }, []);

  const toggle = useCallback(async (dataType: string, enabled: boolean) => {
    const next = { ...config, [dataType]: enabled };
    setConfig(next);
    await updatePersistConfig({ [dataType]: enabled });
  }, [config]);

  return { config, loading, toggle };
}

export function useRetrospective(date: string | null) {
  const [data, setData] = useState<RetrospectiveData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) { setData(null); return; }
    setLoading(true);
    getRetrospective(date).then(d => { setData(d); setLoading(false); });
  }, [date]);

  return { data, loading };
}
