import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, User, LanguageCode } from '../../types';
import { apiStore } from '../../services/apiStore';
import { translations } from '../../utils/translations';
import { subscribeToUserAppointments } from '../../services/firebase';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Database,
  Mail,
  Lock,
  LogIn
} from 'lucide-react';

interface MyAppointmentsViewProps {
  currentUser: User | null;
  onNavigate: (view: string, payload?: any) => void;
  language: LanguageCode;
  onUserAuth?: (user: User) => void;
}

export const MyAppointmentsView: React.FC<MyAppointmentsViewProps> = ({
  currentUser,
  onNavigate,
  language,
  onUserAuth
}) => {
  const t = translations[language];
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);
  const [firestoreAppointments, setFirestoreAppointments] = useState<Appointment[]>([]);

  // Manual citizen sign in state
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [citizenError, setCitizenError] = useState<string | null>(null);
  const [citizenLoading, setCitizenLoading] = useState(false);

  const handleCitizenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCitizenError(null);
    setCitizenLoading(true);
    try {
      const user = apiStore.login(citizenEmail.trim(), citizenPassword, 'CITIZEN');
      if (!user) {
        setCitizenError('Invalid email/mobile or password. Please verify your credentials or register an account.');
        return;
      }
      if (onUserAuth) {
        onUserAuth(user);
      }
    } catch (err: any) {
      setCitizenError(err?.message || 'Login failed.');
    } finally {
      setCitizenLoading(false);
    }
  };

  // Realtime subscription to Firebase Firestore
  useEffect(() => {
    if (!currentUser?.id) {
      setFirestoreAppointments([]);
      return;
    }
    const unsubscribe = subscribeToUserAppointments(currentUser.id, (cloudApts) => {
      if (cloudApts && cloudApts.length > 0) {
        setFirestoreAppointments(cloudApts);
      }
    });
    return () => unsubscribe();
  }, [currentUser?.id]);

  const appointments = useMemo(() => {
    // If logged in citizen, return their appointments; otherwise return demo appointments
    const userId = currentUser ? currentUser.id : undefined;
    const local = apiStore.getAppointments(undefined, userId);
    
    // Merge firestore and local, deduping by id / appointmentId
    const map = new Map<string, Appointment>();
    local.forEach((a) => map.set(a.id || a.appointmentId, a));
    firestoreAppointments.forEach((a) => map.set(a.id || a.appointmentId, a));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [currentUser, refreshKey, firestoreAppointments]);

  const filteredAppointments = useMemo(() => {
    if (filter === 'ALL') return appointments;
    if (filter === 'ACTIVE') {
      return appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED');
    }
    return appointments.filter((a) => a.status === filter);
  }, [appointments, filter]);

  const handleCancel = (aptId: string) => {
    if (window.confirm('Are you sure you want to cancel this public healthcare appointment?')) {
      apiStore.updateAppointmentStatus(aptId, 'CANCELLED');
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t.myAppointments} & Digital OPD Tokens
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <Database className="w-3 h-3" /> Firebase Sync
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Track your scheduled consultations, doctor visits and digital tokens across public hospitals.
          </p>
        </div>

        <button
          id="book-new-appointment-btn"
          onClick={() => onNavigate('appointment')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs font-bold">
        {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl border transition-all ${
              filter === status
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status} ({appointments.filter((a) => status === 'ALL' ? true : status === 'ACTIVE' ? (a.status === 'BOOKED' || a.status === 'CONFIRMED') : a.status === status).length})
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Appointments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any appointments under the "{filter}" category.
          </p>
          <button
            onClick={() => onNavigate('appointment')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Book Your First Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isBooked = apt.status === 'BOOKED';
            const isConfirmed = apt.status === 'CONFIRMED';
            const isCompleted = apt.status === 'COMPLETED';
            const isCancelled = apt.status === 'CANCELLED';

            return (
              <div
                key={apt.id}
                id={`appointment-item-${apt.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Appointment ID</span>
                    <span className="text-base font-mono font-bold text-blue-700">
                      {apt.appointmentId}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border self-start ${
                      isConfirmed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isBooked
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : isCompleted
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    ● {apt.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 block font-medium">Healthcare Facility</span>
                    <strong className="text-slate-900 block leading-tight">{apt.hospitalName}</strong>
                    <span className="text-[11px] text-emerald-600 font-semibold">Free Govt OPD</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block font-medium">Doctor / Department</span>
                    <strong className="text-slate-900 block leading-tight">{apt.doctorName}</strong>
                    <span className="text-[11px] text-slate-500 block">{apt.doctorSpecialization}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block font-medium">Scheduled Visit</span>
                    <strong className="text-slate-900 block">{apt.appointmentDate}</strong>
                    <span className="text-[11px] text-blue-700 font-semibold block">{apt.appointmentTime}</span>
                  </div>
                </div>

                {apt.reason && (
                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-semibold">Reason: </span>
                    <span className="text-slate-700">{apt.reason}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Patient: <strong>{apt.patientName}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <button
                        onClick={() =>
                          onNavigate('feedback', {
                            hospitalId: apt.hospitalId,
                            appointmentId: apt.appointmentId
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                      >
                        ★ Rate This Visit
                      </button>
                    )}

                    {(isBooked || isConfirmed) && (
                      <button
                        id={`cancel-apt-${apt.id}`}
                        onClick={() => handleCancel(apt.id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
