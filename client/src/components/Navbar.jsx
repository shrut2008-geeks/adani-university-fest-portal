import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { 
  Home, 
  Calendar, 
  Users, 
  BarChart3, 
  Ticket, 
  LogOut, 
  LogIn, 
  Menu, 
  X,
  ExternalLink
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Requirement: Menu: Dashboard, Clubs, Events, Registrations, Reports, all on one line.
  const navLinks = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Clubs', path: '/clubs', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Registrations', path: '/registrations', icon: Ticket },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Left: Logo & University Title (flex-shrink-0 and whitespace-nowrap so never overlapped) */}
          <div className="flex items-center flex-shrink-0 whitespace-nowrap mr-3 xl:mr-6">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Adani University Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0" 
              />
              <div className="flex flex-col whitespace-nowrap">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black tracking-tight font-sans" style={{ color: 'var(--primary)' }}>
                    adani
                  </span>
                  <span className="text-sm sm:text-base font-semibold" style={{ color: 'var(--text)' }}>
                    University
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Club &amp; Event Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links (Clean Single Line, visible above 1100px) */}
          <div className="hidden min-[1100px]:flex items-center gap-1 flex-nowrap whitespace-nowrap">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active 
                      ? 'bg-[var(--hero-bg)]' 
                      : 'hover:bg-[var(--hero-bg)]'
                  }`}
                  style={{
                    color: active ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right: Subtle university text link + Single Primary Button */}
          <div className="hidden min-[1100px]:flex items-center gap-4 flex-shrink-0 whitespace-nowrap">
            {/* Small text link for university */}
            <a
              href="https://www.adaniuni.ac.in/"
              target="_blank"
              rel="noreferrer"
              className="text-xs hover:underline font-medium transition-colors inline-flex items-center gap-1"
              style={{ color: 'var(--text-muted)' }}
            >
              adani.ac.in
              <ExternalLink className="w-3 h-3" />
            </a>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-[var(--border)]">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold truncate max-w-[150px]" style={{ color: 'var(--text)' }}>
                    {user?.email}
                  </span>
                  <StatusBadge status={user?.role} />
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : location.pathname !== '/login' ? (
              /* One main button on the right */
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:opacity-95"
                style={{ background: 'var(--primary)' }}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            ) : null}
          </div>

          {/* Mobile / Tablet menu hamburger: visible below 1100px */}
          <div className="flex min-[1100px]:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown menu below 1100px */}
      {mobileMenuOpen && (
        <div className="min-[1100px]:hidden border-b border-[var(--border)] bg-[var(--surface)] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold ${
                  active 
                    ? 'bg-[var(--hero-bg)]' 
                    : 'hover:bg-[var(--hero-bg)]'
                }`}
                style={{
                  color: active ? 'var(--primary)' : 'var(--text)',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }} />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <a
              href="https://adani.ac.in"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium flex items-center gap-1 px-3 py-1"
              style={{ color: 'var(--text-muted)' }}
            >
              adani.ac.in ↗
            </a>

            {isAuthenticated ? (
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Signed in as</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{user?.email}</p>
                  <div className="mt-1">
                    <StatusBadge status={user?.role} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : location.pathname !== '/login' ? (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm"
                style={{ background: 'var(--primary)' }}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
};
