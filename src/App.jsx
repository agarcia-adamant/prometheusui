import { useState } from 'react';
import { leads } from './data/leads';
import { Flame, Phone, MapPin, Star, Search } from 'lucide-react';
import './App.css';
import Prometheus from './assets/Prometheus.svg'

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = searchQuery.trim()
    ? leads.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leads;

  const formatPhone = (phone) => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 safe-area-top">
        <div className="px-3 sm:px-5 py-3 sm:py-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                <img src={Prometheus} alt="Prometheus Logo" className="w-7 h-7" />
              </div>
              <span className="font-bold text-xl brand-gradient-text hidden sm:block">Prometheus</span>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-red-50 border border-orange-200/50">
              <span className="text-sm font-semibold text-[var(--color-brand-orange)]">{filteredLeads.length} leads</span>
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
                w-full h-12 pl-12 pr-4 rounded-2xl
                bg-slate-100 border-2 border-transparent
                text-slate-700 placeholder:text-slate-400
                focus:outline-none focus:bg-white focus:border-orange-300
                text-base
              "
            />
          </div>
        </div>
      </header>

      {/* Leads List */}
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
          filteredLeads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => handleCall(lead.phone)}
              className="w-full text-left bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm active:bg-slate-50"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Lead Number */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                  <span className="text-xs sm:text-sm font-bold text-slate-400">#{lead.id}</span>
                </div>

                {/* Lead Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-base truncate mb-0.5">
                    {lead.name}
                  </h3>
                  
                  {/* Phone - Main CTA */}
                  <div className="flex items-center gap-2 text-[var(--color-brand-orange)] font-medium">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{formatPhone(lead.phone)}</span>
                  </div>
                  
                  {/* Address & Rating */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="text-xs truncate max-w-[100px] sm:max-w-[180px] md:max-w-[250px]">{lead.address}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="text-xs font-medium">{lead.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Call Icon */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl brand-gradient flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
                </div>
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  );
}

export default App;
