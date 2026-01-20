import { Phone, MapPin, ChevronRight, User } from 'lucide-react';

export default function LeadCard({ lead, index, onCall }) {
  const handleCall = (e) => {
    e.stopPropagation();
    onCall(lead);
  };

  return (
    <div 
      className={`
        premium-surface rounded-[2rem] p-5 
        touch-feedback cursor-pointer
        animate-fade-in-up opacity-0
        stagger-${Math.min(index + 1, 8)}
      `}
      onClick={handleCall}
    >
      <div className="flex items-center gap-4">
        {/* Avatar/Index */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
          <span className="text-lg font-bold text-slate-400">#{lead.id}</span>
        </div>

        {/* Lead Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-lg truncate mb-1">
            {lead.name || 'Unknown Business'}
          </h3>
          
          <div className="flex items-center gap-2 text-slate-500">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate">{lead.phoneDisplay}</span>
          </div>
          
          {lead.address && (
            <div className="flex items-center gap-2 text-slate-400 mt-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs truncate">{lead.address}</span>
            </div>
          )}
        </div>

        {/* Call Button */}
        <button
          onClick={handleCall}
          className="
            w-16 h-16 rounded-2xl shimmer-btn
            flex items-center justify-center
            shadow-lg shadow-orange-500/20
            touch-feedback relative pulse-ring
            hover:shadow-xl hover:shadow-orange-500/30
            transition-shadow
          "
          aria-label={`Call ${lead.name}`}
        >
          <Phone className="w-7 h-7 text-white" fill="white" />
        </button>
      </div>
    </div>
  );
}
