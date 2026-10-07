import React, { useState } from 'react';
import {
  Key,
  Gamepad2,
  Users,
  PlayCircle,
  Webhook,
  TrendingUp,
  ShieldAlert,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Clock,
  Coins,
  Lock,
} from 'lucide-react';
import { platform } from '../../services/platformStore';
import { Player, ResponsibleGamingLimits } from '../../types';

export const OperatorPortal: React.FC<{ onRefresh: () => void; onLaunchGame: (gameId: string) => void }> = ({
  onRefresh,
  onLaunchGame,
}) => {
  const [subTab, setSubTab] = useState<'DASHBOARD' | 'GAMES' | 'PLAYERS' | 'LAUNCH' | 'KEYS' | 'WEBHOOKS' | 'RISK'>('DASHBOARD');
  const activeOp = platform.getActiveOperator();

  // New API Key Modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // New Player Modal state
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({
    username: '',
    externalPlayerId: '',
    initialBalance: 500,
    dailyLossLimit: 500,
    dailyDepositLimit: 1000,
    sessionLimit: 120,
  });

  // Launch state
  const [launchPlayerId, setLaunchPlayerId] = useState(platform.players.find(p => p.operatorId === activeOp.id)?.id || '');
  const [launchGameId, setLaunchGameId] = useState('game_neext_fortune');
  const [generatedLaunchUrl, setGeneratedLaunchUrl] = useState<string | null>(null);

  // Handlers
  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    const cred = platform.generateApiKey(activeOp.id, keyName, ['wallet:read', 'wallet:write', 'games:launch']);
    setCreatedSecret(cred.rawSecretDisplay || null);
    setKeyName('');
    onRefresh();
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerForm.username) return;

    const extId = newPlayerForm.externalPlayerId || 'ext_' + Math.random().toString(36).substring(2, 9);
    const newPlayer: Player = {
      id: 'ply_' + Math.random().toString(36).substring(2, 10),
      operatorId: activeOp.id,
      externalPlayerId: extId,
      username: newPlayerForm.username,
      currency: activeOp.currency,
      balance: newPlayerForm.initialBalance,
      status: 'ACTIVE',
      rgLimits: {
        dailyLossLimit: newPlayerForm.dailyLossLimit || undefined,
        dailyDepositLimit: newPlayerForm.dailyDepositLimit || undefined,
        sessionTimeMinutes: newPlayerForm.sessionLimit || undefined,
      },
      createdAt: new Date().toISOString(),
      lastActiveAt: 'Just now',
      totalWagered: 0,
      totalWon: 0,
      sessionCount: 1,
    };

    platform.players.unshift(newPlayer);
    platform.ledger.unshift({
      id: 'ledg_' + Math.random().toString(36).substring(2, 9),
      operatorId: activeOp.id,
      playerId: newPlayer.id,
      idempotencyKey: 'idem_initial_credit_' + newPlayer.id,
      type: 'DEPOSIT',
      debit: 0,
      credit: newPlayerForm.initialBalance,
      balanceAfter: newPlayerForm.initialBalance,
      currency: activeOp.currency,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      metadata: { note: 'Initial test wallet credit via Operator Panel' },
    });

    platform.auditLogs.unshift({
      id: 'audit_' + Math.random().toString(36).substring(2, 9),
      operatorId: activeOp.id,
      actor: 'operator-admin',
      action: 'PLAYER_PROVISIONED',
      category: 'AUTH',
      details: `Registered external player ${newPlayer.username} (${newPlayer.externalPlayerId})`,
      timestamp: new Date().toISOString(),
      ip: '194.156.98.12',
    });

    setShowPlayerModal(false);
    onRefresh();
  };

  const handleGenerateLaunchSession = () => {
    const targetPlayer = platform.players.find(p => p.id === launchPlayerId) || platform.players[0];
    const sessionRes = platform.createGameSession(activeOp.id, targetPlayer.id, launchGameId, activeOp.currency);
    setGeneratedLaunchUrl(sessionRes.launchUrl);
    platform.activePlayerId = targetPlayer.id;
    onRefresh();
  };

  const handleResolveAlert = (alertId: string) => {
    const alert = platform.riskAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      onRefresh();
    }
  };

  const opPlayers = platform.players.filter(p => p.operatorId === activeOp.id);
  const opCredentials = platform.credentials.filter(c => c.operatorId === activeOp.id);
  const opConfigs = platform.configs.filter(c => c.operatorId === activeOp.id);
  const opRiskAlerts = platform.riskAlerts.filter(a => a.operatorId === activeOp.id);
  const opWebhooks = platform.webhooks.filter(w => w.operatorId === activeOp.id);

  return (
    <div className="space-y-6">
      {/* Operator Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 font-bold">
              {activeOp.code}
            </span>
            <h1 className="text-2xl font-black text-white">{activeOp.name}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated Tenant Environment • Jurisdiction: <strong className="text-slate-300">{activeOp.country}</strong> • Settlement: <strong className="text-amber-400">{activeOp.currency}</strong>
          </p>
        </div>

        {/* Quick Launch Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLaunchGame('game_neext_fortune')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Game Client</span>
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab('DASHBOARD')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Overview & GGR</span>
        </button>

        <button
          onClick={() => setSubTab('GAMES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'GAMES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Configured Games ({opConfigs.length})</span>
        </button>

        <button
          onClick={() => setSubTab('PLAYERS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'PLAYERS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Players & Limits ({opPlayers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('LAUNCH')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'LAUNCH' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          <span>Game Session Launcher</span>
        </button>

        <button
          onClick={() => setSubTab('KEYS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'KEYS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API & SDK Credentials</span>
        </button>

        <button
          onClick={() => setSubTab('WEBHOOKS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'WEBHOOKS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Webhooks & Events</span>
        </button>

        <button
          onClick={() => setSubTab('RISK')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'RISK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Risk Sentinel ({opRiskAlerts.filter(a => !a.resolved).length})</span>
        </button>
      </div>

      {/* SUBTAB 1: DASHBOARD & GGR */}
      {subTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Gross Gaming Revenue (GGR)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                €{activeOp.totalGgr.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>Hold Rate</span>
                <span className="font-bold text-slate-300">
                  {activeOp.totalTurnover > 0 ? ((activeOp.totalGgr / activeOp.totalTurnover) * 100).toFixed(2) : '3.65'}%
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Wagering Volume</div>
              <div className="text-2xl font-black text-indigo-300 mt-1">
                €{activeOp.totalTurnover.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>Total Rounds</span>
                <span className="font-bold text-slate-300">
                  {platform.gameRounds.filter(r => r.operatorId === activeOp.id).length.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Active Players</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {opPlayers.filter(p => p.status === 'ACTIVE').length} / {opPlayers.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>Suspended / RG Limits</span>
                <span className="font-bold text-rose-400">{opPlayers.filter(p => p.status !== 'ACTIVE').length}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Webhook Health</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">100%</div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>Events Delivered</span>
                <span className="font-bold text-slate-300">{opWebhooks.length} payloads</span>
              </div>
            </div>
          </div>

          {/* Recent Operator Game Rounds */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">Live Settled Game Rounds</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Round ID</th>
                    <th className="py-2.5 px-3">Game</th>
                    <th className="py-2.5 px-3">Player</th>
                    <th className="py-2.5 px-3">Bet</th>
                    <th className="py-2.5 px-3">Payout</th>
                    <th className="py-2.5 px-3">Multiplier</th>
                    <th className="py-2.5 px-3">Provable Hash</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {platform.gameRounds
                    .filter(r => r.operatorId === activeOp.id)
                    .slice(0, 8)
                    .map(round => (
                      <tr key={round.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-indigo-300">{round.id}</td>
                        <td className="py-2 px-3 text-slate-200 font-sans font-medium">{round.gameId}</td>
                        <td className="py-2 px-3 text-slate-400">{round.playerId}</td>
                        <td className="py-2 px-3 text-slate-300 font-bold">€{round.betAmount.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <span className={round.winAmount > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            €{round.winAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-amber-400">{round.payoutMultiplier}x</td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">{round.rngSeed}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{new Date(round.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  {platform.gameRounds.filter(r => r.operatorId === activeOp.id).length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                        No rounds played yet for this operator. Launch a game or run the simulator!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CONFIGURED GAMES */}
      {subTab === 'GAMES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platform.games.map(game => {
              const cfg = opConfigs.find(c => c.gameId === game.id);
              const isEnabled = cfg ? cfg.enabled : false;

              return (
                <div key={game.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm">{game.name}</span>
                    <button
                      onClick={() => {
                        if (cfg) {
                          cfg.enabled = !cfg.enabled;
                        } else {
                          platform.configs.push({
                            gameId: game.id,
                            operatorId: activeOp.id,
                            enabled: true,
                            selectedRtpProfileId: 'RTP_STANDARD',
                            minBet: game.minBet,
                            maxBet: game.maxBet,
                            allowedCurrencies: [activeOp.currency],
                            jackpotContributionPct: 1.0,
                          });
                        }
                        onRefresh();
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        isEnabled
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 line-clamp-2">{game.description}</div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Assigned RTP Profile:</label>
                      <select
                        value={cfg?.selectedRtpProfileId || 'RTP_STANDARD'}
                        onChange={e => {
                          if (cfg) {
                            cfg.selectedRtpProfileId = e.target.value;
                            onRefresh();
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200 outline-none"
                      >
                        {game.availableRtpProfiles.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-500">Min Bet:</span>
                        <div className="font-bold text-slate-300">€{cfg?.minBet || game.minBet}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Max Bet:</span>
                        <div className="font-bold text-slate-300">€{cfg?.maxBet || game.maxBet}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PLAYERS & RESPONSIBLE GAMING */}
      {subTab === 'PLAYERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Registered Operator Players & RG Controls</h3>
            <button
              onClick={() => setShowPlayerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create Player</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Player Handle</th>
                  <th className="py-3 px-4">External ID</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Responsible Gaming Limits</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {opPlayers.map(player => (
                  <tr key={player.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{player.username}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Sessions: {player.sessionCount}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-300">{player.externalPlayerId}</td>
                    <td className="py-3 px-4 font-bold text-amber-400">
                      €{player.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {player.rgLimits.dailyLossLimit ? `Loss: €${player.rgLimits.dailyLossLimit} / day` : 'No Loss Limit'}
                      {player.rgLimits.sessionTimeMinutes ? ` • ${player.rgLimits.sessionTimeMinutes}m session` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          player.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {player.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          platform.activePlayerId = player.id;
                          onRefresh();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                          platform.activePlayerId === player.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {platform.activePlayerId === player.id ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: GAME SESSION LAUNCHER */}
      {subTab === 'LAUNCH' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-indigo-400" />
              B2B Game Launch URL Generator (/api/v1/games/launch)
            </h3>
            <p className="text-xs text-slate-400">
              Generates a signed, single-use, short-lived game session token conforming to Phase 06 specifications.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Player</label>
                <select
                  value={launchPlayerId}
                  onChange={e => setLaunchPlayerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                >
                  {opPlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.username} ({p.externalPlayerId}) - Balance: €{p.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Game Selection</label>
                <select
                  value={launchGameId}
                  onChange={e => setLaunchGameId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                >
                  {platform.games.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.type})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateLaunchSession}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30"
              >
                Generate Signed Launch Session Token
              </button>

              {generatedLaunchUrl && (
                <div className="mt-4 p-3 bg-slate-950 border border-indigo-900/60 rounded-xl space-y-2">
                  <div className="text-[11px] text-slate-400 font-semibold">Generated Secure Launch URL:</div>
                  <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-indigo-300 break-all select-all">
                    {generatedLaunchUrl}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Signed Token Valid for 120 minutes
                    </span>
                    <button
                      onClick={() => onLaunchGame(launchGameId)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black text-xs transition"
                    >
                      Open in Game Client
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: API KEYS & CREDENTIALS */}
      {subTab === 'KEYS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">B2B API & SDK Client Credentials</h3>
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New API Key</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opCredentials.map(cred => (
              <div key={cred.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{cred.name}</span>
                  <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-bold">
                    {cred.status}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <div className="text-slate-400 text-[10px]">Client ID:</div>
                  <div className="text-indigo-300 bg-slate-950 p-2 rounded border border-slate-800 break-all">
                    {cred.clientId}
                  </div>

                  <div className="text-slate-400 text-[10px] pt-1">Client Secret (Hashed):</div>
                  <div className="text-slate-500 bg-slate-950 p-2 rounded border border-slate-800">
                    {cred.clientSecretHash}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  <span>Scopes: {cred.scopes.join(', ')}</span>
                  <span>Used: {cred.lastUsedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: WEBHOOKS */}
      {subTab === 'WEBHOOKS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-base">Webhook Endpoint & Secret Key</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block mb-1">Target Endpoint URL:</span>
                <input
                  type="text"
                  value={activeOp.webhookUrl || ''}
                  onChange={e => {
                    activeOp.webhookUrl = e.target.value;
                    onRefresh();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-300 outline-none"
                />
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Signing Secret (HMAC SHA-256):</span>
                <input
                  type="text"
                  readOnly
                  value={activeOp.webhookSecret || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 outline-none select-all"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  platform.dispatchWebhook(activeOp.id, 'WALLET_TRANSACTION', {
                    test: true,
                    operator: activeOp.code,
                    timestamp: new Date().toISOString(),
                    message: 'NeextPlay Webhook Connectivity Ping Successful',
                  });
                  onRefresh();
                }}
                className="px-3.5 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold hover:bg-indigo-600/30"
              >
                Send Test Webhook Ping
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-white text-sm">Dispatched Webhook Event Logs</h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {opWebhooks.map(wh => (
                <div key={wh.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-indigo-400">{wh.eventType}</span>
                    <span className="text-slate-500">{new Date(wh.deliveredAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] truncate">Signature: {wh.signature}</div>
                  <div className="text-slate-300 text-[10px] bg-slate-900 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(wh.payload)}
                  </div>
                </div>
              ))}
              {opWebhooks.length === 0 && (
                <div className="text-slate-500 text-xs py-4 text-center">No webhook events dispatched yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 7: RISK SENTINEL */}
      {subTab === 'RISK' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Realtime Risk & Anti-Fraud Sentinel</h3>
            <span className="text-xs text-slate-400">Evaluates every bet and payout against compliance triggers</span>
          </div>

          <div className="space-y-3">
            {opRiskAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  alert.resolved
                    ? 'bg-slate-900/50 border-slate-800 opacity-60'
                    : alert.severity === 'CRITICAL'
                    ? 'bg-rose-950/40 border-rose-500/50'
                    : 'bg-amber-950/40 border-amber-500/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-slate-950'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="font-bold text-white text-xs">{alert.ruleName}</span>
                    <span className="text-[10px] text-slate-400">• {new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-slate-300">{alert.details}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Player: {alert.playerId}</div>
                </div>

                {!alert.resolved && (
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Mark Reviewed
                  </button>
                )}
              </div>
            ))}
            {opRiskAlerts.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No active risk or fraud alerts. All betting traffic within standard variance thresholds.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Generate B2B Client Credentials</h3>

            {!createdSecret ? (
              <form onSubmit={handleGenerateKey} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Key Description / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. European Server Node 2"
                    value={keyName}
                    onChange={e => setKeyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                    Create API Key
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200">
                  <strong className="block text-amber-400 font-bold mb-1">Save your Secret Key now!</strong>
                  This is the only time this raw secret will be visible. It cannot be recovered later.
                </div>

                <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-white break-all select-all border border-slate-800">
                  {createdSecret}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowKeyModal(false);
                      setCreatedSecret(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
                  >
                    I have safely copied this secret
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Player Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create External Player & RG Limits</h3>
            <form onSubmit={handleCreatePlayer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Username / Nickname</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. valkyrie_player"
                  value={newPlayerForm.username}
                  onChange={e => setNewPlayerForm({ ...newPlayerForm, username: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">External Operator Player ID</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  value={newPlayerForm.externalPlayerId}
                  onChange={e => setNewPlayerForm({ ...newPlayerForm, externalPlayerId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Initial Balance (€)</label>
                  <input
                    type="number"
                    min="1"
                    value={newPlayerForm.initialBalance}
                    onChange={e => setNewPlayerForm({ ...newPlayerForm, initialBalance: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Daily Loss Limit (€)</label>
                  <input
                    type="number"
                    min="10"
                    value={newPlayerForm.dailyLossLimit}
                    onChange={e => setNewPlayerForm({ ...newPlayerForm, dailyLossLimit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlayerModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
