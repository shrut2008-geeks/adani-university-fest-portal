import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const getStyle = (val) => {
    switch (val.toLowerCase()) {
      // Event Status — exact spec colors
      case 'planned':
        return 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]';
      case 'ongoing':
        return 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA] font-semibold';
      case 'completed':
        return 'bg-[#F3E8FF] text-[#6B1B72] border-[#E9D5FF]';

      // Payment Status — exact spec colors
      case 'approved':
        return 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]';
      case 'pending':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';

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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyle(status)}`}>
      {status}
    </span>
  );
};
