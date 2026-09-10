import React, { useState } from 'react';
import { UserRole, User, Hospital } from '../../types';
import { apiStore } from '../../services/apiStore';
import { firebaseLogin, firebaseRegister, firebaseGoogleLogin } from '../../services/firebase';
import { GoogleAccountChooserModal } from '../GoogleAccountChooserModal';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface AuthModalsProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const hospitals = apiStore.getHospitals();

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CITIZEN');

  // Register extra fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('NTR');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('520002');
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || '');
  const [adminKey, setAdminKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Attempt Firebase Login
      try {
        const fbUser = await firebaseLogin(email.trim(), password);
        apiStore.setCurrentUser(fbUser);
        onSuccess(fbUser);
        onClose();
        return;
      } catch (fbErr: any) {
        console.warn('Firebase login attempt fallback to local store:', fbErr?.message || fbErr);
      }

      // 2. Fallback to apiStore users with manual credentials
      const user = apiStore.login(email.trim(), password, role);
      if (!user) {
        setError('Invalid credentials or password. Please check your email/mobile and password, or create a new account.');
        return;
      }

      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setShowGoogleChooser(true);
  };

  const handleSelectGoogleAccount = async (selected: { email: string; name: string }) => {
    setError(null);
    setLoading(true);
    try {
      const user = await firebaseGoogleLogin(selected.email, selected.name);
      apiStore.setCurrentUser(user);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      const fallbackUser = apiStore.loginWithGoogle(selected.email, selected.name);
      onSuccess(fallbackUser);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password || !phone) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (role === 'ADMIN' && adminKey !== 'SIH2026') {
      setError('Invalid Government Admin Code. Use demo code: SIH2026');
      return;
    }

    setLoading(true);
    try {
      // Register with Firebase Auth & store in Firestore
      let user: User;
      try {
        user = await firebaseRegister({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          mobile: phone.trim(),
          role,
          location: `${village.trim() || 'Vijayawada'}, ${mandal.trim() || 'Vijayawada'}`,
          district,
          state,
          hospitalId: role === 'HOSPITAL_STAFF' ? hospitalId : undefined
        });
      } catch (fbErr: any) {
        console.warn('Firebase registration exception, saving locally:', fbErr);
        user = apiStore.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobile: phone.trim(),
          role,
          location: `${village.trim() || 'Vijayawada'}, ${mandal.trim() || 'Vijayawada'}`,
          district,
          state,
          hospitalId: role === 'HOSPITAL_STAFF' ? hospitalId : undefined
        });
      }

      apiStore.setCurrentUser(user);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {mode === 'login' ? 'Sign In to HealthAccess Portal' : 'Register New Account'}
              </h3>
              <p className="text-xs text-slate-500">Public Healthcare Platform</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'register'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {/* Account Type Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Select Portal / Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CITIZEN')}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition-all ${
                      role === 'CITIZEN'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('HOSPITAL_STAFF')}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition-all ${
                      role === 'HOSPITAL_STAFF'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Hospital Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition-all ${
                      role === 'ADMIN'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Govt Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {role === 'HOSPITAL_STAFF'
                    ? 'Official Hospital Email / Staff ID *'
                    : role === 'ADMIN'
                    ? 'Directorate Government Email *'
                    : 'Registered Email or Mobile Number *'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === 'HOSPITAL_STAFF'
                        ? 'staff@ggh.gov.in'
                        : role === 'ADMIN'
                        ? 'admin@mohfw.gov.in'
                        : 'e.g. citizen@healthcare.gov.in or 9848022334'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold text-slate-700 block">Authoritative Testing Accounts:</span>
                <p>• Citizen: <span className="font-mono text-slate-800">citizen@healthcare.gov.in</span> / <span className="font-mono text-slate-800">password123</span></p>
                <p>• Hospital Staff: <span className="font-mono text-slate-800">staff@ggh.gov.in</span> / <span className="font-mono text-slate-800">password123</span></p>
                <p>• Govt Admin: <span className="font-mono text-slate-800">admin@mohfw.gov.in</span> / <span className="font-mono text-slate-800">password123</span></p>
              </div>

              <button
                type="submit"
                id="modal-login-submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{loading ? 'Authenticating...' : 'Sign In with Email'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[10px] uppercase font-bold text-slate-400">Or continue with</span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google (Firebase)</span>
              </button>

              <div className="pt-2 text-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Firebase Auth & Firestore: <strong className="text-slate-700">healthconnect-india</strong>
                </span>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              {/* Role Picker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CITIZEN', 'HOSPITAL_STAFF', 'ADMIN'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`p-2 rounded-xl border font-bold text-[11px] transition-all ${
                        role === r
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'CITIZEN' ? 'Citizen' : r === 'HOSPITAL_STAFF' ? 'Staff' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Village / Town</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Gollapudi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mandal / Taluka</label>
                  <input
                    type="text"
                    value={mandal}
                    onChange={(e) => setMandal(e.target.value)}
                    placeholder="e.g. Vijayawada Rural"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 text-slate-800 text-[11px] shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 text-slate-800 text-[11px] shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 text-slate-800 text-[11px] shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Conditional Role Fields */}
              {role === 'HOSPITAL_STAFF' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Public Hospital Facility *
                  </label>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.hospitalType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'ADMIN' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Government Admin Secret Code *
                  </label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter code (Demo code: SIH2026)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              )}

              <button
                type="submit"
                id="modal-register-submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Complete Registration
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[10px] uppercase font-bold text-slate-400">Or register with</span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                id="modal-register-google"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Real Google Account Selection Dialog */}
      <GoogleAccountChooserModal
        isOpen={showGoogleChooser}
        onClose={() => setShowGoogleChooser(false)}
        onSelectAccount={handleSelectGoogleAccount}
        initialEmail={email}
        initialName={name}
      />
    </div>
  );
};
