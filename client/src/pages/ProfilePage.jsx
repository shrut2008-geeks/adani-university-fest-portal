import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CertificateModal } from '../components/CertificateModal';
import { PassQRModal } from '../components/PassQRModal';
import { StatusBadge } from '../components/StatusBadge';
import { 
  User, 
  Award, 
  Calendar, 
  Ticket, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  QrCode,
  Building,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, token, isAuthenticated, isRole } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertReg, setSelectedCertReg] = useState(null);
  const [selectedQrPass, setSelectedQrPass] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyRegistrations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/registrations/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching student profile registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 max-w-lg mx-auto">
        <User className="w-12 h-12 mx-auto text-[#74186E]" />
        <h2 className="text-xl font-bold text-gray-900">Student Profile Sign In</h2>
        <p className="text-xs text-gray-500">
          Sign in with your Adani University student account to access your official activity portfolio, verified certificates, and registered passes.
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

  const attendedEvents = registrations.filter((r) => r.attended);
  const upcomingEvents = registrations.filter((r) => !r.attended && new Date(r.event_date) > new Date());
  const completedEvents = registrations.filter((r) => new Date(r.event_date) <= new Date());

  return (
    <div className="space-y-8 pb-16">
      {/* Student Portfolio Hero Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F7EEF6] border-2 border-[#E4CCE1] flex items-center justify-center text-2xl font-black text-[#74186E] shadow-xs">
            {user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {user?.email?.split('@')[0]}
              </h1>
              <StatusBadge status={user?.role} />
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified AU Account
              </span>
            </div>

            <p className="text-xs text-gray-500 font-mono">
              {user?.email} • Adani University, Ahmedabad
            </p>
            <p className="text-xs text-gray-600 pt-1">
              Official Student Co-Curricular &amp; Fest Activity Portfolio for Placement &amp; Academic Records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95"
            style={{ background: 'var(--primary)' }}
          >
            <Calendar className="w-3.5 h-3.5" /> Browse Events
          </Link>
          <Link
            to="/registrations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-800 border border-gray-300 shadow-xs hover:bg-gray-50"
          >
            <Ticket className="w-3.5 h-3.5 text-[#74186E]" /> My Passes
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">Events Attended</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {attendedEvents.length}
          </div>
          <p className="text-[11px] text-gray-400">Verified attendance check-ins</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">Certificates Earned</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {attendedEvents.length}
          </div>
          <p className="text-[11px] text-gray-400">Official digital certificates</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">Upcoming Passes</span>
            <Clock className="w-4 h-4 text-[#74186E]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {upcomingEvents.length}
          </div>
          <p className="text-[11px] text-gray-400">Confirmed seat passes</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">Total Registered</span>
            <Ticket className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {registrations.length}
          </div>
          <p className="text-[11px] text-gray-400">All registered fest entries</p>
        </div>
      </div>

      {/* Verified Certificates Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Verified Participation Certificates</h2>
              <p className="text-xs text-gray-500">Download and print official certificates with Adani University seal</p>
            </div>
          </div>
        </div>

        {attendedEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center space-y-3">
            <Award className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">No verified certificates yet</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Certificates are automatically unlocked as soon as your digital pass is scanned and verified at the venue gate desk.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attendedEvents.map((reg) => (
              <div
                key={reg.id}
                className="p-6 rounded-2xl bg-white border border-amber-200/70 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full pointer-events-none" />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-600" /> Verified Certificate
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    CERT-{reg.id}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#74186E] uppercase">
                    {reg.club_name}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5 line-clamp-1">
                    {reg.event_title}
                  </h3>
                </div>

                <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(reg.event_date).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{reg.venue_name || 'Main Campus'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Attendance Verified
                  </span>
                  <button
                    onClick={() => setSelectedCertReg(reg)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 transition-colors shadow-xs"
                  >
                    <Download className="w-3 h-3 text-amber-800" /> View &amp; Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Passes with QR Badges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upcoming Event Passes</h2>
            <p className="text-xs text-gray-500">Present your digital QR code for instant check-in at the gate</p>
          </div>
          <Link
            to="/registrations"
            className="text-xs font-bold text-[#74186E] hover:underline flex items-center gap-1"
          >
            Manage all passes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center space-y-3">
            <Ticket className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">No upcoming event registrations</p>
            <p className="text-xs text-gray-400">
              Browse the festival schedule to reserve passes for hackathons, workshops, and robotics challenges.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
              style={{ background: 'var(--primary)' }}
            >
              Explore Schedule
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((reg) => (
              <div
                key={reg.id}
                className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#74186E] transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#74186E] font-bold px-2 py-0.5 rounded-md bg-[#F7EEF6] border border-[#E4CCE1]">
                    PASS-#{reg.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Clock className="w-3 h-3" /> Confirmed
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#74186E] uppercase">
                    {reg.club_name}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5 truncate">
                    {reg.event_title}
                  </h3>
                </div>

                <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(reg.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{reg.venue_name || 'Main Campus'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedQrPass(reg)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95"
                    style={{ background: 'var(--primary)' }}
                  >
                    <QrCode className="w-3.5 h-3.5" /> View QR Code
                  </button>

                  <Link
                    to={`/events/${reg.event_id}`}
                    className="text-xs font-bold text-gray-600 hover:text-[#74186E]"
                  >
                    Event Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CertificateModal
        isOpen={Boolean(selectedCertReg)}
        onClose={() => setSelectedCertReg(null)}
        registration={selectedCertReg}
      />

      <PassQRModal
        isOpen={Boolean(selectedQrPass)}
        onClose={() => setSelectedQrPass(null)}
        registration={selectedQrPass}
      />
    </div>
  );
};
