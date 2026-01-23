import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, PhoneCall, Calendar, Users, MapPin, Clock, 
  TrendingUp, RefreshCw, AlertCircle, ArrowLeft
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { formatPhone, formatRelativeTime } from '../utils/formatters';
import Header from '../components/shared/Header';
import StatCard from '../components/shared/StatCard';

export default function ManagerDashboard() {
  const [batches, setBatches] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add your credentials to .env');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all batches with call counts
      const { data: batchData, error: batchError } = await supabase
        .from('lead_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchError) throw batchError;

      // Fetch call counts per batch
      const { data: callCounts, error: countError } = await supabase
        .from('call_events')
        .select('batch_id');

      if (countError) throw countError;

      // Count calls per batch
      const callCountMap = {};
      callCounts?.forEach(call => {
        callCountMap[call.batch_id] = (callCountMap[call.batch_id] || 0) + 1;
      });

      // Merge call counts with batch data
      const batchesWithCounts = batchData?.map(batch => ({
        ...batch,
        calls_made: callCountMap[batch.id] || 0,
      })) || [];

      setBatches(batchesWithCounts);

      // Fetch recent calls (last 50)
      const { data: callData, error: callError } = await supabase
        .from('call_events')
        .select(`
          id,
          lead_id,
          lead_name,
          lead_phone,
          lead_address,
          called_at,
          device_id,
          batch_id,
          lead_batches (name)
        `)
        .order('called_at', { ascending: false })
        .limit(50);

      if (callError) throw callError;

      setRecentCalls(callData || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate aggregate stats
  const stats = useMemo(() => {
    const totalLeads = batches.reduce((sum, b) => sum + (b.lead_count || 0), 0);
    const totalCalls = batches.reduce((sum, b) => sum + (b.calls_made || 0), 0);
    const activeBatches = batches.filter(b => b.calls_made > 0).length;
    
    // Calculate unique leads called (approximate from recent calls)
    const uniqueLeadKeys = new Set(
      recentCalls.map(c => `${c.batch_id}:${c.lead_id}`)
    );
    
    // Today's calls
    const today = new Date().toDateString();
    const callsToday = recentCalls.filter(
      c => new Date(c.called_at).toDateString() === today
    ).length;

    return {
      totalLeads,
      totalCalls,
      activeBatches,
      totalBatches: batches.length,
      uniqueLeadsCalled: uniqueLeadKeys.size,
      callsToday,
    };
  }, [batches, recentCalls]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Header>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </Header>
        <main className="px-4 py-16 text-center max-w-lg mx-auto">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Supabase Not Configured
          </h2>
          <p className="text-slate-500 mb-6">
            To use the manager dashboard, you need to configure Supabase credentials in your <code className="bg-slate-100 px-1 rounded">.env</code> file.
          </p>
          <div className="bg-slate-100 rounded-lg p-4 text-left text-sm font-mono text-slate-600">
            VITE_SUPABASE_URL=your_url<br />
            VITE_SUPABASE_ANON_KEY=your_key
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header>
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </Header>

      <main className="px-3 sm:px-4 md:px-6 py-4 safe-area-bottom pb-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
          {lastRefresh && (
            <span className="text-xs text-slate-400">
              Updated {formatRelativeTime(lastRefresh.toISOString())}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Global Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard 
            icon={MapPin} 
            label="Lead Lists" 
            value={stats.totalBatches} 
            color="slate"
          />
          <StatCard 
            icon={Users} 
            label="Total Leads" 
            value={stats.totalLeads} 
            color="blue"
          />
          <StatCard 
            icon={Phone} 
            label="Total Calls" 
            value={stats.totalCalls} 
            color="orange"
          />
          <StatCard 
            icon={PhoneCall} 
            label="Leads Contacted" 
            value={stats.uniqueLeadsCalled} 
            color="emerald"
          />
          <StatCard 
            icon={Calendar} 
            label="Calls Today" 
            value={stats.callsToday} 
            color="purple"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Active Lists" 
            value={stats.activeBatches} 
            color="cyan"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lead Lists Performance */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800">Lead Lists Performance</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {isLoading && batches.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </div>
              ) : batches.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400">
                  No lead lists found
                </div>
              ) : (
                batches.map((batch) => {
                  const progress = batch.lead_count > 0 
                    ? Math.round((batch.calls_made / batch.lead_count) * 100)
                    : 0;
                  
                  return (
                    <div key={batch.id} className="px-4 py-3 hover:bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-800">
                            {batch.name || 'Unnamed List'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-500">
                            {batch.calls_made} / {batch.lead_count} calls
                          </span>
                          <span className={`font-semibold ${
                            progress >= 75 ? 'text-emerald-600' :
                            progress >= 50 ? 'text-amber-600' :
                            progress >= 25 ? 'text-orange-600' :
                            'text-slate-400'
                          }`}>
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800">Recent Activity</h2>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading && recentCalls.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </div>
              ) : recentCalls.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400">
                  No calls recorded yet
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentCalls.map((call) => (
                    <div key={call.id} className="px-4 py-3 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <PhoneCall className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">
                              {call.lead_name || `Lead #${call.lead_id}`}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatPhone(call.lead_phone)}
                            </p>
                            {call.lead_batches?.name && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {call.lead_batches.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(call.called_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Device Activity */}
        {recentCalls.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800">Activity by Device</h2>
            </div>
            <div className="p-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(
                  recentCalls.reduce((acc, call) => {
                    const device = call.device_id || 'Unknown';
                    if (!acc[device]) {
                      acc[device] = { calls: 0, lastActive: call.called_at };
                    }
                    acc[device].calls++;
                    if (new Date(call.called_at) > new Date(acc[device].lastActive)) {
                      acc[device].lastActive = call.called_at;
                    }
                    return acc;
                  }, {})
                ).map(([device, data]) => (
                  <div key={device} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate" title={device}>
                        {device.slice(0, 8)}...
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {data.calls} calls
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Last active {formatRelativeTime(data.lastActive)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
