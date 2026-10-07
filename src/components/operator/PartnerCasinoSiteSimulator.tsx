/**
 * Partner Casino Site Simulator (Client Site)
 * Fully functional external casino frontend that connects to NeextPlay Master API.
 * Features:
 * 1. Connect different company API credentials (NexusBet, Apex, Solaria, or Custom)
 * 2. User registration and player database management
 * 3. Full Deposit & Withdrawal system (Bkash, Cards, Crypto, Bank)
 * 4. Categorized game lobby (Crash, Slots, Live Casino, Table)
 * 5. Game launch with domain headers passed
 * 6. Live user balance minus on bet and plus on win
 * 7. Real-time double-entry ledger & transaction history
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Key,
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Gamepad2,
  Layers,
  Search,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  PlusCircle,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  DollarSign,
  AlertCircle,
  History,
  Activity,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { platform } from '../../services/platformStore';
import { masterApi, BalanceEventLog } from '../../services/masterApiService';
import { useI18n } from '../../services/i18nContext';
import { Player, GameDefinition, Operator } from '../../types';
import { soundFx } from '../../utils/audio';

// Games
import { AviatorGameClient } from '../game/AviatorGameClient';
import { SlotGameClient } from '../game/SlotGameClient';
import { CrashGameClient } from '../game/CrashGameClient';
import { LiveCasinoClient } from '../game/LiveCasinoClient';

import aviatorBanner from '../../assets/images/aviator_banner_1791307837428.jpg';
import planeIcon from '../../assets/images/aviator_red_plane_1791307806618.jpg';

interface PartnerCasinoSiteSimulatorProps {
  onRefresh: () => void;
}

export const PartnerCasinoSiteSimulator: React.FC<PartnerCasinoSiteSimulatorProps> = ({ onRefresh }) => {
  const { formatMoney } = useI18n();

  // 1. COMPANY API CREDENTIALS STATE
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('op_nexus');
  const [customCredModalOpen, setCustomCredModalOpen] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('np_client_live_nexus_78912');
  const [customDomain, setCustomDomain] = useState<string>('nexusbet.io');
  const [apiLatency, setApiLatency] = useState<number>(14);

  // Active Operator
  const currentOperator = platform.operators.find(o => o.id === selectedOperatorId) || platform.operators[0];

  // 2. ACTIVE CASINO PLAYER STATE
  const operatorPlayers = platform.players.filter(p => p.operatorId === currentOperator.id);
  const [activePlayerId, setActivePlayerId] = useState<string>(operatorPlayers[0]?.id || platform.players[0].id);
  const activePlayer = platform.players.find(p => p.id === activePlayerId) || platform.getActivePlayer();

  // Live balance state
  const [balance, setBalance] = useState<number>(activePlayer.balance);
  const [balanceEvents, setBalanceEvents] = useState<BalanceEventLog[]>([]);

  // 3. GAME LOBBY & LAUNCH STATE
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'CRASH' | 'SLOT' | 'LIVE_CASINO' | 'TABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [launchedGame, setLaunchedGame] = useState<GameDefinition | null>(null);

  // 4. MODALS (User Create, Deposit, Withdraw, Ledger)
  const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);

  // New Player Form
  const [newPlayerForm, setNewPlayerForm] = useState({
    username: '',
    externalPlayerId: '',
    currency: currentOperator.currency || 'USD',
    initialBalance: 500.0,
  });

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState<number>(100.0);
  const [depositMethod, setDepositMethod] = useState<'BKASH' | 'CARDS' | 'CRYPTO' | 'BANK'>('BKASH');
  const [depositTxId, setDepositTxId] = useState<string>('');

  // Withdraw Form
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50.0);
  const [withdrawMethod, setWithdrawMethod] = useState<'BKASH' | 'CARDS' | 'CRYPTO' | 'BANK'>('BKASH');
  const [withdrawAccount, setWithdrawAccount] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Synchronize active balance
  useEffect(() => {
    setBalance(activePlayer.balance);
    platform.activePlayerId = activePlayer.id;
    platform.selectedOperatorId = currentOperator.id;

    const unsubscribe = masterApi.subscribeBalance((newBal, log) => {
      setBalance(newBal);
      if (log) {
        setBalanceEvents(prev => [log, ...prev.slice(0, 30)]);
      }
      onRefresh();
    });

    return unsubscribe;
  }, [activePlayer.id, currentOperator.id, onRefresh]);

  // Handle Switch Operator
  const handleSwitchOperator = (opId: string) => {
    soundFx.playClick();
    setSelectedOperatorId(opId);
    const op = platform.operators.find(o => o.id === opId);
    if (op) {
      const opPlys = platform.players.filter(p => p.operatorId === op.id);
      if (opPlys[0]) {
        setActivePlayerId(opPlys[0].id);
        setBalance(opPlys[0].balance);
      }
      setCustomDomain(`${op.code.toLowerCase()}.io`);
      setCustomApiKey(`np_client_live_${op.code.toLowerCase()}_${Date.now().toString(36)}`);
    }
    // Simulate fast API ping
    setApiLatency(Math.floor(10 + Math.random() * 8));
    setLaunchedGame(null);
    onRefresh();
  };

  // Handle Create New Casino Player
  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerForm.username) return;

    soundFx.playClick();
    const pId = 'ply_' + Math.random().toString(36).substring(2, 9);
    const newPlayer: Player = {
      id: pId,
      operatorId: currentOperator.id,
      externalPlayerId: newPlayerForm.externalPlayerId || `${currentOperator.code.toLowerCase()}_user_${Date.now().toString(36).substring(3, 7)}`,
      username: newPlayerForm.username,
      currency: newPlayerForm.currency,
      balance: Number(newPlayerForm.initialBalance),
      status: 'ACTIVE',
      rgLimits: { dailyDepositLimit: 10000, dailyLossLimit: 5000 },
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalWagered: 0,
      totalWon: 0,
      sessionCount: 1,
    };

    platform.players.unshift(newPlayer);
    platform.activePlayerId = newPlayer.id;
    setActivePlayerId(newPlayer.id);
    setBalance(newPlayer.balance);

    // Initial deposit transaction
    platform.executeWalletTransaction({
      operatorId: currentOperator.id,
      playerId: newPlayer.id,
      type: 'DEPOSIT',
      amount: newPlayer.balance,
      currency: newPlayer.currency,
      idempotencyKey: `idem_welcome_${Date.now()}`,
      metadata: { channel: 'INITIAL_WELCOME_FUNDS' },
    });

    setShowCreateUserModal(false);
    setNewPlayerForm({
      username: '',
      externalPlayerId: '',
      currency: currentOperator.currency || 'USD',
      initialBalance: 500.0,
    });
    onRefresh();
  };

  // Handle Deposit (Cash In)
  const handleExecuteDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    soundFx.playClick();
    const newBal = masterApi.depositBalance(depositAmount, activePlayer.id);
    setBalance(newBal);
    confetti({ particleCount: 35, spread: 60 });
    setShowDepositModal(false);
    onRefresh();
  };

  // Handle Withdrawal (Cash Out)
  const handleExecuteWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);

    if (withdrawAmount <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount.');
      return;
    }

    if (withdrawAmount > balance) {
      setWithdrawError(`Insufficient funds. Your current balance is ${formatMoney(balance)}.`);
      return;
    }

    soundFx.playClick();
    const res = masterApi.withdrawBalance(withdrawAmount, activePlayer.id, {
      method: withdrawMethod,
      account: withdrawAccount || 'Direct Mobile/Bank Payout',
    });

    if (!res.success) {
      setWithdrawError(res.error || 'Withdrawal failed. Please check balance.');
      return;
    }

    setBalance(res.newBalance);
    setShowWithdrawModal(false);
    setWithdrawAccount('');
    onRefresh();
  };

  // Launch Game with Domain Headers
  const handleLaunchGame = (game: GameDefinition) => {
    soundFx.playClick();

    // Trigger Master API Launch with Domain Headers
    masterApi.launchGameWithDomainHeaders({
      operatorId: currentOperator.id,
      apiKey: customApiKey,
      playerId: activePlayer.id,
      playerName: activePlayer.username,
      currency: activePlayer.currency,
      initialBalance: activePlayer.balance,
      gameId: game.id,
      domain: customDomain,
    });

    setLaunchedGame(game);
    window.scrollTo({ top: 120, behavior: 'smooth' });
    onRefresh();
  };

  // Filter games
  const filteredGames = platform.games.filter(g => {
    const matchesCategory = activeCategory === 'ALL' || g.type === activeCategory;
    const matchesSearch =
      !searchQuery ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Recent transactions for active player
  const playerTransactions = platform.ledger.filter(l => l.playerId === activePlayer.id);

  return (
    <div className="space-y-6 font-sans select-none animate-in fade-in">
      
      {/* 1. TOP B2B CONNECTION HUD (SWITCH OPERATOR & API CREDENTIALS) */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Operator Switcher */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-2 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  OPERATOR CLIENT SITE SIMULATOR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  CONNECTED (200 OK • {apiLatency}ms)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{currentOperator.name}</span>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  ({currentOperator.code})
                </span>
              </h2>
            </div>
          </div>

          {/* Quick Switch Company Credentials Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">Switch Operator:</span>
            <select
              value={selectedOperatorId}
              onChange={e => handleSwitchOperator(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 outline-none cursor-pointer hover:border-amber-500/50"
            >
              {platform.operators.map(op => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.currency})
                </option>
              ))}
            </select>

            <button
              onClick={() => setCustomCredModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
              title="Inspect or edit API Key & Domain"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">API Config</span>
            </button>
          </div>
        </div>

        {/* Active Domain & Auth Header Pill */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span>
              HOST DOMAIN: <strong className="text-white">{customDomain}</strong>
            </span>
            <span>
              API TOKEN: <strong className="text-indigo-400">{customApiKey.substring(0, 22)}...</strong>
            </span>
            <span>
              JURISDICTION: <strong className="text-slate-200">{currentOperator.country}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Double-Entry Wallet Active
            </span>
          </div>
        </div>
      </div>

      {/* 2. OPERATOR CASINO SITE NAVBAR */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0e141f] to-slate-950 border-2 border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md">
        
        {/* Casino Brand & Lobby Navigation */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 p-1 flex items-center justify-center shadow-lg shadow-red-600/30">
            <img src={planeIcon} alt="Casino" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-xl font-black tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
                {currentOperator.code} CASINO
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold block">
              Powered by NeextPlay B2B Provider Engine
            </span>
          </div>
        </div>

        {/* Player Profile & Real-Time Balance Bank Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Active Player Card */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:px-3 sm:py-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-black text-sm">
              👤
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-white truncate max-w-[120px]">
                  {activePlayer.username}
                </span>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold ml-1 underline cursor-pointer"
                  title="Switch or Register Player"
                >
                  Switch
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                ID: {activePlayer.id.substring(0, 10)}
              </span>
            </div>
          </div>

          {/* Real-Time Player Balance Display */}
          <div className="px-3.5 py-2 bg-slate-950 border border-amber-500/40 rounded-2xl flex flex-col text-right shadow-inner">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              CASINO BALANCE
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-400 leading-tight">
              {formatMoney(balance)}
            </span>
          </div>

          {/* Deposit Button (Cash In) */}
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition transform active:scale-95 flex items-center gap-1.5"
          >
            <ArrowDownCircle className="w-4 h-4 text-slate-950" />
            <span>Deposit</span>
          </button>

          {/* Withdraw Button (Cash Out) */}
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 transition transform active:scale-95 flex items-center gap-1.5"
          >
            <ArrowUpCircle className="w-4 h-4 text-white" />
            <span>Withdraw</span>
          </button>

          {/* Transactions Ledger */}
          <button
            onClick={() => setShowLedgerModal(true)}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
            title="View Player Transactions Ledger"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. IN-GAME LAUNCH FRAME (WHEN A GAME IS LAUNCHED) */}
      {launchedGame ? (
        <div className="space-y-4 animate-in zoom-in-95 duration-200">
          
          {/* In-Game Header HUD */}
          <div className="bg-[#0f141f] border-2 border-red-500/50 rounded-3xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-red-600/30">
                {launchedGame.type === 'CRASH' ? '🚀' : launchedGame.type === 'SLOT' ? '🎰' : '🎲'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">{launchedGame.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[10px] font-bold border border-red-500/30">
                    LIVE GAME SESSION
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Domain: <strong className="text-slate-200">{customDomain}</strong> • Player: <strong className="text-slate-200">{activePlayer.username}</strong>
                </p>
              </div>
            </div>

            {/* Quick Balance & Exit */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl flex flex-col text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase">LIVE BALANCE</span>
                <span className="text-xl font-black font-mono text-amber-400">
                  {formatMoney(balance)}
                </span>
              </div>

              <button
                onClick={() => setShowDepositModal(true)}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Funds</span>
              </button>

              <button
                onClick={() => setLaunchedGame(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit to Lobby</span>
              </button>
            </div>
          </div>

          {/* RENDER THE GAME CLIENT */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-2xl">
            {launchedGame.id === 'game_aviator_pro' ? (
              <AviatorGameClient onRefresh={onRefresh} />
            ) : launchedGame.type === 'SLOT' ? (
              <SlotGameClient onRefresh={onRefresh} />
            ) : launchedGame.id === 'game_neext_velocity' ? (
              <CrashGameClient onRefresh={onRefresh} />
            ) : (
              <LiveCasinoClient onRefresh={onRefresh} />
            )}
          </div>

          {/* LIVE BALANCE DEDUCTIONS AUDIT STREAM */}
          <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                Live Wallet Ledger Hooks: Player Balance Minused on Bet & Credited on Win
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Auto-Synced with Ledger</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-xs pr-1">
              {balanceEvents.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">
                  Place a bet in the game above. The balance will immediately subtract your wager and credit any payouts!
                </div>
              ) : (
                balanceEvents.map(evt => (
                  <div
                    key={evt.id}
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      evt.type === 'BET_MINUS'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        : evt.type === 'WIN_PLUS'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{evt.timestamp}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-slate-900 border border-slate-800">
                        {evt.type === 'BET_MINUS' ? '⚡ BET MINUS' : evt.type === 'WIN_PLUS' ? '🏆 WIN CREDIT' : '💰 BANKING'}
                      </span>
                      <span className="font-bold">{evt.gameName}</span>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-bold">
                        {evt.type === 'BET_MINUS' ? `-${formatMoney(evt.amount)}` : `+${formatMoney(evt.amount)}`}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        Post-Bal: <strong className="text-white">{formatMoney(evt.newBalance)}</strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 4. MAIN CASINO LOBBY SECTION (WHEN NO GAME IS ACTIVE) */
        <div className="space-y-6">
          
          {/* HERO BANNER: AVIATOR HIGHLIGHT */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-r from-red-950 via-slate-950 to-indigo-950 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl z-10">
              <span className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/40 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                <span>✈️</span> FEATURED CRASH GAME
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Aviator NextGen
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Experience the world's most popular crash game with dual simultaneous betting panels, certified 97.0% RTP, provably fair cryptographic SHA-512 curve, and real-time multiplayer cashouts.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const av = platform.games.find(g => g.id === 'game_aviator_pro');
                    if (av) handleLaunchGame(av);
                  }}
                  className="px-7 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-red-600/35 transition transform active:scale-95 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Play Aviator Now</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Limits: $0.50 - $500.00</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">Max Win: 1,000x</span>
                </div>
              </div>
            </div>

            <div className="w-48 sm:w-64 flex-shrink-0 z-10 group">
              <img
                src={planeIcon}
                alt="Aviator 3D Plane"
                className="w-full h-auto drop-shadow-[0_15px_35px_rgba(239,68,68,0.5)] transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* CATEGORIES BAR & SEARCH */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4">
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'ALL', label: 'All Titles', icon: '🔥' },
                { id: 'CRASH', label: 'Crash & Aviator', icon: '✈️' },
                { id: 'SLOT', label: 'Video Slots', icon: '🎰' },
                { id: 'LIVE_CASINO', label: 'Live Tables', icon: '🎙️' },
                { id: 'TABLE', label: 'RNG Tables', icon: '♠️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    activeCategory === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* GAMES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map(game => (
              <div
                key={game.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 rounded-3xl overflow-hidden shadow-2xl transition group flex flex-col justify-between"
              >
                {/* Thumbnail / Visual */}
                <div className="relative h-44 overflow-hidden bg-slate-950">
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                  
                  {/* Category Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/40 rounded-full text-[10px] font-black uppercase">
                      {game.type}
                    </span>
                  </div>

                  {/* Certified RTP */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold">
                      RTP {game.defaultRtp.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition flex items-center gap-2">
                      {game.name}
                      {game.id === 'game_aviator_pro' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                          TOP
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  {/* Limits and Play Button */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Table Limits</span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        ${game.minBet} - ${game.maxBet}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLaunchGame(game)}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition transform active:scale-95 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Play Now</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / SWITCH PLAYER */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141e] border border-slate-700 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Casino Player Management</h3>
                  <p className="text-xs text-slate-400">Register new players on {currentOperator.name} database</p>
                </div>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Registered Players List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase">Existing Players on this Operator:</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {operatorPlayers.map(p => (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                      p.id === activePlayer.id
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block text-slate-200">{p.username}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.id} • Balance: <strong className="text-amber-400">{formatMoney(p.balance)}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActivePlayerId(p.id);
                        setBalance(p.balance);
                        setShowCreateUserModal(false);
                        onRefresh();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        p.id === activePlayer.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {p.id === activePlayer.id ? 'Active' : 'Select'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Register New Player Form */}
            <form onSubmit={handleCreatePlayer} className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase block">Register New Casino Player:</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LuckyPilot99"
                    value={newPlayerForm.username}
                    onChange={e => setNewPlayerForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">External Player ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ext_usr_0091"
                    value={newPlayerForm.externalPlayerId}
                    onChange={e => setNewPlayerForm(prev => ({ ...prev, externalPlayerId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Currency</label>
                  <select
                    value={newPlayerForm.currency}
                    onChange={e => setNewPlayerForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 text-xs outline-none focus:border-amber-500"
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
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Initial Balance Deposit</label>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    value={newPlayerForm.initialBalance}
                    onChange={e => setNewPlayerForm(prev => ({ ...prev, initialBalance: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Create & Login Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DEPOSIT (CASH IN) */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141e] border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <ArrowDownCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Deposit to Casino Balance</h3>
                  <p className="text-xs text-slate-400">Cash in funds for {activePlayer.username}</p>
                </div>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-bold uppercase">Payment Gateway Method</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {[
                  { id: 'BKASH', label: 'bKash / Nagad', icon: '🇧🇩' },
                  { id: 'CARDS', label: 'Visa / Mastercard', icon: '💳' },
                  { id: 'CRYPTO', label: 'Crypto (USDT/BTC)', icon: '🪙' },
                  { id: 'BANK', label: 'Instant Bank Wire', icon: '🏦' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDepositMethod(m.id as any)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition ${
                      depositMethod === m.id
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <form onSubmit={handleExecuteDeposit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold uppercase">
                  Deposit Amount ({activePlayer.currency})
                </label>
                <input
                  type="number"
                  min="10"
                  step="25"
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 font-mono font-black text-lg outline-none focus:border-emerald-500"
                />

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[50, 100, 250, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-300"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-mono text-white font-bold">{formatMoney(balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Post-Balance:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatMoney(balance + depositAmount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition"
                >
                  Confirm & Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WITHDRAWAL (CASH OUT) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141e] border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <ArrowUpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Withdraw Casino Funds</h3>
                  <p className="text-xs text-slate-400">Cash out winnings for {activePlayer.username}</p>
                </div>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {/* Payout Gateway */}
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-bold uppercase">Payout Method</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {[
                  { id: 'BKASH', label: 'bKash / Nagad', icon: '🇧🇩' },
                  { id: 'BANK', label: 'Bank Account Wire', icon: '🏦' },
                  { id: 'CRYPTO', label: 'USDT (TRC-20)', icon: '🪙' },
                  { id: 'CARDS', label: 'Direct Card Payout', icon: '💳' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWithdrawMethod(m.id as any)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition ${
                      withdrawMethod === m.id
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleExecuteWithdrawal} className="space-y-4">
              <div>
                <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                  Recipient Account Number / Mobile / Address
                </label>
                <input
                  type="text"
                  required
                  placeholder={withdrawMethod === 'BKASH' ? '017XXXXXXXX or 019XXXXXXXX' : 'Account or Wallet Address'}
                  value={withdrawAccount}
                  onChange={e => setWithdrawAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase">
                  <span>Withdrawal Amount ({activePlayer.currency})</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(balance)}
                    className="text-amber-400 hover:underline"
                  >
                    Withdraw All ({formatMoney(balance)})
                  </button>
                </div>

                <input
                  type="number"
                  min="5"
                  max={balance}
                  step="10"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-300 font-mono font-black text-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-mono text-white font-bold">{formatMoney(balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Post-Balance:</span>
                  <span className="font-mono text-indigo-300 font-bold">
                    {formatMoney(Math.max(0, balance - withdrawAmount))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 transition"
                >
                  Process Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TRANSACTIONS & LEDGER HISTORY */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141e] border border-slate-700 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-black text-white">Player Wallet Ledger & Audit Trail</h3>
                  <p className="text-xs text-slate-400">
                    All double-entry transactions for {activePlayer.username} ({activePlayer.id})
                  </p>
                </div>
              </div>
              <button onClick={() => setShowLedgerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {playerTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No ledger entries recorded for this player yet.
                </div>
              ) : (
                playerTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            tx.type === 'BET' || tx.type === 'WITHDRAWAL'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {tx.type}
                        </span>
                        <span className="text-slate-400 text-[10px]">{tx.timestamp.substring(11, 19)}</span>
                      </div>
                      <span className="text-slate-400 text-[10px] block">
                        TX: {tx.idempotencyKey.substring(0, 24)}...
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-black ${
                          tx.debit > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {tx.debit > 0 ? `-${formatMoney(tx.debit)}` : `+${formatMoney(tx.credit)}`}
                      </span>
                      <span className="text-slate-400 text-[10px] block mt-0.5">
                        Post: <strong className="text-white">{formatMoney(tx.balanceAfter)}</strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOM API CREDENTIALS CONFIG */}
      {customCredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141e] border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Company API Credentials</h3>
              </div>
              <button onClick={() => setCustomCredModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Company Host Domain</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={e => setCustomDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">API Key / Client ID</label>
                <input
                  type="text"
                  value={customApiKey}
                  onChange={e => setCustomApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-300 font-mono text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Master Provider Endpoint</label>
                <input
                  type="text"
                  readOnly
                  value="http://localhost:3000/api/v1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-400 font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCustomCredModalOpen(false)}
                className="px-5 py-2 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
