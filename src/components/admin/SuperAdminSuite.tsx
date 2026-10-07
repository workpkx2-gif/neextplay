import React, { useState } from 'react';
import {
  Building2,
  Gamepad2,
  Sliders,
  Radio,
  FileSpreadsheet,
  Activity,
  Plus,
  CheckCircle,
  Search,
  Server,
  Layers,
  Percent,
  ShieldAlert,
} from 'lucide-react';
import { platform } from '../../services/platformStore';
import { Operator, GameDefinition, GameStatus } from '../../types';
import { INITIAL_LIVE_TABLES } from '../../engine/liveCasinoAdapter';
import { useI18n } from '../../services/i18nContext';

export const SuperAdminSuite: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const { t, formatMoney } = useI18n();
  const [subTab, setSubTab] = useState<'OPERATORS' | 'CATALOG' | 'MATH_RTP' | 'LIVE_CASINO' | 'LEDGER_AUDIT' | 'HEALTH'>('OPERATORS');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [newOpModal, setNewOpModal] = useState(false);
  const [newOpForm, setNewOpForm] = useState({ name: '', code: '', email: '', country: 'Malta (MGA)', currency: 'EUR' });

  const handleToggleStatus = (op: Operator, nextStatus: Operator['status']) => {
    op.status = nextStatus;
    platform.auditLogs.unshift({
      id: 'audit_' + Math.random().toString(36).substring(2, 9),
      operatorId: op.id,
      actor: 'super-admin@neextplay.com',
      action: `OPERATOR_STATUS_CHANGED_${nextStatus}`,
      category: 'CONFIG',
      details: `Operator ${op.name} (${op.code}) status updated to ${nextStatus}.`,
      timestamp: new Date().toISOString(),
      ip: '10.0.4.1',
    });
    onRefresh();
  };

  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpForm.name || !newOpForm.code) return;

    const created: Operator = {
      id: 'op_' + newOpForm.code.toLowerCase().replace(/\s+/g, '_'),
      name: newOpForm.name,
      code: newOpForm.code.toUpperCase(),
      email: newOpForm.email,
      country: newOpForm.country,
      status: 'ACTIVE',
      currency: newOpForm.currency,
      allowedCurrencies: [newOpForm.currency, 'USD'],
      createdAt: new Date().toISOString(),
      totalGgr: 0,
      totalTurnover: 0,
      companyBalance: 100000.00,
      activePlayers: 0,
      ipWhitelist: ['127.0.0.1'],
      webhookUrl: 'https://webhook.site/test',
      webhookSecret: 'whsec_' + Math.random().toString(36).substring(2, 16),
    };

    platform.operators.push(created);
    platform.games.forEach(g => {
      platform.configs.push({
        gameId: g.id,
        operatorId: created.id,
        enabled: true,
        selectedRtpProfileId: g.availableRtpProfiles[0]?.id || 'RTP_STANDARD',
        minBet: g.minBet,
        maxBet: g.maxBet,
        allowedCurrencies: [created.currency],
        jackpotContributionPct: 1.0,
      });
    });

    setNewOpModal(false);
    setNewOpForm({ name: '', code: '', email: '', country: 'Malta (MGA)', currency: 'EUR' });
    onRefresh();
  };

  const handleGameStatusToggle = (game: GameDefinition, nextStatus: GameStatus) => {
    game.status = nextStatus;
    onRefresh();
  };

  const totalGlobalGgr = platform.operators.reduce((acc, o) => acc + o.totalGgr, 0);
  const totalGlobalTurnover = platform.operators.reduce((acc, o) => acc + o.totalTurnover, 0);

  const filteredOperators = platform.operators.filter(
    o => o.name.toLowerCase().includes(operatorSearch.toLowerCase()) || o.code.toLowerCase().includes(operatorSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Super Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-3xl border border-indigo-900/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Company Admin Platform Control</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Global orchestrator: multi-tenant client governance, certified mathematical game configuration, and immutable double-entry ledger oversight.
          </p>
        </div>

        {/* Global KPI cards formatted in Active Currency */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 text-right shadow-lg">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Global GGR</div>
            <div className="text-lg font-black text-emerald-400">
              {formatMoney(totalGlobalGgr)}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 text-right shadow-lg">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Turnover</div>
            <div className="text-lg font-black text-indigo-300">
              {formatMoney(totalGlobalTurnover)}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 text-right shadow-lg">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Operators</div>
            <div className="text-lg font-black text-amber-400">{platform.operators.length} B2B</div>
          </div>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab('OPERATORS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'OPERATORS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>B2B Operators ({platform.operators.length})</span>
        </button>

        <button
          onClick={() => setSubTab('CATALOG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'CATALOG'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Master Game Catalog ({platform.games.length})</span>
        </button>

        <button
          onClick={() => setSubTab('MATH_RTP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'MATH_RTP'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Global Math & RTP Profiles</span>
        </button>

        <button
          onClick={() => setSubTab('LIVE_CASINO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'LIVE_CASINO'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-400" />
          <span>Live Casino Providers</span>
        </button>

        <button
          onClick={() => setSubTab('LEDGER_AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'LEDGER_AUDIT'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Immutable Ledger & Audits</span>
        </button>

        <button
          onClick={() => setSubTab('HEALTH')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'HEALTH'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Health & SRE</span>
        </button>
      </div>

      {/* SUBTAB 1: OPERATORS DIRECTORY */}
      {subTab === 'OPERATORS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={operatorSearch}
                onChange={e => setOperatorSearch(e.target.value)}
                placeholder="Search operator by name or code..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setNewOpModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New B2B Operator</span>
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Operator Entity</th>
                  <th className="py-3.5 px-4">Jurisdiction</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Turnover</th>
                  <th className="py-3.5 px-4">GGR</th>
                  <th className="py-3.5 px-4">Active Players</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOperators.map(op => (
                  <tr key={op.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{op.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>Code: {op.code}</span>
                        <span>•</span>
                        <span>{op.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{op.country}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          op.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                            : op.status === 'PENDING'
                            ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                            : op.status === 'SUSPENDED'
                            ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {op.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {formatMoney(op.totalTurnover)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      {formatMoney(op.totalGgr)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{op.activePlayers.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {op.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleToggleStatus(op, 'ACTIVE')}
                            className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 rounded-lg hover:bg-emerald-600/30 text-[11px] font-bold"
                          >
                            Activate
                          </button>
                        )}
                        {op.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleToggleStatus(op, 'SUSPENDED')}
                            className="px-2.5 py-1 bg-amber-600/20 text-amber-400 border border-amber-500/40 rounded-lg hover:bg-amber-600/30 text-[11px] font-bold"
                          >
                            Suspend
                          </button>
                        )}
                        {op.status !== 'BLOCKED' && (
                          <button
                            onClick={() => handleToggleStatus(op, 'BLOCKED')}
                            className="px-2.5 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/40 rounded-lg hover:bg-rose-600/30 text-[11px] font-bold"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MASTER GAME CATALOG */}
      {subTab === 'CATALOG' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platform.games.map(game => (
            <div
              key={game.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="relative h-36 overflow-hidden bg-slate-950">
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-white border border-white/20 uppercase tracking-widest">
                      {game.type}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-extrabold text-white text-base">{game.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{game.description}</p>
                  <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800">
                    <div>
                      <span className="text-slate-500">Default RTP:</span>
                      <div className="font-bold text-amber-400">{game.defaultRtp}%</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Limits:</span>
                      <div className="font-bold text-slate-300">{formatMoney(game.minBet)} - {formatMoney(game.maxBet)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                <span className="text-[10px] text-slate-500 font-mono">{game.slug}</span>
                <button
                  onClick={() => handleGameStatusToggle(game, game.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE')}
                  className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700"
                >
                  {game.status === 'ACTIVE' ? 'Set Maintenance' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: GLOBAL MATH & RTP PROFILES */}
      {subTab === 'MATH_RTP' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-400" />
                Certified Mathematical RTP Profiles & Volatility Governance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Outcomes are auditable across all operators and currencies.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold">
              GLI-19 Certified Spec
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 space-y-2">
              <span className="text-xs font-extrabold text-indigo-300">RTP_HIGH</span>
              <div className="text-2xl font-black text-white">97.80% <span className="text-xs text-slate-500">RTP</span></div>
              <p className="text-xs text-slate-400">High hit frequency with increased Wild and Scatter frequency.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/50 space-y-2">
              <span className="text-xs font-extrabold text-emerald-300">RTP_STANDARD</span>
              <div className="text-2xl font-black text-white">96.50% <span className="text-xs text-slate-500">RTP</span></div>
              <p className="text-xs text-slate-400">Default regulatory baseline compliant with MGA and UKGC.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/50 space-y-2">
              <span className="text-xs font-extrabold text-amber-300">RTP_LOW</span>
              <div className="text-2xl font-black text-white">94.10% <span className="text-xs text-slate-500">RTP</span></div>
              <p className="text-xs text-slate-400">Conservative profile for maximum hold margin.</p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: LIVE CASINO PROVIDERS */}
      {subTab === 'LIVE_CASINO' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INITIAL_LIVE_TABLES.map(table => (
            <div key={table.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-sm">{table.name}</span>
                <span className="px-2 py-0.5 bg-rose-950 text-rose-400 rounded-full text-[10px] font-bold">
                  {table.streamQuality}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Dealer: {table.dealerName} • Limits: {formatMoney(table.minBet)} - {formatMoney(table.maxBet)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 5: IMMUTABLE LEDGER */}
      {subTab === 'LEDGER_AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Debit</th>
                <th className="py-2.5 px-3">Credit</th>
                <th className="py-2.5 px-3">Balance After</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {platform.ledger.slice(0, 15).map(entry => (
                <tr key={entry.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-indigo-300">{entry.id}</td>
                  <td className="py-2 px-3 text-slate-300">{entry.operatorId}</td>
                  <td className="py-2 px-3 font-bold">{entry.type}</td>
                  <td className="py-2 px-3 text-rose-400">{entry.debit > 0 ? `-${formatMoney(entry.debit)}` : '—'}</td>
                  <td className="py-2 px-3 text-emerald-400">{entry.credit > 0 ? `+${formatMoney(entry.credit)}` : '—'}</td>
                  <td className="py-2 px-3 text-white font-bold">{formatMoney(entry.balanceAfter)}</td>
                  <td className="py-2 px-3 text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 6: HEALTH */}
      {subTab === 'HEALTH' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            Platform Infrastructure Health
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-950 rounded-xl flex justify-between">
              <span className="text-slate-300">API Latency</span>
              <span className="text-emerald-400 font-bold">18ms average</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl flex justify-between">
              <span className="text-slate-300">Database Consistency</span>
              <span className="text-emerald-400 font-bold">100% Verified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
