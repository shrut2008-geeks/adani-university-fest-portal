import React, { useState, useEffect } from 'react';
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

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle Escape key and body scroll lock for mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Navigation Links
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
    <>
      <nav className="sticky top-0 z-40 w-full bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Left: Logo & University Title */}
            <div className="flex items-center flex-shrink-0 whitespace-nowrap mr-3 xl:mr-6">
              <Link to="/" className="flex items-center gap-3 group">
                <img 
                  src="/logo.png" 
                  alt="Adani University Logo" 
                  className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0 transition-transform duration-200 group-hover:scale-105" 
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

            {/* Center: Desktop Navigation Links with animated active pill & indicator */}
            <div className="hidden min-[1100px]:flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
              {navLinks.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active 
                        ? 'bg-[var(--hero-bg)] text-[var(--primary)] shadow-sm' 
                        : 'text-[var(--text)] hover:text-[var(--primary)] hover:bg-[var(--hero-bg)]/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${active ? 'scale-110 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                    <span>{item.name}</span>
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--primary)] rounded-full animate-fade-in-up" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right: Subtle university text link + Single Primary Action */}
            <div className="hidden min-[1100px]:flex items-center gap-4 flex-shrink-0 whitespace-nowrap">
              {/* External university link pointing to https://www.adaniuni.ac.in/ with label "adaniuni.ac.in" */}
              <a
                href="https://www.adaniuni.ac.in/"
                target="_blank"
                rel="noreferrer"
                className="text-xs hover:underline font-medium transition-colors inline-flex items-center gap-1 hover:text-[var(--primary)]"
                style={{ color: 'var(--text-muted)' }}
              >
                adaniuni.ac.in
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
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all btn-press"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : location.pathname !== '/login' ? (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 btn-press"
                  style={{ background: 'var(--primary)' }}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              ) : null}
            </div>

            {/* Mobile / Tablet Hamburger Toggle */}
            <div className="flex min-[1100px]:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors btn-press"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Accessible Mobile Hamburger Menu (Slide-in Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 min-[1100px]:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in panel */}
          <div 
            className="fixed top-0 right-0 bottom-0 w-72 sm:w-80 max-w-[85vw] bg-[var(--surface)] z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in-right border-l border-[var(--border)]"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                  <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
                    AU Fest Portal
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors btn-press"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-5 space-y-1.5">
                {navLinks.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        active 
                          ? 'bg-[var(--hero-bg)] text-[var(--primary)] font-bold shadow-sm' 
                          : 'text-[var(--text)] hover:bg-[var(--hero-bg)]/40 hover:text-[var(--primary)]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer & User / Auth Actions */}
            <div className="pt-6 border-t border-[var(--border)] space-y-4">
              {/* External university link pointing to https://www.adaniuni.ac.in/ with label "adaniuni.ac.in" */}
              <a
                href="https://www.adaniuni.ac.in/"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold flex items-center justify-between px-3.5 py-2 rounded-xl transition-colors hover:bg-gray-50 border border-[var(--border)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1.5">
                  adaniuni.ac.in
                  <ExternalLink className="w-3 h-3 text-[var(--primary)]" />
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Official</span>
              </a>

              {isAuthenticated ? (
                <div className="p-3.5 bg-[var(--hero-bg)] rounded-2xl border border-[var(--border)] space-y-3">
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Signed in as</p>
                    <p className="text-xs font-bold truncate mt-0.5" style={{ color: 'var(--text)' }}>{user?.email}</p>
                    <div className="mt-1.5">
                      <StatusBadge status={user?.role} />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-colors btn-press shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              ) : location.pathname !== '/login' ? (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 btn-press"
                  style={{ background: 'var(--primary)' }}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
