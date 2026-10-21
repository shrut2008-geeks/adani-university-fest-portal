import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  BarChart3, 
  Users, 
  IndianRupee, 
  Ticket, 
  Star, 
  Download, 
  ShieldAlert, 
  LogIn,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';

// Shared fill-percentage (1 decimal, same as EventsPage)
const fillPct = (registered, capacity) => {
  if (!capacity || capacity <= 0) return null;
  return ((registered / capacity) * 100).toFixed(1);
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const ReportsPage = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { 
    if (isAdmin) fetchReports(); 
    else setLoading(false); 
  }, [isAdmin]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/reports', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to load analytical reports');
      setReports(await res.json());
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/reports/export', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to export reports CSV');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `au_fest_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Analytics report exported to CSV successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  // Guard: require admin
  if (!isAdmin) {
    return (
      <div className="p-12 text-center rounded-2xl space-y-4 max-w-lg mx-auto theme-card mt-12">
        <ShieldAlert className="w-12 h-12 mx-auto" style={{ color: 'var(--primary)' }} />
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sign in as admin</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Reports are restricted to portal administrators. Please sign in with an admin account to view analytical reports.
        </p>
        <Link to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm hover:opacity-95"
          style={{ background: 'var(--primary)' }}
        >
          <LogIn className="w-4 h-4" /> Sign In as Admin
        </Link>
      </div>
    );
  }

  // Loading skeleton
  if (loading) return (
    <div className="space-y-8 pb-16">
      <div className="h-12 w-64 animate-pulse rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />)}
      </div>
    </div>
  );

  if (error || !reports) return (
    <div className="p-8 text-center text-rose-600 font-semibold">{error || 'Unable to load report data.'}</div>
  );

  const { membersPerClub, totalBudgetPerClub, registrationsPerEvent, avgRatingPerEvent } = reports;
  const maxMembers = Math.max(...membersPerClub.map(c => c.member_count), 1);
  const maxBudget = Math.max(...totalBudgetPerClub.map(c => parseFloat(c.approved_budget)), 1);

  const panelStyle = { background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(30,27,46,0.08)' };
  const dividerStyle = { borderBottom: '1px solid var(--border)' };
  const tagStyle = { background: 'var(--hero-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' };
  const subCardStyle = { background: 'var(--bg)', border: '1px solid var(--border)' };
  const trackStyle = { background: 'var(--bg)' };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text)' }}>
            <BarChart3 className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            Fest Intelligence &amp; Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Memberships, budgets, registrations and ratings at a glance
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 hover:opacity-95"
            style={{ background: 'var(--primary)', color: '#FFFFFF' }}
          >
            {exporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <Download className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            Print
          </button>
        </div>
      </div>

      {/* 2×2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 1. Members per Club */}
        <div className="p-6 rounded-2xl space-y-5" style={panelStyle}>
          <div className="flex items-center justify-between pb-3" style={dividerStyle}>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Members per Club
            </h2>
          </div>
          <div className="space-y-4">
            {membersPerClub.map((club) => {
              const pct = maxMembers > 0 ? Math.round((club.member_count / maxMembers) * 100) : 0;
              return (
                <div key={club.club_id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{club.club_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded" style={tagStyle}>{club.category}</span>
                    </div>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>
                      {plural(club.member_count, 'member')}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={trackStyle}>
                    {pct > 0 && (
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                    )}
                  </div>
                  <div className="flex gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span>Presidents: <strong style={{ color: 'var(--text)' }}>{club.presidents_count}</strong></span>
                    <span>VPs: <strong style={{ color: 'var(--text)' }}>{club.vps_count}</strong></span>
                    <span>Members: <strong style={{ color: 'var(--text)' }}>{club.general_members_count}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Total Budget per Club */}
        <div className="p-6 rounded-2xl space-y-5" style={panelStyle}>
          <div className="flex items-center justify-between pb-3" style={dividerStyle}>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              Total Budget per Club
            </h2>
          </div>
          <div className="space-y-4">
            {totalBudgetPerClub.map((b) => {
              const approvedNum = parseFloat(b.approved_budget);
              const pendingNum = parseFloat(b.pending_budget);
              const pct = maxBudget > 0 ? Math.round((approvedNum / maxBudget) * 100) : 0;
              return (
                <div key={b.club_id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{b.club_name}</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(approvedNum)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={trackStyle}>
                    {pct > 0 && (
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                    )}
                  </div>
                  <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span>{plural(b.events_count, 'event')} hosted</span>
                    {pendingNum > 0 && (
                      <span className="text-amber-600 font-medium">Pending: {formatCurrency(pendingNum)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Registrations per Event */}
        <div className="p-6 rounded-2xl space-y-5" style={panelStyle}>
          <div className="flex items-center justify-between pb-3" style={dividerStyle}>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Ticket className="w-5 h-5 text-amber-600" />
              Registrations per Event
            </h2>
          </div>
          <div className="space-y-3.5">
            {registrationsPerEvent.map((evt) => {
              const pct = fillPct(evt.registration_count, evt.venue_capacity);
              return (
                <div key={evt.event_id} className="p-3.5 rounded-xl space-y-2" style={subCardStyle}>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{evt.event_title}</h3>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{evt.club_name} • {evt.venue_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm" style={{ color: 'var(--primary)' }}>{evt.registration_count}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}> / {evt.venue_capacity || 'N/A'}</span>
                    </div>
                  </div>
                  {evt.venue_capacity > 0 && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={trackStyle}>
                        {parseFloat(evt.capacity_filled_percentage) > 0 && (
                          <div className="h-full rounded-full"
                            style={{ width: `${Math.min(100, evt.capacity_filled_percentage)}%`, background: 'var(--primary)' }} />
                        )}
                      </div>
                      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>Filled: {pct}%</span>
                        <span>Checked-in: <strong className="text-emerald-600">{evt.attended_count}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Average Rating per Event */}
        <div className="p-6 rounded-2xl space-y-5" style={panelStyle}>
          <div className="flex items-center justify-between pb-3" style={dividerStyle}>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Star className="w-5 h-5 text-amber-500" />
              Average Rating per Event
            </h2>
          </div>
          <div className="space-y-3.5">
            {avgRatingPerEvent.map((evt) => {
              const hasRating = parseFloat(evt.average_rating) > 0;
              return (
                <div key={evt.event_id} className="p-3.5 rounded-xl space-y-1.5" style={subCardStyle}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{evt.event_title}</h3>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{evt.club_name}</p>
                    </div>
                    {hasRating ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-extrabold text-amber-700 text-sm">{evt.average_rating}</span>
                      </div>
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No ratings yet</span>
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] pt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Reviews: <strong style={{ color: 'var(--text)' }}>{evt.feedback_count}</strong></span>
                    {hasRating && <span>5-star: <strong className="text-amber-500">{evt.five_star_count}</strong></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};