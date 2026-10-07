import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Building2,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Code2,
} from 'lucide-react';
import { useAuth, UserRole } from '../../services/authContext';
import { useI18n } from '../../services/i18nContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'LOGIN' | 'REGISTER' | 'DEMO';
  onLoginSuccess: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'LOGIN',
  onLoginSuccess,
}) => {
  const { login, registerDeveloper, quickLoginAs, isLoading } = useAuth();
  const { t, language } = useI18n();
  const isBn = language === 'bn';

  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'DEMO'>(defaultTab);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regForm, setRegForm] = useState({
    companyName: '',
    email: '',
    password: '',
    country: 'Malta (MGA)',
    currency: 'BDT',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = await login(loginEmail, loginPassword);
    if (res.success) {
      if (loginEmail.includes('admin')) {
        onLoginSuccess('COMPANY_ADMIN');
      } else {
        onLoginSuccess('DEVELOPER');
      }
      onClose();
    } else {
      setErrorMessage(res.error || (isBn ? 'লগইন ব্যর্থ হয়েছে।' : 'Failed to authenticate.'));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = await registerDeveloper(regForm);
    if (res.success) {
      onLoginSuccess('DEVELOPER');
      onClose();
    } else {
      setErrorMessage(res.error || (isBn ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' : 'Registration failed.'));
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setErrorMessage(null);
    await quickLoginAs(role);
    onLoginSuccess(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        
        {/* Glow corner accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <img
              src="/src/assets/images/neextplay_corp_logo_1791306162874.jpg"
              alt="NeextPlay Company Logo"
              className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shadow-md shadow-amber-500/20"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-lg tracking-tight">
                  {isBn ? 'নেক্সটপ্লে' : 'NEEXTPLAY'}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold uppercase">
                  {isBn ? 'নিরাপদ পোর্টাল' : 'Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'কোম্পানি অ্যাডমিন ও ডেভেলপার ওয়ার্কস্পেস' : 'Company Admin & Developer Workspace'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 bg-slate-950/80 p-1 border-b border-slate-800 text-xs font-bold text-center">
          <button
            onClick={() => { setTab('LOGIN'); setErrorMessage(null); }}
            className={`py-2.5 rounded-xl transition ${
              tab === 'LOGIN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isBn ? 'লগইন' : 'Sign In'}
          </button>
          <button
            onClick={() => { setTab('REGISTER'); setErrorMessage(null); }}
            className={`py-2.5 rounded-xl transition ${
              tab === 'REGISTER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isBn ? 'নতুন ডেভেলপার' : 'New Developer'}
          </button>
          <button
            onClick={() => { setTab('DEMO'); setErrorMessage(null); }}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1 ${
              tab === 'DEMO' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBn ? '২টি রোল সুইচ' : '2 Roles Access'}</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 relative z-10">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  {isBn ? 'কর্পোরেট / ডেভেলপার ইমেইল' : 'Corporate / Developer Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="admin@neextplay.com বা dev@nexusbet.io"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">{isBn ? 'অ্যাকাউন্ট পাসওয়ার্ড' : 'Account Password'}</label>
                  <span className="text-[10px] text-slate-500">{isBn ? 'ফায়ারবেস ক্লাউড ডেটাবেস' : 'Firebase Cloud Database'}</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="******"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Authenticating...') : (isBn ? 'ওয়ার্কস্পেসে লগইন করুন' : 'Sign In to Workspace')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER DEVELOPER */}
          {tab === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  {isBn ? 'কোম্পানির আইনগত নাম' : 'Company Legal Entity'}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regForm.companyName}
                    onChange={e => setRegForm({ ...regForm, companyName: e.target.value })}
                    placeholder={isBn ? 'উদাহরণ: সোলারিয়া গেমিং লিমিটেড' : 'e.g. Solaria Interactive Corp'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  {isBn ? 'ডেভেলপার অফিসিয়াল ইমেইল' : 'Developer / Integration Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="dev@company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  {isBn ? 'মাস্টার পাসওয়ার্ড' : 'Master Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="******"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {isBn ? 'লাইসেন্স জুরিসডিকশন' : 'Jurisdiction'}
                  </label>
                  <select
                    value={regForm.country}
                    onChange={e => setRegForm({ ...regForm, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Malta (MGA)">মাল্টা (MGA)</option>
                    <option value="United Kingdom (UKGC)">যুক্তরাজ্য (UKGC)</option>
                    <option value="Curacao (eGaming)">কুরাসাও (eGaming)</option>
                    <option value="Bangladesh (B2B)">বাংলাদেশ (B2B)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {isBn ? 'সেটেলমেন্ট মুদ্রা' : 'Currency'}
                  </label>
                  <select
                    value={regForm.currency}
                    onChange={e => setRegForm({ ...regForm, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="BDT">BDT (টাকা - ৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? (isBn ? 'তৈরি করা হচ্ছে...' : 'Creating Keys...') : (isBn ? 'কোম্পানি নিবন্ধন করুন ও API কি পান' : 'Register Company & Get API Keys')}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: THE 2 CORE ROLES */}
          {tab === 'DEMO' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400">
                {isBn ? 'সংশ্লিষ্ট ড্যাশবোর্ডে প্রবেশের জন্য লগইন করুন:' : 'Log in to experience each dedicated dashboard:'}
              </p>

              <div className="space-y-3">
                {/* Role 1: Company Admin */}
                <button
                  onClick={() => handleQuickLogin('COMPANY_ADMIN')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-indigo-900/40 hover:border-indigo-500 rounded-2xl flex items-center justify-between text-left transition group shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-sm group-hover:text-indigo-300">
                        {isBn ? '১. কোম্পানি অ্যাডমিন (প্ল্যাটফর্ম নিয়ন্ত্রণ)' : '1. Company Admin (Platform Control)'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">admin@neextplay.com</div>
                      <div className="text-[10px] text-indigo-400 mt-0.5">
                        {isBn ? 'সম্পূর্ণ প্ল্যাটফর্ম প্রশাসন, গেম ম্যাথ ও লেজার অডিট' : 'Platform governance, master game math, ledger audits'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-indigo-950 text-indigo-300 rounded-lg font-bold border border-indigo-800">
                    {isBn ? 'নিয়ন্ত্রণ' : 'Control'}
                  </span>
                </button>

                {/* Role 2: Developer */}
                <button
                  onClick={() => handleQuickLogin('DEVELOPER')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-emerald-900/40 hover:border-emerald-500 rounded-2xl flex items-center justify-between text-left transition group shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-sm group-hover:text-emerald-300">
                        {isBn ? '২. ডেভেলপার / অপারেটর (নেক্সটহাব গেমিং)' : '2. Developer / Operator (NeextHub Gaming Corp)'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">neexthub@gmail.com</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        {isBn ? 'ব্যক্তিগতকৃত API ডকুমেন্টেশন, ক্লায়েন্ট কি, টেস্ট স্পিন' : 'Live Master API cURL suite, Real Client keys, game launcher'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-emerald-950 text-emerald-300 rounded-lg font-bold border border-emerald-800">
                    {isBn ? 'ডেভেলপার' : 'Developer'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
