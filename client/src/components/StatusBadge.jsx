import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const getStyle = (val) => {
    switch (val.toLowerCase()) {
      // Colour-coded status badges based on real event lifecycle/capacity
      case 'open':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'filling fast':
      case 'filling_fast':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'full':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case 'completed':
        return 'bg-slate-100 text-slate-600 border-slate-200 font-medium';

      // Traditional event statuses
      case 'planned':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'ongoing':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';

      // Payment Status
      case 'approved':
        return 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0] font-semibold';
      case 'pending':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] font-semibold';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';

      // Member Position
      case 'president':
        return 'bg-[#F7EEF6] text-[#6B1B72] border-[#DDBDD9] font-bold';
      case 'vice-president':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
      case 'member':
        return 'bg-gray-100 text-gray-600 border-gray-200';

      // User Roles
      case 'admin':
        return 'bg-[#6B1B72] text-white border-transparent';
      case 'club_admin':
        return 'bg-[#1D4ED8] text-white border-transparent';
      case 'student':
        return 'bg-[#15803D] text-white border-transparent';

      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs transition-colors border ${getStyle(status)}`}>
      {status}
    </span>
  );
};

// Helper to determine the colour-coded event status badge based on real data fields
export const getEventStatusInfo = (event) => {
  if (!event) return { label: 'Open', status: 'open' };

  const rawStatus = (event.status || '').toLowerCase();
  if (rawStatus === 'completed') {
    return { label: 'Completed', status: 'completed' };
  }

  const regCount = parseInt(event.registrations_count ?? event.registration_count ?? 0, 10);
  const cap = parseInt(event.venue_capacity ?? event.capacity ?? 0, 10);

  if (cap > 0 && regCount >= cap) {
    return { label: 'Full', status: 'full' };
  }

  if (cap > 0 && (regCount / cap) >= 0.8) {
    return { label: 'Filling Fast', status: 'filling fast' };
  }

  return { label: 'Open', status: 'open' };
};

export const EventStatusBadge = ({ event }) => {
  const { label } = getEventStatusInfo(event);
  return <StatusBadge status={label} />;
};
