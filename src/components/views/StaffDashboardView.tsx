import React, { useState, useMemo } from 'react';
import {
  Hospital,
  Doctor,
  HospitalService,
  MedicineStock,
  Appointment,
  Complaint,
  User,
  LanguageCode
} from '../../types';
import { apiStore } from '../../services/apiStore';
import { translations } from '../../utils/translations';
import {
  LayoutDashboard,
  Stethoscope,
  Activity,
  Pill,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Save,
  Building2,
  RefreshCw,
  Clock,
  Mail,
  Lock,
  LogIn
} from 'lucide-react';

interface StaffDashboardViewProps {
  currentUser: User | null;
  onNavigate: (view: string, payload?: any) => void;
  language: LanguageCode;
  onUserAuth?: (user: User) => void;
}

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({
  currentUser,
  onNavigate,
  language,
  onUserAuth
}) => {
  const t = translations[language];
  const hospitals = apiStore.getHospitals();

  // Staff manual authentication state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Determine hospital managed by this staff member
  const initialHospitalId = currentUser?.hospitalId || (hospitals[0] ? hospitals[0].id : '');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(initialHospitalId);
  const [activeTab, setActiveTab] = useState<'doctors' | 'services' | 'medicines' | 'appointments' | 'complaints'>('doctors');
  const [notification, setNotification] = useState<string | null>(null);
  const [renderCount, setRenderCount] = useState(0);

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const user = apiStore.login(authEmail.trim(), authPassword, 'HOSPITAL_STAFF');
      if (!user) {
        setAuthError('Invalid hospital staff credentials. Please check your official email and password.');
        return;
      }
      if (onUserAuth) {
        onUserAuth(user);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const currentHospital = useMemo(
    () => apiStore.getHospitalById(selectedHospitalId),
    [selectedHospitalId]
  );

  const doctors = useMemo(
    () => apiStore.getDoctors(selectedHospitalId),
    [selectedHospitalId, renderCount]
  );

  const services = useMemo(
    () => apiStore.getServices(selectedHospitalId),
    [selectedHospitalId, renderCount]
  );

  const medicines = useMemo(
    () => apiStore.getMedicines(selectedHospitalId),
    [selectedHospitalId, renderCount]
  );

  const appointments = useMemo(
    () => apiStore.getAppointments(selectedHospitalId),
    [selectedHospitalId, renderCount]
  );

  const complaints = useMemo(
    () => apiStore.getComplaints(selectedHospitalId),
    [selectedHospitalId, renderCount]
  );

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // DOCTOR HANDLERS
  const handleDoctorStatusChange = (
    doctorId: string,
    status: 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_LEAVE'
  ) => {
    apiStore.updateDoctorStatus(doctorId, status);
    setRenderCount((c) => c + 1);
    showToast('Doctor consultation status updated in real-time');
  };

  // SERVICE HANDLERS
  const handleServiceToggle = (serviceId: string, available: boolean, waitTime: string) => {
    apiStore.updateServiceStatus(serviceId, available, waitTime);
    setRenderCount((c) => c + 1);
    showToast('Service availability and queue wait time saved');
  };

  // MEDICINE HANDLERS
  const handleMedicineQuantity = (medicineId: string, qty: number) => {
    apiStore.updateMedicineStock(medicineId, qty);
    setRenderCount((c) => c + 1);
    showToast('Dispensary stock count updated');
  };

  // APPOINTMENT HANDLERS
  const handleAppointmentStatus = (
    aptId: string,
    status: 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  ) => {
    apiStore.updateAppointmentStatus(aptId, status);
    setRenderCount((c) => c + 1);
    showToast(`Appointment status changed to ${status}`);
  };

  // COMPLAINT RESOLUTION STATE & HANDLERS
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<Complaint['status']>('RESOLVED');
  const [resolutionRemarks, setResolutionRemarks] = useState<string>('');

  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;
    apiStore.updateComplaintStatus(selectedComplaintId, resolutionStatus, resolutionRemarks);
    setSelectedComplaintId(null);
    setResolutionRemarks('');
    setRenderCount((c) => c + 1);
    showToast('Grievance status & resolution remarks recorded for citizen view');
  };

  if (!currentUser || currentUser.role !== 'HOSPITAL_STAFF') {
    return (
      <div className="max-w-xl mx-auto my-8 px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 space-y-2 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 mb-3 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-blue-400 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800 inline-block">
              Hospital Operations Gateway
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Hospital Staff Duty Portal
            </h1>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Authorized clinical officers, OPD staff, and pharmacists must authenticate to manage doctor duty rosters, diagnostic availability, and medicine inventory.
            </p>
          </div>

          {/* Current user notice if logged in as different role */}
          {currentUser && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div className="space-y-0.5">
                <p className="font-semibold">
                  Signed in as {currentUser.name} ({currentUser.role.replace('_', ' ')})
                </p>
                <p className="text-[11px] text-amber-700">
                  Hospital staff credentials are required to modify hospital records. Please authenticate below.
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleStaffLogin} className="p-6 sm:p-8 space-y-4 text-xs">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Hospital Email / Staff ID *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. staff@ggh.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Staff Account Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter your staff password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{authLoading ? 'Authenticating Staff...' : 'Sign In to Hospital Workspace'}</span>
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 block">Registered Staff System Account:</span>
              <p>• Official Staff Email: <span className="font-mono text-slate-800 font-medium">staff@ggh.gov.in</span></p>
              <p>• Password: <span className="font-mono text-slate-800 font-medium">password123</span></p>
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
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Staff Operational Command
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Operator: {currentUser?.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Hospital Staff Daily Management Portal
            </h1>
            <p className="text-xs text-slate-500">
              Live updates directly synchronize with citizen discovery search, OPD appointment tokens and stock monitors.
            </p>
          </div>

          {/* Hospital Switcher */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              id="staff-hospital-switcher"
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.hospitalType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Success Toast */}
        {notification && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'doctors'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor Duty ({doctors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'services'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Diagnostic Services ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('medicines')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'medicines'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Dispensary Stock ({medicines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'appointments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>OPD Appointments ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'complaints'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Grievances ({complaints.length})</span>
        </button>
      </div>

      {/* TAB 1: DOCTORS DUTY ROSTER */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Physician & Specialist Roster Management
              </h3>
              <p className="text-xs text-slate-500">
                Toggle live status when doctors start OPD consultation, take rounds or go on leave.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">OPD Schedule</th>
                  <th className="p-3">Current Consultation Status</th>
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <strong className="text-slate-900 text-sm block">{doc.name}</strong>
                      <span className="text-[11px] text-slate-500">{doc.qualification}</span>
                    </td>
                    <td className="p-3 font-semibold text-blue-700">{doc.specialization}</td>
                    <td className="p-3 text-slate-600">
                      <div>{doc.availableDays.join(', ')}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{doc.timeSlots[0]}</div>
                    </td>
                    <td className="p-3">
                      <select
                        value={doc.availabilityStatus}
                        onChange={(e) =>
                          handleDoctorStatusChange(doc.id, e.target.value as any)
                        }
                        className={`p-1.5 rounded-lg border font-bold text-xs ${
                          doc.availabilityStatus === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : doc.availabilityStatus === 'IN_CONSULTATION'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-rose-50 text-rose-900 border-rose-300'
                        }`}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="IN_CONSULTATION">IN_CONSULTATION</option>
                        <option value="ON_LEAVE">ON_LEAVE</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          handleDoctorStatusChange(
                            doc.id,
                            doc.availabilityStatus === 'AVAILABLE' ? 'ON_LEAVE' : 'AVAILABLE'
                          )
                        }
                        className="text-[11px] font-semibold text-blue-700 hover:underline"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES STATUS */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Diagnostic Labs, Radiology & Clinical Services
            </h3>
            <p className="text-xs text-slate-500">
              Inform waiting citizens of equipment availability and approximate test queue durations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{srv.serviceName}</h4>
                    <span className="text-[11px] text-slate-500">{srv.category}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srv.available}
                      onChange={(e) =>
                        handleServiceToggle(srv.id, e.target.checked, srv.waitingTime)
                      }
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className={`text-xs font-bold ${srv.available ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {srv.available ? 'Operational' : 'Down/Closed'}
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <label className="text-slate-500 font-medium">Estimated Queue Wait:</label>
                  <input
                    type="text"
                    defaultValue={srv.waitingTime}
                    onBlur={(e) => handleServiceToggle(srv.id, srv.available, e.target.value)}
                    className="p-1 px-2 rounded-lg border border-slate-200 font-bold text-slate-800 w-28 bg-white shadow-xs"
                  />
                </div>

                <p className="text-[11px] text-slate-500 italic">{srv.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MEDICINE STOCK */}
      {activeTab === 'medicines' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Government Formulary & Dispensary Drug Stock
            </h3>
            <p className="text-xs text-slate-500">
              Threshold alert triggers automatic indent generation for state central medical warehouse replenishment.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Units in Stock</th>
                  <th className="p-3">Threshold Limit</th>
                  <th className="p-3">Live Stock Status</th>
                  <th className="p-3 text-right">Update Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((med) => {
                  const isLow = med.quantity <= med.minimumThreshold && med.quantity > 0;
                  const isOut = med.quantity === 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900">{med.medicineName}</td>
                      <td className="p-3 text-slate-500">{med.category}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{med.quantity}</td>
                      <td className="p-3 font-mono text-slate-400">{med.minimumThreshold}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                            isOut
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isOut ? '🔴 Out of Stock' : isLow ? '⚠️ Low Stock' : '🟢 In Stock'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleMedicineQuantity(med.id, Math.max(0, med.quantity - 10))}
                            className="w-7 h-7 rounded-lg bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => handleMedicineQuantity(med.id, med.quantity + 50)}
                            className="w-7 h-7 rounded-lg bg-blue-50 font-bold text-blue-700 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          >
                            +50
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Active Digital OPD Patient Tokens
            </h3>
            <p className="text-xs text-slate-500">
              Mark patient triage, verify tokens, and record consultations completed.
            </p>
          </div>

          {appointments.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">No OPD appointments logged for this facility.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Token ID</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Visit Date & Slot</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-blue-700">{apt.appointmentId}</td>
                      <td className="p-3 font-bold text-slate-900">{apt.patientName}</td>
                      <td className="p-3 text-slate-600">{apt.doctorName}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{apt.appointmentDate}</div>
                        <div className="text-[11px] text-slate-400">{apt.appointmentTime}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            apt.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : apt.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : apt.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          ● {apt.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === 'BOOKED' && (
                            <button
                              onClick={() => handleAppointmentStatus(apt.id, 'CONFIRMED')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] shadow-xs transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                          {apt.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleAppointmentStatus(apt.id, 'COMPLETED')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-semibold text-[10px] shadow-xs transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleAppointmentStatus(apt.id, 'CANCELLED')}
                              className="px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-[10px] transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMPLAINTS & GRIEVANCE REDRESSAL */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Public Grievances Filed Against this Facility
              </h3>
              <p className="text-xs text-slate-500">
                Provide transparent remarks and update status to RESOLVED or IN PROGRESS for citizen tracking.
              </p>
            </div>

            {complaints.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">Zero grievances registered against this facility.</p>
            ) : (
              <div className="space-y-3">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 text-xs">
                          {c.complaintId}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-slate-200 font-semibold text-slate-800">
                          {c.category}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border self-start ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'IN PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        ● {c.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 italic bg-white p-3 rounded-xl border border-slate-200/80">
                      "{c.description}"
                    </p>

                    {c.resolutionRemarks && (
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                        <strong className="text-emerald-900 block text-[11px]">Existing Action Remarks:</strong>
                        <span className="text-emerald-950 font-medium">{c.resolutionRemarks}</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedComplaintId(c.id);
                          setResolutionStatus(c.status);
                          setResolutionRemarks(c.resolutionRemarks || '');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                      >
                        Respond / Update Grievance Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal / Inline Response Box */}
          {selectedComplaintId && (
            <div className="bg-white rounded-3xl border-2 border-blue-500 p-6 shadow-md space-y-4">
              <h4 className="font-bold text-sm text-slate-900">
                Hospital Staff Redressal Form (Complaint #{complaints.find((c) => c.id === selectedComplaintId)?.complaintId})
              </h4>

              <form onSubmit={handleResolveComplaint} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Update Status *</label>
                  <select
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                  >
                    <option value="UNDER REVIEW">UNDER REVIEW</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Resolution Remarks *</label>
                  <textarea
                    rows={3}
                    value={resolutionRemarks}
                    onChange={(e) => setResolutionRemarks(e.target.value)}
                    placeholder="e.g. Additional doctor deployed on OPD duty; 200 boxes of Paracetamol restocked from District Medical Store..."
                    className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaintId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
                  >
                    Submit Resolution Update
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
