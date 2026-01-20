import { Link, useLocation } from 'react-router-dom';
import Prometheus from '../../assets/Prometheus.svg';

export default function Header({ children, showNav = false }) {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 safe-area-top">
      <div className="px-3 sm:px-5 py-3 sm:py-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <img src={Prometheus} alt="Prometheus Logo" className="w-7 h-7" />
            </div>
            <span className="font-bold text-xl brand-gradient-text hidden sm:block">Prometheus</span>
          </Link>

          {showNav && (
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Driver
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Admin
              </Link>
            </nav>
          )}
        </div>

        {children}
      </div>
    </header>
  );
}
