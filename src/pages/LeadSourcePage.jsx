import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LeadsProvider } from '../context/LeadsContext';
import { CallTrackingProvider } from '../context/CallTrackingContext';
import { getRouteBySlug } from '../data/routeConfig';
import DriverView from './DriverView';

/**
 * Wrapper component that loads leads based on URL slug
 */
export default function LeadSourcePage() {
  const { slug } = useParams();
  const route = getRouteBySlug(slug);

  if (!route) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Lead list not found
          </h1>
          <p className="text-slate-500 mb-6">
            The lead list "{slug}" doesn't exist.
          </p>
          
        </div>
      </div>
    );
  }

  return (
    <LeadsProvider slug={slug}>
      <CallTrackingProvider>
        <DriverView />
      </CallTrackingProvider>
    </LeadsProvider>
  );
}
