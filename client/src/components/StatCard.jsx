import React, { useState, useEffect } from 'react';

// Count-up hook to animate numbers on load
const useCountUp = (targetValue, duration = 1200) => {
  const [displayValue, setDisplayValue] = useState(targetValue);

  useEffect(() => {
    if (targetValue === undefined || targetValue === null) return;

    // Check if targetValue is currency format (e.g. "₹ 1,50,000" or contains ₹)
    const isCurrency = typeof targetValue === 'string' && (targetValue.includes('₹') || targetValue.includes('INR'));
    const numericStr = String(targetValue).replace(/[^0-9.]/g, '');
    const targetNum = parseFloat(numericStr);

    if (isNaN(targetNum) || targetNum === 0) {
      setDisplayValue(targetValue);
      return;
    }

    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * easeProgress;

      if (isCurrency) {
        setDisplayValue(
          new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
          }).format(Math.round(current))
        );
      } else {
        setDisplayValue(Math.round(current).toLocaleString());
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration]);

  return displayValue;
};

export const StatCard = ({ title, value, icon: Icon, accentColor = 'purple', subtitle }) => {
  const animatedValue = useCountUp(value);

  const iconStyle = {
    bg: 'bg-[#F7EEF6]',
    text: 'text-[#6B1B72]',
    border: 'border-[#E4CCE1]'
  };

  return (
    <div className="theme-card relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-black tracking-tight break-words font-sans transition-all" style={{ color: 'var(--primary)' }}>
            {animatedValue}
          </div>
          {subtitle && (
            <p className="text-xs mt-1 line-clamp-2 leading-relaxed font-normal" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${iconStyle.bg} ${iconStyle.text} ${iconStyle.border}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
