import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { StatusBadge, getEventStatusInfo } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  Award,
  IndianRupee,
  Ticket,
  ArrowRight,
  MapPin,
  Clock,
  RefreshCw,
  Server,
  AlertTriangle,
  Loader2
} from 'lucide-react';

// ── Shared fill-percentage helper (1 decimal place) ─────────────────────────
export const fillPct = (registered, capacity) => {
  if (!capacity || capacity <= 0) return null;
  return ((registered / capacity) * 100).toFixed(1);
};

// ── Countdown helper ─────────────────────────────────────────────────────────
const useCountdown = (targetDate) => {
  const calc = () => {
    if (!targetDate) return null;
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds };
  };
  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return remaining;
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const MAX_AUTO_RETRIES = 3;

  useEffect(() => {
    fetchStats(0);
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const fetchStats = async (attempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
      const data = await res.json();
      setStats(data);
      setRetryAttempt(0);
      setIsRetrying(false);
    } catch (err) {
      if (attempt < MAX_AUTO_RETRIES) {
        setIsRetrying(true);
        setRetryAttempt(attempt + 1);
        retryTimeoutRef.current = setTimeout(() => {
          fetchStats(attempt + 1);
        }, 3500);
      } else {
        setIsRetrying(false);
        setError(err.message || 'Unable to connect to the server');
      }
    } finally {
      if (attempt >= MAX_AUTO_RETRIES || stats) {
        setLoading(false);
      }
    }
  };

  const handleManualRetry = () => {
    setRetryAttempt(0);
    setIsRetrying(false);
    fetchStats(0);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const countdown = useCountdown(stats?.nextEvent?.date);

  return (
    <div className="space-y-10 pb-16">

      {/* ── Server Wake-up Notice (When Retrying or Cold Start) ── */}
      {isRetrying && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-sm flex items-center justify-between gap-3 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <Server className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Server is waking up, please wait...
              </p>
              <p className="text-[11px] text-amber-700">
                Render free-tier spinning up. Auto-retrying (Attempt {retryAttempt} of {MAX_AUTO_RETRIES})...
              </p>
            </div>
          </div>
          <Loader2 className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
        </div>
      )}

      {/* ── Manual Error Banner (if all retries failed) ── */}
      {error && !loading && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Server is taking longer than usual to respond
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                The Render backend might still be waking up from sleep. Click retry to reconnect.
              </p>
            </div>
          </div>
          <button
            onClick={handleManualRetry}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm btn-press self-end sm:self-auto flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* ── Hero Section with Animated Gradient & Fade-In-Up ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12 animate-gradient-flow"
        style={{
          background: 'linear-gradient(135deg, #F3E8F5 0%, #EFE1F2 50%, #F8EFF9 100%)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px -2px rgba(107,27,114,0.06)'
        }}
      >
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all"
          style={{ background: 'rgba(107,27,114,0.12)' }} 
        />
        <div 
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all"
          style={{ background: 'rgba(29,78,216,0.08)' }} 
        />

        {/* Two-column layout: Text + Next Event Spotlight */}
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start justify-between">

          {/* Left: Animated Text Content */}
          <div className="flex-1 space-y-5 max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4CCE1] text-[11px] font-bold text-[#6B1B72] shadow-sm backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#6B1B72] animate-ping" />
              Annual Tech &amp; Cultural Fest
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]" style={{ color: 'var(--text)' }}>
              Adani University <br />
              <span style={{ color: 'var(--primary)' }}>Club &amp; Event Portal</span>
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-gray-600 max-w-xl">
              Discover student clubs, explore scheduled competitions and cultural sessions,
              and reserve attendee passes with instant capacity confirmation.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link 
                to="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-sm hover:opacity-95 btn-press"
                style={{ background: 'var(--primary)' }}
              >
                <Ticket className="w-4 h-4" /> Explore Events
              </Link>
              <Link 
                to="/clubs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-white/90 btn-press"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} /> Browse Clubs
              </Link>
            </div>
          </div>

          {/* Right: Next event spotlight countdown */}
          {!loading && stats?.nextEvent && countdown && (
            <div
              className="w-full lg:w-72 flex-shrink-0 rounded-2xl p-5 space-y-4 theme-card animate-fade-in-up"
              style={{ background: 'var(--surface)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                  ⚡ Next Planned Event
                </p>
                <StatusBadge status={stats.nextEvent.status} />
              </div>
              <div>
                <h3 className="font-black text-base leading-snug" style={{ color: 'var(--text)' }}>
                  {stats.nextEvent.title}
                </h3>
                <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {stats.nextEvent.club_name}
                </p>
              </div>
              <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6B1B72]" />
                  <span>{new Date(stats.nextEvent.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {stats.nextEvent.venue_name && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6B1B72]" />
                    <span>{stats.nextEvent.venue_name}</span>
                  </div>
                )}
              </div>

              {/* Countdown tiles */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: 'Days', val: countdown.days },
                  { label: 'Hrs', val: countdown.hours },
                  { label: 'Min', val: countdown.minutes },
                  { label: 'Sec', val: countdown.seconds },
                ].map(({ label, val }) => (
                  <div 
                    key={label} 
                    className="flex flex-col items-center rounded-xl py-2"
                    style={{ background: 'var(--hero-bg)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-lg font-black tabular-nums" style={{ color: 'var(--primary)' }}>
                      {String(val).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <Link 
                to={`/events/${stats.nextEvent.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:opacity-95 btn-press"
                style={{ background: 'var(--primary)' }}
              >
                Event Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards with Count-Up Animation & Skeletons ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Fest Overview &amp; Key Metrics
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="h-32 rounded-2xl relative overflow-hidden theme-card p-5"
              >
                <div className="space-y-3">
                  <div className="w-24 h-3 rounded bg-gray-200/80 animate-pulse" />
                  <div className="w-16 h-7 rounded bg-gray-200 animate-pulse" />
                  <div className="w-36 h-2.5 rounded bg-gray-100 animate-pulse" />
                </div>
                <div className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5`}>
            <StatCard 
              title="Active Clubs" 
              value={stats?.totals?.clubs || 0} 
              icon={Users} 
              accentColor="purple"
              subtitle="Registered campus student societies" 
            />
            <StatCard 
              title="Registered Members" 
              value={stats?.totals?.members || 0} 
              icon={Award} 
              accentColor="purple"
              subtitle="Students across all clubs" 
            />
            <StatCard 
              title="Fest Events" 
              value={stats?.totals?.events || 0} 
              icon={Calendar} 
              accentColor="purple"
              subtitle="Scheduled competitions & symposiums" 
            />
            {isAdmin && (
              <StatCard 
                title="Sponsorship Received" 
                value={formatCurrency(stats?.totals?.sponsorshipReceived)}
                icon={IndianRupee} 
                accentColor="purple" 
                subtitle="Approved corporate contributions only" 
              />
            )}
          </div>
        )}
      </section>

      {/* ── Upcoming Events + Participation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Events list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Calendar className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Upcoming Fest Events
            </h2>
            <Link to="/events" className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div 
                  key={n} 
                  className="h-28 rounded-2xl relative overflow-hidden theme-card p-5"
                >
                  <div className="flex justify-between items-center h-full">
                    <div className="space-y-2 flex-1">
                      <div className="w-20 h-4 rounded-full bg-gray-200 animate-pulse" />
                      <div className="w-48 h-5 rounded bg-gray-200 animate-pulse" />
                      <div className="w-36 h-3 rounded bg-gray-100 animate-pulse" />
                    </div>
                    <div className="w-16 h-8 rounded bg-gray-200 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              ))
            ) : stats?.upcomingEvents?.length === 0 ? (
              <div 
                className="p-8 text-center rounded-2xl text-sm theme-card"
                style={{ color: 'var(--text-muted)' }}
              >
                No upcoming events scheduled right now.
              </div>
            ) : stats?.upcomingEvents?.map((evt) => {
              const venueCap = evt.capacity || evt.venue_capacity || 0;
              const isFull = venueCap > 0 && evt.registration_count >= venueCap;
              const pct = fillPct(evt.registration_count, venueCap);
              const statusInfo = getEventStatusInfo({
                ...evt,
                venue_capacity: venueCap,
                registrations_count: evt.registration_count
              });

              return (
                <Link 
                  key={evt.id} 
                  to={`/events/${evt.id}`}
                  className="block p-5 rounded-2xl transition-all theme-card group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Real-data Colour-coded Status Badge */}
                        <StatusBadge status={statusInfo.label} />
                        <span className="text-xs font-bold truncate" style={{ color: 'var(--primary)' }}>
                          {evt.club_name}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text)' }}>
                        {evt.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(evt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {evt.venue_name || 'Main Campus'} {venueCap > 0 ? `(Cap: ${venueCap})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Registrations</p>
                        <p className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                          {evt.registration_count} / {venueCap > 0 ? venueCap : '∞'}
                        </p>
                        {evt.status === 'Completed' ? (
                          <span className="inline-block text-[10px] font-semibold text-gray-500">
                            {evt.feedback_count > 0 ? 'View feedback' : 'Event completed'}
                          </span>
                        ) : pct !== null && (
                          <p className="text-[10px] font-semibold" style={{ color: isFull ? '#ef4444' : pct >= 80 ? '#d97706' : '#15803d' }}>
                            {isFull ? 'Full' : `${pct}% filled`}
                          </p>
                        )}
                      </div>
                      <span className="p-2.5 rounded-xl transition-transform duration-200 group-hover:translate-x-1" style={{ background: 'var(--hero-bg)', color: 'var(--primary)' }}>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: participation + admin sponsorships */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl space-y-4 theme-card">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Ticket className="w-4 h-4 text-emerald-600" /> Fest Participation
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Total Registrations', val: stats?.totals?.registrations || 0, style: { color: 'var(--text)' } },
                { label: 'Checked-In Attendees', val: stats?.totals?.attended || 0, style: { color: '#15803D' } },
                { label: 'Attendance Rate', val: `${stats?.totals?.registrations ? Math.round((stats.totals.attended / stats.totals.registrations) * 100) : 0}%`, style: { color: 'var(--primary)' } },
              ].map(({ label, val, style }) => (
                <div key={label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-sm font-bold" style={style}>{val}</span>
                </div>
              ))}
            </div>
            <Link 
              to="/registrations"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-[var(--primary)] hover:text-white btn-press"
              style={{ background: 'var(--hero-bg)', color: 'var(--primary)', border: '1px solid rgba(107,27,114,0.2)' }}
            >
              View Registrations
            </Link>
          </div>

          {isAdmin && (
            <div className="p-6 rounded-2xl space-y-4 theme-card">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <IndianRupee className="w-4 h-4 text-emerald-600" /> Recent Sponsorships
                </h3>
                <Link to="/sponsors" className="text-xs font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {stats?.recentPayments?.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No recent payments recorded.</p>
                ) : stats?.recentPayments?.map((pay) => (
                  <div 
                    key={pay.id} 
                    className="p-3.5 rounded-xl text-xs space-y-1.5 transition-all hover:border-[var(--primary)]/40"
                    style={{ background: 'var(--hero-bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>{pay.sponsor_name || 'University Grant'}</span>
                      <StatusBadge status={pay.status} />
                    </div>
                    <div className="flex justify-between items-start gap-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="break-words leading-tight flex-1 text-gray-600">{pay.event_title}</span>
                      <span className="font-bold text-emerald-600 flex-shrink-0">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pay.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
