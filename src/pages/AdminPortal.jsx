import { useState, useMemo } from 'react';
import { Phone, PhoneCall, Calendar, Users, Trash2, Search } from 'lucide-react';
import { leads } from '../data/leads';
import { useCallTracking } from '../context/CallTrackingContext';
import { formatPhone, formatRelativeTime } from '../utils/formatters';
import Header from '../components/shared/Header';
import SearchBar from '../components/shared/SearchBar';
import StatCard from '../components/shared/StatCard';

export default function AdminPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('all'); // 'all', 'called', 'uncalled'
  const { callHistory, getStats, hasBeenCalled, getCallInfo, clearHistory } = useCallTracking();
  
  const stats = getStats();

  const filteredLeads = useMemo(() => {
    let filtered = leads;
    
    // Filter by call status
    if (view === 'called') {
      filtered = filtered.filter(l => hasBeenCalled(l.id));
    } else if (view === 'uncalled') {
      filtered = filtered.filter(l => !hasBeenCalled(l.id));
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.address.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [searchQuery, view, callHistory]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all call history? This cannot be undone.')) {
      clearHistory();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header showNav>
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Search leads..."
        />
      </Header>

      <main className="px-3 sm:px-4 md:px-6 py-4 safe-area-bottom pb-8 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard 
            icon={Users} 
            label="Total Leads" 
            value={leads.length} 
            color="slate"
          />
          <StatCard 
            icon={PhoneCall} 
            label="Leads Called" 
            value={stats.uniqueLeadsCalled} 
            color="emerald"
          />
          <StatCard 
            icon={Phone} 
            label="Total Calls" 
            value={stats.totalCalls} 
            color="orange"
          />
          <StatCard 
            icon={Calendar} 
            label="Called Today" 
            value={stats.callsToday} 
            color="blue"
          />
        </div>

        {/* Filter Tabs & Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setView('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                view === 'all' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({leads.length})
            </button>
            <button
              onClick={() => setView('called')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                view === 'called' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Called ({stats.uniqueLeadsCalled})
            </button>
            <button
              onClick={() => setView('uncalled')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                view === 'uncalled' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Uncalled ({leads.length - stats.uniqueLeadsCalled})
            </button>
          </div>

          {stats.uniqueLeadsCalled > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear History</span>
            </button>
          )}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Lead
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                    Phone
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Rating
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                    Last Called
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Calls
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No leads found</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const callInfo = getCallInfo(lead.id);
                    const called = !!callInfo;
                    
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-400">#{lead.id}</span>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{lead.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
                                {lead.address}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-slate-600">{formatPhone(lead.phone)}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-amber-600">⭐ {lead.rating}</span>
                        </td>
                        <td className="px-4 py-3">
                          {called ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <PhoneCall className="w-3 h-3" />
                              Called
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {callInfo ? (
                            <span className="text-sm text-slate-500">
                              {formatRelativeTime(callInfo.lastCalled)}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {callInfo ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                              {callInfo.callCount}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 text-center text-sm text-slate-400">
          Showing {filteredLeads.length} of {leads.length} leads
        </div>
      </main>
    </div>
  );
}
