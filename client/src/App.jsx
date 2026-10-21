import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { RegistrationsPage } from './pages/RegistrationsPage';
import { SponsorsPage } from './pages/SponsorsPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans">
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
                <Route path="/login" element={<LoginPage />} />
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
                    {/* Footer brand — "AU Fest" not "ANTIGRAVITY" */}
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
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
