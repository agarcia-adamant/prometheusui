import { Phone, MapPin, Star, CheckCircle } from 'lucide-react';
import { formatPhone } from '../../utils/formatters';

export default function LeadCard({ lead, onCall, isCalled = false, showCallStatus = false }) {
  return (
    <button
      onClick={() => onCall(lead)}
      className={`
        w-full text-left bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border shadow-sm active:bg-slate-50
        ${isCalled ? 'border-emerald-200' : 'border-slate-100'}
      `}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Lead Number */}
        <div className={`
          w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 border
          ${isCalled 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-gradient-to-br from-slate-100 to-slate-50 border-slate-100'
          }
        `}>
          {showCallStatus && isCalled ? (
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
          ) : (
            <span className="text-xs sm:text-sm font-bold text-slate-400">#{lead.id}</span>
          )}
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
        <div className={`
          w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0
          ${isCalled ? 'bg-emerald-500' : 'brand-gradient'}
        `}>
          <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
        </div>
      </div>
    </button>
  );
}
