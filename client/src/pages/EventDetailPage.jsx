import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Ticket, 
  DollarSign, 
  Star, 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Check, 
  Clock, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';

export const EventDetailPage = () => {
  const { id } = useParams();
  const { user, isRole, token, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' | 'organisers' | 'payments' | 'feedback'

  // Available club members for organisers modal
  const [clubMembers, setClubMembers] = useState([]);
  // Available sponsors for payments modal
  const [sponsors, setSponsors] = useState([]);

  // Modals state
  const [isAddOrganiserOpen, setIsAddOrganiserOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Forms
  const [organiserForm, setOrganiserForm] = useState({ member_id: '', role: '' });
  const [paymentForm, setPaymentForm] = useState({ sponsor_id: '', amount: '', status: 'Approved' });
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const canManage = isRole('admin') || (isRole('club_admin') && user?.clubs?.some(c => c.id === event?.club_id));

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error('Event not found');
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    if (!token || !event) return;
    try {
      const [membersRes, sponsorsRes] = await Promise.all([
        fetch(`/api/members?club_id=${event.club_id}`),
        fetch('/api/sponsors')
      ]);
      if (membersRes.ok) {
        const memData = await membersRes.json();
        setClubMembers(memData);
        if (memData.length > 0) setOrganiserForm(prev => ({ ...prev, member_id: memData[0].id }));
      }
      if (sponsorsRes.ok) {
        const spData = await sponsorsRes.json();
        setSponsors(spData);
      }
    } catch (err) {
      console.error('Error fetching auxiliary data:', err);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to register for events.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ event_id: parseInt(id, 10) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      alert(data.message || 'Successfully registered!');
      fetchEventDetail();
    } catch (err) {
      alert(`Registration Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAttended = async (regId) => {
    try {
      const res = await fetch(`/api/registrations/${regId}/toggle-attended`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle attendance');

      fetchEventDetail();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddOrganiser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/organisers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: parseInt(id, 10),
          member_id: parseInt(organiserForm.member_id, 10),
          role: organiserForm.role
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign organiser');

      setIsAddOrganiserOpen(false);
      setOrganiserForm({ member_id: '', role: '' });
      fetchEventDetail();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrganiser = async (orgId) => {
    if (!window.confirm('Remove this organiser role?')) return;
    try {
      const res = await fetch(`/api/organisers/${orgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove organiser');

      fetchEventDetail();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/sponsors/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: parseInt(id, 10),
          sponsor_id: paymentForm.sponsor_id ? parseInt(paymentForm.sponsor_id, 10) : null,
          amount: parseFloat(paymentForm.amount),
          status: paymentForm.status
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record payment');

      setIsAddPaymentOpen(false);
      setPaymentForm({ sponsor_id: '', amount: '', status: 'Approved' });
      fetchEventDetail();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const res = await fetch(`/api/sponsors/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update payment');

      fetchEventDetail();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: parseInt(id, 10),
          rating: parseInt(feedbackForm.rating, 10),
          comment: feedbackForm.comment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit feedback');

      setIsFeedbackOpen(false);
      setFeedbackForm({ rating: 5, comment: '' });
      alert(data.message);
      fetchEventDetail();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isUserRegistered = event?.registrations?.some(r => r.user_id === user?.id);
  const isUserAttended = event?.registrations?.some(r => r.user_id === user?.id && r.attended);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading event details...</div>;
  }

  if (error || !event) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-600 font-semibold">{error || 'Event not found'}</p>
        <Link to="/events" className="text-sm text-[#74186E] hover:underline">
          Return to Events
        </Link>
      </div>
    );
  }

  const isFull = event.venue_capacity && event.registrations_count >= event.venue_capacity;

  return (
    <div className="space-y-8 pb-16">
      {/* Back Link */}
      <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#74186E] transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Events Schedule
      </Link>

      {/* Hero Event Banner */}
      <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status={event.status} />
              <Link to={`/clubs/${event.club_id}`} className="text-xs font-bold text-[#74186E] hover:underline">
                {event.club_name}
              </Link>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">Event #{event.id}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                {new Date(event.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                {event.venue_name || 'Main Auditorium'} (Capacity: {event.venue_capacity || 'N/A'})
              </span>
              {event.avg_rating && (
                <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {event.avg_rating} / 5.0 ({event.feedback_count} reviews)
                </span>
              )}
            </div>
          </div>

          {/* Registration / Student Action */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 min-w-[200px]">
            {isUserRegistered ? (
              <div className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>You are Registered</span>
                {isUserAttended && <span className="ml-1 text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded">Checked In</span>}
              </div>
            ) : isFull ? (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed shadow-none"
              >
                Registration Closed (Capacity Full)
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={actionLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Registering...' : 'Register for Event'}
              </button>
            )}

            {/* Leave Feedback trigger */}
            <button
              onClick={() => {
                setFormError('');
                setIsFeedbackOpen(true);
              }}
              className="text-xs text-gray-700 hover:text-[#74186E] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 transition-colors"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {isUserAttended || isRole('admin') ? 'Leave Feedback' : 'Give Feedback (Attendance Required)'}
            </button>
          </div>
        </div>

        {/* Capacity utilization bar */}
        {event.venue_capacity && (
          <div className="pt-4 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Attendance: <strong className="text-gray-900">{event.registrations_count} / {event.venue_capacity} registered</strong></span>
              <span>Attended: <strong className="text-emerald-700">{event.attended_count}</strong></span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? 'bg-rose-500' : 'bg-[#74186E]'
                }`}
                style={{ width: `${Math.min(100, (event.registrations_count / event.venue_capacity) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 space-x-1 sm:space-x-4 bg-white px-4 rounded-xl shadow-sm">
        {[
          { id: 'registrations', label: `Registrations (${event.registrations?.length || 0})`, icon: Ticket },
          { id: 'organisers', label: `Organisers (${event.organisers?.length || 0})`, icon: Users },
          { id: 'payments', label: `Sponsorship & Budget (${event.payments?.length || 0})`, icon: DollarSign },
          { id: 'feedback', label: `Feedback (${event.feedback?.length || 0})`, icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'organisers' || tab.id === 'payments') fetchAuxData();
              }}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                active 
                  ? 'border-[#74186E] text-[#74186E]' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#74186E]' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Registrations & Attendance */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Student Registrations & Attendance</h2>
              <p className="text-xs text-gray-500">
                {canManage ? 'Click attendance button to toggle check-in status.' : 'List of confirmed attendees.'}
              </p>
            </div>
          </div>

          {event.registrations?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
              No students registered yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FAF8FB] text-xs uppercase tracking-wider text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Registration ID</th>
                      <th className="px-6 py-3.5 font-bold">Student Email</th>
                      <th className="px-6 py-3.5 font-bold">Attended Status</th>
                      {canManage && <th className="px-6 py-3.5 text-right font-bold">Check-in Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {event.registrations?.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">REG-#{r.id}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{r.email}</td>
                        <td className="px-6 py-4">
                          {r.attended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" /> Attended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              Absent
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleToggleAttended(r.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                r.attended
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {r.attended ? 'Mark Absent' : 'Mark Attended'}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Organisers & Committee Roles */}
      {activeTab === 'organisers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Organising Committee</h2>
              <p className="text-xs text-gray-500">Club members appointed to event management roles.</p>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  fetchAuxData();
                  setFormError('');
                  setIsAddOrganiserOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign Organiser
              </button>
            )}
          </div>

          {event.organisers?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
              No organisers designated yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.organisers?.map((org) => (
                <div
                  key={org.id}
                  className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={org.position} />
                    {canManage && (
                      <button
                        onClick={() => handleDeleteOrganiser(org.id)}
                        className="text-xs text-gray-400 hover:text-rose-600"
                        title="Remove organiser"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{org.email}</h3>
                    <p className="text-xs font-bold text-[#74186E] mt-1">
                      Role: {org.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Sponsorship & Budget */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Event Financials & Sponsorship</h2>
              <p className="text-xs text-gray-500">Approved corporate sponsorships and budget allocations.</p>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  fetchAuxData();
                  setFormError('');
                  setIsAddPaymentOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white transition-all shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Sponsorship
              </button>
            )}
          </div>

          {/* Total Approved Sponsorship Highlight */}
          <div className="p-6 rounded-2xl bg-[#FAF8FB] border border-[#E4CCE1] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total Approved Sponsorship</p>
              <p className="text-3xl font-black text-[#74186E] mt-1">
                {formatCurrency(event.totalApprovedSponsorship)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100 text-[#74186E]">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>

          {/* Payments Table */}
          {event.payments?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
              No payments recorded for this event.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FAF8FB] text-xs uppercase tracking-wider text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Payment ID</th>
                      <th className="px-6 py-3.5 font-bold">Sponsor / Source</th>
                      <th className="px-6 py-3.5 font-bold">Amount</th>
                      <th className="px-6 py-3.5 font-bold">Status</th>
                      {canManage && <th className="px-6 py-3.5 text-right font-bold">Approval Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {event.payments?.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">PAY-#{p.id}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {p.sponsor_name || 'Adani University Budget Disbursement'}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status !== 'Approved' && (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id, 'Approved')}
                                  className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                >
                                  Approve
                                </button>
                              )}
                              {p.status !== 'Rejected' && (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id, 'Rejected')}
                                  className="px-2.5 py-1 rounded text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Feedback & Ratings */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Student Ratings & Feedback</h2>
              <p className="text-xs text-gray-500">Only verified attendees can submit fest reviews.</p>
            </div>

            <button
              onClick={() => {
                setFormError('');
                setIsFeedbackOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#74186E] text-white hover:bg-[#62125D] shadow-sm transition-all self-start sm:self-auto"
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              Write Review
            </button>
          </div>

          {event.feedback?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
              No feedback submitted for this event yet.
            </div>
          ) : (
            <div className="space-y-3">
              {event.feedback?.map((f) => (
                <div
                  key={f.id}
                  className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{f.email}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= f.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {f.comment || '(No written comment provided)'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assign Organiser Modal */}
      <Modal
        isOpen={isAddOrganiserOpen}
        onClose={() => setIsAddOrganiserOpen(false)}
        title="Assign Organising Role"
      >
        <form onSubmit={handleAddOrganiser} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Select Club Member *</label>
            <select
              required
              value={organiserForm.member_id}
              onChange={(e) => setOrganiserForm({ ...organiserForm, member_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            >
              <option value="">-- Choose Club Member --</option>
              {clubMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.email} ({m.position})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Organiser Role *</label>
            <input
              type="text"
              required
              value={organiserForm.role}
              onChange={(e) => setOrganiserForm({ ...organiserForm, role: e.target.value })}
              placeholder="e.g. Lead Technical Coordinator"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddOrganiserOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        title="Record Sponsorship Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Sponsor (Leave empty for University Budget Grant)</label>
            <select
              value={paymentForm.sponsor_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, sponsor_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            >
              <option value="">-- Adani University Grant (sponsor_id = NULL) --</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Amount (INR ₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="e.g. 50000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
            <select
              value={paymentForm.status}
              onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            >
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddPaymentOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        title="Submit Event Feedback"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Rating (1 to 5 Stars) *</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                  className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= feedbackForm.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-bold text-amber-600 ml-2">
                {feedbackForm.rating} Star{feedbackForm.rating > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Your Comments & Experience</label>
            <textarea
              rows={4}
              value={feedbackForm.comment}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
              placeholder="What did you think of the event organization and sessions?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
