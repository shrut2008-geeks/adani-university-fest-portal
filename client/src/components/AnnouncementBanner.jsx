import React, { useEffect, useState } from 'react';
import { Megaphone, X, ChevronRight, AlertTriangle, Info, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Default fallback campus alerts for AU Fest if API table has not yet been seeded
  const fallbackAnnouncements = [
    {
      id: 'fb-1',
      title: 'RoboWars Venue Update',
      message: 'RoboWars challenge venue moved to Tech Lab Alpha (Block B) due to lab testing. Schedule remains 2:00 PM.',
      priority: 'urgent',
      link: '/events'
    },
    {
      id: 'fb-2',
      title: 'Hackathon Submissions Open',
      message: 'Round 1 problem statements for National Collegiate Hackathon are now live! Check in with your team pass.',
      priority: 'info',
      link: '/events'
    },
    {
      id: 'fb-3',
      title: 'Gate Pass QR Verification',
      message: 'Download or snapshot your digital QR pass from "My Event Passes" for instant mobile scanner check-in at entry doors.',
      priority: 'notice',
      link: '/registrations'
    }
  ];

  useEffect(() => {
    // Check if user dismissed recently
    const isDismissed = sessionStorage.getItem('au_fest_announcement_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
          return;
        }
      }
    } catch {
      // Fallback gracefully to offline campus notices
    }
    setAnnouncements(fallbackAnnouncements);
  };

  // Rotate notices every 8 seconds if there are multiple
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [announcements]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('au_fest_announcement_dismissed', 'true');
  };

  if (dismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex] || announcements[0];
  const isUrgent = current?.priority === 'urgent' || current?.priority === 'high';

  return (
    <div
      role="alert"
      className={`relative w-full border-b transition-colors shadow-xs ${
        isUrgent
          ? 'bg-rose-900 text-rose-50 border-rose-800'
          : 'bg-[#4B104E] text-purple-50 border-[#390C3B]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-2 flex items-center justify-between gap-3 text-xs">
        
        {/* Left: Badge + Icon */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] shrink-0 ${
              isUrgent
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-white/20 text-white'
            }`}
          >
            {isUrgent ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                <span>Urgent Alert</span>
              </>
            ) : (
              <>
                <Megaphone className="w-3 h-3" />
                <span>Campus Notice</span>
              </>
            )}
          </span>

          {/* Marquee Text / Headline */}
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold underline decoration-white/30 truncate">
              {current.title}:
            </span>
            <span className="text-white/90 truncate hidden sm:inline">
              {current.message}
            </span>
          </div>

          {current.link && (
            <Link
              to={current.link}
              className="inline-flex items-center gap-0.5 font-bold hover:underline shrink-0 text-white ml-1"
            >
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Right: Counter and Dismiss */}
        <div className="flex items-center gap-3 shrink-0">
          {announcements.length > 1 && (
            <span className="text-[10px] text-white/70 font-mono hidden md:inline">
              {currentIndex + 1} of {announcements.length}
            </span>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Dismiss campus notice"
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
