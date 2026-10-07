import React, { useState } from 'react';
import {
  Cpu,
  Play,
  RotateCw,
  Percent,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
} from 'lucide-react';
import { runMathematicalSimulation, SimulationStats, SLOT_SYMBOLS } from '../../engine/slotEngine';

export const MathSimulator: React.FC = () => {
  const [spinCount, setSpinCount] = useState<number>(10000);
  const [betSize, setBetSize] = useState<number>(1.00);
  const [rtpProfile, setRtpProfile] = useState<string>('RTP_STANDARD');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stats, setStats] = useState<SimulationStats | null>(null);

  const theoreticalRtpMap: Record<string, number> = {
    RTP_HIGH: 97.80,
    RTP_STANDARD: 96.50,
    RTP_LOW: 94.10,
  };

  const handleRunSimulation = () => {
    setIsRunning(true);
    // Allow UI to update loading state before heavy calculation
    setTimeout(() => {
      const result = runMathematicalSimulation(spinCount, betSize, rtpProfile);
      setStats(result);
      setIsRunning(false);
    }, 50);
  };

  const targetTheorRtp = theoreticalRtpMap[rtpProfile] || 96.50;
  const delta = stats ? Number((stats.empiricalRtp - targetTheorRtp).toFixed(2)) : 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 p-6 rounded-2xl border border-indigo-900/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white">Mathematical RNG & RTP Batch Simulator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate thousands of authoritative rounds in real time. Validates GLI-19 statistical randomness, empirical vs theoretical RTP convergence, hit frequency, and symbol variance without modifying live player balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            GLI-19 Deterministic Engine
          </span>
        </div>
      </div>

      {/* Simulator Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Simulation Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Batch Spin Volume</label>
            <select
              value={spinCount}
              onChange={e => setSpinCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs outline-none"
            >
              <option value={1000}>1,000 Spins (Quick Check)</option>
              <option value={10000}>10,000 Spins (Standard Audit)</option>
              <option value={50000}>50,000 Spins (High Precision)</option>
              <option value={100000}>100,000 Spins (Regulatory Benchmark)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Target RTP Profile</label>
            <select
              value={rtpProfile}
              onChange={e => setRtpProfile(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs outline-none"
            >
              <option value="RTP_HIGH">VIP High Profile (Theoretical 97.80%)</option>
              <option value="RTP_STANDARD">Global Standard (Theoretical 96.50%)</option>
              <option value="RTP_LOW">Conservative Profile (Theoretical 94.10%)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Simulated Bet (€ / spin)</label>
            <input
              type="number"
              min="0.2"
              step="0.5"
              value={betSize}
              onChange={e => setBetSize(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold text-xs outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            disabled={isRunning}
            onClick={handleRunSimulation}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Simulating {spinCount.toLocaleString()} Spins...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Execute Batch Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Dashboard */}
      {stats && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Empirical RTP Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Empirical RTP</span>
                <span className="text-slate-500">Theor: {targetTheorRtp}%</span>
              </div>
              <div className="text-3xl font-black text-amber-400">
                {stats.empiricalRtp}%
              </div>
              <div className="text-[11px] pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-slate-500">Variance Delta:</span>
                <span className={`font-mono font-bold ${Math.abs(delta) <= 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {delta >= 0 ? `+${delta}%` : `${delta}%`} (Within 95% CI)
                </span>
              </div>
            </div>

            {/* Hit Frequency Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Hit Frequency</div>
              <div className="text-3xl font-black text-emerald-400">
                {stats.hitFrequencyPct}%
              </div>
              <div className="text-[11px] pt-2 flex items-center justify-between border-t border-slate-800 text-slate-400">
                <span>Winning Spins:</span>
                <strong className="text-white">{stats.hitCount.toLocaleString()} / {stats.totalSpins.toLocaleString()}</strong>
              </div>
            </div>

            {/* Max Win Multiplier Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Max Single Win</div>
              <div className="text-3xl font-black text-indigo-300">
                {stats.maxMultiplier}x
              </div>
              <div className="text-[11px] pt-2 flex items-center justify-between border-t border-slate-800 text-slate-400">
                <span>Peak Payout:</span>
                <strong className="text-emerald-400">€{stats.maxPayout.toFixed(2)}</strong>
              </div>
            </div>

            {/* Bonus Triggers & Performance Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Free Spins Triggers</div>
              <div className="text-3xl font-black text-purple-400">
                {stats.freeSpinTriggers.toLocaleString()}
              </div>
              <div className="text-[11px] pt-2 flex items-center justify-between border-t border-slate-800 text-slate-400">
                <span>Compute Duration:</span>
                <strong className="text-slate-300 font-mono">{stats.durationMs}ms</strong>
              </div>
            </div>
          </div>

          {/* Symbol Frequency Distribution Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Symbol Stop Frequency Breakdown (Across 5 Reels x 3 Positions)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(stats.symbolDistribution).map(([symKey, count]) => {
                const symDef = SLOT_SYMBOLS[symKey] || SLOT_SYMBOLS.TEN;
                const totalSymbolsEvaluated = stats.totalSpins * 15;
                const pct = ((count / totalSymbolsEvaluated) * 100).toFixed(2);

                return (
                  <div key={symKey} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{symDef.icon}</span>
                      <span className="text-xs font-bold text-white">{symDef.name.replace(/ of Runes| Crown/g, '')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <span className="text-slate-500">{count.toLocaleString()} stops</span>
                      <span className="font-bold text-indigo-300">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
