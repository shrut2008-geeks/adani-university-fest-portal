import React, { useEffect, useState } from 'react';

/**
 * Vengeance UI-inspired Stats Counter
 * Smoothly animates numbers from 0 to the target value using ease-out easing.
 */
export const StatsCounter = ({ 
  value = 0, 
  duration = 1400, 
  prefix = '', 
  suffix = '',
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Extract numeric portion if value is string like "12", "150", or raw number
  const numericTarget = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;

  useEffect(() => {
    let startTimestamp = null;
    const startVal = 0;
    const diff = numericTarget - startVal;

    if (diff === 0) {
      setDisplayValue(0);
      return;
    }

    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula: 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + diff * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [numericTarget, duration]);

  // Format with Indian locale commas if greater than 999
  const formatted = displayValue.toLocaleString('en-IN');

  return (
    <span className={`inline-block font-sans ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
