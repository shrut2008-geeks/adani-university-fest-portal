import React, { useEffect, useState } from 'react';
import { Award, Sparkles, ExternalLink } from 'lucide-react';

// High-profile baseline sponsors for AU Fest
const BASELINE_SPONSORS = [
  { id: 1, name: 'Adani Group', tier: 'Title Partner', color: '#6B1B6E' },
  { id: 2, name: 'AWS Educate', tier: 'Cloud Partner', color: '#FF9900' },
  { id: 3, name: 'GitHub Campus', tier: 'Developer Partner', color: '#24292E' },
  { id: 4, name: 'Red Bull Energy', tier: 'Beverage Partner', color: '#DB0A40' },
  { id: 5, name: 'Intel Innovation', tier: 'Hardware Partner', color: '#0071C5' },
  { id: 6, name: 'Adani Solar', tier: 'Sustainability Partner', color: '#00853E' },
  { id: 7, name: 'Postman Student', tier: 'API Partner', color: '#FF6C37' },
  { id: 8, name: 'Polygon Labs', tier: 'Web3 Partner', color: '#8247E5' }
];

/**
 * Vengeance UI-inspired Logo Slider / Infinite Marquee
 * Continuous smooth scrolling marquee of official festival partners and sponsors.
 */
export const LogoSlider = ({ title = "Proudly Powered By Official Fest Partners & Sponsors" }) => {
  const [sponsors, setSponsors] = useState(BASELINE_SPONSORS);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const res = await fetch('/api/sponsors');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge API sponsors with baseline partners for a rich marquee
          const mapped = data.map((s, idx) => ({
            id: s.id || `api-${idx}`,
            name: s.name,
            tier: s.tier || 'Associate Partner',
            color: '#6B1B6E'
          }));
          setSponsors([...mapped, ...BASELINE_SPONSORS]);
          return;
        }
      }
    } catch {
      // Graceful fallback to baseline
    }
    setSponsors(BASELINE_SPONSORS);
  };

  const displayList = sponsors.length > 0 ? sponsors : BASELINE_SPONSORS;
  // Duplicate list to achieve continuous infinite marquee loop
  const marqueeItems = [...displayList, ...displayList];

  return (
    <div className="w-full py-6 overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-xs relative">
      {/* Title */}
      <div className="px-6 pb-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#74186E]" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">
            {title}
          </span>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">
          Official Industry &amp; Tech Collaborators
        </span>
      </div>

      {/* Marquee Wrapper with side fade gradients */}
      <div className="relative w-full overflow-hidden mt-4">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Marquee track */}
        <div className="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused] py-1 cursor-pointer">
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-[#74186E] hover:bg-[#FAF8FB] transition-all shrink-0 shadow-2xs group"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-2xs"
                style={{ background: item.color || '#6B1B6E' }}
              >
                {item.name.charAt(0)}
              </div>

              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-[#74186E] transition-colors whitespace-nowrap">
                  {item.name}
                </div>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  {item.tier}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
