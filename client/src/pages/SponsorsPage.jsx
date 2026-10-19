import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Building2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export const SponsorsPage = () => {
  const { isRole, token } = useAuth();
  const toast = useToast();

  const [sponsors, setSponsors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [eventFilter, setEventFilter] = useState('');

  // Modals state
  const [isAddSponsorOpen, setIsAddSponsorOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  // Forms
  const [sponsorName, setSponsorName] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    event_id: '',
    sponsor_id: '',
    amount: '',
    status: 'Pending'
  });

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const canManage = isRole('admin') || isRole('club_admin');

  useEffect(() => {
    fetchData();
  }, [statusFilter, eventFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      let paymentsUrl = '/api/sponsors/payments?';
      if (statusFilter !== 'All') paymentsUrl += `status=${statusFilter}&`;
      if (eventFilter) paymentsUrl += `event_id=${eventFilter}&`;

      const [sponsorsRes, paymentsRes, eventsRes] = await Promise.all([
        fetch('/api/sponsors'),
        fetch(paymentsUrl),
        fetch('/api/events')
      ]);

      if (!sponsorsRes.ok || !paymentsRes.ok) {
        throw new Error('Failed to load financial records');
      }

      const sData = await sponsorsRes.json();
      const pData = await paymentsRes.json();
      const eData = eventsRes.ok ? await eventsRes.json() : [];

      setSponsors(sData);
      setPayments(pData);
      setEvents(eData);

      if (eData.length > 0 && !paymentForm.event_id) {
        setPaymentForm(prev => ({ ...prev, event_id: eData[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSponsor = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/sponsors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: sponsorName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add sponsor');

      toast.success(`Sponsor "${sponsorName}" added successfully!`, 'Sponsor Added');
      setIsAddSponsorOpen(false);
      setSponsorName('');
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSponsor = async (sponsor) => {
    if (!window.confirm(`Delete sponsor "${sponsor.name}"? Payments linked will retain record with sponsor=NULL.`)) return;

    try {
      const res = await fetch(`/api/sponsors/${sponsor.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete sponsor');

      toast.success(`Sponsor "${sponsor.name}" deleted.`, 'Sponsor Removed');
      fetchData();
    } catch (err) {
      toast.error(err.message, 'Failed to Delete Sponsor');
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
          event_id: parseInt(paymentForm.event_id, 10),
          sponsor_id: paymentForm.sponsor_id ? parseInt(paymentForm.sponsor_id, 10) : null,
          amount: parseFloat(paymentForm.amount),
          status: paymentForm.status
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record payment');

      toast.success('Funding payment recorded successfully!', 'Payment Recorded');
      setIsAddPaymentOpen(false);
      setPaymentForm(prev => ({ ...prev, sponsor_id: '', amount: '', status: 'Pending' }));
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (paymentId, status) => {
    try {
      const res = await fetch(`/api/sponsors/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update payment status');

      toast.success(`Payment status changed to ${status}.`, 'Status Updated');
      fetchData();
    } catch (err) {
      toast.error(err.message, 'Update Failed');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const totalApprovedAll = payments
    .filter(p => p.status === 'Approved')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalPendingAll = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sponsors & Budget Management</h1>
          <p className="text-sm text-gray-600">
            Corporate partnerships, university disbursements, and verified sponsorship payments.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormError('');
                setIsAddSponsorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4 text-[#74186E]" />
              Add Sponsor
            </button>
            <button
              onClick={() => {
                setFormError('');
                setIsAddPaymentOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        )}
      </div>

      {/* Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Sponsorship</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {formatCurrency(totalApprovedAll)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Approvals</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                {formatCurrency(totalPendingAll)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Corporate Sponsors</p>
              <p className="text-2xl sm:text-3xl font-black text-[#74186E] mt-1">
                {sponsors.length} Partners
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-[#74186E] border border-purple-100">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Sponsors Directory */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#74186E]" />
          Sponsor Directory
        </h2>

        {sponsors.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
            No sponsors registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sponsors.map((sp) => (
              <div
                key={sp.id}
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#74186E] transition-all space-y-2 relative group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-base">{sp.name}</h3>
                  {isRole('admin') && (
                    <button
                      onClick={() => handleDeleteSponsor(sp)}
                      className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                      title="Delete Sponsor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Contributed:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(sp.total_contributed)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments Ledger Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#74186E]" />
            Sponsorship Payments Ledger
          </h2>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-800 text-xs focus:outline-none focus:border-[#74186E]"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved Only</option>
              <option value="Pending">Pending Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>

            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-800 text-xs focus:outline-none focus:border-[#74186E]"
            >
              <option value="">All Events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
            No payments match your criteria.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8FB] text-xs uppercase tracking-wider text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Payment ID</th>
                    <th className="px-6 py-3.5 font-bold">Event & Host Club</th>
                    <th className="px-6 py-3.5 font-bold">Sponsor / Source</th>
                    <th className="px-6 py-3.5 font-bold">Amount</th>
                    <th className="px-6 py-3.5 font-bold">Status</th>
                    {canManage && <th className="px-6 py-3.5 text-right font-bold">Approval Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">PAY-#{p.id}</td>
                      <td className="px-6 py-4">
                        <Link to={`/events/${p.event_id}`} className="font-bold text-gray-900 hover:text-[#74186E]">
                          {p.event_title}
                        </Link>
                        <span className="block text-xs text-gray-500">{p.club_name}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {p.sponsor_name}
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
                                onClick={() => handleUpdateStatus(p.id, 'Approved')}
                                className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              >
                                Approve
                              </button>
                            )}
                            {p.status !== 'Rejected' && (
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'Rejected')}
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

      {/* Add Sponsor Modal */}
      <Modal
        isOpen={isAddSponsorOpen}
        onClose={() => setIsAddSponsorOpen(false)}
        title="Register Sponsor"
      >
        <form onSubmit={handleAddSponsor} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Company / Sponsor Name *</label>
            <input
              type="text"
              required
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              placeholder="e.g. Adani Solar, Deloitte"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddSponsorOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Add Sponsor'}
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
            <label className="block text-xs font-bold text-gray-700 mb-1">Target Event *</label>
            <select
              required
              value={paymentForm.event_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, event_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            >
              <option value="">-- Choose Event --</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title} ({e.club_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Sponsor (Leave blank for internal University disbursement)</label>
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
              placeholder="e.g. 100000"
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
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
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
    </div>
  );
};
