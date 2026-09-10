import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Hospital,
  Doctor,
  Appointment,
  Complaint,
  MedicineStock,
  User,
  LanguageCode
} from '../../types';
import { apiStore } from '../../services/apiStore';
import { translations } from '../../utils/translations';
import {
  ShieldAlert,
  Building2,
  Stethoscope,
  Calendar,
  AlertTriangle,
  Star,
  Activity,
  Pill,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  MapPin,
  Plus,
  CheckCircle2,
  Filter,
  Mail,
  Lock,
  LogIn,
  XCircle
} from 'lucide-react';
import {
  Chart as ChartJS,
  registerables
} from 'chart.js';

// Register all Chart.js components, controllers, and scales
ChartJS.register(...registerables);

interface AdminDashboardViewProps {
  currentUser: User | null;
  onNavigate: (view: string, payload?: any) => void;
  language: LanguageCode;
  onUserAuth?: (user: User) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onNavigate,
  language,
  onUserAuth
}) => {
  const t = translations[language];

  // Admin authentication state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [adminTab, setAdminTab] = useState<'analytics' | 'hospitals' | 'complaints' | 'medicines'>('analytics');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    try {
      if (adminCode && adminCode.trim().toUpperCase() !== 'SIH2026') {
        setAdminError('Invalid Directorate Security Clearance Code.');
        return;
      }
      const user = apiStore.login(adminEmail.trim(), adminPassword, 'ADMIN');
      if (!user) {
        setAdminError('Access Denied: Invalid administrator credentials or incorrect password.');
        return;
      }
      if (onUserAuth) {
        onUserAuth(user);
      }
    } catch (err: any) {
      setAdminError(err?.message || 'Authentication error.');
    } finally {
      setAdminLoading(false);
    }
  };

  const analytics = useMemo(() => apiStore.getAnalytics(), []);
  const allHospitals = useMemo(() => apiStore.getHospitals(), []);
  const allDoctors = useMemo(() => apiStore.getDoctors(), []);
  const allComplaints = useMemo(() => apiStore.getComplaints(), []);
  const allMedicines = useMemo(() => apiStore.getMedicines(), []);

  // Filtered by district if specified
  const filteredHospitals = useMemo(() => {
    if (selectedDistrict === 'All') return allHospitals;
    return allHospitals.filter((h) => h.district.toLowerCase() === selectedDistrict.toLowerCase());
  }, [allHospitals, selectedDistrict]);

  // Chart canvas refs
  const ratingChartRef = useRef<HTMLCanvasElement | null>(null);
  const complaintCategoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const appointmentTrendChartRef = useRef<HTMLCanvasElement | null>(null);
  const medicineShortageChartRef = useRef<HTMLCanvasElement | null>(null);

  // Instances to destroy on re-render
  const chartsRef = useRef<{ [key: string]: ChartJS | null }>({});

  useEffect(() => {
    if (adminTab !== 'analytics') return;

    const destroyCanvasChart = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const existing = ChartJS.getChart(canvas);
      if (existing) {
        existing.destroy();
      }
    };

    // 1. HOSPITAL RATINGS COMPARISON (BAR CHART)
    if (ratingChartRef.current) {
      destroyCanvasChart(ratingChartRef.current);
      if (chartsRef.current['rating']) {
        chartsRef.current['rating']?.destroy();
      }
      const labels = allHospitals.slice(0, 8).map((h) => h.name.replace('Government ', '').substring(0, 18));
      const data = allHospitals.slice(0, 8).map((h) => h.rating);

      chartsRef.current['rating'] = new ChartJS(ratingChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Hospital Quality Rating (out of 5.0)',
              data,
              backgroundColor: 'rgba(37, 99, 235, 0.8)',
              borderColor: '#2563eb',
              borderWidth: 1.5,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 5,
              ticks: { stepSize: 1 }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // 2. COMPLAINTS BY CATEGORY (DOUGHNUT CHART)
    if (complaintCategoryChartRef.current) {
      destroyCanvasChart(complaintCategoryChartRef.current);
      if (chartsRef.current['complaint']) {
        chartsRef.current['complaint']?.destroy();
      }

      const catCounts: { [cat: string]: number } = {};
      allComplaints.forEach((c) => {
        catCounts[c.category] = (catCounts[c.category] || 0) + 1;
      });

      const catLabels = Object.keys(catCounts);
      const catData = Object.values(catCounts);

      chartsRef.current['complaint'] = new ChartJS(complaintCategoryChartRef.current, {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [
            {
              data: catData,
              backgroundColor: [
                '#f43f5e',
                '#f97316',
                '#eab308',
                '#06b6d4',
                '#8b5cf6',
                '#ec4899',
                '#10b981',
                '#64748b'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' as const, labels: { boxWidth: 12, font: { size: 10 } } }
          }
        }
      });
    }

    // 3. APPOINTMENT TRENDS (LINE CHART)
    if (appointmentTrendChartRef.current) {
      destroyCanvasChart(appointmentTrendChartRef.current);
      if (chartsRef.current['appointments']) {
        chartsRef.current['appointments']?.destroy();
      }

      chartsRef.current['appointments'] = new ChartJS(appointmentTrendChartRef.current, {
        type: 'line',
        data: {
          labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          datasets: [
            {
              label: 'OPD Patients Scheduled',
              data: [142, 189, 175, 210, 195, 130, 45],
              borderColor: '#0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              fill: true,
              tension: 0.35,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // 4. MEDICINE SHORTAGES (HORIZONTAL BAR)
    if (medicineShortageChartRef.current) {
      destroyCanvasChart(medicineShortageChartRef.current);
      if (chartsRef.current['medicines']) {
        chartsRef.current['medicines']?.destroy();
      }

      // Group low stock drugs
      const lowDrugs = allMedicines
        .filter((m) => m.quantity <= m.minimumThreshold)
        .slice(0, 6);

      chartsRef.current['medicines'] = new ChartJS(medicineShortageChartRef.current, {
        type: 'bar',
        data: {
          labels: lowDrugs.map((m) => m.medicineName.substring(0, 16)),
          datasets: [
            {
              label: 'Units Left in Stock',
              data: lowDrugs.map((m) => m.quantity),
              backgroundColor: '#f59e0b',
              borderRadius: 4
            },
            {
              label: 'Safety Threshold',
              data: lowDrugs.map((m) => m.minimumThreshold),
              backgroundColor: '#e2e8f0',
              borderRadius: 4
            }
          ]
        },
        options: {
          indexAxis: 'y' as const,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
          }
        }
      });
    }

    return () => {
      [ratingChartRef, complaintCategoryChartRef, appointmentTrendChartRef, medicineShortageChartRef].forEach(
        (ref) => {
          destroyCanvasChart(ref.current);
        }
      );
      chartsRef.current = {};
    };
  }, [adminTab, allHospitals, allComplaints, allMedicines]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-8 px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-950 text-white p-6 sm:p-8 space-y-2 text-center border-b border-slate-800">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 mb-3 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-purple-400 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-800 inline-block">
              State Directorate Security Gateway
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Directorate Administrative Command
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Restricted to State Health Officials, Directorate of Medical Services, and Authorized Public Health Quality Inspectors.
            </p>
          </div>

          {/* User role notice if logged in as citizen/staff */}
          {currentUser && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div className="space-y-0.5">
                <p className="font-semibold">
                  Signed in as {currentUser.name} ({currentUser.role.replace('_', ' ')})
                </p>
                <p className="text-[11px] text-amber-700">
                  State Directorate Administration clearance is required to view hospital audits, compliance metrics, and district surveillance.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="p-6 sm:p-8 space-y-4 text-xs">
            {adminError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{adminError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Government Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g. admin@mohfw.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-xs text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Admin Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-xs text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Directorate Security Clearance Code
              </label>
              <input
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="SIH2026 (or leave default)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-xs text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{adminLoading ? 'Verifying Clearance...' : 'Authenticate & Enter Directorate Command'}</span>
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 block">Registered Directorate Account:</span>
              <p>• Official Admin Email: <span className="font-mono text-slate-800 font-medium">admin@mohfw.gov.in</span></p>
              <p>• Password: <span className="font-mono text-slate-800 font-medium">password123</span></p>
              <p>• Clearance Code: <span className="font-mono text-slate-800 font-medium">SIH2026</span></p>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                ← Return to Public Citizen Services
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Authority Command Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                State Health Department & National Health Mission
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Command Level: State Administrator
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Public Healthcare Quality & Accessibility Intelligence
            </h1>
            <p className="text-xs text-slate-500">
              Real-time surveillance of district hospitals, rural PHCs, doctor attendances, drug stockouts, and public grievances.
            </p>
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <MapPin className="w-4 h-4 text-slate-400" />
            <select
              id="admin-district-filter"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="p-1 rounded-xl text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            >
              <option value="All">All Districts (State Overview)</option>
              <option value="NTR">NTR District</option>
              <option value="Krishna">Krishna District</option>
              <option value="Guntur">Guntur District</option>
            </select>
          </div>
        </div>

        {/* 6 Core KPI Cards (Section 16) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Total Facilities</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{analytics.totalHospitals}</span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">100% Geo-mapped</span>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Physicians Roster</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{analytics.totalDoctors}</span>
            <span className="text-[10px] text-blue-700 font-semibold block mt-1">14 Specialists</span>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">OPD Appointments</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{analytics.totalAppointments}</span>
            <span className="text-[10px] text-blue-700 font-semibold block mt-1">Zero Booking Fee</span>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Total Complaints</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{analytics.totalComplaints}</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">Public Escrow</span>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Grievances Solved</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{analytics.solvedComplaints}</span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
              {Math.round((analytics.solvedComplaints / Math.max(1, analytics.totalComplaints)) * 100)}% Redressal Rate
            </span>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">State Quality Score</span>
            <div className="flex items-center gap-1 text-2xl font-bold text-amber-600 mt-1">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>{analytics.avgQualityScore}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Citizen Verified</span>
          </div>
        </div>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="border border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setAdminTab('analytics')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            adminTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Interactive Visual Analytics</span>
        </button>

        <button
          onClick={() => setAdminTab('hospitals')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            adminTab === 'hospitals'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Facility Directory & Underserved Analysis</span>
        </button>

        <button
          onClick={() => setAdminTab('complaints')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            adminTab === 'complaints'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>State Grievance Escalation Queue</span>
        </button>

        <button
          onClick={() => setAdminTab('medicines')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            adminTab === 'medicines'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Supply Chain Shortages</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE CHARTS */}
      {adminTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Hospital Quality Ratings */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Hospital Quality Rating Comparison (Citizen Scorecard)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">Benchmark of public healthcare facilities based on verified patient ratings.</p>
            <div className="h-64 relative">
              <canvas ref={ratingChartRef} />
            </div>
          </div>

          {/* Chart 2: Complaints by Category */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600" />
                <span>Citizen Grievances by Root Cause</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">Distribution of reported public healthcare issues across all facilities.</p>
            <div className="h-64 relative">
              <canvas ref={complaintCategoryChartRef} />
            </div>
          </div>

          {/* Chart 3: Weekly Appointment Load Trends */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Weekly OPD Inflow & Digital Token Trends</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">Citizen utilization of advance digital appointment booking vs walk-ins.</p>
            <div className="h-64 relative">
              <canvas ref={appointmentTrendChartRef} />
            </div>
          </div>

          {/* Chart 4: Essential Medicine Shortages */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-amber-600" />
                <span>Critical Formulary Stockout Risk</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">Medicines operating below safety threshold requiring state warehouse replenishment.</p>
            <div className="h-64 relative">
              <canvas ref={medicineShortageChartRef} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITALS DIRECTORY & UNDERSERVED IDENTIFICATION */}
      {adminTab === 'hospitals' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Government Facilities Surveillance & Rural Underserved Detection
            </h3>
            <p className="text-xs text-slate-500">
              Identifying facilities with critical doctor vacancies, low beds, or missing ultrasound/X-ray diagnostics.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Hospital Name</th>
                  <th className="p-3">Level / Tier</th>
                  <th className="p-3">Location (Village / Mandal)</th>
                  <th className="p-3">Doctors on Roster</th>
                  <th className="p-3">Quality Score</th>
                  <th className="p-3">Emergency Ready</th>
                  <th className="p-3 text-right">Surveillance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHospitals.map((h) => {
                  const hospDocs = allDoctors.filter((d) => d.hospitalId === h.id);
                  const isRural = h.hospitalType.includes('PHC') || h.hospitalType.includes('CHC');

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <strong className="text-slate-900 text-sm block">{h.name}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">{h.phone}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] border ${
                            isRural
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-blue-50 text-blue-900 border-blue-200'
                          }`}
                        >
                          {h.hospitalType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {h.village}, {h.mandal}, {h.district}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {hospDocs.length} Specialists Assigned
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-amber-600">⭐ {h.rating}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({h.totalReviews})</span>
                      </td>
                      <td className="p-3">
                        {h.emergencyAvailable ? (
                          <span className="font-semibold text-emerald-700">✓ 24x7 Casualty</span>
                        ) : (
                          <span className="font-medium text-slate-400">Regular OPD Only</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onNavigate('hospital-details', { hospitalId: h.id })}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs shadow-xs transition-colors"
                        >
                          Audit Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLAINTS */}
      {adminTab === 'complaints' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              State Grievance Escalation & Redressal Tracking
            </h3>
            <p className="text-xs text-slate-500">
              High-level monitoring of unresolved complaints to prevent administrative delays.
            </p>
          </div>

          <div className="space-y-3">
            {allComplaints.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{c.complaintId}</span>
                    <span className="font-bold text-slate-900">{c.hospitalName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 font-semibold text-slate-700">
                      {c.category}
                    </span>
                  </div>
                  <p className="text-slate-700 italic">"{c.description}"</p>
                  {c.resolutionRemarks && (
                    <p className="text-emerald-900 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      Resolution: {c.resolutionRemarks}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span
                    className={`px-3 py-1 rounded-full font-bold ${
                      c.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    ● {c.status}
                  </span>
                  <button
                    onClick={() => {
                      apiStore.updateComplaintStatus(c.id, 'RESOLVED', 'Escalated and verified resolved by State Health Authority.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Force Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MEDICINES STOCKOUT MONITOR */}
      {adminTab === 'medicines' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              State Public Dispensary Stock Alert & Indent Requests
            </h3>
            <p className="text-xs text-slate-500">
              Automatically flagged when local PHC/CHC inventory falls below the safety threshold.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allMedicines
              .filter((m) => m.quantity <= m.minimumThreshold)
              .map((med) => {
                const hosp = apiStore.getHospitalById(med.hospitalId);

                return (
                  <div
                    key={med.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{med.medicineName}</span>
                      <span className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${
                        med.quantity === 0
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200'
                      }`}>
                        {med.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert'}
                      </span>
                    </div>

                    <div className="text-slate-600">
                      <span>Hospital: </span>
                      <strong className="text-slate-900">{hosp?.name || 'Govt Facility'}</strong>
                    </div>

                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
                      <span>Remaining: <strong className="text-slate-900 font-mono">{med.quantity}</strong> units</span>
                      <span>Min Threshold: <strong className="font-mono">{med.minimumThreshold}</strong></span>
                    </div>

                    <button
                      onClick={() => {
                        apiStore.updateMedicineStock(med.id, med.quantity + 200);
                        alert(`Dispatched 200 units of ${med.medicineName} from State Central Medical Store.`);
                      }}
                      className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      Dispatch 200 Units from Warehouse
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
