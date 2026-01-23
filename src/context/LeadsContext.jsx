import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { getDeviceId } from '../utils/device';
import { parseCsvLeads } from '../utils/leadParser';
import { getCsvBySlug } from '../data/routeConfig';

const LeadsContext = createContext(null);

const BATCH_ID_PREFIX = 'prometheus_batch_id';
const getBatchIdKey = (fileName) => `${BATCH_ID_PREFIX}:${fileName}`;

const createBatchId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `batch_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function LeadsProvider({ children, slug }) {
  const [leads, setLeads] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [batchName, setBatchName] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [routeName, setRouteName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      setError('No lead source specified');
      return;
    }

    let cancelled = false;

    const loadLeads = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { content, fileName, routeName: name } = getCsvBySlug(slug);
        if (cancelled) return;

        setSourceFile(fileName);
        setRouteName(name);
        const parsedLeads = await parseCsvLeads(content);
        if (cancelled) return;

        const nextBatchId = (() => {
          const stored = localStorage.getItem(getBatchIdKey(fileName));
          if (stored) return stored;
          const created = createBatchId();
          localStorage.setItem(getBatchIdKey(fileName), created);
          return created;
        })();

        const nextBatchName = fileName.replace(/\.[^/.]+$/, '');

        setLeads(parsedLeads);
        setBatchId(nextBatchId);
        setBatchName(nextBatchName);

        if (isSupabaseConfigured) {
          setSyncStatus('syncing');
          setSyncError(null);

          const payload = {
            id: nextBatchId,
            name: nextBatchName,
            lead_count: parsedLeads.length,
            device_id: getDeviceId(),
          };

          const { error: upsertError } = await supabase
            .from('lead_batches')
            .upsert([payload], { onConflict: 'id' });

          if (cancelled) return;

          if (upsertError) {
            setSyncStatus('error');
            setSyncError(upsertError);
          } else {
            setSyncStatus('synced');
          }
        }
      } catch (loadError) {
        if (cancelled) return;
        setLeads([]);
        setBatchId(null);
        setBatchName(null);
        setRouteName(null);
        setSyncStatus('idle');
        setSyncError(null);
        setError(loadError?.message || 'Failed to load leads.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLeads();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const value = useMemo(
    () => ({
      leads,
      batchId,
      batchName,
      routeName,
      sourceFile,
      slug,
      hasLeads: leads.length > 0,
      isLoading,
      error,
      syncStatus,
      syncError,
    }),
    [leads, batchId, batchName, routeName, sourceFile, slug, isLoading, error, syncStatus, syncError]
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
}
