import React, { useState, useEffect } from 'react';
import { Radio, Users, ShieldCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_LIVE_TABLES } from '../../engine/liveCasinoAdapter';
import { platform } from '../../services/platformStore';
import { soundFx } from '../../utils/audio';
import { GameSplashScreen } from './GameSplashScreen';

export const LiveCasinoClient: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedTable, setSelectedTable] = useState(INITIAL_LIVE_TABLES[0]);
  const [betAmount, setBetAmount] = useState(10);
  const [betPlaced, setBetPlaced] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(selectedTable.secondsRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          // Round Settlement on ball drop
          if (betPlaced) {
            const isWin = Math.random() < 0.48; // European roulette even-money chance
            if (isWin) {
              const winPayout = betAmount * 2;
              const player = platform.getActivePlayer();
              platform.executeWalletTransaction({
                operatorId: player.operatorId,
                playerId: player.id,
                type: 'WIN',
                amount: winPayout,
                currency: player.currency,
                idempotencyKey: `idem_live_win_${Date.now()}`,
                metadata: { tableId: selectedTable.id, multiplier: 2.0 },
              });
              setLastWin(winPayout);
              soundFx.playWin(2.0);
              confetti({ particleCount: 30, spread: 50 });
              onRefresh();
            }
          }
          setBetPlaced(false);
          return 20; // reset betting window
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [betPlaced, betAmount, selectedTable.id, onRefresh]);

  const handlePlaceLiveBet = () => {
    const player = platform.getActivePlayer();
    if (player.balance < betAmount) return;

    soundFx.playClick();
    platform.executeWalletTransaction({
      operatorId: player.operatorId,
      playerId: player.id,
      type: 'BET',
      amount: betAmount,
      currency: player.currency,
      idempotencyKey: `idem_live_${Date.now()}`,
      metadata: { tableId: selectedTable.id },
    });

    setBetPlaced(true);
    setLastWin(null);
    onRefresh();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Universal Splash Screen */}
      {showSplash && (
        <GameSplashScreen
          gameType="LIVE"
          onComplete={() => setShowSplash(false)}
        />
      )}

      {/* Table Selector */}
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {INITIAL_LIVE_TABLES.map(table => (
            <button
              key={table.id}
              onClick={() => {
                setSelectedTable(table);
                setSeconds(table.secondsRemaining);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                selectedTable.id === table.id
                  ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <img src={table.dealerAvatar} alt={table.dealerName} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="font-extrabold text-white text-xs">{table.name}</div>
                <div className="text-[10px] text-slate-400">Dealer: {table.dealerName}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowSplash(true)}
          className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-2xl border border-slate-800 transition flex flex-col items-center justify-center text-xs font-bold gap-1 cursor-pointer flex-shrink-0"
          title="Replay Splash Screen"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px]">Splash</span>
        </button>
      </div>

      {/* Main Table Stream Mock & Betting */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
        <div className="relative h-72 sm:h-96 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
          
          {/* Top Live Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              LIVE 4K 60FPS
            </span>
            <span className="px-2.5 py-1 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-full text-xs font-bold">
              Round: {selectedTable.currentRoundId}
            </span>
          </div>

          <div className="space-y-3 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-amber-400 shadow-xl">
              <img src={selectedTable.dealerAvatar} alt={selectedTable.dealerName} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-black text-white">{selectedTable.name}</h3>
            <p className="text-xs text-slate-400">
              Dealer <strong className="text-white">{selectedTable.dealerName}</strong> is accepting bets. Optical Card/Ball recognition active.
            </p>

            {/* Countdown timer */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900/90 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>BETTING WINDOW CLOSES IN {seconds}s</span>
            </div>

            {lastWin && (
              <div className="px-4 py-1.5 bg-emerald-950/90 border border-emerald-500/50 rounded-full text-xs font-black text-emerald-300 animate-in fade-in flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>TABLE WIN! +€{lastWin.toFixed(2)} CREDITED TO BALANCE</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Table Limits: <strong className="text-white">€{selectedTable.minBet} - €{selectedTable.maxBet.toLocaleString()}</strong>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[5, 10, 25, 50, 100].map(chip => (
                <button
                  key={chip}
                  onClick={() => setBetAmount(chip)}
                  className={`w-9 h-9 rounded-full font-black text-xs border transition ${
                    betAmount === chip
                      ? 'bg-amber-500 text-slate-950 border-white scale-110 shadow-lg'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  €{chip}
                </button>
              ))}
            </div>

            <button
              onClick={handlePlaceLiveBet}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition"
            >
              {betPlaced ? 'BET ACCEPTED!' : `PLACE BET €${betAmount}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
