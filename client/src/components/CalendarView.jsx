import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Ticket,
  ExternalLink,
  Download
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';

export const CalendarView = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group events by day string YYYY-MM-DD
  const eventsByDay = {};
  events.forEach((evt) => {
    if (!evt.date) return;
    const d = new Date(evt.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(evt);
  });

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  // Build grid days
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    calendarCells.push({
      dayNum,
      isCurrentMonth: false,
      dateKey: null
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: day,
      isCurrentMonth: true,
      isToday: key === todayStr,
      dateKey: key,
      dayEvents: eventsByDay[key] || []
    });
  }

  // Trailing next month days to complete grid (multiples of 7)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    calendarCells.push({
      dayNum: day,
      isCurrentMonth: false,
      dateKey: null
    });
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Calendar Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 gap-4 bg-[#FAF8FB]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#F7EEF6] border border-[#E4CCE1]">
            <CalendarIcon className="w-5 h-5 text-[#74186E]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-gray-500">
              {events.length} campus events scheduled across all clubs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#74186E] bg-white border border-[#E4CCE1] hover:bg-[#F7EEF6] transition-colors shadow-sm"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            className="p-1.5 rounded-xl text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            aria-label="Next Month"
            className="p-1.5 rounded-xl text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Columns Header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-bold text-gray-600 py-3">
        {daysOfWeek.map((day) => (
          <div key={day} className="uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Monthly Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 bg-gray-200">
        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div 
                key={`empty-${idx}`} 
                className="bg-gray-50/70 min-h-[110px] p-2 text-right text-xs text-gray-300 select-none"
              >
                {cell.dayNum}
              </div>
            );
          }

          return (
            <div
              key={cell.dateKey}
              className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors bg-white ${
                cell.isToday ? 'bg-purple-50/40 ring-1 ring-inset ring-[#74186E]/30' : 'hover:bg-gray-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    cell.isToday
                      ? 'bg-[#74186E] text-white shadow-sm'
                      : 'text-gray-700'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {cell.dayEvents && cell.dayEvents.length > 0 && (
                  <span className="text-[10px] font-semibold text-[#74186E] bg-[#F7EEF6] px-1.5 py-0.5 rounded-md">
                    {cell.dayEvents.length} {cell.dayEvents.length === 1 ? 'event' : 'events'}
                  </span>
                )}
              </div>

              {/* Event Pills for the day */}
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-36">
                {cell.dayEvents && cell.dayEvents.map((evt) => {
                  const eventTime = new Date(evt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={evt.id}
                      className="group/pill block p-1.5 rounded-lg border border-purple-100 bg-purple-50/70 hover:bg-[#F7EEF6] hover:border-[#74186E] transition-all text-left shadow-xs"
                    >
                      <Link
                        to={`/events/${evt.id}`}
                        className="block font-bold text-xs text-gray-900 truncate hover:text-[#74186E] transition-colors"
                        title={evt.title}
                      >
                        {evt.title}
                      </Link>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                        <span className="font-medium text-[#74186E] truncate max-w-[90px]">
                          {evt.club_name}
                        </span>
                        <span>{eventTime}</span>
                      </div>

                      {/* Quick Calendar buttons */}
                      <div className="mt-1 pt-1 border-t border-purple-100/60 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 truncate max-w-[80px]">
                          {evt.venue_name || 'Main Campus'}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={getGoogleCalendarUrl(evt)}
                            target="_blank"
                            rel="noreferrer"
                            title="Add to Google Calendar"
                            className="text-gray-500 hover:text-[#74186E] p-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <button
                            onClick={() => downloadIcsFile(evt)}
                            title="Download iCal (.ics)"
                            className="text-gray-500 hover:text-[#74186E] p-0.5"
                          >
                            <Download className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
