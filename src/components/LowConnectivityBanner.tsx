import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  Wifi,
  QrCode,
  Download,
  Phone,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Building2,
  AlertCircle
} from 'lucide-react';
import { apiStore } from '../services/apiStore';
import { LanguageCode } from '../types';
import { translations } from '../utils/translations';

interface LowConnectivityBannerProps {
  language: LanguageCode;
  onNavigateToHospital?: (hospitalId: string) => void;
}

export const LowConnectivityBanner: React.FC<LowConnectivityBannerProps> = ({
  language,
  onNavigateToHospital
}) => {
  const t = translations[language];
  const [isLowBandwidthMode, setIsLowBandwidthMode] = useState<boolean>(() => {
    return localStorage.getItem('sih_low_bandwidth_mode') === 'true';
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [offlineTokens, setOfflineTokens] = useState<any[]>([]);

  useEffect(() => {
    const tokens = apiStore.getOfflineTokens();
    setOfflineTokens(tokens);
  }, [isExpanded]);

  const toggleMode = () => {
    const next = !isLowBandwidthMode;
    setIsLowBandwidthMode(next);
    localStorage.setItem('sih_low_bandwidth_mode', String(next));
    if (next) {
      document.body.classList.add('low-bandwidth-mode');
    } else {
      document.body.classList.remove('low-bandwidth-mode');
    }
  };

  const latestToken = offlineTokens[0];

  return (
    <div className="bg-slate-800 text-white rounded-2xl border border-slate-700 text-xs transition-all overflow-hidden shadow-xs w-full">
      <div className="w-full px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md ${isLowBandwidthMode ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'}`}>
            {isLowBandwidthMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              {isLowBandwidthMode ? '2G / Low-Connectivity Mode Active' : 'Rural 2G / Offline Network Assist'}
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400">
              {isLowBandwidthMode ? 'Fast text mode, cached passes offline' : 'Ensures zero data loss in rural mandals'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {latestToken && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Offline OPD Pass ({latestToken.tokenCode})</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <button
            onClick={toggleMode}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
              isLowBandwidthMode
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {isLowBandwidthMode ? 'Turn Off 2G Mode' : 'Enable 2G Mode'}
          </button>
        </div>
      </div>

      {/* Expanded Offline Pass & SMS/USSD Fallback Drawer */}
      {isExpanded && (
        <div className="bg-slate-900 border-t border-slate-700 p-4 sm:p-6 transition-all animate-in slide-in-from-top-2">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Offline Digital OPD Pass */}
            {latestToken ? (
              <div className="bg-white text-slate-900 rounded-2xl p-4 border border-slate-300 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Offline Verified OPD Token
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">
                    No Internet Needed
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
                    <span className="text-sm font-bold text-slate-800">{latestToken.patientName}</span>
                    <span className="text-xs text-slate-500 block mt-0.5">{latestToken.hospitalName}</span>
                    <span className="text-[11px] text-blue-600 font-semibold">{latestToken.department}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Token Code</span>
                    <span className="text-2xl font-black text-blue-700 font-mono tracking-tight">
                      {latestToken.tokenCode}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Chamber: {latestToken.roomNumber}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Est. Wait: <strong>~{latestToken.estimatedWaitMins} mins</strong></span>
                  </div>
                  <span className="text-emerald-700 font-medium">Valid for Today OPD</span>
                </div>

                <p className="text-[10px] text-slate-400 text-center">
                  Show this screen directly to the OPD entry counter or doctor chamber if mobile network is unavailable.
                </p>
              </div>
            ) : (
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-slate-300 text-xs">
                <p>No offline tokens stored yet. When you generate an OPD token, an offline copy is automatically saved here.</p>
              </div>
            )}

            {/* Right: USSD & SMS Fallback Guides */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Zero-Internet SMS & USSD Booking Channels
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                If data connectivity fails in remote mandals or villages, citizens and ASHA workers can use standard GSM SMS or basic keypad USSD without mobile data:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">SMS OPD Booking</span>
                  <p className="font-mono text-xs text-white bg-slate-950 p-1.5 rounded border border-slate-800">
                    OPD GGH MED to 166
                  </p>
                  <span className="text-[10px] text-slate-400 block">Returns SMS OPD Token instantly</span>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">Direct USSD Dial</span>
                  <p className="font-mono text-xs text-white bg-slate-950 p-1.5 rounded border border-slate-800">
                    *99*108# (Toll-Free)
                  </p>
                  <span className="text-[10px] text-slate-400 block">Works on all keypad mobile phones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
