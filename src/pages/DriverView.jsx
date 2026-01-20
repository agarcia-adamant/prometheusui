import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { leads } from '../data/leads';
import { useCallTracking } from '../context/CallTrackingContext';
import Header from '../components/shared/Header';
import SearchBar from '../components/shared/SearchBar';
import LeadCard from '../components/shared/LeadCard';

export default function DriverView() {
  const [searchQuery, setSearchQuery] = useState('');
  const { recordCall, hasBeenCalled } = useCallTracking();

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(lead =>
      lead.name.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.address.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCall = (lead) => {
    recordCall(lead.id, lead.name, lead.phone);
    window.location.href = `tel:${lead.phone}`;
  };

  const uncalledLeads = filteredLeads.filter(l => !hasBeenCalled(l.id));
  const calledLeads = filteredLeads.filter(l => hasBeenCalled(l.id));

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header >
        <div className="flex items-center gap-3 mb-3">
          <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-red-50 border border-orange-200/50">
            <span className="text-sm font-semibold text-[var(--color-brand-orange)]">
              {uncalledLeads.length} remaining
            </span>
          </div>
          {calledLeads.length > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="text-sm font-semibold text-emerald-600">
                {calledLeads.length} called
              </span>
            </div>
          )}
        </div>
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Search leads..."
        />
      </Header>

      <main className="px-3 sm:px-4 md:px-6 py-4 space-y-2 sm:space-y-3 safe-area-bottom pb-8 max-w-3xl mx-auto">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-1">No leads found</h3>
            <p className="text-slate-400">Try a different search term</p>
          </div>
        ) : (
          <>
            {/* Uncalled leads first */}
            {uncalledLeads.map((lead) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                onCall={handleCall}
                isCalled={false}
                showCallStatus
              />
            ))}
            
            {/* Called leads section */}
            {calledLeads.length > 0 && (
              <>
                <div className="flex items-center gap-3 pt-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Already Called</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                
                {calledLeads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onCall={handleCall}
                    isCalled={true}
                    showCallStatus
                  />
                ))}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
