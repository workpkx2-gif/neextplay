/**
 * NeextPlay B2B Platform State & Service Engine
 * Full Multi-Tenant Ledger, Authoritative Game Execution & API Sandbox Store
 */

import {
  Operator,
  ApiCredential,
  GameDefinition,
  OperatorGameConfig,
  Player,
  GameSession,
  LedgerEntry,
  GameRound,
  WebhookEventRecord,
  RiskRule,
  RiskAlert,
  AuditLog,
  SlotSpinResult,
} from '../types';
import { evaluateSpin, generateProvableSeeds } from '../engine/slotEngine';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { realDb } from '../db/indexedDbEngine';

// Seed Operators
const INITIAL_OPERATORS: Operator[] = [
  {
    id: 'op_neexthub',
    name: 'NeextHub Gaming Corp',
    code: 'NEEXTHUB',
    email: 'neexthub@gmail.com',
    country: 'Global B2B License',
    status: 'ACTIVE',
    currency: 'USD',
    allowedCurrencies: ['USD', 'EUR', 'BDT', 'INR', 'BRL', 'GBP'],
    createdAt: '2025-01-01T00:00:00Z',
    totalGgr: 892400.00,
    totalTurnover: 12450000.00,
    companyBalance: 250000.00,
    activePlayers: 4850,
    ipWhitelist: ['*'],
    webhookUrl: 'https://api.neexthub.com/v1/casino-callback',
    webhookSecret: 'whsec_neexthub_live_449018273645',
  },
  {
    id: 'op_nexus',
    name: 'NexusBet International Ltd',
    code: 'NEXUSBET',
    email: 'compliance@nexusbet.io',
    country: 'Malta (MGA)',
    status: 'ACTIVE',
    currency: 'EUR',
    allowedCurrencies: ['EUR', 'USD', 'GBP', 'BRL'],
    createdAt: '2025-01-15T10:00:00Z',
    totalGgr: 248950.40,
    totalTurnover: 4120800.00,
    companyBalance: 180000.00,
    activePlayers: 1840,
    ipWhitelist: ['194.156.98.12', '185.220.101.5'],
    webhookUrl: 'https://api.nexusbet.io/v1/webhooks/neextplay',
    webhookSecret: 'whsec_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
  },
  {
    id: 'op_apex',
    name: 'Apex Gaming Group',
    code: 'APEX_GRP',
    email: 'integrations@apexgaming.co.uk',
    country: 'United Kingdom (UKGC)',
    status: 'ACTIVE',
    currency: 'GBP',
    allowedCurrencies: ['GBP', 'EUR'],
    createdAt: '2025-03-20T14:30:00Z',
    totalGgr: 184320.10,
    totalTurnover: 2890450.00,
    companyBalance: 140000.00,
    activePlayers: 1120,
    ipWhitelist: ['212.58.244.20'],
    webhookUrl: 'https://gateway.apexgaming.co.uk/casino/events',
    webhookSecret: 'whsec_77f6e5d4c3b2a100ffeeddccbbaa9988',
  },
  {
    id: 'op_solaria',
    name: 'Solaria Interactive Corp',
    code: 'SOLARIA',
    email: 'tech@solaria-gaming.com',
    country: 'Curacao (eGaming)',
    status: 'PENDING',
    currency: 'USD',
    allowedCurrencies: ['USD', 'USDT', 'BTC'],
    createdAt: '2026-02-01T08:15:00Z',
    totalGgr: 45200.00,
    totalTurnover: 680000.00,
    companyBalance: 50000.00,
    activePlayers: 420,
    ipWhitelist: ['104.28.19.45'],
    webhookUrl: 'https://solaria-gaming.com/api/neextplay-hook',
    webhookSecret: 'whsec_33c2b1a0f9e8d7c6b5a4123456789abc',
  },
];

// Seed API Credentials
const INITIAL_CREDENTIALS: ApiCredential[] = [
  {
    id: 'cred_neexthub_live',
    operatorId: 'op_neexthub',
    name: 'NeextHub Master Live API Key',
    clientId: 'np_live_key_neexthub_992147',
    clientSecretHash: 'np_sec_live_neexthub_8f7b6a5c4d3e210a',
    rawSecretDisplay: 'np_sec_live_neexthub_8f7b6a5c4d3e210a',
    status: 'ACTIVE',
    scopes: ['wallet:read', 'wallet:write', 'games:launch', 'players:manage'],
    createdAt: '2025-01-01T00:00:00Z',
    lastUsedAt: 'Active now',
  },
  {
    id: 'cred_nexus_live',
    operatorId: 'op_nexus',
    name: 'NexusBet Production API Key',
    clientId: 'np_client_live_nexus_78912',
    clientSecretHash: '$2b$12$eX8mJ5L3aB9qZ2w0vP1o4uD...',
    rawSecretDisplay: 'np_sec_live_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
    status: 'ACTIVE',
    scopes: ['wallet:read', 'wallet:write', 'games:launch', 'players:manage'],
    createdAt: '2025-01-16T11:00:00Z',
    lastUsedAt: 'Just now',
  },
  {
    id: 'cred_nexus_sandbox',
    operatorId: 'op_nexus',
    name: 'NexusBet Sandbox Testing Key',
    clientId: 'np_client_test_nexus_00234',
    clientSecretHash: '$2b$12$kL4mP2o9qR8w7v6x5y3z1aB...',
    rawSecretDisplay: 'np_sec_test_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
    status: 'ACTIVE',
    scopes: ['*'],
    createdAt: '2025-01-16T11:05:00Z',
    lastUsedAt: '2 hours ago',
  },
  {
    id: 'cred_apex_live',
    operatorId: 'op_apex',
    name: 'Apex Gaming Primary Server Key',
    clientId: 'np_client_live_apex_44521',
    clientSecretHash: '$2b$12$bB1c9d8e7f6a5b4c3d2e1f0...',
    rawSecretDisplay: 'np_sec_live_77f6e5d4c3b2a100ffeeddccbbaa9988',
    status: 'ACTIVE',
    scopes: ['wallet:read', 'wallet:write', 'games:launch'],
    createdAt: '2025-03-21T09:00:00Z',
    lastUsedAt: '12 mins ago',
  },
];

// Seed Master Game Catalog
const INITIAL_GAMES: GameDefinition[] = [
  {
    id: 'game_neext_fortune',
    slug: 'neext-fortune',
    name: 'Neext Fortune',
    type: 'SLOT',
    provider: 'NeextPlay Studios',
    version: '2.4.1',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    description: 'High-volatility 5x3 mythological video slot with 20 fixed paylines, Dragon Wild multipliers, and Free Spins re-trigger bonus.',
    defaultRtp: 96.50,
    availableRtpProfiles: [
      { id: 'RTP_HIGH', label: 'VIP High Tier (97.80%)', rtp: 97.80, volatility: 'HIGH' },
      { id: 'RTP_STANDARD', label: 'Global Standard (96.50%)', rtp: 96.50, volatility: 'HIGH' },
      { id: 'RTP_LOW', label: 'Conservative (94.10%)', rtp: 94.10, volatility: 'MEDIUM' },
    ],
    minBet: 0.20,
    maxBet: 100.00,
    maxMultiplier: 5000,
    features: ['Wild Substitutions', 'Free Spins (3x multiplier)', 'Scatter Pays', 'AutoPlay', 'Turbo Spin'],
    linesCount: 20,
    releaseDate: '2025-02-10',
  },
  {
    id: 'game_aviator_pro',
    slug: 'aviator-pro',
    name: 'Aviator (Crash Game)',
    type: 'CRASH',
    provider: 'NeextPlay Studios',
    version: '3.1.0',
    status: 'ACTIVE',
    thumbnail: '/src/assets/images/aviator_banner_1791307837428.jpg',
    description: 'World-renowned crash game featuring dual synchronous betting panels, provably fair SHA-512 verification, aerodynamic red monoplane curve, live multiplayer cashouts, and community live chat.',
    defaultRtp: 97.00,
    availableRtpProfiles: [
      { id: 'RTP_AVIATOR_97', label: 'Certified Fair (97.00%)', rtp: 97.00, volatility: 'EXTREME' },
    ],
    minBet: 0.50,
    maxBet: 500.00,
    maxMultiplier: 1000,
    features: ['Provably Fair Verification', 'Dual Independent Bet Panels', 'Auto Cashout & Auto Bet', 'Multiplayer Live Feed', 'Live Chat'],
    releaseDate: '2026-03-01',
  },
  {
    id: 'game_neext_velocity',
    slug: 'neext-velocity',
    name: 'Neext Velocity Crash',
    type: 'CRASH',
    provider: 'NeextPlay Studios',
    version: '1.2.0',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    description: 'Provably fair high-speed multiplier crash game with instant cashouts, dual bets, and live multiplayer ticker.',
    defaultRtp: 97.00,
    availableRtpProfiles: [
      { id: 'RTP_CRASH_97', label: 'Certified Fair (97.00%)', rtp: 97.00, volatility: 'EXTREME' },
    ],
    minBet: 0.50,
    maxBet: 250.00,
    maxMultiplier: 250,
    features: ['Provably Fair Verification', 'Auto Cashout', 'Realtime Multiplier Curve', 'High Frequency (every 10s)'],
    releaseDate: '2025-06-18',
  },
  {
    id: 'game_monaco_roulette',
    slug: 'monaco-vip-roulette',
    name: 'Monaco VIP Roulette',
    type: 'LIVE_CASINO',
    provider: 'NeextPlay Live Studios',
    version: '3.0.0',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=600&auto=format&fit=crop&q=80',
    description: 'European single-zero live dealer streaming roulette with automated OCR ball tracking and instant bet settlement.',
    defaultRtp: 97.30,
    availableRtpProfiles: [
      { id: 'RTP_ROULETTE', label: 'European Rulebook (97.30%)', rtp: 97.30, volatility: 'MEDIUM' },
    ],
    minBet: 1.00,
    maxBet: 5000.00,
    maxMultiplier: 36,
    features: ['4K Multi-Camera Stream', 'Race Track Bets', 'Live Dealer Chat', 'Instant Settlement'],
    releaseDate: '2025-09-01',
  },
  {
    id: 'game_imperial_baccarat',
    slug: 'imperial-speed-baccarat',
    name: 'Imperial Speed Baccarat',
    type: 'LIVE_CASINO',
    provider: 'NeextPlay Live Studios',
    version: '1.8.2',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=600&auto=format&fit=crop&q=80',
    description: '12-second round speed baccarat featuring Dragon 7 and Panda 8 side bets, bead plate roadmaps, and VIP squeeze mode.',
    defaultRtp: 98.94,
    availableRtpProfiles: [
      { id: 'RTP_BACCARAT', label: 'Standard Commission (98.94%)', rtp: 98.94, volatility: 'LOW' },
    ],
    minBet: 5.00,
    maxBet: 25000.00,
    maxMultiplier: 30,
    features: ['Speed Mode (12s)', 'Side Bets', 'Roadmaps (Big Road, Small Road)', 'VIP Table Limits'],
    releaseDate: '2025-11-20',
  },
];

// Seed Operator Game Configurations
const INITIAL_CONFIGS: OperatorGameConfig[] = [
  {
    gameId: 'game_neext_fortune',
    operatorId: 'op_nexus',
    enabled: true,
    selectedRtpProfileId: 'RTP_STANDARD',
    minBet: 0.20,
    maxBet: 100.00,
    allowedCurrencies: ['EUR', 'USD', 'GBP'],
    jackpotContributionPct: 1.5,
  },
  {
    gameId: 'game_neext_velocity',
    operatorId: 'op_nexus',
    enabled: true,
    selectedRtpProfileId: 'RTP_CRASH_97',
    minBet: 0.50,
    maxBet: 250.00,
    allowedCurrencies: ['EUR', 'USD'],
    jackpotContributionPct: 0.0,
  },
  {
    gameId: 'game_monaco_roulette',
    operatorId: 'op_nexus',
    enabled: true,
    selectedRtpProfileId: 'RTP_ROULETTE',
    minBet: 1.00,
    maxBet: 5000.00,
    allowedCurrencies: ['EUR', 'GBP'],
    jackpotContributionPct: 0.0,
  },
  {
    gameId: 'game_imperial_baccarat',
    operatorId: 'op_nexus',
    enabled: false,
    selectedRtpProfileId: 'RTP_BACCARAT',
    minBet: 5.00,
    maxBet: 10000.00,
    allowedCurrencies: ['EUR'],
    jackpotContributionPct: 0.0,
  },
];

// Seed Players
const INITIAL_PLAYERS: Player[] = [
  {
    id: 'ply_neexthub_vip1',
    operatorId: 'op_neexthub',
    externalPlayerId: 'ext_neext_001',
    username: 'neexthub_highroller',
    currency: 'USD',
    balance: 1500.00,
    status: 'ACTIVE',
    rgLimits: {
      dailyDepositLimit: 50000,
      dailyLossLimit: 25000,
      sessionTimeMinutes: 240,
    },
    createdAt: '2025-01-01T12:00:00Z',
    lastActiveAt: 'Just now',
    totalWagered: 3500.00,
    totalWon: 4200.00,
    sessionCount: 88,
  },
  {
    id: 'ply_alex_88',
    operatorId: 'op_nexus',
    externalPlayerId: 'ext_usr_771892',
    username: 'alex_nordic',
    currency: 'EUR',
    balance: 1450.00,
    status: 'ACTIVE',
    rgLimits: {
      dailyDepositLimit: 2000,
      dailyLossLimit: 1000,
      sessionTimeMinutes: 120,
    },
    createdAt: '2025-02-01T12:00:00Z',
    lastActiveAt: 'Just now',
    totalWagered: 18400.00,
    totalWon: 17290.00,
    sessionCount: 42,
  },
  {
    id: 'ply_elena_vip',
    operatorId: 'op_nexus',
    externalPlayerId: 'ext_usr_990142',
    username: 'elena_highroller',
    currency: 'EUR',
    balance: 8200.50,
    status: 'ACTIVE',
    rgLimits: {
      dailyDepositLimit: 10000,
      dailyLossLimit: 5000,
    },
    createdAt: '2025-01-20T16:45:00Z',
    lastActiveAt: '10 mins ago',
    totalWagered: 124500.00,
    totalWon: 119800.00,
    sessionCount: 115,
  },
  {
    id: 'ply_thomas_limit',
    operatorId: 'op_nexus',
    externalPlayerId: 'ext_usr_334120',
    username: 'thomas_safe',
    currency: 'EUR',
    balance: 85.00,
    status: 'ACTIVE',
    rgLimits: {
      dailyDepositLimit: 100,
      dailyLossLimit: 50,
      sessionTimeMinutes: 30,
    },
    createdAt: '2025-04-10T09:30:00Z',
    lastActiveAt: 'Yesterday',
    totalWagered: 620.00,
    totalWon: 540.00,
    sessionCount: 12,
  },
  {
    id: 'ply_susp_bot',
    operatorId: 'op_nexus',
    externalPlayerId: 'ext_usr_666001',
    username: 'turbo_bot_x',
    currency: 'EUR',
    balance: 310.00,
    status: 'SUSPENDED',
    rgLimits: {},
    createdAt: '2025-05-01T04:12:00Z',
    lastActiveAt: '3 days ago',
    totalWagered: 4200.00,
    totalWon: 3950.00,
    sessionCount: 6,
  },
];

// Seed Risk Rules
const INITIAL_RISK_RULES: RiskRule[] = [
  {
    id: 'risk_win_mult',
    name: 'Abnormal High Multiplier Alert',
    description: 'Triggers audit when a single spin or round pays > 50x bet',
    triggerType: 'WIN_MULTIPLIER',
    threshold: 50,
    action: 'FLAG_REVIEW',
    enabled: true,
  },
  {
    id: 'risk_rapid_spin',
    name: 'Rapid Bet Frequency Sentinel',
    description: 'Detects unnatural automated betting cadence (<300ms interval)',
    triggerType: 'RAPID_BETS',
    threshold: 4, // 4 bets in 1 second
    action: 'TEMP_SUSPEND',
    enabled: true,
  },
  {
    id: 'risk_negative_delta',
    name: 'Daily Player Negative Delta Guard',
    description: 'Alerts financial desk if single player net loss exceeds €5,000 in 24h',
    triggerType: 'NEGATIVE_DELTA',
    threshold: 5000,
    action: 'FLAG_REVIEW',
    enabled: true,
  },
];

class PlatformStateService {
  public operators: Operator[] = INITIAL_OPERATORS;
  public credentials: ApiCredential[] = INITIAL_CREDENTIALS;
  public games: GameDefinition[] = INITIAL_GAMES;
  public configs: OperatorGameConfig[] = INITIAL_CONFIGS;
  public players: Player[] = INITIAL_PLAYERS;
  public sessions: GameSession[] = [];
  public ledger: LedgerEntry[] = [];
  public gameRounds: GameRound[] = [];
  public webhooks: WebhookEventRecord[] = [];
  public riskRules: RiskRule[] = INITIAL_RISK_RULES;
  public riskAlerts: RiskAlert[] = [];
  public auditLogs: AuditLog[] = [];

  // Active runtime context
  public currentRole: 'SUPER_ADMIN' | 'OPERATOR' = 'SUPER_ADMIN';
  public selectedOperatorId: string = 'op_neexthub';
  public activePlayerId: string = 'ply_neexthub_vip1';

  private processedIdempotencyKeys = new Set<string>();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initLedgerAndHistory();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Platform listener error:', err);
      }
    });
  }

  public saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('neextplay_players_cache', JSON.stringify(this.players));
        localStorage.setItem('neextplay_operators_cache', JSON.stringify(this.operators));
        localStorage.setItem('neextplay_active_player_id', this.activePlayerId);
        localStorage.setItem('neextplay_selected_operator_id', this.selectedOperatorId);
      } catch (err) {
        console.error('Failed to save platform state to storage:', err);
      }
    }
  }

  private initLedgerAndHistory() {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedPlayers = localStorage.getItem('neextplay_players_cache');
        if (savedPlayers) {
          const parsed = JSON.parse(savedPlayers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.players = parsed;
          }
        }
        const savedOperators = localStorage.getItem('neextplay_operators_cache');
        if (savedOperators) {
          const parsed = JSON.parse(savedOperators);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.operators = parsed;
          }
        }
        const savedPlayerId = localStorage.getItem('neextplay_active_player_id');
        if (savedPlayerId && this.players.some(p => p.id === savedPlayerId)) {
          this.activePlayerId = savedPlayerId;
        }
        const savedOpId = localStorage.getItem('neextplay_selected_operator_id');
        if (savedOpId && this.operators.some(o => o.id === savedOpId)) {
          this.selectedOperatorId = savedOpId;
        }
      } catch (e) {
        console.error('Error restoring platform cache:', e);
      }
    }

    // Populate realistic historical transactions for initial players
    const initialPlayer = this.players[0];
    this.ledger.push({
      id: 'ledg_init_dep_01',
      operatorId: initialPlayer.operatorId,
      playerId: initialPlayer.id,
      idempotencyKey: 'idem_init_deposit_001',
      type: 'DEPOSIT',
      debit: 0,
      credit: 1500.00,
      balanceAfter: 1500.00,
      currency: 'EUR',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'COMPLETED',
      metadata: { method: 'SEPA_INSTANT', gateway: 'Worldline' },
    });

    this.auditLogs.push({
      id: 'audit_init_01',
      operatorId: 'op_nexus',
      actor: 'system@neextplay.com',
      action: 'PLATFORM_INITIALIZED',
      category: 'AUTH',
      details: 'NeextPlay B2B Engine loaded with certified RTP profiles and double-entry ledger.',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      ip: '127.0.0.1',
    });
  }

  public getActiveOperator(): Operator {
    return this.operators.find(o => o.id === this.selectedOperatorId) || this.operators[0];
  }

  public getActivePlayer(): Player {
    return this.players.find(p => p.id === this.activePlayerId) || this.players[0];
  }

  /**
   * Double-Entry Ledger Debit/Credit Engine with Idempotency
   */
  public executeWalletTransaction(params: {
    operatorId: string;
    playerId: string;
    type: 'BET' | 'WIN' | 'REFUND' | 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    currency: string;
    idempotencyKey: string;
    roundId?: string;
    metadata?: Record<string, unknown>;
  }): { success: boolean; newBalance: number; error?: string; ledgerEntry?: LedgerEntry } {
    if (this.processedIdempotencyKeys.has(params.idempotencyKey)) {
      const existing = this.ledger.find(l => l.idempotencyKey === params.idempotencyKey);
      if (existing) {
        return { success: true, newBalance: existing.balanceAfter, ledgerEntry: existing };
      }
    }

    const player = this.players.find(p => p.id === params.playerId && p.operatorId === params.operatorId);
    if (!player) {
      return { success: false, newBalance: 0, error: 'PLAYER_NOT_FOUND' };
    }

    if (player.status !== 'ACTIVE') {
      return { success: false, newBalance: player.balance, error: `PLAYER_${player.status}` };
    }

    let debit = 0;
    let credit = 0;
    let nextBalance = player.balance;

    if (params.type === 'BET' || params.type === 'WITHDRAWAL') {
      if (player.balance < params.amount) {
        return { success: false, newBalance: player.balance, error: 'INSUFFICIENT_FUNDS' };
      }
      debit = params.amount;
      nextBalance = Number((player.balance - debit).toFixed(2));
      if (params.type === 'BET') {
        player.totalWagered += debit;
      }
    } else if (params.type === 'WIN' || params.type === 'DEPOSIT' || params.type === 'REFUND') {
      credit = params.amount;
      nextBalance = Number((player.balance + credit).toFixed(2));
      if (params.type === 'WIN') {
        player.totalWon += credit;
      }
    }

    player.balance = nextBalance;
    player.lastActiveAt = new Date().toISOString();

    // Update Operator Company Balance & GGR simultaneously
    const operator = this.operators.find(o => o.id === params.operatorId);
    if (operator) {
      if (params.type === 'BET') {
        operator.totalTurnover = Number((operator.totalTurnover + debit).toFixed(2));
        operator.totalGgr = Number((operator.totalGgr + debit).toFixed(2));
        operator.companyBalance = Number((operator.companyBalance + debit).toFixed(2));
      } else if (params.type === 'WIN') {
        operator.totalGgr = Number((operator.totalGgr - credit).toFixed(2));
        operator.companyBalance = Number((operator.companyBalance - credit).toFixed(2));
      }
    }

    const ledgerEntry: LedgerEntry = {
      id: 'ledg_' + Math.random().toString(36).substring(2, 10),
      operatorId: params.operatorId,
      playerId: params.playerId,
      roundId: params.roundId,
      idempotencyKey: params.idempotencyKey,
      type: params.type,
      debit,
      credit,
      balanceAfter: nextBalance,
      currency: params.currency,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      metadata: {
        ...params.metadata,
        companyBalanceAfter: operator ? operator.companyBalance : undefined,
      },
    };

    this.ledger.unshift(ledgerEntry);
    this.processedIdempotencyKeys.add(params.idempotencyKey);

    // Asynchronously synchronize updated player data to Firestore and IndexedDB
    try {
      setDoc(doc(db, 'players', player.id), player, { merge: true }).catch(() => {});
      realDb.put('players', player).catch(() => {});
    } catch {}

    this.saveToStorage();
    this.notifyListeners();

    return { success: true, newBalance: nextBalance, ledgerEntry };
  }

  /**
   * Auto-register or load player profile on Aviator / Game Launch.
   * If the player does not have a registered profile, creates one under the company / operator,
   * stores to Firebase Firestore and local database, and returns the player.
   * If player profile exists, loads the freshest profile, updates session stats, and saves.
   */
  public async autoRegisterOrLoadPlayer(params?: {
    companyOperatorId?: string;
    preferredUsername?: string;
  }): Promise<{ player: Player; isNew: boolean }> {
    const targetOpId = params?.companyOperatorId || this.selectedOperatorId || 'op_neexthub';
    const operator = this.operators.find(o => o.id === targetOpId) || this.operators[0];

    // Check stored profile id from localStorage
    const storedPlayerId = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('neextplay_current_player_profile_id') || localStorage.getItem('neextplay_active_player_id'))
      : null;

    if (storedPlayerId) {
      // 1. Try to find in memory
      let existingPlayer = this.players.find(p => p.id === storedPlayerId);

      // 2. Try to fetch fresh from Firestore
      try {
        const snap = await getDoc(doc(db, 'players', storedPlayerId));
        if (snap.exists()) {
          const cloudData = snap.data() as Player;
          existingPlayer = { ...(existingPlayer || cloudData), ...cloudData };
        }
      } catch (err) {
        // Fallback to indexedDb
        try {
          const localRecord = await realDb.get<Player>('players', storedPlayerId);
          if (localRecord) {
            existingPlayer = { ...(existingPlayer || localRecord), ...localRecord };
          }
        } catch {}
      }

      if (existingPlayer) {
        // Player found! Update session count and active time
        existingPlayer.sessionCount = (existingPlayer.sessionCount || 0) + 1;
        existingPlayer.lastActiveAt = new Date().toISOString();

        // Update in memory array
        const idx = this.players.findIndex(p => p.id === existingPlayer!.id);
        if (idx >= 0) {
          this.players[idx] = existingPlayer;
        } else {
          this.players.push(existingPlayer);
        }

        this.activePlayerId = existingPlayer.id;
        if (existingPlayer.operatorId) {
          this.selectedOperatorId = existingPlayer.operatorId;
        }

        // Persist updated profile to Firestore and IndexedDB
        try {
          await setDoc(doc(db, 'players', existingPlayer.id), existingPlayer, { merge: true });
          await realDb.put('players', existingPlayer);
        } catch {}

        this.saveToStorage();
        this.notifyListeners();
        return { player: existingPlayer, isNew: false };
      }
    }

    // No existing registered player found -> Auto-register new player under company operator!
    const newId = 'ply_auto_' + Math.random().toString(36).substring(2, 9);
    const newPlayer: Player = {
      id: newId,
      operatorId: operator.id,
      externalPlayerId: 'ext_usr_' + Date.now().toString(36),
      username: params?.preferredUsername || (`AviatorAce_${Math.floor(1000 + Math.random() * 9000)}`),
      currency: operator.currency || 'USD',
      balance: 2500.00, // Generous starting flight bankroll
      status: 'ACTIVE',
      rgLimits: {},
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalWagered: 0,
      totalWon: 0,
      sessionCount: 1,
      avatar: 'pilot-1',
      vipLevel: 1,
      vipPoints: 0,
      bestMultiplier: 1.0,
      isAutoRegistered: true,
    };

    // Store in Firestore and IndexedDB
    try {
      await setDoc(doc(db, 'players', newPlayer.id), newPlayer, { merge: true });
      await realDb.put('players', newPlayer);
    } catch {}

    // Add to operator active count
    operator.activePlayers = (operator.activePlayers || 0) + 1;

    this.players.unshift(newPlayer);
    this.activePlayerId = newPlayer.id;
    this.selectedOperatorId = operator.id;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('neextplay_current_player_profile_id', newPlayer.id);
      localStorage.setItem('neextplay_active_player_id', newPlayer.id);
    }

    this.auditLogs.unshift({
      id: 'audit_autoreg_' + Date.now().toString(36),
      operatorId: operator.id,
      actor: newPlayer.username,
      action: 'PLAYER_AUTO_REGISTERED',
      category: 'AUTH',
      details: `Auto-registered Aviator player ${newPlayer.username} under company ${operator.name}`,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1',
    });

    this.saveToStorage();
    this.notifyListeners();
    return { player: newPlayer, isNew: true };
  }

  /**
   * Update Player Profile in memory, Firestore, and IndexedDB
   */
  public async updatePlayerProfile(playerId: string, updates: Partial<Player>): Promise<Player> {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    Object.assign(player, updates);
    player.lastActiveAt = new Date().toISOString();

    try {
      await setDoc(doc(db, 'players', player.id), player, { merge: true });
      await realDb.put('players', player);
    } catch {}

    this.saveToStorage();
    this.notifyListeners();
    return player;
  }

  public setActivePlayerId(playerId: string) {
    const p = this.players.find(pl => pl.id === playerId);
    if (p) {
      this.activePlayerId = playerId;
      // Also automatically sync operator if player belongs to another operator
      if (p.operatorId) {
        this.selectedOperatorId = p.operatorId;
      }
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public setSelectedOperatorId(operatorId: string) {
    const o = this.operators.find(op => op.id === operatorId);
    if (o) {
      this.selectedOperatorId = operatorId;
      // If active player is not in this operator, switch to first player of this operator
      const opPlayers = this.players.filter(p => p.operatorId === operatorId);
      if (opPlayers.length > 0 && !opPlayers.some(p => p.id === this.activePlayerId)) {
        this.activePlayerId = opPlayers[0].id;
      }
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public resetBalances() {
    this.players = INITIAL_PLAYERS.map(p => ({ ...p }));
    this.operators = INITIAL_OPERATORS.map(o => ({ ...o }));
    this.activePlayerId = INITIAL_PLAYERS[0].id;
    this.selectedOperatorId = INITIAL_OPERATORS[0].id;
    this.saveToStorage();
    this.notifyListeners();
  }

  public depositToPlayer(playerId: string, amount: number) {
    const p = this.players.find(pl => pl.id === playerId);
    if (p) {
      return this.executeWalletTransaction({
        operatorId: p.operatorId,
        playerId: p.id,
        type: 'DEPOSIT',
        amount,
        currency: p.currency,
        idempotencyKey: `idem_dep_${Date.now()}_${Math.random()}`,
      });
    }
  }

  /**
   * Launch Game Session Creator
   */
  public createGameSession(
    operatorId: string,
    playerId: string,
    gameId: string,
    currency: string = 'EUR'
  ): { sessionToken: string; launchUrl: string; session: GameSession } {
    const token = 'np_sess_' + Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
    const session: GameSession = {
      id: 'sess_' + Math.random().toString(36).substring(2, 10),
      token,
      operatorId,
      playerId,
      gameId,
      currency,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 2).toISOString(), // 2 hours
      status: 'ACTIVE',
      device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP',
    };

    this.sessions.unshift(session);
    const launchUrl = `${window.location.origin}/?session=${token}&game=${gameId}`;
    return { sessionToken: token, launchUrl, session };
  }

  /**
   * Authoritative Slot Spin Executor
   * Executed on server-side model: Debits -> Generates Result -> Credits -> Records -> Triggers Webhooks/Risk
   */
  public async executeAuthoritativeSpin(params: {
    playerId: string;
    gameId: string;
    betAmount: number;
    requestId: string;
    isFreeSpin?: boolean;
    freeSpinMultiplier?: number;
  }): Promise<{ success: boolean; result?: SlotSpinResult; error?: string }> {
    const player = this.players.find(p => p.id === params.playerId);
    if (!player) return { success: false, error: 'PLAYER_NOT_FOUND' };
    if (player.status !== 'ACTIVE') return { success: false, error: `PLAYER_${player.status}` };

    // Responsible Gaming limit verification
    if (player.rgLimits.dailyLossLimit) {
      const netLoss = player.totalWagered - player.totalWon;
      if (netLoss + params.betAmount > player.rgLimits.dailyLossLimit) {
        return { success: false, error: 'RESPONSIBLE_GAMING_LOSS_LIMIT_REACHED' };
      }
    }

    const roundId = 'rnd_' + Math.random().toString(36).substring(2, 12);
    const betIdempotency = `idem_bet_${params.requestId}_${roundId}`;

    // 1. Debit wallet
    if (!params.isFreeSpin) {
      const debitRes = this.executeWalletTransaction({
        operatorId: player.operatorId,
        playerId: player.id,
        type: 'BET',
        amount: params.betAmount,
        currency: player.currency,
        idempotencyKey: betIdempotency,
        roundId,
        metadata: { gameId: params.gameId },
      });

      if (!debitRes.success) {
        return { success: false, error: debitRes.error };
      }
    }

    // 2. Fetch game config for operator
    const config = this.configs.find(c => c.operatorId === player.operatorId && c.gameId === params.gameId);
    const rtpProfileKey = config ? config.selectedRtpProfileId : 'RTP_STANDARD';

    // 3. Cryptographic Provable seeds & Math evaluation
    const seeds = await generateProvableSeeds();
    const evalResult = evaluateSpin(params.betAmount, rtpProfileKey, params.isFreeSpin, params.freeSpinMultiplier);

    // 4. Credit wallet if win > 0
    let nextBalance = player.balance;
    if (evalResult.totalPayout > 0) {
      const winIdempotency = `idem_win_${params.requestId}_${roundId}`;
      const creditRes = this.executeWalletTransaction({
        operatorId: player.operatorId,
        playerId: player.id,
        type: 'WIN',
        amount: evalResult.totalPayout,
        currency: player.currency,
        idempotencyKey: winIdempotency,
        roundId,
        metadata: { gameId: params.gameId, multiplier: evalResult.payoutMultiplier },
      });
      if (creditRes.success) {
        nextBalance = creditRes.newBalance;
      }
    }

    // 5. Record Immutable Game Round
    const gameRound: GameRound = {
      id: roundId,
      operatorId: player.operatorId,
      playerId: player.id,
      gameId: params.gameId,
      roundId,
      sessionId: 'sess_live',
      betAmount: params.isFreeSpin ? 0 : params.betAmount,
      winAmount: evalResult.totalPayout,
      payoutMultiplier: evalResult.payoutMultiplier,
      currency: player.currency,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      rngSeed: seeds.serverSeedHash,
      details: {
        winningLinesCount: evalResult.winningLines.length,
        scatterCount: evalResult.scatterCount,
        isFreeSpinsTriggered: evalResult.isFreeSpinsTriggered,
        freeSpinsAwarded: evalResult.freeSpinsAwarded,
      },
    };
    this.gameRounds.unshift(gameRound);

    // Update Operator GGR stats
    const op = this.operators.find(o => o.id === player.operatorId);
    if (op) {
      op.totalTurnover += params.betAmount;
      op.totalGgr += (params.betAmount - evalResult.totalPayout);
    }

    // 6. Evaluate Risk Engine rules
    if (evalResult.payoutMultiplier >= 50) {
      this.riskAlerts.unshift({
        id: 'alert_' + Math.random().toString(36).substring(2, 9),
        operatorId: player.operatorId,
        playerId: player.id,
        ruleName: 'Abnormal High Multiplier Alert',
        severity: evalResult.payoutMultiplier >= 200 ? 'CRITICAL' : 'HIGH',
        details: `Player hit ${evalResult.payoutMultiplier}x multiplier on ${params.gameId} (€${evalResult.totalPayout.toFixed(2)} payout).`,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    // 7. Dispatch Webhook Event
    this.dispatchWebhook(player.operatorId, 'GAME_ROUND_COMPLETED', {
      roundId,
      playerId: player.externalPlayerId,
      gameId: params.gameId,
      bet: params.betAmount,
      win: evalResult.totalPayout,
      currency: player.currency,
      balance: nextBalance,
      timestamp: new Date().toISOString(),
    });

    const spinResult: SlotSpinResult = {
      roundId,
      grid: evalResult.grid,
      winningLines: evalResult.winningLines,
      isFreeSpinsTriggered: evalResult.isFreeSpinsTriggered,
      freeSpinsAwarded: evalResult.freeSpinsAwarded,
      totalPayout: evalResult.totalPayout,
      payoutMultiplier: evalResult.payoutMultiplier,
      clientSeed: seeds.clientSeed,
      serverSeedHash: seeds.serverSeedHash,
      nextBalance,
    };

    return { success: true, result: spinResult };
  }

  /**
   * Dispatch Webhook with simulated HMAC Signature
   */
  public dispatchWebhook(operatorId: string, eventType: WebhookEventRecord['eventType'], payload: Record<string, unknown>) {
    const operator = this.operators.find(o => o.id === operatorId);
    if (!operator || !operator.webhookUrl) return;

    const signature = 'sha256=' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const record: WebhookEventRecord = {
      id: 'wh_evt_' + Math.random().toString(36).substring(2, 10),
      operatorId,
      eventType,
      payload,
      signature,
      endpointUrl: operator.webhookUrl,
      statusCode: 200,
      deliveredAt: new Date().toISOString(),
      status: 'SUCCESS',
    };
    this.webhooks.unshift(record);
  }

  /**
   * API Credential Generation
   */
  public generateApiKey(operatorId: string, name: string, scopes: string[]): ApiCredential {
    const clientId = `np_client_${Math.random().toString(36).substring(2, 10)}`;
    const rawSecret = `np_sec_live_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const hash = `$2b$12$${rawSecret.substring(0, 18)}...`;

    const cred: ApiCredential = {
      id: 'cred_' + Math.random().toString(36).substring(2, 9),
      operatorId,
      name,
      clientId,
      clientSecretHash: hash,
      rawSecretDisplay: rawSecret, // shown once to user
      status: 'ACTIVE',
      scopes,
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Never',
    };

    this.credentials.unshift(cred);
    this.auditLogs.unshift({
      id: 'audit_' + Math.random().toString(36).substring(2, 9),
      operatorId,
      actor: 'operator-admin',
      action: 'API_CREDENTIAL_CREATED',
      category: 'AUTH',
      details: `Generated API Key [${name}] with scopes: ${scopes.join(', ')}`,
      timestamp: new Date().toISOString(),
      ip: '194.156.98.12',
    });

    return cred;
  }
}

export const platform = new PlatformStateService();
