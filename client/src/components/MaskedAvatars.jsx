import React, { useState } from 'react';
import { UserCheck, Shield } from 'lucide-react';

/**
 * Vengeance UI-inspired Masked / Stacked Avatars with Tooltip
 * Renders overlapping circular avatars for event organisers, committee members, or hackathon teams.
 */
export const MaskedAvatars = ({ 
  members = [], 
  maxDisplay = 4,
  size = 'md' 
}) => {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!members || members.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">No organisers assigned yet</span>
    );
  }

  const displayed = members.slice(0, maxDisplay);
  const remaining = members.length - maxDisplay;

  // Avatar dimension classes
  const sizeClasses = size === 'sm' 
    ? 'w-7 h-7 text-[10px]' 
    : 'w-8 h-8 text-xs';

  // Distinct Adani University friendly background colors for avatars
  const avatarColors = [
    '#6B1B6E',
    '#2E64A5',
    '#00853E',
    '#D9531E',
    '#795290',
    '#C4302B'
  ];

  return (
    <div className="flex items-center -space-x-2 relative">
      {displayed.map((member, index) => {
        const name = member.name || member.user_name || member.student_email || member.email || `Member ${index + 1}`;
        const role = member.role || 'Organiser';
        const initial = name.charAt(0).toUpperCase();
        const bgColor = avatarColors[index % avatarColors.length];

        return (
          <div
            key={member.id || index}
            className="relative group"
            onMouseEnter={() => setActiveTooltip(index)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* Circular Avatar */}
            <div
              className={`${sizeClasses} rounded-full ring-2 ring-white flex items-center justify-center font-bold text-white shadow-2xs cursor-pointer transition-transform group-hover:scale-110 group-hover:z-20 relative`}
              style={{ background: bgColor }}
            >
              {initial}
            </div>

            {/* Hover Tooltip Popup */}
            {activeTooltip === index && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 min-w-[140px] px-2.5 py-1.5 rounded-xl bg-gray-900 text-white shadow-lg pointer-events-none text-left">
                <div className="text-[11px] font-bold truncate">
                  {name}
                </div>
                <div className="text-[10px] text-purple-300 font-medium flex items-center gap-1 mt-0.5">
                  <Shield className="w-2.5 h-2.5" />
                  <span>{role}</span>
                </div>
                {/* Tooltip caret */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        );
      })}

      {/* Overflow bubble if more than maxDisplay */}
      {remaining > 0 && (
        <div 
          className={`${sizeClasses} rounded-full ring-2 ring-white bg-gray-200 text-gray-700 font-bold flex items-center justify-center shadow-2xs z-10`}
          title={`${remaining} more members`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
