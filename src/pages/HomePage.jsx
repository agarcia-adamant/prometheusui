import { Link } from 'react-router-dom';
import { MapPin, Phone, ChevronRight, LayoutDashboard } from 'lucide-react';
import { LEAD_ROUTES } from '../data/routeConfig';
import Header from '../components/shared/Header';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Select a lead list to start calling
          </p>
         
        </div>
      </Header>

      <main className="px-4 py-6 max-w-3xl mx-auto">
        {LEAD_ROUTES.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-1">
              No lead lists available
            </h3>
            <p className="text-slate-400 text-sm">
              Add cleaned CSV files to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide px-1">
              Available Lead Lists
            </h2>
            {LEAD_ROUTES.map((route) => (
              <Link
                key={route.slug}
                to={`/${route.slug}`}
                className="block bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-50 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-[var(--color-brand-orange)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-[var(--color-brand-orange)] transition-colors">
                        {route.name}
                      </h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {route.file}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[var(--color-brand-orange)] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
