import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { StatusBadge, getEventStatusInfo } from '../components/StatusBadge';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Search, 
  Clock, 
  Edit, 
  Trash2, 
  Ticket, 
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Shared fill percentage function: 1 decimal place (e.g. 0.4%)
export const fillPct = (registered, capacity) => {
  if (!capacity || capacity <= 0) return null;
  return ((registered / capacity) * 100).toFixed(1);
};

export const EventsPage = () => {
  const { user, isRole, token, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  const [formData, setFormData] = useState({
    club_id: '',
    venue_id: '',
    title: '',
    date: '',
    status: 'Planned'
  });

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [registeringId, setRegisteringId] = useState(null);

  const statuses = ['All', 'Planned', 'Ongoing', 'Completed'];

  useEffect(() => {
    fetchEvents();
  }, [statusFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = '/api/events?';
      if (statusFilter !== 'All') url += `status=${encodeURIComponent(statusFilter)}&`;
      if (dateFilter) url += `date=${encodeURIComponent(dateFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [clubsRes, venuesRes] = await Promise.all([
        fetch('/api/clubs'),
        fetch('/api/venues')
      ]);
      if (clubsRes.ok) setClubs(await clubsRes.json());
      if (venuesRes.ok) setVenues(await venuesRes.json());
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      club_id: clubs[0]?.id || '',
      venue_id: venues[0]?.id || '',
      title: '',
      date: '2026-11-15T09:00',
      status: 'Planned'
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (evt) => {
    setCurrentEvent(evt);
    const d = new Date(evt.date);
    const dateFormatted = d.toISOString().slice(0, 16);

    setFormData({
      club_id: evt.club_id,
      venue_id: evt.venue_id || '',
      title: evt.title,
      date: dateFormatted,
      status: evt.status
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          club_id: parseInt(formData.club_id, 10),
          venue_id: formData.venue_id ? parseInt(formData.venue_id, 10) : null,
          title: formData.title,
          date: formData.date,
          status: formData.status
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create event');

      toast.success(`Event "${formData.title}" scheduled successfully!`, 'Event Scheduled');
      setIsCreateOpen(false);
      fetchEvents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch(`/api/events/${currentEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          club_id: parseInt(formData.club_id, 10),
          venue_id: formData.venue_id ? parseInt(formData.venue_id, 10) : null,
          title: formData.title,
          date: formData.date,
          status: formData.status
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update event');

      toast.success(`Event "${formData.title}" updated successfully!`, 'Event Updated');
      setIsEditOpen(false);
      fetchEvents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async (evt) => {
    if (!window.confirm(`Are you sure you want to delete event "${evt.title}"?`)) return;

    try {
      const res = await fetch(`/api/events/${evt.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete event');

      toast.success(`Event "${evt.title}" deleted successfully.`, 'Event Deleted');
      fetchEvents();
    } catch (err) {
      toast.error(err.message, 'Failed to Delete Event');
    }
  };

  const handleRegisterEvent = async (evtId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setRegisteringId(evtId);
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ event_id: evtId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      toast.success(data.message || 'Successfully registered for event!', 'Registration Confirmed');
      fetchEvents();
    } catch (err) {
      toast.error(err.message, 'Registration Error');
    } finally {
      setRegisteringId(null);
    }
  };

  const canManageEvent = (evt) => {
    if (isRole('admin')) return true;
    if (isRole('club_admin')) {
      return user?.clubs?.some(c => c.id === evt.club_id);
    }
    return false;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Campus Events Schedule
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Hackathons, technical symposiums, robotic challenges, and cultural evenings.
          </p>
        </div>

        {(isRole('admin') || isRole('club_admin')) && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all hover:opacity-95 self-start sm:self-auto"
            style={{ background: 'var(--primary)' }}
          >
            <Plus className="w-4 h-4" />
            Schedule New Event
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-4 rounded-2xl theme-card">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={{
                background: statusFilter === st ? 'var(--primary)' : 'var(--bg)',
                color: statusFilter === st ? '#FFFFFF' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Date & Search Inputs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs hover:underline self-center"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search title or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none w-full sm:w-56"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>
      </div>

      {/* Events Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-72 rounded-2xl relative overflow-hidden theme-card p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-20 h-5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-16 h-4 rounded bg-gray-200 animate-pulse" />
                </div>
                <div className="w-1/3 h-3 rounded bg-gray-200 animate-pulse" />
                <div className="w-3/4 h-5 rounded bg-gray-200 animate-pulse" />
                <div className="w-full h-12 rounded-xl bg-gray-100 animate-pulse" />
                <div className="w-full h-2 rounded bg-gray-200 animate-pulse" />
              </div>
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-2xl theme-card space-y-3">
          <Calendar className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text)' }}>No events found</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or date selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => {
            const hasManage = canManageEvent(evt);
            const isFull = evt.venue_capacity && evt.registrations_count >= evt.venue_capacity;
            const pct = fillPct(evt.registrations_count, evt.venue_capacity);
            const hasReviews = evt.avg_rating && parseFloat(evt.avg_rating) > 0;

            return (
              <div
                key={evt.id}
                className="flex flex-col justify-between rounded-2xl p-6 theme-card transition-all relative group"
              >
                <div className="space-y-4">
                  {/* Status & Rating: Color-coded badge based on real data fields */}
                  <div className="flex items-center justify-between">
                    <StatusBadge status={getEventStatusInfo(evt).label} />
                    {hasReviews ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <span className="text-amber-500">★</span>
                        {evt.avg_rating} ({evt.feedback_count})
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        No reviews yet
                      </span>
                    )}
                  </div>

                  {/* Title & Club */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                      {evt.club_name}
                    </span>
                    <h3 className="text-lg font-bold mt-1 transition-colors" style={{ color: 'var(--text)' }}>
                      {evt.title}
                    </h3>
                  </div>

                  {/* Date & Venue Info (Removed duplicate Capacity line) */}
                  <div className="space-y-2 text-xs p-3 rounded-xl border border-[var(--border)]" style={{ background: 'var(--hero-bg)', color: 'var(--text)' }}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      <span>{new Date(evt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      <span>{evt.venue_name || 'Main Campus Venue'}</span>
                    </div>
                  </div>

                  {/* Registrations Progress Bar: format "2 / 500 registered", 1 decimal place percentage */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--text)' }}>
                        <Ticket className="w-3 h-3" style={{ color: 'var(--primary)' }} />
                        <span><strong>{evt.registrations_count}</strong> / {evt.venue_capacity || 'N/A'} registered</span>
                      </span>
                      <span>
                        {isFull ? (
                          <span className="text-rose-600 font-bold">Full</span>
                        ) : pct !== null ? (
                          <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                        ) : null}
                      </span>
                    </div>
                    {evt.venue_capacity && (
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (evt.registrations_count / evt.venue_capacity) * 100)}%`,
                            background: isFull ? '#DC2626' : 'var(--primary)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions: Register / Full button + View details */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/events/${evt.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold hover:underline transition-colors"
                      style={{ color: 'var(--primary)' }}
                    >
                      View details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {hasManage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          title="Edit Event"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt)}
                          title="Delete Event"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action button based on event status & auth */}
                  {evt.status === 'Completed' ? (
                    <div className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs bg-gray-50 border border-[var(--border)]">
                      <span className="font-semibold text-gray-500">Event completed</span>
                      {hasReviews && (
                        <Link
                          to={`/events/${evt.id}`}
                          className="font-bold hover:underline transition-colors"
                          style={{ color: 'var(--primary)' }}
                        >
                          View feedback
                        </Link>
                      )}
                    </div>
                  ) : isFull ? (
                    <button
                      disabled
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed border border-[var(--border)]"
                    >
                      Full
                    </button>
                  ) : isAuthenticated ? (
                    <button
                      onClick={() => handleRegisterEvent(evt.id)}
                      disabled={registeringId === evt.id}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:opacity-95 shadow-sm btn-press disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ background: 'var(--primary)' }}
                    >
                      {registeringId === evt.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <span>Register</span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegisterEvent(evt.id)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold transition-all hover:bg-[var(--hero-bg)] border btn-press"
                      style={{
                        background: 'transparent',
                        borderColor: 'var(--primary)',
                        color: 'var(--primary)'
                      }}
                    >
                      Sign in to register
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule New Event"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. AI & Robotics Symposium"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Host Club *</label>
              <select
                required
                value={formData.club_id}
                onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Venue</label>
              <select
                value={formData.venue_id}
                onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">-- Select Venue --</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Date &amp; Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="Planned">Planned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
            >
              {actionLoading ? 'Scheduling...' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Event: ${currentEvent?.title}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Host Club</label>
              <select
                value={formData.club_id}
                onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Venue</label>
              <select
                value={formData.venue_id}
                onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">-- Select Venue --</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Date &amp; Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="Planned">Planned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
