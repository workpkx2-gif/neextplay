/**
 * NeextPlay Master API & Category Game Launcher Studio
 * Features:
 * 1. Master API connection & category browser (CRASH, SLOT, LIVE_CASINO, TABLE)
 * 2. Games under each category display
 * 3. Domain Request Header passing:
 *    - Authorization: Bearer <API_TOKEN>
 *    - x-operator-id, x-player-id, x-player-name, x-currency, x-initial-balance, x-domain
 * 4. Authoritative User Balance System:
 *    - Deducts (minuses) balance on bet
 *    - Credits (pluses) balance on win
 *    - Live API hook event stream
 * 5. In-game launch frame with live balance widget
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Play,
  Key,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  Globe2,
  DollarSign,
  Gamepad2,
  Sliders,
  Terminal,
  Activity,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { masterApi, GameCategory, GameLaunchResult, BalanceEventLog } from '../../services/masterApiService';
import { platform } from '../../services/platformStore';
import { useI18n } from '../../services/i18nContext';
import { GameDefinition } from '../../types';
import { AviatorGameClient } from '../game/AviatorGameClient';
import { SlotGameClient } from '../game/SlotGameClient';
import { CrashGameClient } from '../game/CrashGameClient';
import { LiveCasinoClient } from '../game/LiveCasinoClient';

interface MasterApiLauncherStudioProps {
  onRefresh: () => void;
}

export const MasterApiLauncherStudio: React.FC<MasterApiLauncherStudioProps> = ({ onRefresh }) => {
  const { formatMoney, currency: platformCurrency } = useI18n();

  // Active operator context
  const activeOp = platform.getActiveOperator();
  const activePlayer = platform.getActivePlayer();
  const activeCred = platform.credentials.find(c => c.operatorId === activeOp.id) || platform.credentials[0];

  const detectedHost = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';

  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>('CRASH');
  const [selectedGameId, setSelectedGameId] = useState<string>('game_aviator_pro');
  const [playerId, setPlayerId] = useState<string>(activePlayer?.id || 'ply_neexthub_vip1');
  const [playerName, setPlayerName] = useState<string>(activePlayer?.username || 'NeextHub High Roller');
  const [currency, setCurrency] = useState<string>(activePlayer?.currency || platformCurrency || 'USD');
  const [initialBalance, setInitialBalance] = useState<number>(activePlayer?.balance || 1000.0);
  const [domain, setDomain] = useState<string>(detectedHost);
  const [apiKey, setApiKey] = useState<string>(activeCred?.clientId || 'np_live_key_neexthub_992147');

  // Studio launch state
  const [launchResult, setLaunchResult] = useState<GameLaunchResult | null>(null);
  const [isGameLaunched, setIsGameLaunched] = useState<boolean>(false);
  const [copiedHeader, setCopiedHeader] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'HEADERS' | 'CURL' | 'PAYLOAD'>('HEADERS');

  // Real-time balance logs
  const [balanceLogs, setBalanceLogs] = useState<BalanceEventLog[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(activePlayer.balance);

  // Top-up modal state
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(100.0);

  // Subscribe to live balance changes
  useEffect(() => {
    setCurrentBalance(activePlayer.balance);
    const unsubscribe = masterApi.subscribeBalance((newBal, log) => {
      setCurrentBalance(newBal);
      if (log) {
        setBalanceLogs(prev => [log, ...prev.slice(0, 24)]);
      }
      onRefresh();
    });
    return unsubscribe;
  }, [activePlayer.id, onRefresh]);

  // Categories list
  const categories = masterApi.getCategories();
  const gamesUnderCategory = masterApi.getGamesByCategory(
    selectedCategory as 'ALL' | 'CRASH' | 'SLOT' | 'LIVE_CASINO' | 'TABLE'
  );
  const selectedGame = platform.games.find(g => g.id === selectedGameId) || gamesUnderCategory[0] || platform.games[0];

  // Launch Game Handler
  const handleLaunchGame = () => {
    const res = masterApi.launchGameWithDomainHeaders({
      operatorId: activeOp.id,
      apiKey,
      playerId,
      playerName,
      currency,
      initialBalance,
      gameId: selectedGame.id,
      domain,
    });

    setLaunchResult(res);
    setIsGameLaunched(true);
    setCurrentBalance(res.data?.player.balance || initialBalance);
    onRefresh();
  };

  // Deposit/Top-up handler
  const handleExecuteTopUp = () => {
    const next = masterApi.depositBalance(topUpAmount, playerId);
    setCurrentBalance(next);
    setShowTopUpModal(false);
    onRefresh();
  };

  const copyHeadersToClipboard = () => {
    const headersObj = {
      Host: 'api.neextplay.com',
      Authorization: `Bearer ${apiKey}`,
      'x-operator-id': activeOp.id,
      'x-player-id': playerId,
      'x-player-name': playerName,
      'x-currency': currency,
      'x-initial-balance': initialBalance.toFixed(2),
      'x-domain': domain,
      'Content-Type': 'application/json',
    };
    navigator.clipboard.writeText(JSON.stringify(headersObj, null, 2));
    setCopiedHeader(true);
    setTimeout(() => setCopiedHeader(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. MASTER API CONNECTION HERO */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0d121c] to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                MASTER API GATEWAY ACTIVE (PORT 3000)
              </span>
              <span className="text-xs text-slate-500 font-mono">v1.4.0</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              B2B Game Category Browser & Header-Passed Launch Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Query games by category, pass authenticated domain headers, and verify real-time user balance deductions on every bet and credit on every win.
            </p>
          </div>

          {/* Quick Balance Display & Top Up */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">LIVE USER BALANCE</span>
              <span className="text-xl font-black font-mono text-amber-400">
                {formatMoney(currentBalance)}
              </span>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Top Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY SELECTOR TABS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            STEP 1: SELECT GAME CATEGORY
          </label>
          <span className="text-xs text-slate-400">
            {categories.find(c => c.id === selectedCategory)?.description}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                const gList = masterApi.getGamesByCategory(
                  cat.id as 'ALL' | 'CRASH' | 'SLOT' | 'LIVE_CASINO' | 'TABLE'
                );
                if (gList[0]) setSelectedGameId(gList[0].id);
              }}
              className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-2 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                  {cat.gameCount} Titles
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black text-white">{cat.name}</h4>
                <p className="text-[10px] text-slate-400 font-semibold">{cat.badge}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. GAMES UNDER CATEGORY */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-indigo-400" />
          STEP 2: SELECT GAME UNDER "{categories.find(c => c.id === selectedCategory)?.name.toUpperCase()}"
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gamesUnderCategory.map(game => (
            <div
              key={game.id}
              onClick={() => setSelectedGameId(game.id)}
              className={`rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                selectedGameId === game.id
                  ? 'bg-gradient-to-b from-slate-900 to-[#121824] border-red-500/80 shadow-xl shadow-red-500/10 ring-2 ring-red-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                    {game.type}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    RTP {game.defaultRtp.toFixed(2)}%
                  </span>
                </div>
                <h4 className="text-base font-black text-white flex items-center gap-1.5">
                  {game.name}
                  {game.id === 'game_aviator_pro' && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                      HOT
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {game.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Limit: <strong className="text-white">${game.minBet} - ${game.maxBet}</strong>
                </span>
                <span className="text-amber-400 font-bold font-mono">
                  Max {game.maxMultiplier}x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CONFIGURE DOMAIN HEADERS & PLAYER BALANCE */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <label className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            STEP 3: PASS DOMAIN HEADERS & PLAYER BALANCE PAYLOAD
          </label>
          <span className="text-xs text-emerald-400 font-mono font-bold">
            Target Game: {selectedGame.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 font-bold block mb-1">
              x-player-id (External Player)
            </label>
            <input
              type="text"
              value={playerId}
              onChange={e => setPlayerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-bold block mb-1">
              x-player-name (Display Name)
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-sans text-xs outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-bold block mb-1">
              x-currency
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 font-mono text-xs outline-none focus:border-amber-500"
            >
              <option value="USD">USD ($)</option>
              <option value="BDT">BDT (৳)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-bold block mb-1">
              x-initial-balance (Starting Funds)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                step="10"
                value={initialBalance}
                onChange={e => setInitialBalance(Number(e.target.value))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-xs outline-none focus:border-amber-500"
              />
              <button
                onClick={() => setInitialBalance(500)}
                className="px-2 py-2 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg hover:bg-slate-800"
              >
                500
              </button>
              <button
                onClick={() => setInitialBalance(1000)}
                className="px-2 py-2 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg hover:bg-slate-800"
              >
                1k
              </button>
            </div>
          </div>
        </div>

        {/* DOMAIN & API KEY INPUTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="text-[11px] text-slate-400 font-bold block mb-1">
              x-domain (External Operator Host)
            </label>
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono text-xs outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-bold block mb-1">
              Authorization (Bearer Token)
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-300 font-mono text-xs outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* 5. GENERATED DOMAIN REQUEST HEADERS INSPECTOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Generated Request Headers Passed to Domain
            </span>
            <button
              onClick={copyHeadersToClipboard}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 transition"
            >
              {copiedHeader ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHeader ? 'Copied' : 'Copy Headers'}</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-indigo-200 overflow-x-auto leading-relaxed shadow-inner">
{`POST /api/v1/games/launch HTTP/1.1
Host: api.neextplay.com
Authorization: Bearer ${apiKey}
x-operator-id: ${activeOp.id}
x-player-id: ${playerId}
x-player-name: ${playerName}
x-currency: ${currency}
x-initial-balance: ${initialBalance.toFixed(2)}
x-domain: ${domain}
Content-Type: application/json

{
  "gameId": "${selectedGame.id}",
  "returnUrl": "https://${domain}/lobby"
}`}
          </div>
        </div>

        {/* LAUNCH BUTTON */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Balance changes are calculated and minused/credited authoritatively on every round.</span>
          </div>

          <button
            onClick={handleLaunchGame}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm rounded-2xl uppercase tracking-wider shadow-xl shadow-red-600/35 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>Launch {selectedGame.name} with Headers</span>
          </button>
        </div>
      </div>

      {/* 6. LIVE LAUNCH FRAME SCREEN (WHEN GAME IS LAUNCHED) */}
      {isGameLaunched && (
        <div className="space-y-4 pt-4 border-t-2 border-red-500/30 animate-in fade-in">
          
          {/* Header Bar of Launch Frame */}
          <div className="bg-[#0f141e] border-2 border-red-500/50 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black">
                🚀
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">{selectedGame.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                    DOMAIN HEADERS ATTACHED
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Player: <strong className="text-slate-200">{playerName}</strong> ({playerId}) • Domain: <strong className="text-slate-200">{domain}</strong>
                </p>
              </div>
            </div>

            {/* Live Balance Widget */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl flex flex-col text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase">LIVE PLAYER BALANCE</span>
                <span className="text-xl font-black font-mono text-amber-400">
                  {formatMoney(currentBalance)}
                </span>
              </div>

              <button
                onClick={() => setShowTopUpModal(true)}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>

              <button
                onClick={() => setIsGameLaunched(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                title="Exit Game Frame"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RENDER THE ACTIVE GAME CLIENT */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-2xl">
            {selectedGame.id === 'game_aviator_pro' ? (
              <AviatorGameClient onRefresh={onRefresh} />
            ) : selectedGame.type === 'SLOT' ? (
              <SlotGameClient onRefresh={onRefresh} />
            ) : selectedGame.id === 'game_neext_velocity' ? (
              <CrashGameClient onRefresh={onRefresh} />
            ) : (
              <LiveCasinoClient onRefresh={onRefresh} />
            )}
          </div>

          {/* REAL-TIME WALLET API LOG STREAM */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold text-white uppercase tracking-wider">
                  Real-Time Seamless Wallet Balance Deductions & Additions Log
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Live Webhook Stream</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs pr-1">
              {balanceLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  Place a bet above to witness instant balance deduction (-Bet Amount) and cashout credit (+Win Amount).
                </div>
              ) : (
                balanceLogs.map(log => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      log.type === 'BET_MINUS'
                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                        : log.type === 'WIN_PLUS'
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-slate-900 border border-slate-800">
                        {log.type === 'BET_MINUS' ? '⚡ BET MINUS' : log.type === 'WIN_PLUS' ? '🏆 WIN CREDIT' : '💰 TOP-UP'}
                      </span>
                      <span className="font-bold">{log.gameName}</span>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-bold">
                        {log.type === 'BET_MINUS' ? `-${formatMoney(log.amount)}` : `+${formatMoney(log.amount)}`}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        Bal: <strong className="text-white">{formatMoney(log.newBalance)}</strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOP-UP / DEPOSIT MODAL */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141e] border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Deposit Player Funds</h3>
              <button onClick={() => setShowTopUpModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Inject funds into player <strong className="text-white">{playerName}</strong>'s balance to continue testing game rounds.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-300 font-bold">Top-Up Amount ({currency})</label>
              <input
                type="number"
                min="10"
                step="50"
                value={topUpAmount}
                onChange={e => setTopUpAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 font-mono font-black text-base outline-none"
              />

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[50, 100, 250, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setTopUpAmount(amt)}
                    className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 border border-slate-800"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowTopUpModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTopUp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
