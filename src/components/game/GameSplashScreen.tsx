import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Zap, Award, Sparkles, Volume2, VolumeX, Play, ChevronRight, Lock } from 'lucide-react';
import neextplayLogo from '../../assets/images/neextplay_corp_logo_1791306162874.jpg';
import aviatorLogo from '../../assets/images/aviator_game_logo_1791312129943.jpg';
import { soundFx } from '../../utils/audio';

export type GameKeyType = 'AVIATOR' | 'SLOT' | 'CRASH' | 'LIVE';

interface GameSplashScreenProps {
  gameType: GameKeyType;
  onComplete: () => void;
  titleOverride?: string;
  subtitleOverride?: string;
  autoDurationMs?: number;
}

const GAME_METADATA: Record<
  GameKeyType,
  {
    title: string;
    subtitle: string;
    badge: string;
    accentGradient: string;
    neonColor: string;
    iconSymbol: string;
    logoUrl?: string;
    loadingStages: { pct: number; label: string; code: string }[];
  }
> = {
  AVIATOR: {
    title: 'AVIATOR',
    subtitle: 'HIGH ALTITUDE MULTIPLIER CRASH',
    badge: 'SPRIBE STYLE • GLI-19 CERTIFIED',
    accentGradient: 'from-red-600 via-rose-500 to-amber-500',
    neonColor: '#ef4444',
    iconSymbol: '✈️',
    logoUrl: aviatorLogo,
    loadingStages: [
      { pct: 15, label: 'Initializing CSPRNG Quantum Seeds...', code: 'SEC_CSPRNG_OK' },
      { pct: 38, label: 'Verifying Provably Fair SHA-256 Server Seed...', code: 'SHA256_VERIFIED' },
      { pct: 62, label: 'Calibrating 60 FPS Transparent 3D Flight Physics...', code: 'AERO_PHYS_SYNC' },
      { pct: 85, label: 'Connecting to Real-Time Multiplayer Ledger...', code: 'LEDGER_CONN_EST' },
      { pct: 100, label: 'All Systems Green • Ready for Takeoff', code: 'TAKEOFF_ARMED' },
    ],
  },
  SLOT: {
    title: 'NEEXT FORTUNE',
    subtitle: '5x3 HIGH VOLATILITY CASINO SLOT',
    badge: '96.8% RTP • CERTIFIED MATHEMATICS',
    accentGradient: 'from-amber-500 via-yellow-400 to-amber-600',
    neonColor: '#f59e0b',
    iconSymbol: '🎰',
    loadingStages: [
      { pct: 20, label: 'Generating 5-Reel Cryptographic Stop Positions...', code: 'REEL_MATH_OK' },
      { pct: 50, label: 'Loading Paytable & Free Spins Dynamic Matrices...', code: 'PAYTABLE_SYNC' },
      { pct: 80, label: 'Validating RNG Certification & Ledger Balances...', code: 'RNG_CERT_VALID' },
      { pct: 100, label: 'Slot Spin Matrix Armed & Ready!', code: 'SPIN_SYSTEM_GO' },
    ],
  },
  CRASH: {
    title: 'NEEXT VELOCITY',
    subtitle: 'ORBITAL ROCKET CRASH MULTIPLIER',
    badge: 'INSTANT PAYOUT • 1000x MAX MULTIPLIER',
    accentGradient: 'from-indigo-500 via-purple-500 to-pink-500',
    neonColor: '#a855f7',
    iconSymbol: '🚀',
    loadingStages: [
      { pct: 25, label: 'Igniting Orbital Thrust Calculations...', code: 'THRUST_INIT' },
      { pct: 55, label: 'Syncing Multi-Tenant Real-Time Telemetry...', code: 'TELEMETRY_SYNC' },
      { pct: 85, label: 'Preheating Velocity Escape Multiplier...', code: 'MULT_CURVE_READY' },
      { pct: 100, label: 'Orbital Rocket Armed for Launch!', code: 'ROCKET_ARMED' },
    ],
  },
  LIVE: {
    title: 'MONACO LIVE CASINO',
    subtitle: 'EUROPEAN ROULETTE REAL-TIME WHEEL',
    badge: 'STUDIO CAM 1 • ZERO LATENCY STREAM',
    accentGradient: 'from-emerald-500 via-teal-400 to-cyan-500',
    neonColor: '#10b981',
    iconSymbol: '🎲',
    loadingStages: [
      { pct: 25, label: 'Connecting to Studio HD Video Stream...', code: 'STREAM_CONNECTED' },
      { pct: 55, label: 'Calibrating Optical Ball Tracking Sensors...', code: 'OPTICAL_TRACK_OK' },
      { pct: 85, label: 'Opening Table Betting Window...', code: 'TABLE_OPEN' },
      { pct: 100, label: 'Live Studio Table Connected!', code: 'FEED_ONLINE' },
    ],
  },
};

export const GameSplashScreen: React.FC<GameSplashScreenProps> = ({
  gameType,
  onComplete,
  titleOverride,
  subtitleOverride,
  autoDurationMs = 2200,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const meta = GAME_METADATA[gameType] || GAME_METADATA.AVIATOR;

  // Stable reference to onComplete to prevent interval re-triggering on parent state changes
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    // Play sci-fi power-up sound on launch
    soundFx.playSplashIntro();

    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      if (hasFinishedRef.current) return;

      const elapsed = now - startTime;
      const currentPct = Math.min(100, Math.floor((elapsed / autoDurationMs) * 100));
      setProgress(currentPct);

      if (currentPct < 100) {
        animId = requestAnimationFrame(tick);
      } else {
        hasFinishedRef.current = true;
        soundFx.playSplashComplete();
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onCompleteRef.current();
          }, 300);
        }, 180);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [autoDurationMs]);

  const handleSkipOrStart = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    soundFx.playClick();
    soundFx.playSplashComplete();
    setProgress(100);
    setIsFadingOut(true);
    setTimeout(() => {
      onCompleteRef.current();
    }, 180);
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  // Find active stage based on progress
  const currentStage =
    meta.loadingStages.find(s => progress <= s.pct) ||
    meta.loadingStages[meta.loadingStages.length - 1];

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-between p-3 sm:p-6 bg-[#05070c] select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 15%, rgba(220, 38, 38, 0.16) 0%, transparent 60%),
          radial-gradient(circle at 50% 85%, rgba(15, 23, 42, 0.7) 0%, transparent 75%),
          linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 30px 30px, 30px 30px',
      }}
    >
      {/* 1. TOP BAR: PROVIDER CREST & CERTIFICATIONS */}
      <header className="w-full max-w-4xl flex items-center justify-between pt-2 px-2 z-10">
        {/* Provider Brand Logo & Title */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-amber-500/30 rounded-2xl px-3 py-1.5 shadow-xl backdrop-blur-md">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-amber-400 shadow-md">
            <img
              src={neextplayLogo}
              alt="NeextPlay B2B Gaming Provider"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                NEEXTPLAY
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                PROVIDER
              </span>
            </div>
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
              B2B ENTERPRISE GAMING ENGINE
            </span>
          </div>
        </div>

        {/* Certifications and Audio Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> GLI-19 CERTIFIED
            </span>
            <span>•</span>
            <span className="text-slate-300">PROVABLY FAIR</span>
          </div>

          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* 2. CENTER: ULTRA-PREMIUM HOLOGRAPHIC RADAR & GAME EMBLEM */}
      <div className="relative my-auto flex flex-col items-center justify-center w-full max-w-md text-center z-10 px-4">
        
        {/* Holographic Avionics Radar Ring System */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Ambient Glow */}
          <div
            className="absolute -inset-10 rounded-full opacity-60 pointer-events-none filter blur-2xl transition-all duration-500"
            style={{
              background: `radial-gradient(circle, ${meta.neonColor}55 0%, transparent 70%)`,
            }}
          />

          {/* Outer Rotating HUD Compass Ring with tick marks */}
          <div className="absolute -inset-7 rounded-full border border-dashed border-red-500/30 animate-[spin_20s_linear_infinite] pointer-events-none" />

          {/* Inner Counter-Rotating Reticle */}
          <div className="absolute -inset-4 rounded-full border border-red-500/40 animate-[spin_10s_linear_infinite_reverse] pointer-events-none" />

          {/* Pulse wave ring */}
          <div className="absolute -inset-1 rounded-full border-2 border-red-500/60 animate-ping opacity-30 pointer-events-none" />

          {/* Game Logo Emblem Card */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-2xl border-2 border-red-500/80 ring-4 ring-black/90 bg-slate-950 group">
            {meta.logoUrl ? (
              <img
                src={meta.logoUrl}
                alt={titleOverride || meta.title}
                className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-slate-900 to-black">
                {meta.iconSymbol}
              </div>
            )}

            {/* Glowing sweep sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none animate-[pulse_1.5s_infinite]" />
          </div>

          {/* Floating Pro Badge */}
          <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg border border-red-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
            <span>ORIGINAL EDITION</span>
          </div>
        </div>

        {/* Game Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_20px_rgba(239,68,68,0.8)] font-sans">
          {titleOverride || meta.title}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-bold text-slate-300 mt-1 uppercase tracking-wider">
          {subtitleOverride || meta.subtitle}
        </p>

        {/* Live Status Badge */}
        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-[10px] font-mono font-bold text-slate-300 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{meta.badge}</span>
        </div>
      </div>

      {/* 3. BOTTOM: HIGH-TECH TELEMETRY PROGRESS & LAUNCH ACTION */}
      <footer className="w-full max-w-xl pb-3 sm:pb-5 space-y-3 z-10 px-2">
        {/* Telemetry Stage Message & Percentage */}
        <div className="flex items-center justify-between text-xs font-mono font-bold px-1">
          <div className="flex items-center gap-2 truncate max-w-[280px] sm:max-w-[400px]">
            <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-500/40 text-[9px] font-black">
              {currentStage.code}
            </span>
            <span className="truncate text-slate-200 text-[11px] sm:text-xs">
              {currentStage.label}
            </span>
          </div>

          <span className="text-red-400 font-black text-sm sm:text-base tracking-wider flex-shrink-0">
            {progress}%
          </span>
        </div>

        {/* Glowing Laser Progress Bar */}
        <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800/90 overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${meta.accentGradient} transition-all duration-75 ease-out shadow-lg shadow-red-500/60 relative overflow-hidden`}
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_0.8s_infinite] w-full" />
          </div>
        </div>

        {/* Bottom Actions: Fast Launch button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>256-BIT ENCRYPTED SESSION</span>
          </div>

          <button
            onClick={handleSkipOrStart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 border border-red-400/60 transition cursor-pointer transform active:scale-95"
          >
            <span>{progress >= 100 ? 'START FLIGHT' : 'SKIP INTRO'}</span>
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </footer>
    </div>
  );
};
