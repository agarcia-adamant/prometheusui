import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { getDeviceId } from '../utils/device';
import { useLeads } from './LeadsContext';

const CallTrackingContext = createContext(null);

const STORAGE_PREFIX = 'prometheus_call_history';
const PENDING_PREFIX = 'prometheus_pending_calls';

const getStorageKey = (batchId) => `${STORAGE_PREFIX}:${batchId || 'default'}`;
const getPendingKey = (batchId) => `${PENDING_PREFIX}:${batchId || 'default'}`;

const pickEarlier = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) <= new Date(b) ? a : b;
};

const pickLater = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) >= new Date(b) ? a : b;
};

const buildCallHistoryFromEvents = (events) => {
  const history = {};
  events.forEach((event) => {
    const leadId = event.lead_id;
    if (leadId === undefined || leadId === null) return;

    const calledAt = event.called_at ? new Date(event.called_at).toISOString() : new Date().toISOString();
    const existing = history[leadId];

    if (!existing) {
      history[leadId] = {
        leadId,
        leadName: event.lead_name || '',
        phone: event.lead_phone || '',
        callCount: 1,
        lastCalled: calledAt,
        firstCalled: calledAt,
      };
      return;
    }

    existing.callCount += 1;
    existing.lastCalled = pickLater(existing.lastCalled, calledAt);
    existing.firstCalled = pickEarlier(existing.firstCalled, calledAt);
  });
  return history;
};

const mergeCallHistory = (base, incoming) => {
  const merged = { ...base };
  Object.entries(incoming).forEach(([leadId, next]) => {
    const current = merged[leadId];
    if (!current) {
      merged[leadId] = next;
      return;
    }

    merged[leadId] = {
      ...current,
      leadName: current.leadName || next.leadName,
      phone: current.phone || next.phone,
      callCount: Math.max(current.callCount || 0, next.callCount || 0),
      firstCalled: pickEarlier(current.firstCalled, next.firstCalled),
      lastCalled: pickLater(current.lastCalled, next.lastCalled),
    };
  });
  return merged;
};

export function CallTrackingProvider({ children }) {
  const { batchId } = useLeads();
  const [callHistory, setCallHistory] = useState({});
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (!batchId) {
      setCallHistory({});
      return;
    }

    const stored = localStorage.getItem(getStorageKey(batchId));
    if (!stored) {
      setCallHistory({});
      return;
    }

    try {
      setCallHistory(JSON.parse(stored));
    } catch {
      setCallHistory({});
    }
  }, [batchId]);

  useEffect(() => {
    if (!batchId) return;
    localStorage.setItem(getStorageKey(batchId), JSON.stringify(callHistory));
  }, [callHistory, batchId]);

  const enqueuePendingCall = useCallback((event) => {
    if (!batchId) return;
    const pendingKey = getPendingKey(batchId);
    let pending = [];
    try {
      pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    } catch {
      pending = [];
    }
    pending.push(event);
    localStorage.setItem(pendingKey, JSON.stringify(pending));
  }, [batchId]);

  const flushPendingCalls = useCallback(async () => {
    if (!batchId || !isSupabaseConfigured) return;
    const pendingKey = getPendingKey(batchId);
    let pending = [];
    try {
      pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    } catch {
      pending = [];
    }
    if (pending.length === 0) return;

    const { error } = await supabase.from('call_events').insert(pending);
    if (error) {
      setSyncStatus('error');
      setSyncError(error);
      return;
    }

    localStorage.removeItem(pendingKey);
  }, [batchId]);

  useEffect(() => {
    if (!batchId || !isSupabaseConfigured) return;

    let cancelled = false;

    const syncCalls = async () => {
      setSyncStatus('syncing');
      setSyncError(null);

      const { data, error } = await supabase
        .from('call_events')
        .select('lead_id, lead_name, lead_phone, called_at')
        .eq('batch_id', batchId);

      if (cancelled) return;

      if (error) {
        setSyncStatus('error');
        setSyncError(error);
        return;
      }

      const remoteHistory = buildCallHistoryFromEvents(data || []);
      setCallHistory((prev) => mergeCallHistory(prev, remoteHistory));
      setSyncStatus('synced');
      await flushPendingCalls();
    };

    syncCalls();

    return () => {
      cancelled = true;
    };
  }, [batchId, flushPendingCalls]);

  const recordCall = useCallback(async (lead) => {
    if (!lead) return;
    const now = new Date().toISOString();

    setCallHistory((prev) => ({
      ...prev,
      [lead.id]: {
        leadId: lead.id,
        leadName: lead.name,
        phone: lead.phone,
        callCount: (prev[lead.id]?.callCount || 0) + 1,
        lastCalled: now,
        firstCalled: prev[lead.id]?.firstCalled || now,
      },
    }));

    if (!batchId) return;

    const event = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `call_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      batch_id: batchId,
      lead_id: lead.id,
      lead_name: lead.name,
      lead_phone: lead.phone,
      lead_address: lead.address || null,
      lead_rating: lead.rating || null,
      called_at: now,
      device_id: getDeviceId(),
    };

    if (!isSupabaseConfigured) {
      enqueuePendingCall(event);
      return;
    }

    const { error } = await supabase.from('call_events').insert([event]);
    if (error) {
      setSyncStatus('error');
      setSyncError(error);
      enqueuePendingCall(event);
    } else {
      setSyncStatus('synced');
      await flushPendingCalls();
    }
  }, [batchId, enqueuePendingCall, flushPendingCalls]);

  const getCallInfo = useCallback((leadId) => callHistory[leadId] || null, [callHistory]);

  const hasBeenCalled = useCallback((leadId) => !!callHistory[leadId], [callHistory]);

  const getAllCalls = useCallback(
    () =>
      Object.values(callHistory).sort((a, b) => new Date(b.lastCalled) - new Date(a.lastCalled)),
    [callHistory]
  );

  const getStats = useCallback(() => {
    const calls = Object.values(callHistory);
    const totalCalls = calls.reduce((sum, c) => sum + c.callCount, 0);
    const uniqueLeadsCalled = calls.length;
    
    const today = new Date().toDateString();
    const callsToday = calls.filter(c => 
      new Date(c.lastCalled).toDateString() === today
    ).length;

    const firstCallAt = calls.reduce(
      (earliest, call) => pickEarlier(earliest, call.firstCalled),
      null
    );
    const lastCallAt = calls.reduce(
      (latest, call) => pickLater(latest, call.lastCalled),
      null
    );

    const activeHours = firstCallAt && lastCallAt
      ? Math.max((new Date(lastCallAt) - new Date(firstCallAt)) / 3600000, 0)
      : 0;

    return {
      totalCalls,
      uniqueLeadsCalled,
      callsToday,
      firstCallAt,
      lastCallAt,
      activeHours,
    };
  }, [callHistory]);

  const clearHistory = useCallback(async () => {
    setCallHistory({});
    if (batchId) {
      localStorage.removeItem(getStorageKey(batchId));
      localStorage.removeItem(getPendingKey(batchId));
    }

    if (batchId && isSupabaseConfigured) {
      const { error } = await supabase
        .from('call_events')
        .delete()
        .eq('batch_id', batchId);
      if (error) {
        setSyncStatus('error');
        setSyncError(error);
      }
    }
  }, [batchId]);

  const value = useMemo(
    () => ({
      callHistory,
      recordCall,
      getCallInfo,
      hasBeenCalled,
      getAllCalls,
      getStats,
      clearHistory,
      syncStatus,
      syncError,
    }),
    [callHistory, recordCall, getCallInfo, hasBeenCalled, getAllCalls, getStats, clearHistory, syncStatus, syncError]
  );

  return <CallTrackingContext.Provider value={value}>{children}</CallTrackingContext.Provider>;
}

export function useCallTracking() {
  const context = useContext(CallTrackingContext);
  if (!context) {
    throw new Error('useCallTracking must be used within a CallTrackingProvider');
  }
  return context;
}
