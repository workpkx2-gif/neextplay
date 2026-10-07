import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCw,
  Zap,
  Volume2,
  VolumeX,
  HelpCircle,
  Coins,
  Sparkles,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { platform } from '../../services/platformStore';
import { SLOT_SYMBOLS, SlotSymbol } from '../../engine/slotEngine';
import { soundFx } from '../../utils/audio';
import { SlotSpinResult } from '../../types';
import { useI18n } from '../../services/i18nContext';
import { GameSplashScreen } from './GameSplashScreen';

export const SlotGameClient: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const activePlayer = platform.getActivePlayer();
  const activeOp = platform.getActiveOperator();
  const { t, formatMoney, convertFromEur } = useI18n();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Bet options in base EUR (which are then converted according to currency multiplier)
  const baseBetOptions = [0.20, 0.40, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00];
  const [betIndex, setBetIndex] = useState(2); // €1.00 equivalent
  const currentBaseBet = baseBetOptions[betIndex];

  // Gameplay state
  const [isSpinning, setIsSpinning] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [showPaytable, setShowPaytable] = useState(false);

  // Free spins bonus state
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
  const [freeSpinsTotalWon, setFreeSpinsTotalWon] = useState<number>(0);
  const [showBonusCelebration, setShowBonusCelebration] = useState(false);

  // Display grid (5 columns x 3 rows)
  const [grid, setGrid] = useState<string[][]>([
    ['SEVEN', 'BELL', 'TEN'],
    ['WILD', 'DIAMOND', 'KING'],
    ['CHEST', 'SCATTER', 'QUEEN'],
    ['ACE', 'BELL', 'TEN'],
    ['DIAMOND', 'WILD', 'SEVEN'],
  ]);

  const [lastSpinResult, setLastSpinResult] = useState<SlotSpinResult | null>(null);
  const [highlightedLineIndex, setHighlightedLineIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const spinInProgressRef = useRef(false);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const executeSpin = async (isBonusSpin = false) => {
    if (spinInProgressRef.current) return;
    setErrorMessage(null);

    if (!isBonusSpin && activePlayer.balance < currentBaseBet) {
      setErrorMessage('Insufficient balance. Please deposit funds or adjust your bet size.');
      setAutoPlayCount(0);
      return;
    }

    spinInProgressRef.current = true;
    setIsSpinning(true);
    setHighlightedLineIndex(null);

    soundFx.playReelSpin();
    setSpinningReels([true, true, true, true, true]);

    const requestId = 'req_' + Math.random().toString(36).substring(2, 10);
    const spinPromise = platform.executeAuthoritativeSpin({
      playerId: activePlayer.id,
      gameId: 'game_neext_fortune',
      betAmount: isBonusSpin ? 0 : currentBaseBet,
      requestId,
      isFreeSpin: isBonusSpin,
      freeSpinMultiplier: 3,
    });

    const spinDelayBase = turboMode ? 250 : 600;

    for (let r = 0; r < 5; r++) {
      await new Promise(res => setTimeout(res, spinDelayBase / 2));
      soundFx.playReelStop(r);
      setSpinningReels(prev => {
        const next = [...prev];
        next[r] = false;
        return next;
      });
    }

    const { success, result, error } = await spinPromise;
    spinInProgressRef.current = false;
    setIsSpinning(false);

    if (!success || !result) {
      setErrorMessage(error || 'Spin failed to settle on server.');
      setAutoPlayCount(0);
      onRefresh();
      return;
    }

    setGrid(result.grid);
    setLastSpinResult(result);

    if (result.totalPayout > 0) {
      soundFx.playWin(result.payoutMultiplier);
      if (result.payoutMultiplier >= 10) {
        confetti({
          particleCount: result.payoutMultiplier >= 30 ? 120 : 60,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      if (isBonusSpin) {
        setFreeSpinsTotalWon(prev => prev + result.totalPayout);
      }
    }

    if (result.isFreeSpinsTriggered) {
      soundFx.playBonusTrigger();
      setShowBonusCelebration(true);
      setFreeSpinsRemaining(prev => prev + result.freeSpinsAwarded);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });
      setTimeout(() => setShowBonusCelebration(false), 2800);
    }

    onRefresh();

    if (result.winningLines.length > 0) {
      setHighlightedLineIndex(result.winningLines[0].lineIndex);
    }
  };

  useEffect(() => {
    if (freeSpinsRemaining > 0 && !isSpinning) {
      const timer = setTimeout(() => {
        setFreeSpinsRemaining(prev => prev - 1);
        executeSpin(true);
      }, turboMode ? 400 : 1200);
      return () => clearTimeout(timer);
    } else if (autoPlayCount > 0 && !isSpinning && freeSpinsRemaining === 0) {
      const timer = setTimeout(() => {
        setAutoPlayCount(prev => prev - 1);
        executeSpin(false);
      }, turboMode ? 400 : 1200);
      return () => clearTimeout(timer);
    }
  }, [autoPlayCount, freeSpinsRemaining, isSpinning]);

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in">
      {/* Universal NeextPlay Splash Screen */}
      {showSplash && (
        <GameSplashScreen
          gameType="SLOT"
          onComplete={() => setShowSplash(false)}
        />
      )}

      <div className="relative bg-gradient-to-b from-slate-950 via-[#0d121f] to-slate-950 rounded-3xl border-2 border-amber-500/30 shadow-2xl p-4 sm:p-6 overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Bar */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shadow-amber-500/30">
              NF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-white tracking-wide">NEEXT FORTUNE</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  5x3 • 20 Lines
                </span>
                {freeSpinsRemaining > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                    FREE SPINS: {freeSpinsRemaining} LEFT (3x MULTIPLIER)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                Operator: <span className="text-slate-300 font-semibold">{activeOp.name}</span> • Provider: NeextPlay
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSplash(true)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-800 text-xs flex items-center gap-1 transition"
              title="Replay Splash Screen"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-semibold">Splash</span>
            </button>

            <button
              onClick={() => setShowPaytable(true)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs flex items-center gap-1 transition"
              title={t('game.paytable', 'Paytable')}
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-semibold">{t('game.paytable', 'Paytable')}</span>
            </button>

            <button
              onClick={handleToggleMute}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* 5x3 Reel Grid Matrix */}
        <div className="relative bg-slate-950/90 rounded-2xl p-3 sm:p-5 border border-slate-800/90 shadow-inner">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4].map(colIdx => {
              const colSpinning = spinningReels[colIdx];

              return (
                <div
                  key={colIdx}
                  className="bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900 rounded-xl p-1.5 border border-slate-800/80 flex flex-col gap-2 relative overflow-hidden shadow-md"
                >
                  {[0, 1, 2].map(rowIdx => {
                    const symId = grid[colIdx][rowIdx];
                    const symDef = SLOT_SYMBOLS[symId] || SLOT_SYMBOLS.TEN;

                    const isWinning =
                      lastSpinResult &&
                      lastSpinResult.winningLines.some(
                        wl =>
                          (highlightedLineIndex === null || wl.lineIndex === highlightedLineIndex) &&
                          wl.positions.some(pos => pos[0] === colIdx && pos[1] === rowIdx)
                      );

                    return (
                      <div
                        key={rowIdx}
                        className={`h-20 sm:h-24 rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-300 relative select-none ${
                          colSpinning
                            ? 'blur-sm scale-95 opacity-60 animate-pulse'
                            : isWinning
                            ? 'bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border-2 border-amber-400 scale-105 z-10 shadow-lg shadow-amber-500/30'
                            : 'bg-slate-950/60 border border-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-3xl sm:text-4xl filter drop-shadow-md transform transition-transform hover:scale-110">
                          {symDef.icon}
                        </span>
                        <span
                          className={`text-[10px] sm:text-[11px] font-black uppercase mt-1 tracking-tight ${
                            symDef.isSpecial === 'WILD'
                              ? 'text-amber-400'
                              : symDef.isSpecial === 'SCATTER'
                              ? 'text-purple-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {symDef.name.replace(/ of Runes| Crown/g, '')}
                        </span>

                        {symDef.isSpecial && (
                          <span
                            className={`absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-extrabold ${
                              symDef.isSpecial === 'WILD'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-purple-600 text-white'
                            }`}
                          >
                            {symDef.isSpecial}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Winning Line Overlay Tags */}
          {lastSpinResult && lastSpinResult.winningLines.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-amber-400 font-extrabold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                WINNING LINES ({lastSpinResult.winningLines.length}):
              </span>
              {lastSpinResult.winningLines.map(wl => (
                <button
                  key={wl.lineIndex}
                  onClick={() => setHighlightedLineIndex(wl.lineIndex)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition border ${
                    highlightedLineIndex === wl.lineIndex
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Line #{wl.lineIndex}: +{formatMoney(wl.payout)} ({wl.count}x {wl.symbol})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Free Spins Celebration Modal */}
        {showBonusCelebration && (
          <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/50 mb-3 animate-bounce">
              🔮
            </div>
            <h3 className="text-3xl font-black text-amber-400 tracking-wider">{t('game.freeSpins', 'FREE SPINS TRIGGERED!')}</h3>
            <p className="text-sm text-slate-300 mt-2 max-w-sm">
              3 or more Arcane Orbs landed! Awarded <strong className="text-white text-base">10 Free Spins</strong> with an automatic <strong className="text-emerald-400 text-base">3x Multiplier</strong>!
            </p>
          </div>
        )}

        {/* Controls & Dashboard Footer in Active Multi-Currency */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Balance & Win displays in Active Currency */}
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('game.balance', 'Player Balance')}</div>
              <div className="text-base font-black text-amber-400">
                {formatMoney(activePlayer.balance)}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('game.lastPayout', 'Last Payout')}</div>
              <div className={`text-base font-black ${lastSpinResult && lastSpinResult.totalPayout > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {lastSpinResult ? formatMoney(lastSpinResult.totalPayout) : formatMoney(0)}
              </div>
            </div>
          </div>

          {/* Bet Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-bold">{t('game.bet', 'BET')}:</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                disabled={betIndex === 0 || isSpinning}
                onClick={() => setBetIndex(prev => Math.max(0, prev - 1))}
                className="px-2.5 py-1 text-slate-300 hover:text-white disabled:opacity-40 font-black text-xs"
              >
                -
              </button>
              <span className="px-3 py-1 font-black text-white text-xs min-w-[70px] text-center">
                {formatMoney(currentBaseBet)}
              </span>
              <button
                disabled={betIndex === baseBetOptions.length - 1 || isSpinning}
                onClick={() => setBetIndex(prev => Math.min(baseBetOptions.length - 1, prev + 1))}
                className="px-2.5 py-1 text-slate-300 hover:text-white disabled:opacity-40 font-black text-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Action buttons (Turbo, Autoplay, Spin) */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setTurboMode(!turboMode)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                turboMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title={t('game.turbo', 'Turbo Mode')}
            >
              <Zap className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (autoPlayCount > 0) {
                  setAutoPlayCount(0);
                } else {
                  setAutoPlayCount(25);
                }
              }}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                autoPlayCount > 0
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {autoPlayCount > 0 ? `${t('game.stop', 'Stop')} (${autoPlayCount})` : t('game.auto', 'Auto (25)')}
            </button>

            {/* Master SPIN button */}
            <button
              disabled={isSpinning}
              onClick={() => executeSpin(false)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-2xl font-black text-sm tracking-wider uppercase shadow-xl shadow-amber-500/30 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? t('game.spinning', 'SPINNING...') : t('game.spin', 'SPIN')}</span>
            </button>
          </div>
        </div>

        {/* Provably Fair Cryptographic Seed Footer */}
        {lastSpinResult && (
          <div className="mt-3 pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('game.provableHash', 'Provably Fair Hash')}:</span>
              <span className="text-slate-400 truncate max-w-[220px]">{lastSpinResult.serverSeedHash}</span>
            </div>
            <div>Round ID: {lastSpinResult.roundId}</div>
          </div>
        )}
      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Neext Fortune - {t('game.paytable', 'Paytable')}
              </h3>
              <button
                onClick={() => setShowPaytable(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.values(SLOT_SYMBOLS).map(sym => (
                <div key={sym.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sym.icon}</span>
                    <div>
                      <div className="font-extrabold text-white text-xs">{sym.name}</div>
                      {sym.isSpecial && (
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                          {sym.isSpecial}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 font-mono">
                    <div>5x: <strong className="text-amber-400">{sym.payouts[5]}x</strong></div>
                    <div>4x: <strong className="text-slate-200">{sym.payouts[4]}x</strong></div>
                    <div>3x: <strong className="text-slate-400">{sym.payouts[3]}x</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
