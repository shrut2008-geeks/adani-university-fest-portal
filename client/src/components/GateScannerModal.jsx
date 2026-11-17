import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, XCircle, X, Search, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import jsQR from 'jsqr';
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
    osc.stop(ctx.currentTime + (success ? 0.12 : 0.2));
  } catch {
    // Autoplay blocked or unsupported
  }
}

export const GateScannerModal = ({ isOpen, onClose, onAttendanceUpdated, onCheckInSuccess }) => {
  const { token, isRole } = useAuth();
  const [activeTab, setActiveTab] = useState('camera'); // Default to QR Camera Scanner
  const [passInput, setPassInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && isRole('admin')) {
      setActiveTab('camera');
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
      setPassInput('');
    }
  }, [isOpen, isRole]);

  // Strict Security Guard: Students are blocked; only campus Admins can access the Gate Scanner
  if (!isOpen || !isRole('admin')) return null;

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current);
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
        throw new Error('Camera access not supported on this browser/connection. Please use Manual Pass Lookup.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);

      // Off-screen canvas for real-time jsQR video frame decoding
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let isScanning = true;

      const scanFrame = () => {
        if (!isScanning) return;

        const video = videoRef.current;
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (qrCode && qrCode.data) {
              isScanning = false;
              stopCamera();
              handleProcessCheckIn(qrCode.data);
              return;
            }
          } catch {
            // Ignore temporary frame capture errors
          }
        }

        scanIntervalRef.current = setTimeout(scanFrame, 120);
      };

      // Start scanning loop
      scanIntervalRef.current = setTimeout(scanFrame, 300);
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

    // INSTANT OPTIMISTIC FEEDBACK: 0ms response time
    playBeep(true);
    setScanResult({
      success: true,
      message: `PASS #${cleanedId} Verified: Check-in Successful! Student marked as Attended.`,
      isAttended: true,
      passId: cleanedId
    });
    setPassInput('');

    // Immediately notify parent components so the attendance roster turns green instantly!
    if (onAttendanceUpdated) onAttendanceUpdated(cleanedId, true);
    if (onCheckInSuccess) onCheckInSuccess(cleanedId, true);

    setLoading(true);

    try {
      const res = await fetch(`/api/registrations/${cleanedId}/toggle-attended`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'checkin' })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Pass #${cleanedId} not found in database roster.`);
      }

      // Re-confirm from server response
      const isAttended = data.registration?.attended ?? true;
      setScanResult({
        success: true,
        message: `PASS #${cleanedId} Verified: Check-in Successful! Student marked as ${isAttended ? 'Attended' : 'Absent'}.`,
        isAttended,
        passId: cleanedId
      });
    } catch (err) {
      // Revert optimistic update on failure
      setScanResult({
        success: false,
        message: err.message || `Check-in failed. PASS #${cleanedId} could not be verified.`
      });
      playBeep(false);
      if (onAttendanceUpdated) onAttendanceUpdated(cleanedId, false);
      if (onCheckInSuccess) onCheckInSuccess(cleanedId, false);
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
              <p className="text-xs text-purple-200">Instant attendee pass verification &amp; scanner</p>
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
            onClick={() => { setActiveTab('camera'); startCamera(); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'camera'
                ? 'bg-white text-[#6B1B6E] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live QR Scanner</span>
          </button>
          <button
            onClick={() => { setActiveTab('quick'); stopCamera(); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'quick'
                ? 'bg-white text-[#6B1B6E] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Manual Pass Lookup</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Result Alert Banner */}
          {scanResult && (
            <div 
              className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 transition-all ${
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
              <div className="space-y-0.5 flex-1">
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
                    disabled={!passInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-[#6B1B6E] text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all shadow-xs"
                  >
                    Check In
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6B1B6E]" />
                  <span>Type student's pass number (e.g. 1, 2, 3) and press Enter for instant check-in.</span>
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
