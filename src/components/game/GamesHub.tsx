import React, { useState } from 'react';
import { Gamepad2, Rocket, Radio, Flame } from 'lucide-react';
import { SlotGameClient } from './SlotGameClient';
import { CrashGameClient } from './CrashGameClient';
import { LiveCasinoClient } from './LiveCasinoClient';
import { AviatorGameClient } from './AviatorGameClient';

export const GamesHub: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const [activeGame, setActiveGameState] = useState<'AVIATOR' | 'SLOT' | 'CRASH' | 'LIVE'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neextplay_active_game') as 'AVIATOR' | 'SLOT' | 'CRASH' | 'LIVE' | null;
      if (saved) return saved;
    }
    return 'AVIATOR';
  });

  const setActiveGame = (g: 'AVIATOR' | 'SLOT' | 'CRASH' | 'LIVE') => {
    setActiveGameState(g);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('neextplay_active_game', g);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden min-h-0">
      {/* Game Selector Bar (Ultra-slim single row, horizontal scroll on mobile, zero vertical expansion) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 mb-1 gap-1.5 flex-shrink-0 h-9">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none flex-nowrap min-w-0 flex-1 py-0.5">
          {/* AVIATOR (Featured Game) */}
          <button
            onClick={() => setActiveGame('AVIATOR')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black transition relative overflow-hidden flex-shrink-0 cursor-pointer ${
              activeGame === 'AVIATOR'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/30 ring-1 ring-red-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>✈️</span>
            <span>AVIATOR</span>
            <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[8px] font-black uppercase">
              HOT
            </span>
          </button>

          <button
            onClick={() => setActiveGame('SLOT')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black transition flex-shrink-0 cursor-pointer ${
              activeGame === 'SLOT'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Neext Fortune</span>
            <span className="sm:hidden">Slot</span>
          </button>

          <button
            onClick={() => setActiveGame('CRASH')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black transition flex-shrink-0 cursor-pointer ${
              activeGame === 'CRASH'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Neext Velocity</span>
            <span className="sm:hidden">Crash</span>
          </button>

          <button
            onClick={() => setActiveGame('LIVE')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black transition flex-shrink-0 cursor-pointer ${
              activeGame === 'LIVE'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Casino Tables</span>
            <span className="sm:hidden">Live</span>
          </button>
        </div>
      </div>

      {/* Render selected active game: ONLY Aviator has no-scroll screen-fit, other games scroll normally */}
      <div className={`flex-1 min-h-0 w-full flex flex-col ${activeGame === 'AVIATOR' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {activeGame === 'AVIATOR' && <AviatorGameClient key="aviator_active" onRefresh={onRefresh} />}
        {activeGame === 'SLOT' && <SlotGameClient key="slot_active" onRefresh={onRefresh} />}
        {activeGame === 'CRASH' && <CrashGameClient key="crash_active" onRefresh={onRefresh} />}
        {activeGame === 'LIVE' && <LiveCasinoClient key="live_active" onRefresh={onRefresh} />}
      </div>
    </div>
  );
};
