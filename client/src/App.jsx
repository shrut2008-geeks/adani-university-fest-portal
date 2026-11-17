import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { AnnouncementBanner } from './components/AnnouncementBanner';

// Route-level Code Splitting for ultrafast initial page loads on mobile & desktop
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ClubsPage = lazy(() => import('./pages/ClubsPage').then(m => ({ default: m.ClubsPage })));
const ClubDetailPage = lazy(() => import('./pages/ClubDetailPage').then(m => ({ default: m.ClubDetailPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const RegistrationsPage = lazy(() => import('./pages/RegistrationsPage').then(m => ({ default: m.RegistrationsPage })));
const SponsorsPage = lazy(() => import('./pages/SponsorsPage').then(m => ({ default: m.SponsorsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 rounded-full border-2 border-[#6B1B6E]/30 border-t-[#6B1B6E] animate-spin" />
    <span className="text-xs font-medium text-gray-400">Loading Adani Fest...</span>
  </div>
);

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans">
      <AnnouncementBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/clubs/:id" element={<ClubDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/registrations" element={<RegistrationsPage />} />
            <Route path="/my-registrations" element={<RegistrationsPage />} />
            <Route path="/sponsors" element={<SponsorsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer: stays dark (--footer-bg) with light text */}
      <footer className="border-t border-white/10 bg-[var(--footer-bg)] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Adani University Logo" 
              className="h-8 w-8 rounded-lg object-contain p-0.5 bg-white border border-white/20" 
            />
            <div>
              <p className="font-bold text-white tracking-wide">AU Fest</p>
              <p className="text-[11px] text-slate-400">Adani University Tech & Cultural Fest</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Shantigram, SG Highway, Ahmedabad, Gujarat</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
