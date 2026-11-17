import React from 'react';
import { QRCode } from './QRCode';
import { X, Ticket, Calendar, MapPin, CheckCircle, Printer, Download } from 'lucide-react';

export const PassQRModal = ({ isOpen, onClose, registration }) => {
  if (!isOpen || !registration) return null;

  const passString = `AUFEST:PASS:${registration.id}:EVENT:${registration.event_id}:USER:${registration.user_id}`;
  const formattedDate = registration.event_date
    ? new Date(registration.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : 'TBD';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-sm w-full overflow-hidden space-y-0 my-auto text-center">
        
        {/* Ticket Top Purple Header */}
        <div className="p-6 bg-gradient-to-br from-[#5A145C] to-[#6B1B6E] text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-purple-100 border border-white/20">
            <Ticket className="w-3.5 h-3.5" /> Official AU Fest Ticket
          </span>

          <h3 className="text-xl font-black text-white mt-2 leading-tight">
            {registration.event_title}
          </h3>
          <p className="text-xs text-purple-200 mt-1 uppercase font-bold tracking-wider">
            {registration.club_name}
          </p>
        </div>

        {/* QR Code Body */}
        <div className="p-6 space-y-4 bg-white">
          <div className="flex justify-center">
            <QRCode value={passString} size={180} />
          </div>

          <div className="space-y-1">
            <p className="font-mono text-sm font-black text-[#6B1B6E]">
              PASS-#{registration.id}
            </p>
            <p className="text-xs text-gray-700 font-semibold truncate max-w-[240px] mx-auto">
              {registration.email}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600 text-left space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{registration.venue_name || 'Main Campus Venue'}</span>
            </div>
          </div>

          {registration.attended ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Checked In at Campus Venue</span>
            </div>
          ) : (
            <p className="text-[11px] text-gray-500">
              Present this QR pass or PASS-#{registration.id} at the entrance gate for check-in.
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={() => window.print()}
              className="w-full py-2 px-4 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badge</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
