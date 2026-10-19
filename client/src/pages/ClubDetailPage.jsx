import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Users, 
  Trophy, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowLeft, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export const ClubDetailPage = () => {
  const { id } = useParams();
  const { user, isRole, token } = useAuth();
  const toast = useToast();

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available users for member assignment
  const [allUsers, setAllUsers] = useState([]);

  // Modals state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isAddAchOpen, setIsAddAchOpen] = useState(false);

  const [currentMember, setCurrentMember] = useState(null);
  const [memberForm, setMemberForm] = useState({ user_id: '', position: 'Member' });
  const [achForm, setAchForm] = useState({ description: '' });

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const canManage = isRole('admin') || (isRole('club_admin') && user?.clubs?.some(c => c.id === parseInt(id, 10)));

  useEffect(() => {
    fetchClubDetail();
  }, [id]);

  const fetchClubDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clubs/${id}`);
      if (!res.ok) throw new Error('Club not found');
      const data = await res.json();
      setClub(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token || !canManage) return;
    try {
      const res = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
        if (data.length > 0) {
          setMemberForm(prev => ({ ...prev, user_id: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleOpenAddMember = () => {
    fetchUsers();
    setMemberForm({ user_id: '', position: 'Member' });
    setFormError('');
    setIsAddMemberOpen(true);
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(memberForm.user_id, 10),
          club_id: parseInt(id, 10),
          position: memberForm.position
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add member');

      toast.success('Member assigned to club successfully!', 'Member Added');
      setIsAddMemberOpen(false);
      fetchClubDetail();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditMember = (member) => {
    setCurrentMember(member);
    setMemberForm({ position: member.position });
    setFormError('');
    setIsEditMemberOpen(true);
  };

  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch(`/api/members/${currentMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ position: memberForm.position })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update member');

      toast.success('Member position updated successfully!', 'Member Updated');
      setIsEditMemberOpen(false);
      fetchClubDetail();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Remove ${member.email} from this club?`)) return;
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove member');

      toast.success('Member removed from club.', 'Member Removed');
      fetchClubDetail();
    } catch (err) {
      toast.error(err.message, 'Failed to Remove Member');
    }
  };

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch(`/api/clubs/${id}/achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description: achForm.description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add achievement');

      toast.success('Achievement recorded successfully!', 'Achievement Added');
      setIsAddAchOpen(false);
      setAchForm({ description: '' });
      fetchClubDetail();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAchievement = async (achId) => {
    if (!window.confirm('Delete this achievement?')) return;
    try {
      const res = await fetch(`/api/clubs/${id}/achievements/${achId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete achievement');

      toast.success('Achievement deleted.', 'Achievement Removed');
      fetchClubDetail();
    } catch (err) {
      toast.error(err.message, 'Failed to Delete Achievement');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading club details...</div>;
  }

  if (error || !club) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-600 font-semibold">{error || 'Club not found'}</p>
        <Link to="/clubs" className="text-sm text-[#74186E] hover:underline">
          Return to Clubs Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Back Link */}
      <Link to="/clubs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#74186E] transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Clubs
      </Link>

      {/* Header Profile Card */}
      <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F7EEF6] text-[#74186E] border border-[#E4CCE1]">
                {club.category || 'General Club'}
              </span>
              <span className="text-xs text-gray-400">Club ID #{club.id}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {club.name}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {club.description || 'Dedicated to student activities and community empowerment at Adani University.'}
            </p>
          </div>

          <div className="flex flex-col items-end justify-center p-4 rounded-xl bg-gray-50 border border-gray-200 min-w-[140px]">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Members</span>
            <span className="text-3xl font-black text-[#74186E]">{club.member_count}</span>
          </div>
        </div>
      </div>

      {/* 2 Column Layout: Members & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Members Roster */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#74186E]" />
              Executive Committee & Members
            </h2>

            {canManage && (
              <button
                onClick={handleOpenAddMember}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
            )}
          </div>

          {club.members?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
              No members enrolled in this club yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FAF8FB] text-xs uppercase tracking-wider text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Member Email</th>
                      <th className="px-6 py-3.5 font-bold">Position</th>
                      {canManage && <th className="px-6 py-3.5 text-right font-bold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {club.members?.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#F7EEF6] border border-[#DDBDD9] flex items-center justify-center text-xs font-bold text-[#74186E]">
                            {m.email[0].toUpperCase()}
                          </div>
                          <span>{m.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={m.position} />
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditMember(m)}
                                title="Edit Position"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(m)}
                                title="Remove Member"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {/* Associated Events */}
          <div className="pt-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#74186E]" />
              Hosted Campus Events ({club.events?.length || 0})
            </h2>

            {club.events?.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
                No events registered by this club yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {club.events?.map((evt) => (
                  <Link
                    key={evt.id}
                    to={`/events/${evt.id}`}
                    className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-[#74186E] shadow-sm hover:shadow-md block space-y-2 group transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={evt.status} />
                      <span className="text-xs text-gray-500">{evt.registrations_count} registrations</span>
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-[#74186E] transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(evt.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Achievements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Achievements
            </h2>

            {canManage && (
              <button
                onClick={() => setIsAddAchOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#74186E] text-white hover:bg-[#62125D] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>

          <div className="space-y-3">
            {club.achievements?.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
                No achievements recorded yet.
              </div>
            ) : (
              club.achievements?.map((ach) => (
                <div
                  key={ach.id}
                  className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm space-y-2 relative"
                >
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    "{ach.description}"
                  </p>
                  {canManage && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteAchievement(ach.id)}
                        className="text-xs text-gray-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Add Member to Club"
      >
        <form onSubmit={handleAddMemberSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Select User *</label>
            <select
              required
              value={memberForm.user_id}
              onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            >
              <option value="">-- Choose User by Email --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Position *</label>
            <select
              value={memberForm.position}
              onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            >
              <option value="President">President</option>
              <option value="Vice-President">Vice-President</option>
              <option value="Member">Member</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Position Modal */}
      <Modal
        isOpen={isEditMemberOpen}
        onClose={() => setIsEditMemberOpen(false)}
        title={`Update Position: ${currentMember?.email}`}
      >
        <form onSubmit={handleEditMemberSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Position *</label>
            <select
              value={memberForm.position}
              onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            >
              <option value="President">President</option>
              <option value="Vice-President">Vice-President</option>
              <option value="Member">Member</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEditMemberOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Update Position'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Achievement Modal */}
      <Modal
        isOpen={isAddAchOpen}
        onClose={() => setIsAddAchOpen(false)}
        title="Record Club Achievement"
      >
        <form onSubmit={handleAddAchievement} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Achievement Description *</label>
            <textarea
              required
              rows={3}
              value={achForm.description}
              onChange={(e) => setAchForm({ description: e.target.value })}
              placeholder="e.g. 1st Place at National RoboWars Competition"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-[#74186E]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddAchOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#74186E] hover:bg-[#62125D] text-white shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save Achievement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
