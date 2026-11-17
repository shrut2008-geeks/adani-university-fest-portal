// Utility functions for generating calendar links and .ics files for AU Fest events

// Formats a Date object or ISO string into UTC format: YYYYMMDDTHHmmssZ
export function formatToIcsDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Generates an end date (defaults to +2 hours after start if not specified)
export function getEndDate(startDateString, durationHours = 2) {
  const date = new Date(startDateString);
  date.setHours(date.getHours() + durationHours);
  return date;
}

// Generates a Google Calendar Direct Template URL
export function getGoogleCalendarUrl(event) {
  if (!event || !event.date) return '#';

  const startTime = formatToIcsDate(event.date);
  const endTime = formatToIcsDate(getEndDate(event.date));
  const title = encodeURIComponent(`${event.title} - AU Fest`);
  const details = encodeURIComponent(
    `Official AU Fest Event organized by ${event.club_name || 'Adani University'}.\n\n` +
    `Status: ${event.status || 'Planned'}\n` +
    `Venue: ${event.venue_name || 'Adani University Campus'}\n\n` +
    `Access event portal: https://www.adaniuni.ac.in/`
  );
  const location = encodeURIComponent(event.venue_name ? `${event.venue_name}, Adani University, Ahmedabad` : 'Adani University, Shantigram, SG Highway, Ahmedabad');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
}

// Generates an RFC 5545 standard .ics file and triggers download
export function downloadIcsFile(event) {
  if (!event || !event.date) return;

  const startTime = formatToIcsDate(event.date);
  const endTime = formatToIcsDate(getEndDate(event.date));
  const now = formatToIcsDate(new Date());
  const uid = `aufest-event-${event.id}-${Date.now()}@adaniuni.ac.in`;
  const summary = `${event.title} (AU Fest)`;
  const description = `Organized by ${event.club_name || 'Adani University'}. Venue: ${event.venue_name || 'Main Campus'}.`;
  const location = event.venue_name ? `${event.venue_name}, Adani University, Ahmedabad, Gujarat` : 'Adani University, Shantigram, SG Highway, Ahmedabad';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Adani University//AU Fest Event Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `STATUS:${(event.status || 'CONFIRMED').toUpperCase()}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitizedTitle = (event.title || 'event').toLowerCase().replace(/[^a-z0-9]/g, '_');
  a.download = `aufest_${sanitizedTitle}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
