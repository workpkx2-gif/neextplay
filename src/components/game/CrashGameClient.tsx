import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Rocket, ShieldCheck, Flame, Sparkles } from 'lucide-react';
import { platform } from '../../services/platformStore';
import { generateCrashPoint, calculateMultiplierAtTime } from '../../engine/crashEngine';
import { soundFx } from '../../utils/audio';
import { useI18n } from '../../services/i18nContext';
import { GameSplashScreen } from './GameSplashScreen';

export const CrashGameClient: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const activePlayer = platform.getActivePlayer();
  const { t, formatMoney } = useI18n();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  const [betAmount, setBetAmount] = useState<number>(5.00);
  const [autoCashoutAt, setAutoCashoutAt] = useState<number>(2.00);
  const [gameState, setGameState] = useState<'IDLE' | 'FLYING' | 'CRASHED'>('IDLE');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [hasBet, setHasBet] = useState<boolean>(false);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [cashedOutAt, setCashedOutAt] = useState<number>(0);
  const [crashPoint, setCrashPoint] = useState<number>(1.00);
  const [lastRoundResult, setLastRoundResult] = useState<{ win: number; mult: number } | null>(null);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const startRound = () => {
    if (activePlayer.balance < betAmount) return;

    const debitRes = platform.executeWalletTransaction({
      operatorId: activePlayer.operatorId,
      playerId: activePlayer.id,
      type: 'BET',
      amount: betAmount,
      currency: activePlayer.currency,
      idempotencyKey: `idem_crash_bet_${Date.now()}`,
      metadata: { gameId: 'game_neext_velocity' },
    });

    if (!debitRes.success) return;

    soundFx.playClick();
    const point = generateCrashPoint();
    setCrashPoint(point);
    setGameState('FLYING');
    setHasBet(true);
    setHasCashedOut(false);
    setCurrentMultiplier(1.00);
    setLastRoundResult(null);

    startTimeRef.current = performance.now();

    const loop = (time: number) => {
      const elapsedSec = (time - startTimeRef.current) / 1000;
      const mult = calculateMultiplierAtTime(elapsedSec);

      if (mult >= point) {
        setCurrentMultiplier(point);
        setGameState('CRASHED');
        setHasBet(false);
        onRefresh();
        return;
      }

      setCurrentMultiplier(mult);

      if (!hasCashedOut && autoCashoutAt > 0 && mult >= autoCashoutAt) {
        triggerCashout(mult);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    onRefresh();
  };

  const triggerCashout = (cashMult = currentMultiplier) => {
    if (gameState !== 'FLYING' || hasCashedOut) return;

    const winAmount = Number((betAmount * cashMult).toFixed(2));
    setHasCashedOut(true);
    setCashedOutAt(cashMult);
    setLastRoundResult({ win: winAmount, mult: cashMult });

    platform.executeWalletTransaction({
      operatorId: activePlayer.operatorId,
      playerId: activePlayer.id,
      type: 'WIN',
      amount: winAmount,
      currency: activePlayer.currency,
      idempotencyKey: `idem_crash_win_${Date.now()}`,
      metadata: { gameId: 'game_neext_velocity', multiplier: cashMult },
    });

    soundFx.playWin(cashMult);
    confetti({ particleCount: 50, spread: 60 });
    onRefresh();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in">
      {/* Universal Splash Screen */}
      {showSplash && (
        <GameSplashScreen
          gameType="CRASH"
          onComplete={() => setShowSplash(false)}
        />
      )}

      <div className="bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 rounded-3xl border border-indigo-900/40 p-6 shadow-2xl space-y-4 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
              🚀
            </div>
            <div>
              <h2 className="text-lg font-black text-white">NEEXT VELOCITY CRASH</h2>
              <p className="text-[11px] text-slate-400">Provably Fair Multiplier Curve • Certified 97.0% RTP</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSplash(true)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 text-xs flex items-center gap-1 transition"
              title="Replay Splash Screen"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-bold">Splash</span>
            </button>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('game.balance', 'Player Balance')}</span>
              <span className="text-base font-black text-amber-400">{formatMoney(activePlayer.balance)}</span>
            </div>
          </div>
        </div>

        {/* Flight Curve Display */}
        <div className="h-64 sm:h-72 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <div className="text-center z-10 space-y-2">
            <div
              className={`text-5xl sm:text-7xl font-black font-mono tracking-tight transition-transform ${
                gameState === 'CRASHED'
                  ? 'text-rose-500 scale-95'
                  : gameState === 'FLYING'
                  ? 'text-emerald-400 scale-105'
                  : 'text-slate-400'
              }`}
            >
              {currentMultiplier.toFixed(2)}x
            </div>

            <div className="text-xs uppercase font-extrabold tracking-widest">
              {gameState === 'FLYING' && (
                <span className="text-emerald-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 animate-bounce text-amber-400" />
                  ROCKET IN FLIGHT
                </span>
              )}
              {gameState === 'CRASHED' && (
                <span className="text-rose-400">CRASHED AT {crashPoint.toFixed(2)}x</span>
              )}
              {gameState === 'IDLE' && <span className="text-slate-500">READY FOR TAKEOFF</span>}
            </div>

            {hasCashedOut && (
              <div className="px-3 py-1 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 rounded-full text-xs font-bold animate-in fade-in">
                CASHED OUT AT {cashedOutAt.toFixed(2)}x (+{formatMoney(lastRoundResult?.win || 0)})
              </div>
            )}
          </div>
        </div>

        {/* Betting Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="text-[11px] text-slate-400 block font-bold mb-1">{t('game.bet', 'BET')} AMOUNT</label>
            <input
              type="number"
              disabled={gameState === 'FLYING'}
              min="0.5"
              step="0.5"
              value={betAmount}
              onChange={e => setBetAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block font-bold mb-1">AUTO CASHOUT (MULTIPLIER)</label>
            <input
              type="number"
              disabled={gameState === 'FLYING'}
              min="1.01"
              step="0.1"
              value={autoCashoutAt}
              onChange={e => setAutoCashoutAt(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-300 font-mono font-bold text-sm outline-none"
            />
          </div>

          <div className="flex items-end">
            {gameState === 'FLYING' && hasBet && !hasCashedOut ? (
              <button
                onClick={() => triggerCashout()}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-xl uppercase tracking-wider shadow-lg shadow-emerald-500/20"
              >
                {t('game.cashOut', 'CASH OUT')} {formatMoney(betAmount * currentMultiplier)}
              </button>
            ) : (
              <button
                disabled={gameState === 'FLYING'}
                onClick={startRound}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {t('game.launchRocket', 'LAUNCH ROCKET')} ({formatMoney(betAmount)})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
