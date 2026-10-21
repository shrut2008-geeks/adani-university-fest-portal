import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Filter, 
  Search, 
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';

export const RegistrationsPage = () => {
  const { user, isRole, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const isMyView = isRole('student') || location.pathname === '/my-registrations';

  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  // Cancel confirmation dialog state
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    regId: null,
    eventTitle: ''
  });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
      if (!isMyView) {
        fetchEventsList();
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, selectedEventId, location.pathname]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = isMyView ? '/api/registrations/my' : '/api/registrations?';
      if (!isMyView && selectedEventId) url += `event_id=${selectedEventId}&`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch registrations');
      }
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsList = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/registrations/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to export registrations CSV');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `au_fest_registrations_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Registrations roster exported to CSV successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const promptCancel = (regId, eventTitle, eventDate) => {
    if (new Date(eventDate) <= new Date()) {
      toast.error('Cannot cancel registration for an event that has already started.');
      return;
    }
    setCancelModal({
      isOpen: true,
      regId,
      eventTitle
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.regId) return;

    try {
      setCancelling(true);
      const res = await fetch(`/api/registrations/${cancelModal.regId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel registration');
      }

      toast.success(data.message || 'Registration cancelled successfully. Your seat has been released.');
      setCancelModal({ isOpen: false, regId: null, eventTitle: '' });
      fetchRegistrations();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel registration');
    } finally {
      setCancelling(false);
    }
  };

  const handleToggleAttended = async (regId) => {
    try {
      const res = await fetch(`/api/registrations/${regId}/toggle-attended`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to toggle attendance');

      toast.success(data.message || 'Attendance status updated');
      fetchRegistrations();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle attendance');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 max-w-lg mx-auto">
        <Ticket className="w-12 h-12 mx-auto" style={{ color: 'var(--primary)' }} />
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sign In Required</h2>
        <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
          Sign in to view your confirmed event passes and register for upcoming fest events.
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Please sign in with your Adani University credentials to view and manage event passes.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm hover:opacity-95"
          style={{ background: 'var(--primary)' }}
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const filteredRegistrations = registrations.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.email?.toLowerCase().includes(q) ||
      r.event_title?.toLowerCase().includes(q) ||
      r.club_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isMyView ? 'My Event Passes' : 'Event Registrations & Attendance Roster'}
          </h1>
          <p className="text-sm text-gray-600">
            {isMyView 
              ? 'Present your event ticket at the campus venue desk for attendance check-in.'
              : 'Monitor registered attendees and check-in status.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isRole('admin') && !isMyView && (
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#74186E]" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#74186E]" />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          )}

          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm transition-colors"
          >
            <Calendar className="w-4 h-4 text-[#74186E]" />
            Browse More Events
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar (For Admin/Club Admin on Roster view) */}
      {!isMyView && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-800 text-xs focus:outline-none focus:border-[#74186E]"
            >
              <option value="">-- All Events --</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student email or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-[#74186E]"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-white border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRegistrations}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-gray-200 space-y-3">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-700 font-medium">No registrations found</p>
          <p className="text-xs text-gray-400">
            {isMyView
              ? 'You have not registered for any events yet. Explore the events schedule and reserve your seat!'
              : 'No student registrations recorded for this selection.'}
          </p>
          {isMyView && (
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              <Calendar className="w-3.5 h-3.5" /> Find Events to Join
            </Link>
          )}
        </div>
      ) : isMyView ? (
        /* Student Ticket Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRegistrations.map((reg) => {
            const isPastEvent = new Date(reg.event_date) <= new Date();
            return (
              <div
                key={reg.id}
                className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-[#74186E] transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#74186E] font-bold px-2.5 py-1 rounded-md bg-[#F7EEF6] border border-[#E4CCE1]">
                    PASS-#{reg.id}
                  </span>
                  {reg.attended ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Checked In
                    </span>
                  ) : isPastEvent ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                      <Clock className="w-3.5 h-3.5" /> Event Concluded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Clock className="w-3.5 h-3.5" /> Entry Confirmed
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-[#74186E] uppercase tracking-wider">
                    {reg.club_name}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                    {reg.event_title}
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 bg-[#FAF8FB] p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>{new Date(reg.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{reg.venue_name || 'Main Campus'} (Capacity: {reg.venue_capacity || 'N/A'})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <Link
                    to={`/events/${reg.event_id}`}
                    className="text-xs font-bold text-[#74186E] hover:underline flex items-center gap-1 transition-colors"
                  >
                    Event Details & Feedback <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {isPastEvent ? (
                    <span className="text-xs text-gray-400 italic">
                      Event started
                    </span>
                  ) : (
                    <button
                      onClick={() => promptCancel(reg.id, reg.event_title, reg.event_date)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition-colors hover:bg-rose-50 px-2 py-1 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel Pass
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Admin & Club Admin Table View */
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8FB] text-xs uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Pass ID</th>
                  <th className="px-6 py-3.5 font-bold">Event</th>
                  <th className="px-6 py-3.5 font-bold">Student Email</th>
                  <th className="px-6 py-3.5 font-bold">Venue</th>
                  <th className="px-6 py-3.5 font-bold">Attended</th>
                  <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">REG-#{reg.id}</td>
                    <td className="px-6 py-4">
                      <Link to={`/events/${reg.event_id}`} className="font-bold text-gray-900 hover:text-[#74186E]">
                        {reg.event_title}
                      </Link>
                      <span className="block text-xs text-gray-500">{reg.club_name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{reg.email}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {reg.venue_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {reg.attended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Attended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleAttended(reg.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            reg.attended
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {reg.attended ? 'Mark Absent' : 'Mark Attended'}
                        </button>
                        <button
                          onClick={() => promptCancel(reg.id, reg.event_title, reg.event_date)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Registration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal Dialog for Cancelling Pass */}
      {cancelModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog" 
          aria-modal="true"
        >
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Registration?</h3>
                <p className="text-xs text-gray-500">Seat will be released immediately</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to cancel your pass for <strong className="text-gray-900 font-semibold">{cancelModal.eventTitle}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelModal({ isOpen: false, regId: null, eventTitle: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Keep Pass
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  'Yes, Cancel Pass'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};