import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Mic,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  Calendar,
  AlertTriangle,
  Star,
  Clock,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Navigation
} from 'lucide-react';
import { Hospital, LanguageCode, User } from '../../types';
import { translations } from '../../utils/translations';
import { HospitalMap } from '../HospitalMap';
import { useSpeechRecognition } from '../../utils/useSpeechRecognition';

interface HomeViewProps {
  hospitals: (Hospital & { distance?: number })[];
  userCoords: { lat: number; lng: number } | null;
  onUseMyLocation: () => void;
  isLocating?: boolean;
  onNavigate: (view: string, payload?: any) => void;
  language: LanguageCode;
  currentUser: User | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  hospitals,
  userCoords,
  onUseMyLocation,
  isLocating = false,
  onNavigate,
  language,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[language];

  const { isListening, isSupported, startListening } = useSpeechRecognition((transcript) => {
    setSearchQuery(transcript);
    onNavigate('search', { query: transcript });
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('search', { query: searchQuery });
  };

  const quickCards = [
    {
      id: 'quick-hospitals',
      title: t.quickHospitals,
      desc: 'Discover government hospitals, CHCs & rural PHCs with beds & facilities',
      icon: Building2,
      action: () => onNavigate('hospitals')
    },
    {
      id: 'quick-doctors',
      title: t.quickDoctors,
      desc: 'Specialists on duty, OPD hours & live consultation statuses',
      icon: Stethoscope,
      action: () => onNavigate('search', { type: 'doctor' })
    },
    {
      id: 'quick-medicines',
      title: t.quickMedicines,
      desc: 'Real-time essential formulary & Jan Aushadhi generic availability',
      icon: Pill,
      action: () => onNavigate('search', { type: 'medicine' })
    },
    {
      id: 'quick-services',
      title: t.quickServices,
      desc: 'Free Diagnostic Labs, Digital X-Ray, Sonography & Dialysis wait times',
      icon: Activity,
      action: () => onNavigate('search', { type: 'service' })
    },
    {
      id: 'quick-appointments',
      title: t.quickAppointments,
      desc: 'Digital OPD tokens & booking without standing in long queues',
      icon: Calendar,
      action: () => onNavigate('my-appointments')
    },
    {
      id: 'quick-complaints',
      title: t.quickComplaints,
      desc: 'Report unavailable doctor, medicine shortage or grievance directly to Govt',
      icon: AlertTriangle,
      action: () => onNavigate('complaints')
    },
    {
      id: 'quick-feedback',
      title: t.quickFeedback,
      desc: 'Rate cleanliness, doctor consultation & improve public health quality',
      icon: Star,
      action: () => onNavigate('feedback')
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section with Clean Utility Design */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>National Public Healthcare Accessibility Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              {t.findNearbyHeader}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {t.findNearbySubtitle}
            </p>
          </div>

          <button
            type="button"
            id="home-use-location-btn"
            onClick={onUseMyLocation}
            disabled={isLocating}
            className={`self-start md:self-auto px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
              userCoords
                ? 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Detecting GPS Location...</span>
              </>
            ) : userCoords ? (
              <>
                <Navigation className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span>GPS Location Active ({userCoords.lat.toFixed(2)}°, {userCoords.lng.toFixed(2)}°)</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{t.useMyLocation}</span>
              </>
            )}
          </button>
        </div>

        {/* Clean Search Form matching theme */}
        <form
          id="home-search-form"
          onSubmit={handleSearchSubmit}
          className="relative pt-1"
        >
          <div className="relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <input
              id="home-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-12 pr-32 py-3.5 sm:py-4 bg-white border border-slate-200 rounded-2xl shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-slate-800 placeholder-slate-400 font-medium"
            />
            <div className="absolute right-2.5 top-2 sm:top-2.5 flex items-center gap-2">
              <button
                type="button"
                id="home-voice-search-btn"
                onClick={startListening}
                title={isSupported ? t.voiceSearchTitle : 'Voice search not supported in current browser'}
                className={`p-2 rounded-xl transition-colors ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="submit"
                id="home-search-submit-btn"
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                {t.searchBtn}
              </button>
            </div>
          </div>

          {isListening && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>{t.listening}</span>
            </div>
          )}
        </form>

        {/* Quick Utility stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
            <span className="block font-bold text-base text-slate-900">100% Free</span>
            <span className="text-[11px] text-slate-500">OPD Consultations</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
            <span className="block font-bold text-base text-slate-900">24x7 Ready</span>
            <span className="text-[11px] text-slate-500">Emergency & Trauma</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
            <span className="block font-bold text-base text-slate-900">Daily Stock</span>
            <span className="text-[11px] text-slate-500">Essential Medicines</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
            <span className="block font-bold text-base text-slate-900">Civic Redress</span>
            <span className="text-[11px] text-slate-500">Direct Govt Escalation</span>
          </div>
        </div>
      </section>

      {/* Quick Access Action Cards */}
      <section aria-labelledby="quick-access-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="quick-access-heading" className="text-base font-bold text-slate-900 tracking-tight">
            Key Healthcare Services & Citizen Assistance
          </h2>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Transparent public healthcare workflows</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                id={card.id}
                onClick={card.action}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between text-left"
              >
                <div>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{card.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{card.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Map & Live Quality Insights Section (Split Bento Layout) */}
      <section id="interactive-map-section" className="space-y-4 pt-2 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Interactive Public Healthcare Map & Live District Status</span>
            </h2>
            <p className="text-xs text-slate-500">
              {userCoords
                ? `Showing verified public facilities with real-time distance from your GPS coordinates (${userCoords.lat.toFixed(4)}°N, ${userCoords.lng.toFixed(4)}°E)`
                : 'Using NTR District reference center (Vijayawada). Click "Use My Current Location" above for real-time GPS distances.'}
            </p>
          </div>
          <button
            id="view-all-hospitals-btn"
            onClick={() => onNavigate('hospitals')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Public Facilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Map with Utility Overlays */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <HospitalMap
                hospitals={hospitals}
                userCoords={userCoords}
                onSelectHospital={(h) => onNavigate('hospital-details', { hospitalId: h.id })}
                height="380px"
              />
            </div>

            {/* Bottom Map Status Bar */}
            <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Facilities Shown</span>
                  <span className="text-sm font-bold text-slate-900">{hospitals.length} Centers</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Emergency Units</span>
                  <span className="text-sm font-bold text-slate-900">
                    {hospitals.filter((h) => h.emergencyAvailable).length} Available
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Digital OPD</span>
                  <span className="text-sm font-bold text-emerald-600">Active Live</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('search')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Filter Map
                </button>
                <button
                  onClick={() => onNavigate('hospitals')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Hospital Directory
                </button>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Quality Insights Panel (Clean Utility / Minimal dark card) */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Quality Insights</h3>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-emerald-400 font-bold tracking-wide">
                  LIVE UPDATE
                </span>
              </div>

              <div className="space-y-5">
                {/* Circular indicator stat */}
                <div className="flex items-center gap-4 bg-slate-800/60 p-3 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold">84%</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Service Availability</p>
                    <p className="text-xs text-slate-400">District Average: 72%</p>
                  </div>
                </div>

                {/* Essential Medicines Stock Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">Essential Formulary in Stock</span>
                    <span className="text-blue-400 font-bold">92%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-[10px] text-slate-400">Verified by Jan Aushadhi & Govt Depots</span>
                </div>

                {/* Top Rated Facility */}
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400">Top Rated Facility in Area</span>
                  <p className="font-bold text-slate-200">Community Health Centre, Mangalagiri</p>
                  <p className="text-slate-400 text-[11px]">⭐ 4.6/5.0 from 210+ verified citizen reviews</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Public Quality Score</span>
              <button
                onClick={() => onNavigate('feedback')}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <span>View Audits</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Public Hospitals List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Government Facilities with Live OPD & Emergency Care
          </h2>
          <button
            onClick={() => onNavigate('hospitals')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            See All Facilities
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitals.slice(0, 6).map((hosp) => (
            <div
              key={hosp.id}
              id={`hospital-card-${hosp.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {hosp.hospitalType}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{hosp.rating}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({hosp.totalReviews})</span>
                  </div>
                </div>

                <h3
                  className="font-bold text-base text-slate-900 leading-snug group-hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={() => onNavigate('hospital-details', { hospitalId: hosp.id })}
                >
                  {hosp.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  📍 {hosp.address}, {hosp.district}, {hosp.state} - {hosp.pincode}
                </p>

                {hosp.distance !== undefined && (
                  <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{hosp.distance} km away from your location</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hosp.facilities.slice(0, 3).map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                    >
                      {f}
                    </span>
                  ))}
                  {hosp.facilities.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400">
                      +{hosp.facilities.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  id={`btn-details-${hosp.id}`}
                  onClick={() => onNavigate('hospital-details', { hospitalId: hosp.id })}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  {t.viewDetails}
                </button>
                <button
                  id={`btn-book-${hosp.id}`}
                  onClick={() => onNavigate('appointment', { hospitalId: hosp.id })}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {t.bookAppointment}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency Helpline Banner */}
      <section className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
            <PhoneCall className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-rose-950">
              National & State Emergency Medical Toll-Free Helplines
            </h3>
            <p className="text-xs text-rose-800">
              For acute medical trauma call <strong>108</strong> (Ambulance), maternal/infant transport <strong>102</strong>, or tele-consultation <strong>104</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:108"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            Call 108
          </a>
          <a
            href="tel:102"
            className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            Call 102
          </a>
        </div>
      </section>
    </div>
  );
};
