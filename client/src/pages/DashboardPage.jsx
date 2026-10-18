import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
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
  Timer,
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

  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
      setStats(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const countdown = useCountdown(stats?.nextEvent?.date);

  return (
    <div className="space-y-10 pb-16">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 sm:p-10"
        style={{ background: 'var(--hero-bg)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(30,27,46,0.08)' }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(107,27,114,0.08)' }} />

        {/* Two-column: text + next-event card */}
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">

          {/* Left: text */}
          <div className="flex-1 space-y-4 max-w-2xl">


            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--text)' }}>
              Adani University <br />
              <span style={{ color: 'var(--primary)' }}>Club &amp; Event Portal</span>
            </h1>

            <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Discover student clubs, explore scheduled competitions and cultural sessions,
              and reserve attendee passes with instant capacity confirmation.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                <Ticket className="w-4 h-4" /> Explore Events
              </Link>
              <Link to="/clubs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} /> Browse Clubs
              </Link>
            </div>
          </div>

          {/* Right: next event countdown */}
          {!loading && stats?.nextEvent && countdown && (
            <div
              className="w-full lg:w-72 flex-shrink-0 rounded-2xl p-5 space-y-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(30,27,46,0.08)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                ⚡ Next Planned Event
              </p>
              <div>
                <h3 className="font-black text-base leading-snug" style={{ color: 'var(--text)' }}>
                  {stats.nextEvent.title}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {stats.nextEvent.club_name}
                </p>
              </div>
              <div className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(stats.nextEvent.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                {stats.nextEvent.venue_name && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {stats.nextEvent.venue_name}
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
                  <div key={label} className="flex flex-col items-center rounded-xl py-2"
                    style={{ background: 'var(--hero-bg)', border: '1px solid var(--border)' }}>
                    <span className="text-xl font-black tabular-nums" style={{ color: 'var(--primary)' }}>
                      {String(val).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <Link to={`/events/${stats.nextEvent.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                Event Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Fest Overview &amp; Key Metrics
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 rounded-2xl animate-pulse"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5`}>
            <StatCard title="Active Clubs" value={stats?.totals?.clubs || 0} icon={Users} accentColor="purple"
              subtitle="Registered campus student societies" />
            <StatCard title="Registered Members" value={stats?.totals?.members || 0} icon={Award} accentColor="purple"
              subtitle="Students across all clubs" />
            <StatCard title="Fest Events" value={stats?.totals?.events || 0} icon={Calendar} accentColor="purple"
              subtitle="Scheduled competitions & symposiums" />
            {isAdmin && (
              <StatCard title="Sponsorship Received" value={formatCurrency(stats?.totals?.sponsorshipReceived)}
                icon={IndianRupee} accentColor="purple" subtitle="Approved corporate contributions only" />
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
              [1,2,3].map(n => (
                <div key={n} className="h-24 rounded-2xl animate-pulse"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
              ))
            ) : stats?.upcomingEvents?.length === 0 ? (
              <div className="p-8 text-center rounded-2xl text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                No upcoming events scheduled right now.
              </div>
            ) : stats?.upcomingEvents?.map((evt) => {
              const venueCap = evt.capacity || evt.venue_capacity || 0;
              const isFull = venueCap > 0 && evt.registration_count >= venueCap;
              const pct = fillPct(evt.registration_count, venueCap);

              return (
                <Link key={evt.id} to={`/events/${evt.id}`}
                  className="block p-5 rounded-2xl shadow-sm transition-all theme-card"
                  style={{ '--hover-border': 'var(--primary)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={evt.status} />
                        <span className="text-xs font-bold truncate" style={{ color: 'var(--primary)' }}>
                          {evt.club_name}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text)' }}>
                        {evt.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
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
                          <p className="text-[10px]" style={{ color: isFull ? '#ef4444' : 'var(--text-muted)' }}>
                            {isFull ? 'Full' : `${pct}% filled`}
                          </p>
                        )}
                      </div>
                      <span className="p-2 rounded-xl" style={{ background: 'var(--hero-bg)', color: 'var(--primary)' }}>
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
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-sm font-bold" style={style}>{val}</span>
                </div>
              ))}
            </div>
            <Link to="/registrations"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors"
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
                  <div key={pay.id} className="p-3.5 rounded-xl text-xs space-y-1.5"
                    style={{ background: 'var(--hero-bg)', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>{pay.sponsor_name || 'University Grant'}</span>
                      <StatusBadge status={pay.status} />
                    </div>
                    <div className="flex justify-between items-start gap-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="break-words leading-tight flex-1" style={{ color: 'var(--text-muted)' }}>{pay.event_title}</span>
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
