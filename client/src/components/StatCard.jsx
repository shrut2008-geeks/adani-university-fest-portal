import React from 'react';

export const StatCard = ({ title, value, icon: Icon, accentColor = 'purple', subtitle }) => {
  // Requirement 6: Use purple tints for all three icons
  const iconStyle = {
    bg: 'bg-[#F7EEF6]',
    text: 'text-[#6B1B72]',
    border: 'border-[#E4CCE1]'
  };

  return (
    <div className="theme-card relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-black tracking-tight break-words font-sans" style={{ color: 'var(--primary)' }}>
            {value}
          </div>
          {subtitle && (
            <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border flex-shrink-0 ${iconStyle.bg} ${iconStyle.text} ${iconStyle.border}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
