import { useState, useMemo } from 'react';
import { 
  Flame, 
  Search, 
  Phone, 
  ArrowLeft,
  PhoneCall,
  X,
  Sparkles
} from 'lucide-react';
import LeadCard from './LeadCard';

export default function LeadsList({ leads, onReset }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [callHistory, setCallHistory] = useState(new Set());

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      lead.name?.toLowerCase().includes(query) ||
      lead.phone?.includes(query) ||
      lead.phoneDisplay?.includes(query) ||
      lead.address?.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  const handleCallLead = (lead) => {
    setSelectedLead(lead);
  };

  const confirmCall = () => {
    if (selectedLead) {
      // Mark as called
      setCallHistory(prev => new Set([...prev, selectedLead.id]));
      
      // Initiate call
      window.location.href = `tel:${selectedLead.phone}`;
      
      // Close modal after brief delay
      setTimeout(() => setSelectedLead(null), 500);
    }
  };

  const uncalledLeads = filteredLeads.filter(l => !callHistory.has(l.id));
  const calledLeads = filteredLeads.filter(l => callHistory.has(l.id));

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 safe-area-top">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onReset}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center touch-feedback hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg brand-gradient-text">Prometheus</span>
            </div>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-red-50 flex items-center justify-center">
              <span className="text-sm font-bold text-[var(--color-brand-orange)]">{leads.length}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full h-14 pl-12 pr-4 rounded-2xl
                bg-slate-100 border-2 border-transparent
                text-slate-700 placeholder:text-slate-400
                focus:outline-none focus:bg-white focus:border-[var(--color-brand-orange)]/30
                transition-all text-lg
              "
            />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-5 py-4 flex gap-3">
        <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[var(--color-brand-orange)]" />
            <span className="text-xs font-medium text-slate-500">Ready to call</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{uncalledLeads.length}</span>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <PhoneCall className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500">Called</span>
          </div>
          <span className="text-2xl font-bold text-emerald-600">{calledLeads.length}</span>
        </div>
      </div>

      {/* Leads List */}
      <main className="px-5 pb-8 space-y-4 safe-area-bottom">
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
            {uncalledLeads.map((lead, index) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                index={index}
                onCall={handleCallLead}
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
                
                {calledLeads.map((lead, index) => (
                  <div key={lead.id} className="opacity-60">
                    <LeadCard 
                      lead={lead} 
                      index={index}
                      onCall={handleCallLead}
                    />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </main>

      {/* Call Confirmation Modal */}
      {selectedLead && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setSelectedLead(null)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-t-[2.5rem] p-6 pb-10 safe-area-bottom"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* Lead info */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <span className="text-2xl font-bold text-slate-400">#{selectedLead.id}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {selectedLead.name || 'Unknown Business'}
              </h2>
              <p className="text-lg text-slate-500">{selectedLead.phoneDisplay}</p>
              {selectedLead.address && (
                <p className="text-sm text-slate-400 mt-1">{selectedLead.address}</p>
              )}
            </div>

            {/* Call button */}
            <button
              onClick={confirmCall}
              className="
                w-full h-20 rounded-3xl shimmer-btn
                flex items-center justify-center gap-4
                text-white font-bold text-xl
                shadow-xl shadow-orange-500/30
                touch-feedback
                hover:shadow-2xl hover:shadow-orange-500/40
                transition-shadow
              "
            >
              <Phone className="w-8 h-8" fill="white" />
              <span>Call Now</span>
            </button>

            {/* Cancel */}
            <button
              onClick={() => setSelectedLead(null)}
              className="w-full h-14 mt-4 rounded-2xl bg-slate-100 text-slate-600 font-semibold touch-feedback hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
