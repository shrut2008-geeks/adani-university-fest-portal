import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, XCircle, X, Search, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Simple Web Audio API beep for affirmative scan audio feedback
function playBeep(success = true) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = success ? 'sine' : 'square';
    osc.frequency.value = success ? 880 : 300;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + (success ? 0.15 : 0.25));
  } catch {
    // Autoplay blocked or unsupported
  }
}

export const GateScannerModal = ({ isOpen, onClose, onAttendanceUpdated, onCheckInSuccess }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'camera'
  const [passInput, setPassInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult(null);
      setPassInput('');
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser/connection. Please use Pass Code Lookup.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Start automatic live QR detection if BarcodeDetector API is supported
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const rawVal = barcodes[0].rawValue;
                  if (rawVal) {
                    stopCamera();
                    handleProcessCheckIn(rawVal);
                  }
                }
              } catch {
                // Ignore transient frame decode errors
              }
            }
          }, 400);
        } catch {
          // BarcodeDetector initialization fallback
        }
      }
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera.');
      setCameraActive(false);
    }
  };

  const handleProcessCheckIn = async (passId) => {
    if (!passId) return;

    // Extract numeric ID from "PASS-#123", "REG-#123", "AUFEST:PASS:123", or plain "123"
    let cleanedId = null;
    const match = String(passId).match(/(\d+)/);
    if (match) {
      cleanedId = match[1];
    }

    if (!cleanedId) {
      setScanResult({
        success: false,
        message: 'Invalid Pass format. Please enter a valid pass ID number (e.g. 1, PASS-#1).'
      });
      playBeep(false);
      return;
    }

    setLoading(true);
    setScanResult(null);

    try {
      const res = await fetch(`/api/registrations/${cleanedId}/toggle-attended`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Pass #${cleanedId} not found in database roster.`);
      }

      const isAttended = data.registration?.attended;
      setScanResult({
        success: true,
        message: isAttended 
          ? `PASS #${cleanedId} Verified: Check-in Successful! Student marked as Attended.` 
          : `PASS #${cleanedId} Status Updated: Marked as Absent / Check-in revoked.`,
        isAttended,
        passId: cleanedId
      });
      playBeep(true);
      setPassInput('');

      if (onAttendanceUpdated) onAttendanceUpdated();
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || `Check-in failed. PASS #${cleanedId} could not be verified.`
      });
      playBeep(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (passInput.trim()) {
      handleProcessCheckIn(passInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden space-y-0">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#5A145C] to-[#6B1B6E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 border border-white/20">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Event Gate Check-in</h3>
              <p className="text-xs text-purple-200">Rapid attendee pass verification &amp; scanner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 p-1.5 gap-1.5">
          <button
            onClick={() => { setActiveTab('quick'); stopCamera(); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'quick'
                ? 'bg-white text-[#6B1B6E] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pass Code Lookup</span>
          </button>
          <button
            onClick={() => { setActiveTab('camera'); startCamera(); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'camera'
                ? 'bg-white text-[#6B1B6E] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Result Alert Banner */}
          {scanResult && (
            <div 
              className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 animate-fade-in ${
                scanResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-bold">{scanResult.success ? 'Verified Check-in' : 'Verification Notice'}</p>
                <p className="font-medium text-xs leading-relaxed">{scanResult.message}</p>
              </div>
            </div>
          )}

          {/* Tab 1: Pass Code Lookup */}
          {activeTab === 'quick' && (
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Enter Student Pass ID Number
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    placeholder="e.g. 1, 2, PASS-#3..."
                    className="w-full pl-10 pr-24 py-3 rounded-2xl text-sm border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-[#6B1B6E] focus:ring-2 focus:ring-[#6B1B6E]/20"
                  />
                  <button
                    type="submit"
                    disabled={loading || !passInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-[#6B1B6E] text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all shadow-xs"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Check In'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6B1B6E]" />
                  <span>Type student's pass number (e.g. 1, 2, 3) and press Enter to mark verified attendance.</span>
                </p>
              </div>
            </form>
          )}

          {/* Tab 2: Camera Viewfinder */}
          {activeTab === 'camera' && (
            <div className="space-y-4 text-center">
              {cameraError ? (
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-3">
                  <XCircle className="w-8 h-8 mx-auto text-rose-500" />
                  <p className="font-semibold">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6B1B6E] hover:opacity-95 shadow-sm"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative mx-auto rounded-2xl overflow-hidden aspect-square max-w-[280px] bg-black border-4 border-[#6B1B6E] shadow-md flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-8 border-2 border-dashed border-amber-300 rounded-xl pointer-events-none animate-pulse" />
                    <div className="absolute bottom-3 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-full text-[10px] text-white font-medium">
                      Point camera at ticket QR code
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Camera viewfinder is active. If your browser supports native barcode detection, it checks in automatically.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
