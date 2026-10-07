/**
 * NeextPlay Aviator How To Play & Game Rules Modal
 */

import React from 'react';
import { HelpCircle, Play, DollarSign, Rocket, ShieldCheck, X } from 'lucide-react';

interface AviatorHowToPlayModalProps {
  onClose: () => void;
}

export const AviatorHowToPlayModal: React.FC<AviatorHowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in font-sans">
      <div className="bg-[#0f141d] border border-slate-700/80 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#141a26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">HOW TO PLAY AVIATOR</h3>
              <p className="text-xs text-slate-400">Rules, Betting Strategy & Game Mechanics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* Quick 3-Step Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 font-black flex items-center justify-center">
                1
              </div>
              <h4 className="font-bold text-white text-sm">Place Your Bet</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Choose your bet amount before takeoff. You can even place <strong>two bets simultaneously</strong>!
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-white text-sm">Watch It Fly</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                As the lucky red plane ascends, the multiplier curve climbs upwards from 1.00x into high heavens.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center">
                3
              </div>
              <h4 className="font-bold text-white text-sm">Cash Out!</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Hit Cash Out before the plane flies away! Your win is your bet multiplied by the exact cashout multiplier.
              </p>
            </div>
          </div>

          {/* Key Game Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Advanced Features</h4>

            <div className="space-y-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Dual Independent Betting Panels</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Run two separate strategies at once. For example, set Panel 1 to Auto Cash Out safely at 1.50x to cover your wager, while letting Panel 2 chase a massive 20x+ multiplier!
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Play className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Auto Bet & Auto Cash Out</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Switch to the 'Auto' tab on either panel to enable automated round entry, or configure a target multiplier (e.g. 2.00x) for millisecond-precise automated cashouts.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Provably Fair Cryptography</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Every single round is determined by SHA-256 and SHA-512 hashes generated jointly by the server and client seeds. Click any multiplier pill in the top bar to inspect and verify the math!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RTP & Compliance Note */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-300">Theoretical RTP:</span> 97.00%
            </div>
            <div>
              <span className="font-bold text-slate-300">Max Multiplier:</span> 1,000x
            </div>
            <div>
              <span className="font-bold text-slate-300">Certification:</span> GLI-19
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition"
          >
            Got It, Let's Play
          </button>
        </div>
      </div>
    </div>
  );
};
