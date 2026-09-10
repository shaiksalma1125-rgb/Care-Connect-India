import React from 'react';
import {
  HeartPulse,
  Search,
  Calendar,
  MessageSquare,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  Globe,
  Sliders,
  ShieldCheck,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { User, LanguageCode } from '../types';
import { translations } from '../utils/translations';

interface NavbarProps {
  currentUser: User | null;
  currentView: string;
  onNavigate: (view: string, payload?: any) => void;
  onLogout: () => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  highContrast: boolean;
  onToggleContrast?: () => void;
  onToggleHighContrast?: () => void;
  fontScale?: 'normal' | 'large' | 'xlarge' | number;
  onChangeFontScale?: (scale: 'normal' | 'large' | 'xlarge' | number) => void;
  onSwitchRoleQuick?: (role: 'CITIZEN' | 'HOSPITAL_STAFF' | 'ADMIN') => void;
  onSwitchRole?: (role: 'CITIZEN' | 'HOSPITAL_STAFF' | 'ADMIN') => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  language,
  onLanguageChange,
  highContrast,
  onToggleContrast,
  onToggleHighContrast,
  fontScale = 'normal',
  onChangeFontScale,
  onSwitchRoleQuick,
  onSwitchRole,
  onOpenLogin,
  onOpenRegister
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showA11yMenu, setShowA11yMenu] = React.useState(false);
  const t = translations[language];

  const handleRoleSwitch = (role: 'CITIZEN' | 'HOSPITAL_STAFF' | 'ADMIN') => {
    if (typeof onSwitchRoleQuick === 'function') {
      onSwitchRoleQuick(role);
    } else if (typeof onSwitchRole === 'function') {
      onSwitchRole(role);
    }
  };

  const handleToggleContrast = () => {
    if (typeof onToggleContrast === 'function') {
      onToggleContrast();
    } else if (typeof onToggleHighContrast === 'function') {
      onToggleHighContrast();
    }
  };

  const currentScale: 'normal' | 'large' | 'xlarge' =
    typeof fontScale === 'number'
      ? fontScale > 120
        ? 'xlarge'
        : fontScale > 105
        ? 'large'
        : 'normal'
      : fontScale === 'large' || fontScale === 'xlarge'
      ? fontScale
      : 'normal';

  const navItems = [
    { id: 'home', label: t.home, icon: HeartPulse },
    { id: 'search', label: t.searchHealthcare, icon: Search },
    { id: 'hospitals', label: t.hospitals, icon: Building2 },
    { id: 'my-appointments', label: t.appointments, icon: Calendar },
    { id: 'feedback', label: t.feedback, icon: MessageSquare },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle }
  ];

  return (
    <header
      id="main-navbar"
      className={`sticky top-0 z-50 transition-colors border-b ${
        highContrast
          ? 'bg-black text-yellow-300 border-yellow-400'
          : 'bg-white text-slate-800 border-slate-200 shadow-xs'
      }`}
    >
      {/* Top Official Government & Portals Header */}
      <div
        className={`border-b text-xs ${
          highContrast
            ? 'bg-zinc-900 text-yellow-300 border-yellow-500'
            : 'bg-slate-950 text-slate-300 border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white tracking-tight">
              Government of India
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-300">
              Ministry of Health & Family Welfare
            </span>
          </div>

          {/* Realistic Portal Access Links */}
          <div className="flex items-center gap-2">
            <button
              id="portal-citizen-link"
              onClick={() => onNavigate('home')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                currentView !== 'staff-dashboard' && currentView !== 'admin-dashboard'
                  ? 'text-white bg-slate-800 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Citizen Portal
            </button>
            <span className="text-slate-700">•</span>
            <button
              id="portal-staff-link"
              onClick={() => onNavigate('staff-dashboard')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                currentView === 'staff-dashboard'
                  ? 'text-blue-300 bg-blue-950/80 font-semibold border border-blue-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏥 Hospital Staff Portal
            </button>
            <span className="text-slate-700">•</span>
            <button
              id="portal-admin-link"
              onClick={() => onNavigate('admin-dashboard')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                currentView === 'admin-dashboard'
                  ? 'text-purple-300 bg-purple-950/80 font-semibold border border-purple-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Directorate Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Name - Strictly non-wrapping and aligned on full screen */}
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate(currentUser?.role === 'HOSPITAL_STAFF' ? 'staff-dashboard' : currentUser?.role === 'ADMIN' ? 'admin-dashboard' : 'home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xl p-1 shrink-0 min-w-max cursor-pointer"
          >
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-xs shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 011-1h2a1 1 0 011 1v3M12 21v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3M12 4v16m0-16h3m-3 4h3m-3 4h3m-3 4h3"></path>
              </svg>
            </div>
            <div className="flex flex-col min-w-max shrink-0">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                Care Connect India
              </span>
              <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold whitespace-nowrap">
                Accessibility & Quality
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center space-x-0.5 shrink">
            {currentUser?.role === 'HOSPITAL_STAFF' ? (
              <button
                id="nav-staff-dash"
                onClick={() => onNavigate('staff-dashboard')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  currentView === 'staff-dashboard'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                🏥 Hospital Staff Workspace
              </button>
            ) : currentUser?.role === 'ADMIN' ? (
              <button
                id="nav-admin-dash"
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  currentView === 'admin-dashboard'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                📊 Directorate Admin Dashboard
              </button>
            ) : (
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? highContrast
                          ? 'bg-yellow-400 text-black font-bold'
                          : 'bg-blue-50 text-blue-700 font-bold'
                        : highContrast
                        ? 'text-yellow-300 hover:bg-zinc-800'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })
            )}
          </nav>

          {/* Right Action Controls: Language, Accessibility, User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            {/* Minimal Language Pills Toggle */}
            <div className="hidden sm:flex bg-slate-100 rounded-full p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  language === 'en'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  language === 'hi'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('te')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  language === 'te'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                తెలుగు
              </button>
            </div>

            {/* Mobile Fallback Select for Language */}
            <div className="sm:hidden relative inline-block text-left">
              <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1" />
                <select
                  id="language-selector"
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                  aria-label="Select Interface Language"
                  className="bg-transparent text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden py-1 pr-1"
                >
                  <option value="en">EN</option>
                  <option value="te">TE</option>
                  <option value="hi">HI</option>
                </select>
              </div>
            </div>

            <span className="hidden md:inline text-slate-300">|</span>

            {/* Accessibility Settings Dropdown Toggle */}
            <div className="relative">
              <button
                id="a11y-settings-toggle"
                onClick={() => setShowA11yMenu(!showA11yMenu)}
                title="Accessibility Preferences"
                aria-label="Accessibility settings"
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {showA11yMenu && (
                <div
                  id="a11y-menu"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs text-slate-800 space-y-3"
                >
                  <div className="font-bold text-slate-900 border-b pb-1.5 flex items-center justify-between">
                    <span>{t.accessibilitySettings}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>

                  {/* Contrast Toggle */}
                  <div className="flex items-center justify-between">
                    <span>{t.highContrast}</span>
                    <button
                      id="contrast-toggle-btn"
                      onClick={handleToggleContrast}
                      className={`px-2.5 py-1 rounded font-bold text-[11px] ${
                        highContrast
                          ? 'bg-yellow-400 text-black'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {highContrast ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Font Scale */}
                  <div>
                    <span className="block mb-1.5 font-medium text-slate-700">{t.textSize}</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => onChangeFontScale && onChangeFontScale('normal')}
                        className={`py-1 rounded text-center border font-medium ${
                          currentScale === 'normal'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.normal}
                      </button>
                      <button
                        onClick={() => onChangeFontScale && onChangeFontScale('large')}
                        className={`py-1 rounded text-center border font-medium ${
                          currentScale === 'large'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.large}
                      </button>
                      <button
                        onClick={() => onChangeFontScale && onChangeFontScale('xlarge')}
                        className={`py-1 rounded text-center border font-medium ${
                          currentScale === 'xlarge'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.extraLarge}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  id="user-profile-btn"
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left text-xs">
                    <span className="font-semibold text-slate-800 block leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                </button>
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => {
                    if (onOpenLogin) onOpenLogin();
                    else onNavigate('login');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600"
                >
                  {t.login}
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => {
                    if (onOpenRegister) onOpenRegister();
                    else onNavigate('register');
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {t.register}
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-drawer"
          className="lg:hidden px-4 pt-2 pb-4 space-y-2 border-t border-slate-200 bg-white"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 text-blue-600" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {currentUser?.role === 'HOSPITAL_STAFF' && (
            <button
              onClick={() => {
                onNavigate('staff-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-800"
            >
              🏥 Hospital Staff Dashboard
            </button>
          )}

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => {
                onNavigate('admin-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-900"
            >
              📊 Directorate Admin Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
};
