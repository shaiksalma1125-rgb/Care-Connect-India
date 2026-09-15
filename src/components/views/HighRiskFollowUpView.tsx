import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  Send,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  ShieldAlert,
  Building2,
  Plus,
  Search,
  Filter,
  Activity,
  Clock
} from 'lucide-react';
import { apiStore } from '../../services/apiStore';
import { HighRiskPatient, LanguageCode, User as UserType } from '../../types';
import { translations } from '../../utils/translations';

interface HighRiskFollowUpViewProps {
  language: LanguageCode;
  currentUser: UserType | null;
  onNavigateToHospital: (hospitalId: string) => void;
}

export const HighRiskFollowUpView: React.FC<HighRiskFollowUpViewProps> = ({
  language,
  currentUser,
  onNavigateToHospital
}) => {
  const t = translations[language];
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [highRiskKey, setHighRiskKey] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sentAlertMsg, setSentAlertMsg] = useState<string | null>(null);

  const hospitals = useMemo(() => apiStore.getHospitals(), []);
  const patients = useMemo(() => apiStore.getHighRiskPatients(), [highRiskKey]);

  // Add modal form
  const [patientName, setPatientName] = useState('Anusha K.');
  const [patientAge, setPatientAge] = useState(24);
  const [patientPhone, setPatientPhone] = useState('+91 98492 88410');
  const [riskType, setRiskType] = useState<HighRiskPatient['riskType']>('HIGH_RISK_PREGNANCY');
  const [condition, setCondition] = useState('Severe Gestational Anemia (Hb 7.2 g/dL)');
  const [riskLevel, setRiskLevel] = useState<HighRiskPatient['riskLevel']>('CRITICAL');
  const [ashaWorkerName, setAshaWorkerName] = useState('Lakshmi Devi');
  const [ashaWorkerPhone, setAshaWorkerPhone] = useState('+91 98480 12345');
  const [assignedHospitalId, setAssignedHospitalId] = useState(hospitals[0]?.id || 'hosp-1');
  const [dueDate, setDueDate] = useState('2026-09-18');

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchRisk = filterRisk === 'ALL' || p.riskLevel === filterRisk;
      const matchQuery =
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ashaWorkerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRisk && matchQuery;
    });
  }, [patients, filterRisk, searchQuery]);

  const handleSendReminder = (patient: HighRiskPatient) => {
    apiStore.sendHighRiskReminder(patient.id);
    setSentAlertMsg(
      `Automated High-Risk Reminder dispatched via SMS & WhatsApp to ${patient.patientName} (${patient.patientPhone}) and ASHA worker ${patient.ashaWorkerName}!`
    );
    setHighRiskKey((k) => k + 1);
  };

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const hosp = hospitals.find((h) => h.id === assignedHospitalId);
    apiStore.addHighRiskPatient({
      patientName,
      patientAge,
      patientPhone,
      riskType,
      condition,
      riskLevel,
      hospitalId: assignedHospitalId,
      hospitalName: hosp?.name || 'Government General Hospital',
      ashaWorkerName,
      ashaWorkerPhone,
      nextFollowUpDate: dueDate,
      lastVitalsRecorded: 'BP 138/88, Pulse 82',
      followUpActionNotes: 'Mandatory clinical checkup and iron sucrose IV infusion.'
    });

    setHighRiskKey((k) => k + 1);
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-pink-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-xs font-semibold mb-2">
              <HeartPulse className="w-3.5 h-3.5 text-rose-300" />
              <span>National Maternal & Chronic NCD High-Risk Surveillance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.highRiskFollowUp}
            </h1>
            <p className="text-sm text-rose-100 mt-1 max-w-2xl leading-relaxed">
              {t.highRiskFollowUpDesc}. Proactive tracking of high-risk maternal ANC cases, chronic hypertension/diabetes dropouts and ASHA home-visit coordination to prevent maternal & infant mortality.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll High-Risk Patient</span>
          </button>
        </div>
      </div>

      {sentAlertMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-900 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{sentAlertMsg}</span>
          </div>
          <button
            onClick={() => setSentAlertMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, medical condition, or ASHA worker..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Patients' },
            { id: 'CRITICAL', label: 'Critical Risk' },
            { id: 'HIGH', label: 'High Risk' },
            { id: 'MODERATE', label: 'Moderate Risk' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterRisk(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterRisk === f.id
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    patient.riskLevel === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
                      : patient.riskLevel === 'HIGH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {patient.riskLevel} RISK
                </span>

                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-600">
                  {patient.riskType.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{patient.patientName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Age: {patient.patientAge}y &bull; {patient.patientPhone}
                </p>
              </div>

              <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 space-y-1.5 text-xs text-rose-950">
                <span className="font-bold block">Clinical Condition:</span>
                <p className="font-semibold text-rose-900 leading-relaxed">{patient.condition}</p>
                {patient.lastVitalsRecorded && (
                  <p className="text-[11px] text-rose-800 opacity-90">
                    Latest Vitals: {patient.lastVitalsRecorded}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px]">Due Checkup Date:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {patient.nextFollowUpDate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px]">Assigned ASHA:</span>
                  <span className="font-semibold text-slate-800">{patient.ashaWorkerName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px]">Facility:</span>
                  <span className="font-semibold text-slate-800 line-clamp-1">{patient.hospitalName}</span>
                </div>
              </div>
            </div>

            {/* Reminder Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleSendReminder(patient)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Automated Reminder</span>
              </button>

              <span className="text-[10px] text-slate-400 font-medium">
                {patient.reminderSent ? 'Reminder Dispatched' : 'Pending Action'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Enroll Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto text-slate-800">
            <h3 className="font-bold text-base text-slate-900 border-b pb-3 border-slate-100">
              Enroll Patient in High-Risk Follow-Up Surveillance
            </h3>

            <form onSubmit={handleAddPatient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Patient Phone</label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Risk Category</label>
                  <select
                    value={riskType}
                    onChange={(e) => setRiskType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="HIGH_RISK_PREGNANCY">High Risk Pregnancy (ANC)</option>
                    <option value="CHRONIC_NCD">Chronic NCD (HTN/Diabetes)</option>
                    <option value="POST_OPERATIVE">Post-Operative Follow-up</option>
                    <option value="PEDIATRIC_MALNUTRITION">Pediatric Malnutrition (SAM)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Risk Severity</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="CRITICAL">Critical Risk</option>
                    <option value="HIGH">High Risk</option>
                    <option value="MODERATE">Moderate Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Clinical Diagnosis & Findings</label>
                <input
                  type="text"
                  required
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned ASHA Worker</label>
                  <input
                    type="text"
                    required
                    value={ashaWorkerName}
                    onChange={(e) => setAshaWorkerName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Next Follow-Up Due</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                >
                  Enroll Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
