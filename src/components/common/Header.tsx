import React from 'react';
import { Shield, Building2, Gamepad2, Cpu, Code2, LogOut, Globe2 } from 'lucide-react';
import { platform } from '../../services/platformStore';
import { useAuth } from '../../services/authContext';
import { useI18n } from '../../services/i18nContext';
import { LanguageCurrencyBar } from './LanguageCurrencyBar';

export type MainTab = 'ADMIN' | 'OPERATOR' | 'GAMES' | 'SIMULATOR' | 'DEVELOPER' | 'CLIENT_SITE';

interface HeaderProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  onRefresh: () => void;
  onOpenLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onRefresh, onOpenLanding }) => {
  const { user, logout } = useAuth();
  const { t, formatMoney, language } = useI18n();
  const isBn = language === 'bn';
  const [activeOp, setActiveOp] = React.useState(() => platform.getActiveOperator());
  const [activePlayer, setActivePlayer] = React.useState(() => platform.getActivePlayer());

  React.useEffect(() => {
    const sync = () => {
      setActiveOp(platform.getActiveOperator());
      setActivePlayer(platform.getActivePlayer());
    };
    const unsubscribe = platform.subscribe(sync);
    sync();
    return unsubscribe;
  }, []);

  const pendingRiskCount = platform.riskAlerts.filter(a => !a.resolved).length;
  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN';

  const isGamesActive = activeTab === 'GAMES';

  return (
    <header className="sticky top-0 z-50 bg-[#0d1117]/95 border-b border-slate-800 text-slate-100 shadow-xl backdrop-blur-md flex-shrink-0">
      <div className={`${isGamesActive ? 'max-w-[1500px]' : 'max-w-7xl'} mx-auto px-2 sm:px-4 lg:px-6`}>
        <div className={`flex items-center justify-between ${isGamesActive ? 'h-11 sm:h-12' : 'h-14 sm:h-16'} gap-2`}>
          
          {/* Logo & Decorated Brand Name */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group flex-shrink-0" onClick={onOpenLanding}>
            <img
              src="/src/assets/images/neextplay_corp_logo_1791306162874.jpg"
              alt="NeextPlay Company Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover border-2 border-amber-500/60 shadow-xl shadow-amber-500/25 group-hover:scale-105 group-hover:border-amber-400 transition-all duration-300"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent uppercase drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                  {isBn ? 'নেক্সটপ্লে' : 'NEEXTPLAY'}
                </span>
                <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[8px] sm:text-[9px] uppercase font-black tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 rounded-full inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {isCompanyAdmin ? (isBn ? 'অ্যাডমিন' : 'Admin') : (isBn ? 'ডেভেলপার' : 'Developer')}
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 font-medium">
                {isCompanyAdmin ? t('auth.roleAdminTitle', 'Company Admin') : (user?.companyName || activeOp.name)}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {isCompanyAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('ADMIN')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'ADMIN'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t('nav.platformControl', 'Platform Control')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('SIMULATOR')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'SIMULATOR'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{t('nav.globalMath', 'Global Math & RNG')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('CLIENT_SITE')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'CLIENT_SITE'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold shadow-md shadow-red-600/30 ring-1 ring-red-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Casino Site Simulator</span>
                </button>

                <button
                  onClick={() => setActiveTab('GAMES')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'GAMES'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold shadow-md shadow-red-600/30 ring-1 ring-red-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>✈️ Aviator & Games</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('DEVELOPER')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'DEVELOPER'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{t('nav.personalizedDocs', 'Personalized API Docs')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('OPERATOR')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'OPERATOR'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t('nav.companyWorkspace', 'Company Workspace')}</span>
                  {pendingRiskCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-rose-500/80 text-white text-[10px] rounded-full">
                      {pendingRiskCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('CLIENT_SITE')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'CLIENT_SITE'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold shadow-md shadow-red-600/30 ring-1 ring-red-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Partner Casino Site (Test Main)</span>
                </button>

                <button
                  onClick={() => setActiveTab('GAMES')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'GAMES'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>{t('nav.testSpins', 'Live Test Spins')}</span>
                </button>
              </>
            )}
          </nav>

          {/* Global Language and Currency Selector + User Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
            {/* Live Player Balance Indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <div className="flex flex-col text-right">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Balance</span>
                <span className="text-xs font-black text-amber-400 font-mono leading-tight">
                  {formatMoney(activePlayer.balance)}
                </span>
              </div>
            </div>

            <LanguageCurrencyBar compact />

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-1.5 sm:px-2.5 py-1 text-xs gap-1.5 sm:gap-2">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                  isCompanyAdmin ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isCompanyAdmin ? '👑' : '💻'}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="font-bold text-white text-[11px] leading-tight truncate max-w-[100px]">
                    {user.name}
                  </div>
                  <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                    {isCompanyAdmin ? 'Company Admin' : `${user.companyName || activeOp.code}`}
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    onOpenLanding();
                  }}
                  title="Sign Out to Landing Page"
                  className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 rounded-lg text-[11px] font-bold transition border border-slate-700/60 active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('nav.signOut', 'Sign Out')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tab Bar (Dedicated for phones & tablets) */}
        <div className="md:hidden py-2 border-t border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {isCompanyAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`flex-1 min-w-[120px] flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t('nav.platformControl', 'Platform Control')}</span>
              </button>

              <button
                onClick={() => setActiveTab('SIMULATOR')}
                className={`flex-1 min-w-[120px] flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'SIMULATOR'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{t('nav.globalMath', 'Global Math')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('DEVELOPER')}
                className={`flex-1 min-w-[100px] flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'DEVELOPER'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'এপিআই ডক্স' : 'API Docs'}</span>
              </button>

              <button
                onClick={() => setActiveTab('OPERATOR')}
                className={`flex-1 min-w-[110px] flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'OPERATOR'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'ওয়ার্কস্পেস' : 'Workspace'}</span>
                {pendingRiskCount > 0 && (
                  <span className="ml-1 px-1 bg-rose-500 text-white text-[9px] rounded-full">
                    {pendingRiskCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('GAMES')}
                className={`flex-1 min-w-[105px] flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'GAMES'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-amber-300 border border-slate-800'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isBn ? 'লাইভ স্লটস' : 'Live Slots'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
