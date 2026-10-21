import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { 
  Users, 
  Plus, 
  Search, 
  Trophy, 
  Edit, 
  Trash2, 
  ArrowRight, 
  FolderPlus,
  AlertCircle,
  UserPlus,
  X,
  Filter
} from 'lucide-react';

const pluralMember = (count) => {
  const n = parseInt(count, 10) || 0;
  return `${n} ${n === 1 ? 'member' : 'members'}`;
};

export const ClubsPage = () => {
  const { user, isRole, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from URL search parameters so filters survive refresh
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentClub, setCurrentClub] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', description: '' });
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [joiningClubId, setJoiningClubId] = useState(null);

  const categories = ['All', 'Flagship Fest', 'Engineering & Robotics', 'Coding & AI', 'Cultural & Arts'];

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Sync state changes to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
    if (debouncedSearch && debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

    setSearchParams(params, { replace: true });
  }, [activeCategory, debouncedSearch, setSearchParams]);

  // Fetch clubs when activeCategory or debouncedSearch changes
  useEffect(() => {
    fetchClubs();
  }, [activeCategory, debouncedSearch]);

  const hasActiveFilters = activeCategory !== 'All' || Boolean(searchInput.trim());

  const handleClearFilters = () => {
    setActiveCategory('All');
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams({}, { replace: true });
  };

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/clubs?';
      if (activeCategory !== 'All') url += `category=${encodeURIComponent(activeCategory)}&`;
      if (debouncedSearch && debouncedSearch.trim()) url += `search=${encodeURIComponent(debouncedSearch.trim())}&`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch clubs');
      const data = await res.json();
      setClubs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: '', category: 'Flagship Fest', description: '' });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (club) => {
    setCurrentClub(club);
    setFormData({
      name: club.name,
      category: club.category || '',
      description: club.description || ''
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create club');

      toast.success(`Club "${formData.name}" created successfully!`);
      setIsCreateOpen(false);
      fetchClubs();
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
      const res = await fetch(`/api/clubs/${currentClub.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update club');

      toast.success('Club updated successfully!');
      setIsEditOpen(false);
      fetchClubs();
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClub = async (club) => {
    if (!window.confirm(`Are you sure you want to delete "${club.name}"?`)) return;

    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete club');

      toast.success(`Club "${club.name}" deleted.`);
      fetchClubs();
    } catch (err) {
      toast.error(err.message || 'Failed to delete club');
    }
  };

  const handleJoinClub = async (clubId, clubName) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setJoiningClubId(clubId);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          club_id: clubId,
          position: 'Member'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join club');
      toast.success(`Welcome to ${clubName}! Your membership has been registered.`);
      fetchClubs();
    } catch (err) {
      toast.error(err.message || 'Membership notice');
    } finally {
      setJoiningClubId(null);
    }
  };

  const canManageClub = (club) => {
    if (isRole('admin')) return true;
    if (isRole('club_admin')) {
      return user?.clubs?.some(c => c.id === club.id);
    }
    return false;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            University Clubs &amp; Societies
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Official student chapters, technical clubs, and campus fest committees.
          </p>
        </div>

        {isRole('admin') && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all hover:opacity-95 self-start sm:self-auto"
            style={{ background: 'var(--primary)' }}
          >
            <Plus className="w-4 h-4" />
            Add New Club
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center p-4 rounded-2xl theme-card">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={{
                background: activeCategory === cat ? 'var(--primary)' : 'var(--bg)',
                color: activeCategory === cat ? '#FFFFFF' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input & Clear */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search clubs or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs focus:outline-none"
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

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Clubs Grid */}
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
      ) : clubs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl theme-card space-y-3">
          <FolderPlus className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium text-base" style={{ color: 'var(--text)' }}>No clubs found matching your criteria</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try switching categories or clearing search keywords.</p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => {
            const hasManageAccess = canManageClub(club);
            const hasAchievements = club.achievements && club.achievements.length > 0;

            return (
              <div
                key={club.id}
                className="flex flex-col justify-between rounded-2xl p-6 theme-card transition-all relative group"
              >
                <div className="space-y-4">
                  {/* Category & Member Count */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-3 py-1 rounded-full font-semibold border" style={{ background: 'var(--hero-bg)', color: 'var(--primary)', borderColor: 'var(--border)' }}>
                      {club.category || 'General Club'}
                    </span>
                    <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                      <Users className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                      <strong style={{ color: 'var(--text)' }}>{pluralMember(club.member_count)}</strong>
                    </span>
                  </div>

                  {/* Club Title & Description */}
                  <div>
                    <h3 className="text-xl font-bold transition-colors" style={{ color: 'var(--text)' }}>
                      {club.name}
                    </h3>
                    <p className="text-sm mt-2 line-clamp-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {club.description || 'Dedicated to advancing student initiatives and campus activities at Adani University.'}
                    </p>
                  </div>

                  {/* Achievements section */}
                  <div className="pt-3 border-t border-[var(--border)] min-h-[75px] space-y-1.5">
                    <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      Achievements {hasAchievements ? `(${club.achievements.length})` : ''}
                    </p>
                    {hasAchievements ? (
                      <ul className="space-y-1.5">
                        {club.achievements.slice(0, 2).map((ach) => (
                          <li key={ach.id} className="text-xs line-clamp-2 list-disc list-inside leading-snug" style={{ color: 'var(--text-muted)' }}>
                            {ach.description}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                        No achievements yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions: Join club button + View Club Details */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/clubs/${club.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold hover:underline transition-colors"
                      style={{ color: 'var(--primary)' }}
                    >
                      View Club Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {hasManageAccess && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(club)}
                          title="Edit Club"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isRole('admin') && (
                          <button
                            onClick={() => handleDeleteClub(club)}
                            title="Delete Club"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Join club button */}
                  <button
                    onClick={() => handleJoinClub(club.id, club.name)}
                    disabled={joiningClubId === club.id}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                    style={{
                      background: 'var(--hero-bg)',
                      color: 'var(--primary)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {joiningClubId === club.id ? 'Joining...' : isAuthenticated ? 'Join club' : 'Sign in to join'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Club Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New University Club"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Club Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Adani Coding Society"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="Flagship Fest">Flagship Fest</option>
              <option value="Engineering & Robotics">Engineering & Robotics</option>
              <option value="Coding & AI">Coding & AI</option>
              <option value="Cultural & Arts">Cultural & Arts</option>
              <option value="Sports & Fitness">Sports & Fitness</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the club's activities..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
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
              {actionLoading ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Club Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Club: ${currentClub?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Club Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="Flagship Fest">Flagship Fest</option>
              <option value="Engineering & Robotics">Engineering & Robotics</option>
              <option value="Coding & AI">Coding & AI</option>
              <option value="Cultural & Arts">Cultural & Arts</option>
              <option value="Sports & Fitness">Sports & Fitness</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
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