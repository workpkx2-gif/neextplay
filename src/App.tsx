/**
 * NeextPlay - B2B Gaming Provider Platform
 * Features:
 * 1. Landing Page first open (Dashboards are NEVER visible on landing page)
 * 2. Developer Connect section on landing page
 * 3. Strictly 2 roles:
 *    - COMPANY_ADMIN: Platform Control
 *    - DEVELOPER: Personalized API documentation tailored to company details
 * 4. Real IndexedDB database persistence
 * 5. Full multi-language support (12 languages) & multi-currency support (17 currencies)
 */

import React, { useState } from 'react';
import { I18nProvider, useI18n } from './services/i18nContext';
import { AuthProvider, useAuth, UserRole } from './services/authContext';
import { Header, MainTab } from './components/common/Header';
import { LandingPage } from './components/landing/LandingPage';
import { SuperAdminSuite } from './components/admin/SuperAdminSuite';
import { OperatorPortal } from './components/operator/OperatorPortal';
import { GamesHub } from './components/game/GamesHub';
import { MathSimulator } from './components/simulator/MathSimulator';
import { DeveloperPortal } from './components/developer/DeveloperPortal';
import { PartnerCasinoSiteSimulator } from './components/operator/PartnerCasinoSiteSimulator';
import { GameEmbedContainer } from './components/embed/GameEmbedContainer';
import { ShieldCheck, Server, Award, Database } from 'lucide-react';

function MainAppContent() {
  const { user, quickLoginAs } = useAuth();
  const { t } = useI18n();

  // Check if current URL is an iframe embed or game launch session
  const isEmbedMode = typeof window !== 'undefined' && (
    window.location.search.includes('embed=true') ||
    window.location.search.includes('session=') ||
    window.location.search.includes('token=')
  );

  if (isEmbedMode) {
    return <GameEmbedContainer />;
  }
  
  // Tab state with persistence so playing section remains active upon reload
  const [activeTab, setActiveTabState] = useState<MainTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neextplay_active_tab') as MainTab | null;
      if (saved) return saved;
    }
    return 'GAMES'; // Default to GAMES so playing section is immediately active
  });

  const setActiveTab = (tab: MainTab) => {
    setActiveTabState(tab);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('neextplay_active_tab', tab);
    }
  };

  const [, setTick] = useState(0);

  const forceRefresh = () => {
    setTick(t => t + 1);
  };

  // Restore playing session active if page was reloaded while playing
  React.useEffect(() => {
    const restorePlayingSession = async () => {
      if (typeof window !== 'undefined') {
        const savedTab = localStorage.getItem('neextplay_active_tab') || 'GAMES';
        if (savedTab === 'GAMES' && !user) {
          await quickLoginAs('DEVELOPER');
          forceRefresh();
        }
      }
    };
    restorePlayingSession();
  }, [user]);

  const handleEnterDashboard = (role: UserRole) => {
    if (role === 'COMPANY_ADMIN') {
      setActiveTab('ADMIN');
    } else {
      setActiveTab('DEVELOPER');
    }
    forceRefresh();
  };

  const handleOpenDirectGame = async () => {
    if (!user) {
      await quickLoginAs('DEVELOPER');
    }
    setActiveTab('GAMES');
    forceRefresh();
  };

  const handleOpenClientSite = async () => {
    if (!user) {
      await quickLoginAs('DEVELOPER');
    }
    setActiveTab('CLIENT_SITE');
    forceRefresh();
  };

  // If user is not logged in, check if they were in the playing section
  if (!user) {
    const savedTab = typeof window !== 'undefined' ? localStorage.getItem('neextplay_active_tab') : null;
    if (savedTab === 'GAMES') {
      // Auto-authenticating in background so playing session stays active upon reload
      return (
        <div className="h-screen w-full bg-[#080b11] flex flex-col items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono font-bold text-slate-400">Loading Active Game Session...</span>
          </div>
        </div>
      );
    }

    return (
      <LandingPage
        onEnterDashboard={handleEnterDashboard}
        onOpenDirectGame={handleOpenDirectGame}
        onOpenClientSite={handleOpenClientSite}
      />
    );
  }

  // User is authenticated! Display their role-specific dashboard.
  const isGamesActive = activeTab === 'GAMES';

  return (
    <div className={`${isGamesActive ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'} bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 animate-in fade-in`}>
      {/* Top Navigation Bar with Role context and Sign Out */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={forceRefresh}
        onOpenLanding={() => {
          // Handled by sign out
        }}
      />

      {/* Main Content Area strictly tailored to user role */}
      <main className={`flex-1 min-h-0 w-full mx-auto ${isGamesActive ? 'max-w-[1500px] px-1 sm:px-2 py-0.5 flex flex-col overflow-hidden' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>
        {/* Render GAMES for ANY authenticated role so both company admins & developers can play Aviator */}
        {activeTab === 'GAMES' ? (
          <GamesHub onRefresh={forceRefresh} />
        ) : user.role === 'COMPANY_ADMIN' ? (
          <>
            {activeTab === 'ADMIN' && <SuperAdminSuite onRefresh={forceRefresh} />}
            {activeTab === 'SIMULATOR' && <MathSimulator />}
            {activeTab === 'CLIENT_SITE' && <PartnerCasinoSiteSimulator onRefresh={forceRefresh} />}
          </>
        ) : (
          <>
            {activeTab === 'DEVELOPER' && (
              <DeveloperPortal
                onLaunchDirectGame={() => setActiveTab('GAMES')}
                onRefresh={forceRefresh}
              />
            )}
            {activeTab === 'OPERATOR' && (
              <OperatorPortal
                onRefresh={forceRefresh}
                onLaunchGame={() => setActiveTab('GAMES')}
              />
            )}
            {activeTab === 'CLIENT_SITE' && (
              <PartnerCasinoSiteSimulator onRefresh={forceRefresh} />
            )}
          </>
        )}
      </main>

      {/* Footer & Compliance Bar (Ultra slim in games mode to prevent screen scrolling) */}
      {!isGamesActive ? (
        <footer className="border-t border-slate-900 bg-[#06090e] text-slate-500 py-6 text-xs mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="/src/assets/images/neextplay_corp_logo_1791306162874.jpg"
                alt="NeextPlay Company Logo"
                className="w-7 h-7 rounded-lg object-cover border border-amber-500/40"
              />
              <div>
                <span className="font-bold text-slate-300">{t('brand.name', 'NEEXTPLAY')} {t('brand.tagline', 'B2B Gaming Systems')}</span>
                <span className="mx-2">•</span>
                <span>{user.role === 'COMPANY_ADMIN' ? t('auth.roleAdminTitle', 'Company Admin') : `${t('auth.roleDevTitle', 'Developer')} (${user.companyName || 'Operator'})`}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-slate-400">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                {t('hero.realDbActive', 'Firebase Database Active')}
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {t('metrics.randomnessVal', 'GLI-19 Certified')}
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                {t('hero.doubleEntry', 'Double-Entry Ledger')}
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {t('metrics.randomness', 'CSPRNG Verified')}
              </span>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="border-t border-slate-900/80 bg-[#06090e] text-slate-500 py-0.5 px-3 text-[10px] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">NEEXTPLAY B2B PLATFORM</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono">GLI-19 CERTIFIED</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[9px]">
            <span className="text-slate-400">PROVABLY FAIR SHA-256</span>
            <span>•</span>
            <span className="text-amber-400">DOUBLE-ENTRY LEDGER</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </I18nProvider>
  );
}
