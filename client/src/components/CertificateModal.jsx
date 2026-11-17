import React from 'react';
import { Award, Printer, X, CheckCircle, Calendar, MapPin } from 'lucide-react';

export const CertificateModal = ({ isOpen, onClose, registration }) => {
  if (!isOpen || !registration) return null;

  const eventTitle = registration.event_title || 'Campus Fest Event';
  const clubName = registration.club_name || 'Adani University Student Society';
  const attendeeEmail = registration.email || 'student@adani.ac.in';
  const formattedDate = registration.event_date
    ? new Date(registration.event_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'AU Fest 2026';
  const certId = `AUFEST-CERT-${registration.id}-${registration.event_id || '2026'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-3xl w-full p-6 sm:p-8 space-y-6 relative my-auto">
        
        {/* Top Controls (Hidden on print) */}
        <div className="flex items-center justify-between print:hidden pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>Verified Attendee • Official Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6B1B6E] hover:opacity-95 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Frame */}
        <div 
          id="printable-certificate"
          className="relative bg-gradient-to-br from-white via-[#FAF7FB] to-white border-8 border-double border-[#6B1B6E] p-8 sm:p-12 rounded-2xl shadow-inner text-center space-y-6"
        >
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <img src="/logo.png" alt="" className="w-96 h-96 object-contain" />
          </div>

          {/* Header */}
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-center gap-3">
              <img src="/logo.png" alt="Adani University Logo" className="h-12 w-12 object-contain" />
              <div className="text-left">
                <h3 className="text-xl font-black tracking-tight text-[#6B1B6E]">adani</h3>
                <p className="text-xs font-bold tracking-widest uppercase text-gray-700 -mt-1">University</p>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest pt-2">
              Annual Tech &amp; Cultural Fest • AU Fest
            </p>
          </div>

          {/* Certificate Title */}
          <div className="space-y-1 relative z-10 pt-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6B1B6E] tracking-tight font-serif italic">
              Certificate of Participation
            </h1>
            <p className="text-xs uppercase tracking-widest text-amber-700 font-bold">
              ★ Proudly Presented For Active Campus Engagement ★
            </p>
          </div>

          {/* Recipient */}
          <div className="relative z-10 space-y-3 py-2">
            <p className="text-xs sm:text-sm text-gray-600">This is proudly awarded to</p>
            <div className="inline-block border-b-2 border-[#6B1B6E] px-8 pb-1">
              <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {attendeeEmail}
              </p>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed pt-2">
              for their active participation and attendance in the fest event <br />
              <strong className="text-gray-900 text-sm sm:text-base font-bold font-sans">
                "{eventTitle}"
              </strong> <br />
              conducted by <span className="font-semibold text-[#6B1B6E]">{clubName}</span> at Adani University on <span className="font-semibold">{formattedDate}</span>.
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="grid grid-cols-3 items-end pt-6 border-t border-purple-200/80 relative z-10 text-xs">
            <div className="space-y-1">
              <div className="font-serif italic font-bold text-gray-800 text-sm">Fest Convener</div>
              <p className="text-[10px] text-gray-500">Adani University Fest Committee</p>
            </div>

            {/* Seal */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-[#6B1B6E] flex items-center justify-center p-1 bg-white shadow-sm">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Official Seal</span>
            </div>

            <div className="space-y-1">
              <div className="font-serif italic font-bold text-gray-800 text-sm">Dean of Students</div>
              <p className="text-[10px] text-gray-500">Adani University, Shantigram</p>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="pt-2 text-[10px] font-mono text-gray-400 tracking-wider">
            Verification ID: {certId}
          </div>
        </div>

      </div>
    </div>
  );
};
