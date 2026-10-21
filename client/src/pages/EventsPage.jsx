import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
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
  X,
  Filter
} from 'lucide-react';

// Shared fill percentage function: 1 decimal place (e.g. 0.4%)
export const fillPct = (registered, capacity) => {
  if (!capacity || capacity <= 0) return null;
  return ((registered / capacity) * 100).toFixed(1);
};

export const EventsPage = () => {
  const { user, isRole, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize filters from URL query parameters so they survive refresh
  const initialStatus = searchParams.get('status') || 'All';
  const initialClubId = searchParams.get('club_id') || 'All';
  const initialVenueId = searchParams.get('venue_id') || 'All';
  const initialDate = searchParams.get('date') || '';
  const initialSearch = searchParams.get('search') || '';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [clubFilter, setClubFilter] = useState(initialClubId);
  const [venueFilter, setVenueFilter] = useState(initialVenueId);
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

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

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Sync state changes into URL searchParams
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter);
    if (clubFilter && clubFilter !== 'All') params.set('club_id', clubFilter);
    if (venueFilter && venueFilter !== 'All') params.set('venue_id', venueFilter);
    if (dateFilter) params.set('date', dateFilter);
    if (debouncedSearch && debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

    setSearchParams(params, { replace: true });
  }, [statusFilter, clubFilter, venueFilter, dateFilter, debouncedSearch, setSearchParams]);

  // Fetch events when active filters change
  useEffect(() => {
    fetchEvents();
  }, [statusFilter, clubFilter, venueFilter, dateFilter, debouncedSearch]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const hasActiveFilters = 
    statusFilter !== 'All' || 
    clubFilter !== 'All' || 
    venueFilter !== 'All' || 
    Boolean(dateFilter) || 
    Boolean(searchInput.trim());

  const handleClearFilters = () => {
    setStatusFilter('All');
    setClubFilter('All');
    setVenueFilter('All');
    setDateFilter('');
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams({}, { replace: true });
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/events?';
      if (statusFilter !== 'All') url += `status=${encodeURIComponent(statusFilter)}&`;
      if (clubFilter !== 'All') url += `club_id=${encodeURIComponent(clubFilter)}&`;
      if (venueFilter !== 'All') url += `venue_id=${encodeURIComponent(venueFilter)}&`;
      if (dateFilter) url += `date=${encodeURIComponent(dateFilter)}&`;
      if (debouncedSearch && debouncedSearch.trim()) url += `search=${encodeURIComponent(debouncedSearch.trim())}&`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
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

      toast.success(`Event "${formData.title}" created successfully!`);
      setIsCreateOpen(false);
      fetchEvents();
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
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

      toast.success('Event updated successfully!');
      setIsEditOpen(false);
      fetchEvents();
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
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

      toast.success(`Event "${evt.title}" deleted.`);
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete event');
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
      toast.success(data.message || 'Successfully registered for event! Pass issued.');
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Registration error');
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

      {/* Comprehensive Filter Bar with debounced search & clear filters */}
      <div className="p-4 rounded-2xl theme-card space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
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

          {/* Search Input (Debounced) */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search title, club, or venue..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl text-xs focus:outline-none w-full"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Club, Venue, Date selection & Clear Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border)]">
          {/* Club Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-gray-500 font-medium">Club:</label>
            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="All">All Clubs</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Venue Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-gray-500 font-medium">Venue:</label>
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="All">All Venues</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-gray-500 font-medium">Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Events Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-2xl theme-card space-y-3">
          <Calendar className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium text-base" style={{ color: 'var(--text)' }}>No events match your search or filters</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Try adjusting your search terms, date range, or selected venue.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              Reset All Filters
            </button>
          )}
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
                  {/* Status & Rating */}
                  <div className="flex items-center justify-between">
                    <StatusBadge status={evt.status} />
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

                  {/* Date & Venue Info */}
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

                  {/* Registrations Progress Bar */}
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
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:opacity-95 shadow-sm"
                      style={{ background: 'var(--primary)' }}
                    >
                      {registeringId === evt.id ? 'Registering...' : 'Register'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegisterEvent(evt.id)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold transition-all hover:bg-[var(--hero-bg)] border"
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