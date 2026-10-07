import React, { useState } from 'react';
import {
  ShieldCheck,
  Gamepad2,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Globe2,
  CheckCircle2,
  Code2,
  Server,
  Play,
  Terminal,
  FileCode,
  Key,
  Shield,
  Coins,
  Star,
  HelpCircle,
  ChevronDown,
  Quote,
  Menu,
  X,
  ExternalLink,
  Gift,
  TrendingUp,
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';
import { useAuth, UserRole } from '../../services/authContext';
import { useI18n } from '../../services/i18nContext';
import { LanguageCurrencyBar } from '../common/LanguageCurrencyBar';

interface LandingPageProps {
  onEnterDashboard: (role: UserRole) => void;
  onOpenDirectGame: () => void;
  onOpenClientSite?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDashboard,
  onOpenDirectGame,
  onOpenClientSite,
}) => {
  const { user } = useAuth();
  const { t, formatMoney, currency, language } = useI18n();
  const isBn = language === 'bn';
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'LOGIN' | 'REGISTER' | 'DEMO'>('LOGIN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeBannerTab, setActiveBannerTab] = useState<'SHOWROOM' | 'OFFERS' | 'GAMES'>('SHOWROOM');
  const [turnoverBaseEur, setTurnoverBaseEur] = useState<number>(50000);

  const openAuth = (tab: 'LOGIN' | 'REGISTER' | 'DEMO' = 'LOGIN') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (role: UserRole) => {
    onEnterDashboard(role);
  };

  const banners = {
    SHOWROOM: {
      img: '/src/assets/images/neextplay_premium_banner_1791304583495.jpg',
      title: t('hero.bannerTitle', 'NeextPlay Premium Suite'),
      sub: t('hero.bannerSub', '5x3 Video Slot • 20 Fixed Paylines • Real-time Settlements'),
    },
    OFFERS: {
      img: '/src/assets/images/neextplay_offer_banner_1791305212252.jpg',
      title: t('offer.card1Title', '0% GGR Setup Fee'),
      sub: t('offer.card1Desc', 'First 30 days zero platform licensing cost. Keep 100% of your initial gaming turnover with instant activation.'),
    },
    GAMES: {
      img: '/src/assets/images/neextplay_games_suite_banner_1791305231367.jpg',
      title: t('banner.tabGames', 'Triple Play Showcase'),
      sub: t('games.subtitle', 'Interactive live client available right within the Developer & Operator portal.'),
    },
  };

  const faqItems = [
    { qKey: 'faq.q1', aKey: 'faq.a1' },
    { qKey: 'faq.q2', aKey: 'faq.a2' },
    { qKey: 'faq.q3', aKey: 'faq.a3' },
    { qKey: 'faq.q4', aKey: 'faq.a4' },
    { qKey: 'faq.q5', aKey: 'faq.a5' },
  ];

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* Responsive Premium Header */}
      <nav className="sticky top-0 z-40 bg-[#070a10]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          
          {/* Logo & Decorated Brand Name */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group flex-shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="/src/assets/images/neextplay_corp_logo_1791306162874.jpg"
              alt="NeextPlay Company Logo"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl object-cover border-2 border-amber-500/60 shadow-xl shadow-amber-500/25 group-hover:scale-105 group-hover:border-amber-400 transition-all duration-300"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.35)]">
                  {isBn ? 'নেক্সটপ্লে' : 'NEEXTPLAY'}
                </span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase px-1 sm:px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500/25 to-yellow-500/10 text-amber-300 border border-amber-500/40 tracking-wider shadow-sm">
                  PRO
                </span>
              </div>
              <span className="hidden sm:flex text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                {isBn ? 'বি২বি গেমিং সিস্টেম' : 'B2B Gaming Systems'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links - Only 2 Primary Important Shortcuts */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-bold text-slate-300">
            <button
              onClick={onOpenClientSite || onOpenDirectGame}
              className="text-amber-300 hover:text-white transition flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-950/80 to-amber-950/80 hover:bg-slate-900 border border-amber-500/40 shadow-sm"
            >
              <Globe2 className="w-4 h-4 text-amber-400" />
              <span>Partner Casino Demo (Test Main)</span>
            </button>
            <a
              href="#developer-connect"
              className="hover:text-amber-300 transition flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 shadow-sm"
            >
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>{t('nav.developerConnect', 'Developer Connect')}</span>
            </a>
            <a
              href="#games"
              className="hover:text-indigo-300 transition flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 shadow-sm"
            >
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              <span>{t('nav.gameCatalog', 'Game Catalog')}</span>
            </a>
          </div>

          {/* Header Controls (Responsive for Mobile & Desktop) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Language & Currency in top bar for tablet and desktop */}
            <div className="hidden md:flex">
              <LanguageCurrencyBar />
            </div>

            {user ? (
              <button
                onClick={() => onEnterDashboard(user.role)}
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition flex-shrink-0"
              >
                <span>{user.role === 'COMPANY_ADMIN' ? (isBn ? 'অ্যাডমিন' : 'Admin') : (isBn ? 'গেটওয়ে' : 'Gateway')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => openAuth('LOGIN')}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900/80 sm:bg-transparent border border-slate-800 sm:border-transparent rounded-lg sm:rounded-none transition flex-shrink-0"
                >
                  {t('nav.signIn', 'Sign In')}
                </button>
                <button
                  onClick={() => openAuth('DEMO')}
                  className="hidden sm:flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-xl text-xs font-bold transition shadow flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('nav.twoRoles', '2 Roles Access')}</span>
                </button>
                <button
                  onClick={() => openAuth('REGISTER')}
                  className="hidden md:flex items-center space-x-1 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex-shrink-0"
                >
                  <span>{t('nav.registerDeveloper', 'Register Developer')}</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition flex-shrink-0 active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with Ultra-Clean Mobile Experience */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/90 bg-[#080c14]/98 backdrop-blur-2xl px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-3">
            
            {/* Mobile Language & Currency Selector Row */}
            <div className="md:hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isBn ? 'ভাষা ও মুদ্রা সেটিংস' : 'Language & Currency'}
              </span>
              <div className="flex items-center justify-between">
                <LanguageCurrencyBar />
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25">
                  {currency}
                </span>
              </div>
            </div>

            {/* 2 Important Shortcuts */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                {isBn ? 'প্রধান নেভিগেশন' : 'Primary Navigation'}
              </span>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href="#developer-connect"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 flex items-center justify-between border border-slate-800 hover:border-amber-500/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                        {t('nav.developerConnect', 'Developer Connect')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isBn ? 'রিয়েলটাইম এপিআই ডক ও স্যান্ডবক্স' : 'API Docs & Integration Sandbox'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                </a>

                <a
                  href="#games"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 flex items-center justify-between border border-slate-800 hover:border-indigo-500/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                        {t('nav.gameCatalog', 'Game Catalog')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isBn ? '৩টি সার্টিফাইড লাইভ স্লট শোকেস' : 'Triple Play Certified Slot Showcase'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
                </a>
              </div>
            </div>

            {/* Quick Authentication Actions */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                {isBn ? 'প্ল্যাটফর্ম রোল অ্যাক্সেস' : 'Role-Based Access'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); openAuth('DEMO'); }}
                  className="p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('nav.twoRoles', '2 Roles Access')}</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); openAuth('REGISTER'); }}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 transition"
                >
                  <span>{t('nav.registerDeveloper', 'Register Dev')}</span>
                </button>
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); openAuth('LOGIN'); }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition text-center"
              >
                {t('nav.signIn', 'Sign In with Existing Account')}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Screen-Fit Hero Section */}
      <section className="relative pt-10 pb-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-amber-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-xl backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>{t('hero.badge', 'GLI-19 Certified • Regulated B2B Casino Provider Architecture')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            {t('hero.title', 'Next-Generation B2B Gaming Engine & API Gateway')}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-normal">
            {t('hero.subtitle', 'Certified 5x3 video slot math, provably fair multiplier curves, live dealer stream adapters, and real Firebase Firestore database architecture.')}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenDirectGame}
              className="flex items-center space-x-2 px-7 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-red-600/35 transition transform active:scale-95 ring-2 ring-red-500/50"
            >
              <span className="text-sm">✈️</span>
              <span>Play Aviator Game</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => openAuth('REGISTER')}
              className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 transition transform active:scale-95"
            >
              <span>{t('hero.btnGetKeys', 'Get Developer API Keys')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#developer-connect"
              className="flex items-center space-x-2 px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white rounded-2xl font-bold text-xs transition"
            >
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>{t('hero.btnExplore', 'Explore Developer Connect')}</span>
            </a>
          </div>

          {/* Premium Showcase Banner with Interactive 3-Tab Switcher */}
          <div className="pt-6 max-w-5xl mx-auto space-y-4">
            
            {/* Banner Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setActiveBannerTab('SHOWROOM')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeBannerTab === 'SHOWROOM'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('banner.tabShowroom', 'Luxury Gaming Studio')}</span>
              </button>
              <button
                onClick={() => setActiveBannerTab('OFFERS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeBannerTab === 'OFFERS'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t('banner.tabOffers', 'B2B Exclusive Welcome Grant')}</span>
              </button>
              <button
                onClick={() => setActiveBannerTab('GAMES')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeBannerTab === 'GAMES'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>{t('banner.tabGames', 'Triple Play Showcase')}</span>
              </button>
            </div>

            {/* Banner Frame */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-slate-800/80 shadow-2xl bg-slate-950 group">
              <img
                src={banners[activeBannerTab].img}
                alt="NeextPlay B2B Showcase Banner"
                className="w-full h-auto max-h-[480px] object-cover opacity-90 group-hover:opacity-100 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070a10] via-transparent to-transparent"></div>
              
              <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="bg-slate-950/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 text-left shadow-xl max-w-lg">
                  <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wide">{banners[activeBannerTab].title}</div>
                  <div className="text-xs sm:text-sm font-extrabold text-white">{banners[activeBannerTab].sub}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    {t('hero.realDbActive', 'Firebase Firestore Database Active')}
                  </span>
                  <span className="hidden md:flex px-2.5 sm:px-3 py-1 sm:py-1.5 bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 rounded-xl text-[11px] sm:text-xs font-bold items-center gap-1.5 backdrop-blur-md">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                    {t('hero.doubleEntry', 'Double-Entry Ledger')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="border-y border-slate-800/80 bg-slate-950/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">{t('metrics.uptimeVal', '99.99%')}</div>
            <div className="text-xs text-slate-400 font-semibold uppercase mt-1">{t('metrics.uptime', 'Guaranteed API SLA Uptime')}</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">{t('metrics.latencyVal', '<18ms')}</div>
            <div className="text-xs text-slate-400 font-semibold uppercase mt-1">{t('metrics.latency', 'Round Settlement Latency')}</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-indigo-300 font-mono">{t('metrics.randomnessVal', 'GLI-19')}</div>
            <div className="text-xs text-slate-400 font-semibold uppercase mt-1">{t('metrics.randomness', 'Certified Mathematical Randomness')}</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono">{t('metrics.jurisdictionsVal', '4+ Tiers')}</div>
            <div className="text-xs text-slate-400 font-semibold uppercase mt-1">{t('metrics.jurisdictions', 'Global Licensing Jurisdictions')}</div>
          </div>
        </div>
      </section>

      {/* EXCLUSIVE B2B OPERATOR OFFERS & WELCOME GRANT */}
      <section id="offers" className="py-20 bg-gradient-to-b from-slate-950 via-[#0c101d] to-slate-950 border-b border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center space-y-3">
            <span className="px-3.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              {t('offer.badge', 'Limited-Time Operator Grants')}
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">
              {t('offer.title', 'Accelerate Your Gaming Platform with Tier-1 Terms')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              {t('offer.subtitle', 'Exclusive commercial packages designed to maximize operator profit margins and eliminate upfront financial risk.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Offer 1 */}
            <div className="bg-slate-900/90 border-2 border-amber-500/30 hover:border-amber-500/70 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl transition group relative overflow-hidden">
              <div className="space-y-4">
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-black uppercase tracking-wide inline-block">
                  {t('offer.card1Tag', 'Special Welcome Grant')}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-400 transition">
                  {t('offer.card1Title', '0% GGR Setup Fee')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('offer.card1Desc', 'First 30 days zero platform licensing cost. Keep 100% of your initial gaming turnover with instant activation.')}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => openAuth('REGISTER')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>{t('offer.btnClaim', 'Claim Special B2B Offer')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Offer 2 */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl transition group relative overflow-hidden">
              <div className="space-y-4">
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-[10px] font-black uppercase tracking-wide inline-block">
                  {t('offer.card2Tag', 'Instant Integration')}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-400 transition">
                  {t('offer.card2Title', 'Turnkey Multi-Currency SDK')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('offer.card2Desc', 'Full support for BDT (৳) and 16+ global currencies with automated settlement and double-entry ledger protection.')}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => openAuth('REGISTER')}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <span>{t('offer.btnClaim', 'Claim Special B2B Offer')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Offer 3 */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl transition group relative overflow-hidden">
              <div className="space-y-4">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase tracking-wide inline-block">
                  {t('offer.card3Tag', 'Enterprise SLA')}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-400 transition">
                  {t('offer.card3Title', 'Dedicated 24/7 Account Director')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('offer.card3Desc', 'Dedicated technical solution architect and immediate compliance onboarding assistance for regulated jurisdictions.')}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => openAuth('REGISTER')}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <span>{t('offer.btnClaim', 'Claim Special B2B Offer')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE B2B OPERATOR PROFIT CALCULATOR */}
      <section id="calculator" className="py-20 bg-slate-950 border-b border-slate-800/80 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {t('calc.badge', 'Interactive Profit Estimator')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {t('calc.title', 'Calculate Your Projected Casino Net Revenue')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {t('calc.subtitle', 'Drag the turnover slider to simulate monthly player volume in your active currency and observe estimated operator yields.')}
            </p>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
            {/* Slider */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {t('calc.turnoverLabel', 'Estimated Monthly Turnover')}
                </label>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {formatMoney(turnoverBaseEur)}
                </div>
              </div>

              <input
                type="range"
                min="5000"
                max="500000"
                step="5000"
                value={turnoverBaseEur}
                onChange={e => setTurnoverBaseEur(Number(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>{formatMoney(5000)}</span>
                <span>{formatMoney(250000)}</span>
                <span>{formatMoney(500000)}</span>
              </div>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t('calc.rtpAvg', 'Average Studio Hold (3.8%)')}</div>
                <div className="text-lg font-black text-white mt-1 font-mono">
                  {formatMoney(turnoverBaseEur * 0.038)}
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-indigo-400 font-bold uppercase">{t('calc.projectedGGR', 'Projected GGR')}</div>
                <div className="text-lg font-black text-indigo-300 mt-1 font-mono">
                  {formatMoney(turnoverBaseEur * 0.038)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 p-4 rounded-2xl border border-emerald-500/40 shadow-lg">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">{t('calc.operatorNet', 'Your Net Profit (85%)')}</div>
                <div className="text-xl font-black text-emerald-300 mt-1 font-mono">
                  {formatMoney(turnoverBaseEur * 0.038 * 0.85)}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('calc.settlementSpeed', 'Instant Double-Entry Settlement')}</span>
              </div>

              <button
                onClick={() => openAuth('REGISTER')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                <span>{t('offer.btnClaim', 'Claim Special B2B Offer')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DEVELOPER CONNECT SECTION */}
      <section id="developer-connect" className="py-20 bg-gradient-to-b from-slate-950 via-[#0b0f1a] to-slate-950 border-b border-indigo-950/60 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          
          <div className="text-center space-y-3">
            <span className="px-3.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              {t('dev.sectionBadge', 'Developer Connect')}
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">{t('dev.title', '5-Minute Turnkey B2B API Integration')}</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              {t('dev.subtitle', 'Embed games directly into your existing player wallet and casino frontend. Log in to access live, personalized API documentation tailored to your company details.')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-extrabold text-white text-base">{t('dev.step1Title', 'Single Token Game Launch Frame')}</h4>
                <p className="text-xs text-slate-400">
                  {t('dev.step1Desc', 'Generate signed 120-minute launch session tokens to embed seamlessly in iframes or mobile webviews.')}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-extrabold text-white text-base">{t('dev.step2Title', 'Double-Entry Idempotent Wallet Hook')}</h4>
                <p className="text-xs text-slate-400">
                  {t('dev.step2Desc', 'Balance reservations and mutations guarded by Idempotency-Key headers with zero duplicate transactions.')}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-extrabold text-white text-base">{t('dev.step3Title', 'Signed HMAC-SHA256 Webhooks')}</h4>
                <p className="text-xs text-slate-400">
                  {t('dev.step3Desc', 'Real-time event callbacks on every round completion for automated casino ledger synchronization.')}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => openAuth('LOGIN')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4 text-cyan-300" />
                  <span>Launch Master API cURL Suite & Live Sandbox</span>
                </button>

                <button
                  onClick={() => openAuth('REGISTER')}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>{t('dev.btnConnect', 'Connect As Developer & View Custom Docs')}</span>
                </button>
              </div>
            </div>

            {/* Right: Code Sample in Active Currency & Live cURL */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Live Detected Domain Badge */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Detected Site Domain:
                  </span>
                  <span className="font-mono text-xs text-cyan-300 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 truncate max-w-[260px]">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://api.neextplay.com'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>Base:</span>
                  <span className="text-amber-300 font-bold">/api/v1</span>
                </div>
              </div>

              <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                    <span className="ml-2 font-mono text-slate-400 text-[11px]">{t('dev.codeTitle', 'quickstart-integration.ts')}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/40 rounded text-[10px] font-mono font-bold">
                    {t('dev.codeCurrencyLabel', 'Currency')}: {currency}
                  </span>
                </div>

                <div className="p-5 font-mono text-xs text-indigo-200 overflow-x-auto whitespace-pre leading-relaxed">
{`import { NeextPlayClient } from '@neextplay/sdk';

${t('dev.codeComment1', "// 1. Initialize client with your company's credentials")}
const neextplay = new NeextPlayClient({
  clientId: 'np_client_live_YOUR_COMPANY',
  clientSecret: process.env.NEEXTPLAY_SECRET,
  environment: 'production'
});

${t('dev.codeComment2', '// 2. Launch 5x3 video slot for an authenticated player')}
const session = await neextplay.games.launch({
  operatorPlayerId: 'player_user_88192',
  gameId: 'game_neext_fortune',
  currency: '${currency}',
  language: '${language}',
  returnUrl: 'https://yourcasino.com/lobby'
});

${t('dev.codeComment3', '// 3. Render game inside your web or mobile app')}
iframe.src = session.launchUrl;`}
                </div>

                <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {t('dev.multiCurrencyNote', 'Supports BDT (৳) and 16+ global currencies seamlessly.')}
                  </span>
                  <button
                    onClick={() => openAuth('LOGIN')}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    {t('dev.loginToView', 'Log In to View Personalized Docs')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Catalog Showcase */}
      <section id="games" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">{t('games.badge', 'Proprietary Game Suite')}</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">{t('games.title', 'Engineered for High Retention & Verified Hold')}</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {t('games.subtitle', 'Interactive live client available right within the Developer & Operator portal.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase">
                  {t('games.slotType', '5x3 Video Slot')}
                </span>
                <span className="text-xs text-emerald-400 font-bold font-mono">{t('games.slotRtp', 'RTP 96.50%')}</span>
              </div>
              <h3 className="text-xl font-black text-white">{t('games.slotTitle', 'Neext Fortune')}</h3>
              <p className="text-xs text-slate-400">
                {t('games.slotDesc', 'High-volatility mythological video slot with 20 fixed paylines, Dragon Wild substitutions, and 3x multiplier Free Spins.')}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500"><strong className="text-white">{t('games.slotMaxWin', 'Max Win: 5,000x')}</strong></span>
              <button
                onClick={onOpenDirectGame}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition"
              >
                {t('games.playDemo', 'Play Demo')}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-b from-slate-900/90 via-[#131722] to-slate-900/90 border-2 border-red-500/40 hover:border-red-500/80 rounded-3xl p-6 space-y-4 shadow-2xl flex flex-col justify-between transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider rounded-bl-xl shadow-md">
              FEATURED
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                  <span>✈️</span>
                  <span>{t('games.aviatorType', 'AVIATOR CRASH GAME')}</span>
                </span>
                <span className="text-xs text-emerald-400 font-bold font-mono">{t('games.crashRtp', 'RTP 97.00%')}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Aviator NextGen</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">HOT</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Authentic 3D red monoplane flight curve with dual independent betting panels, SHA-512 provably fair verification, live multiplayer ticker, and real-time community chat.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400"><strong className="text-amber-400">Max Win: 1,000x</strong></span>
              <button
                onClick={onOpenDirectGame}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-red-600/30 flex items-center gap-1.5"
              >
                <span>✈️</span>
                <span>Play Aviator</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-rose-500/40 transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-black uppercase">
                  {t('games.liveType', 'Live Streaming')}
                </span>
                <span className="text-xs text-emerald-400 font-bold font-mono">{t('games.liveRtp', 'RTP 97.30%')}</span>
              </div>
              <h3 className="text-xl font-black text-white">{t('games.liveTitle', 'Monaco VIP Live Roulette')}</h3>
              <p className="text-xs text-slate-400">
                {t('games.liveDesc', '4K low-latency video feed integration with automated OCR ball tracking, active betting countdowns, and instant round settlements.')}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">{t('games.liveLimits', 'Limits')}: <strong className="text-white">{formatMoney(1)} - {formatMoney(5000)}</strong></span>
              <button
                onClick={onOpenDirectGame}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition"
              >
                {t('games.viewTables', 'View Tables')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS & OPERATOR TESTIMONIALS SECTION (REQUESTED BY USER) */}
      <section id="reviews" className="py-20 bg-slate-950/80 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="px-3.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {t('reviews.badge', 'Verified B2B Operator Reviews')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">{t('reviews.title', 'Trusted by Leading International Gaming Operators')}</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {t('reviews.subtitle', 'Real testimonials from enterprise partners utilizing NeextPlay game mathematics and API infrastructure.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Review 1 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black">
                    {t('reviews.r1Stat', '+42% Turnover Growth')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{t('reviews.r1Quote', 'Integrating NeextPlay was astonishingly fast. The double-entry wallet hooks eliminated all reconciliation errors, and our players love the Dragon Wild mechanics. Turnover jumped 42% in our first month.')}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-amber-500 flex items-center justify-center font-black text-white text-xs">
                  ML
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs">{t('reviews.r1Name', 'Marcus Lindqvist')}</div>
                  <div className="text-[10px] text-slate-400">{t('reviews.r1Role', 'Chief Technology Officer')} • {t('reviews.r1Company', 'NexusBet International Ltd')}</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-950/90 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-black">
                    {t('reviews.r2Stat', '<18ms API Latency')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{t('reviews.r2Quote', 'The GLI-19 certification and provably fair seeds gave our regulatory auditors complete confidence. Sub-20 millisecond settlement response times provide a flawless player experience.')}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center font-black text-white text-xs">
                  ER
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs">{t('reviews.r2Name', 'Elena Rostova')}</div>
                  <div className="text-[10px] text-slate-400">{t('reviews.r2Role', 'Head of Casino Operations')} • {t('reviews.r2Company', 'Apex Gaming Group UK')}</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-950/90 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black">
                    {t('reviews.r3Stat', '100% Ledger Accuracy')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{t('reviews.r3Quote', 'The native BDT currency support and personalized API documentation made our expansion seamless. Best B2B game engine we have worked with in a decade.')}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center font-black text-white text-xs">
                  TA
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs">{t('reviews.r3Name', 'Tariq Al-Mansoor')}</div>
                  <div className="text-[10px] text-slate-400">{t('reviews.r3Role', 'VP of Integrations')} • {t('reviews.r3Company', 'Solaria Interactive Corp')}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ SECTION (REQUESTED BY USER) */}
      <section id="faq" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            {t('faq.badge', 'Frequently Asked Questions')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">{t('faq.title', 'Everything You Need to Know About NeextPlay B2B')}</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {t('faq.subtitle', 'Clear answers regarding API architecture, licensing compliance, currency support, and launch process.')}
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;

            return (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                >
                  <span className="font-bold text-white text-sm sm:text-base">
                    {t(item.qKey, 'FAQ Question')}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-amber-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in">
                    {t(item.aKey, 'FAQ Answer')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Compliance & Certifications Footer */}
      <footer id="compliance" className="border-t border-slate-800/80 bg-[#05070d] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="/src/assets/images/neextplay_corp_logo_1791306162874.jpg"
                alt="NeextPlay Company Logo"
                className="w-9 h-9 rounded-xl object-cover border border-amber-500/40"
              />
              <span className="font-bold text-white text-sm">
                {t('brand.name', 'NEEXTPLAY')} {t('brand.tagline', 'B2B Gaming Provider Platform')}
              </span>
            </div>
            <div className="flex flex-wrap gap-6 text-[11px] text-slate-400">
              <span>{t('compliance.mga', 'MGA/B2B/992/2025 License')}</span>
              <span>{t('compliance.ukgc', 'UKGC Operator #000-0982-1')}</span>
              <span>{t('compliance.curacao', 'Curacao eGaming 1668/JAZ')}</span>
              <span>{t('compliance.agco', 'AGCO B2B Supplier Certified')}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 text-center md:text-left">
            {t('footer.rights', '© 2026 NeextPlay Gaming Ltd. All rights reserved. 2 Roles System: Company Admin (Platform Control) & Developer (API Integration). 18+ Only.')}
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};
