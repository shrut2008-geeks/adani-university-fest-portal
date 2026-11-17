import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { DashboardPage } from './pages/DashboardPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { RegistrationsPage } from './pages/RegistrationsPage';
import { SponsorsPage } from './pages/SponsorsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans">
      <AnnouncementBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('AU Fest Error Caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FAF8FB]">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-200 shadow-xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-50 text-[#6B1B6E] flex items-center justify-center text-xl font-bold">
              🏛️
            </div>
            <h2 className="text-xl font-black text-gray-900">Something went wrong</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              We encountered a temporary interface issue. Please click below to reload the portal.
            </p>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#6B1B6E] hover:opacity-95 shadow-sm transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
