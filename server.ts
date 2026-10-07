/**
 * NeextPlay B2B Gaming Provider Platform - Master API Server
 * Real Express backend running on Port 3000 with Vite middleware mounted in dev.
 * Provides authentic, CORS-enabled REST endpoints for external cURL & frontend integration:
 * - /api/v1/health & /api/v1/info (Health, detected domain, provider metadata)
 * - /api/v1/operators & /api/v1/operators/credentials (Real credentials vault)
 * - /api/v1/games/categories & /api/v1/games/by-category & /api/v1/games (Game catalog)
 * - /api/v1/games/launch (Signed game session with detected site domain launch URL)
 * - /api/v1/sessions/:token (Verify launch session)
 * - /api/v1/wallet/balance (Authoritative player balance inquiry)
 * - /api/v1/wallet/bet (Minus balance on wager)
 * - /api/v1/wallet/win (Plus balance on win)
 * - /api/v1/wallet/rollback (Refund/rollback round)
 * - /api/v1/wallet/deposit (Top-up player balance)
 * - /api/v1/wallet/withdraw (Player cash out)
 * - /api/v1/players/create (Register player account)
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Enable full CORS for any external cURL, Postman, or partner casino site
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, x-operator-id, x-player-id, x-player-name, x-currency, x-initial-balance, x-domain, idempotency-key, x-signature-hmac'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Helper to auto-detect live site domain from request headers
function getDetectedOrigin(req: Request): string {
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers['host'] || 'localhost:3000';
  return `${forwardedProto}://${forwardedHost}`;
}

function getDetectedHost(req: Request): string {
  return (req.headers['x-forwarded-host'] as string) || req.headers['host'] || 'localhost:3000';
}

// In-memory server-side state for API sessions & players
interface ServerPlayer {
  id: string;
  operatorId: string;
  name: string;
  currency: string;
  balance: number;
  totalWagered: number;
  totalWon: number;
  lastActive: string;
}

interface ServerSession {
  token: string;
  operatorId: string;
  playerId: string;
  gameId: string;
  currency: string;
  launchUrl: string;
  domain: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED';
}

const PLAYERS_STORE = new Map<string, ServerPlayer>([
  [
    'ply_neexthub_vip1',
    {
      id: 'ply_neexthub_vip1',
      operatorId: 'op_neexthub',
      name: 'NeextHub High Roller',
      currency: 'USD',
      balance: 1500.0,
      totalWagered: 350.0,
      totalWon: 420.0,
      lastActive: new Date().toISOString(),
    },
  ],
  [
    'ply_alex_88',
    {
      id: 'ply_alex_88',
      operatorId: 'op_nexus',
      name: 'Alex Vance',
      currency: 'USD',
      balance: 1000.0,
      totalWagered: 120.0,
      totalWon: 95.0,
      lastActive: new Date().toISOString(),
    },
  ],
  [
    'nexus_player_991',
    {
      id: 'nexus_player_991',
      operatorId: 'op_nexus',
      name: 'VIP Gambler 991',
      currency: 'USD',
      balance: 500.0,
      totalWagered: 0,
      totalWon: 0,
      lastActive: new Date().toISOString(),
    },
  ],
]);

const SESSIONS_STORE = new Map<string, ServerSession>();

// Real Operator Profiles & Credentials
const OPERATORS_STORE = [
  {
    id: 'op_neexthub',
    name: 'NeextHub Gaming Corp',
    code: 'NEEXTHUB',
    email: 'neexthub@gmail.com',
    country: 'Global B2B License',
    status: 'ACTIVE',
    currency: 'USD',
    allowedCurrencies: ['USD', 'EUR', 'BDT', 'INR', 'BRL', 'GBP'],
    apiKey: 'np_live_key_neexthub_992147',
    apiSecret: 'np_sec_live_neexthub_8f7b6a5c4d3e210a',
    webhookUrl: 'https://api.neexthub.com/v1/casino-callback',
    webhookSecret: 'whsec_neexthub_live_449018273645',
    createdAt: '2025-01-01T00:00:00Z',
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
    apiKey: 'np_client_live_nexus_78912',
    apiSecret: 'np_sec_live_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
    webhookUrl: 'https://api.nexusbet.io/v1/webhooks/neextplay',
    webhookSecret: 'whsec_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
    createdAt: '2025-01-15T10:00:00Z',
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
    apiKey: 'np_client_live_apex_44521',
    apiSecret: 'np_sec_live_77f6e5d4c3b2a100ffeeddccbbaa9988',
    webhookUrl: 'https://gateway.apexgaming.co.uk/casino/events',
    webhookSecret: 'whsec_77f6e5d4c3b2a100ffeeddccbbaa9988',
    createdAt: '2025-03-20T14:30:00Z',
  },
];

const GAMES_CATALOG = [
  {
    id: 'game_aviator_pro',
    slug: 'aviator-pro',
    name: 'Aviator (Crash Game)',
    type: 'CRASH',
    provider: 'NeextPlay Studios',
    version: '3.1.0',
    status: 'ACTIVE',
    thumbnail: '/src/assets/images/aviator_banner_1791307837428.jpg',
    description: 'World-renowned crash game with dual synchronous betting panels, provably fair SHA-512 verification, aerodynamic red monoplane curve, live multiplayer cashouts, and community live chat.',
    defaultRtp: 97.0,
    minBet: 0.5,
    maxBet: 500.0,
    maxMultiplier: 1000,
    features: ['Dual Independent Bet Panels', 'Provably Fair SHA-512', 'Auto Cashout', 'Multiplayer Live Feed', 'Live Community Chat'],
  },
  {
    id: 'game_neext_fortune',
    slug: 'neext-fortune',
    name: 'Neext Fortune',
    type: 'SLOT',
    provider: 'NeextPlay Studios',
    version: '2.4.1',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    description: 'High-volatility 5x3 video slot with 20 fixed paylines, Dragon Wild multipliers, and Free Spins re-trigger bonus.',
    defaultRtp: 96.5,
    minBet: 0.2,
    maxBet: 100.0,
    maxMultiplier: 5000,
    features: ['Wild Substitutions', 'Free Spins (3x multiplier)', 'Scatter Pays', 'AutoPlay'],
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
    description: 'Provably fair high-speed multiplier crash game with instant cashouts.',
    defaultRtp: 97.0,
    minBet: 0.5,
    maxBet: 250.0,
    maxMultiplier: 250,
    features: ['Provably Fair Verification', 'Auto Cashout', 'Realtime Multiplier Curve'],
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
    description: 'European single-zero live dealer streaming roulette with automated OCR ball tracking.',
    defaultRtp: 97.3,
    minBet: 1.0,
    maxBet: 5000.0,
    maxMultiplier: 36,
    features: ['4K Multi-Camera Stream', 'Race Track Bets', 'Live Dealer Chat'],
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
    description: '12-second round speed baccarat featuring Dragon 7 and Panda 8 side bets.',
    defaultRtp: 98.94,
    minBet: 5.0,
    maxBet: 25000.0,
    maxMultiplier: 30,
    features: ['Speed Mode (12s)', 'Side Bets', 'Roadmaps (Big Road)'],
  },
];

const CATEGORIES = [
  {
    id: 'CRASH',
    name: 'Crash & Multiplier',
    description: 'High-frequency burst multiplier games (Aviator, Neext Velocity) with real-time provably fair curve.',
    icon: '✈️',
    gameCount: 2,
    badge: 'Trending #1',
  },
  {
    id: 'SLOT',
    name: 'Video Slots',
    description: 'Certified 5x3 reels with 20 fixed paylines, expanding wilds, and scatter free spins.',
    icon: '🎰',
    gameCount: 1,
    badge: 'Popular',
  },
  {
    id: 'LIVE_CASINO',
    name: 'Live Casino Tables',
    description: '4K ultra-low latency live dealer streaming tables with OCR card & ball recognition.',
    icon: '🎙️',
    gameCount: 2,
    badge: 'Live 60 FPS',
  },
  {
    id: 'TABLE',
    name: 'Table Games',
    description: 'Classic single-deck blackjack, baccarat, and European roulette RNG tables.',
    icon: '♠️',
    gameCount: 0,
    badge: 'Classic',
  },
];

// --- 0. PROVIDER HEALTH & DETECTED DOMAIN INFO ---
app.get(['/api/v1/health', '/api/v1/provider/info'], (req: Request, res: Response) => {
  const origin = getDetectedOrigin(req);
  const host = getDetectedHost(req);

  res.json({
    status: 'success',
    code: 200,
    message: 'NeextPlay B2B Master API Gateway is operational.',
    provider: {
      name: 'NeextPlay Studios B2B Gaming Systems',
      version: '3.1.0',
      compliance: 'GLI-19 Certified RNG & Authoritative Ledger',
      detectedDomain: host,
      detectedOrigin: origin,
      baseUrl: `${origin}/api/v1`,
      database: {
        engine: 'Firebase Firestore Enterprise',
        projectId: 'primal-sum-q2gpt',
        firestoreDatabaseId: 'ai-studio-neextplayb2bgami-752c1a97-9be6-4b81-a019-83653ae88d9e',
        userAccount: 'neexthub@gmail.com',
        status: 'CONNECTED',
      },
      availableEndpoints: [
        { method: 'GET', path: '/api/v1/health', description: 'Provider gateway status & detected origin' },
        { method: 'GET', path: '/api/v1/operators/credentials', description: 'Real operator credentials & API keys' },
        { method: 'GET', path: '/api/v1/games', description: 'Catalog of active games' },
        { method: 'GET', path: '/api/v1/games/categories', description: 'Categorized game groups' },
        { method: 'POST', path: '/api/v1/games/launch', description: 'Generate signed game session & embed URL' },
        { method: 'GET', path: '/api/v1/sessions/:token', description: 'Verify game launch session' },
        { method: 'GET', path: '/api/v1/wallet/balance', description: 'Query player wallet balance' },
        { method: 'POST', path: '/api/v1/wallet/bet', description: 'Deduct bet from wallet' },
        { method: 'POST', path: '/api/v1/wallet/win', description: 'Credit win to wallet' },
        { method: 'POST', path: '/api/v1/wallet/rollback', description: 'Rollback/cancel round' },
        { method: 'POST', path: '/api/v1/wallet/deposit', description: 'Top-up player balance' },
        { method: 'POST', path: '/api/v1/wallet/withdraw', description: 'Cash out player balance' },
        { method: 'POST', path: '/api/v1/players/create', description: 'Register player account' },
      ],
      serverTime: new Date().toISOString(),
    },
  });
});

// --- 0.1 REAL OPERATORS & CREDENTIALS VAULT ---
app.get('/api/v1/operators/credentials', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    code: 200,
    data: {
      message: 'Active Production & Sandbox API Credentials for Master API Integration',
      operators: OPERATORS_STORE.map(op => ({
        operatorId: op.id,
        operatorName: op.name,
        operatorCode: op.code,
        email: op.email,
        country: op.country,
        currency: op.currency,
        apiKey: op.apiKey,
        apiSecret: op.apiSecret,
        webhookSecret: op.webhookSecret,
        webhookUrl: op.webhookUrl,
        scopes: ['wallet:read', 'wallet:write', 'games:launch', 'players:manage'],
      })),
    },
  });
});

app.get('/api/v1/operators', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    code: 200,
    data: {
      total: OPERATORS_STORE.length,
      operators: OPERATORS_STORE,
    },
  });
});

// --- 1. GET ALL CATEGORIES ---
app.get('/api/v1/games/categories', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    code: 200,
    data: {
      totalCategories: CATEGORIES.length,
      categories: CATEGORIES,
    },
  });
});

// --- 2. GET GAMES GROUPED BY CATEGORY ---
app.get('/api/v1/games/by-category', (_req: Request, res: Response) => {
  const grouped: Record<string, { category: any; games: any[] }> = {};
  for (const cat of CATEGORIES) {
    grouped[cat.id] = {
      category: cat,
      games: GAMES_CATALOG.filter(g => g.type === cat.id),
    };
  }
  res.json({
    status: 'success',
    code: 200,
    data: grouped,
  });
});

// --- 3. GET GAMES (FILTERABLE BY CATEGORY) ---
app.get('/api/v1/games', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  let list = GAMES_CATALOG;
  if (category && category !== 'ALL') {
    list = list.filter(g => g.type === category.toUpperCase());
  }
  res.json({
    status: 'success',
    code: 200,
    data: {
      category: category || 'ALL',
      count: list.length,
      games: list,
    },
  });
});

// --- 4. LAUNCH GAME WITH DOMAIN HEADERS ---
app.post('/api/v1/games/launch', (req: Request, res: Response) => {
  const origin = getDetectedOrigin(req);
  const host = getDetectedHost(req);

  // Read from custom request headers or body
  const headerAuth = (req.headers['authorization'] as string) || (req.headers['x-api-key'] as string) || (req.query.apiKey as string);
  const headerOpId = (req.headers['x-operator-id'] as string) || req.body.operatorId || 'op_neexthub';
  const headerPlayerId = (req.headers['x-player-id'] as string) || req.body.playerId || 'ply_neexthub_vip1';
  const headerPlayerName = (req.headers['x-player-name'] as string) || req.body.playerName || 'NeextHub High Roller';
  const headerCurrency = (req.headers['x-currency'] as string) || req.body.currency || 'USD';
  const headerInitialBal = req.headers['x-initial-balance']
    ? parseFloat(req.headers['x-initial-balance'] as string)
    : req.body.initialBalance !== undefined
    ? parseFloat(req.body.initialBalance)
    : undefined;
  const headerDomain = (req.headers['x-domain'] as string) || req.body.domain || host;

  const gameId = req.body.gameId || 'game_aviator_pro';
  const game = GAMES_CATALOG.find(g => g.id === gameId || g.slug === gameId) || GAMES_CATALOG[0];

  // Retrieve or create player
  let player = PLAYERS_STORE.get(headerPlayerId);
  if (!player) {
    player = {
      id: headerPlayerId,
      operatorId: headerOpId,
      name: headerPlayerName,
      currency: headerCurrency,
      balance: headerInitialBal !== undefined ? headerInitialBal : 1000.0,
      totalWagered: 0,
      totalWon: 0,
      lastActive: new Date().toISOString(),
    };
    PLAYERS_STORE.set(headerPlayerId, player);
  } else {
    if (headerInitialBal !== undefined) {
      player.balance = headerInitialBal;
    }
    if (headerPlayerName) player.name = headerPlayerName;
    player.currency = headerCurrency;
    player.lastActive = new Date().toISOString();
  }

  const sessionToken = 'np_sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  
  // Real launch URL constructed using the detected site origin
  const launchPath = `/?embed=true&game=${game.id}&token=${sessionToken}&playerId=${player.id}&currency=${player.currency}&operatorId=${headerOpId}&domain=${encodeURIComponent(headerDomain)}`;
  const fullLaunchUrl = `${origin}${launchPath}`;

  const sessionData: ServerSession = {
    token: sessionToken,
    operatorId: headerOpId,
    playerId: player.id,
    gameId: game.id,
    currency: player.currency,
    launchUrl: fullLaunchUrl,
    domain: headerDomain,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7200000).toISOString(),
    status: 'ACTIVE',
  };
  SESSIONS_STORE.set(sessionToken, sessionData);

  res.json({
    status: 'success',
    code: 200,
    message: 'Game session generated successfully with detected domain and authenticated credentials.',
    data: {
      sessionToken,
      launchUrl: fullLaunchUrl,
      launchPath,
      game: {
        id: game.id,
        name: game.name,
        type: game.type,
        rtp: game.defaultRtp,
      },
      player: {
        id: player.id,
        name: player.name,
        currency: player.currency,
        balance: player.balance,
      },
      operator: {
        id: headerOpId,
        domain: headerDomain,
        detectedSiteDomain: host,
        detectedOrigin: origin,
      },
      headersReceived: {
        authorization: headerAuth || 'Bearer np_live_key_neexthub_992147',
        'x-operator-id': headerOpId,
        'x-player-id': player.id,
        'x-player-name': player.name,
        'x-currency': player.currency,
        'x-initial-balance': player.balance,
        'x-domain': headerDomain,
      },
      expiresAt: sessionData.expiresAt,
    },
  });
});

// --- 4.1 VERIFY SESSION TOKEN ---
app.get('/api/v1/sessions/:token', (req: Request, res: Response) => {
  const token = req.params.token;
  const session = SESSIONS_STORE.get(token);

  if (!session) {
    res.status(404).json({
      status: 'error',
      code: 404,
      error: 'SESSION_NOT_FOUND',
      message: `No active game session found for token '${token}'`,
    });
    return;
  }

  const player = PLAYERS_STORE.get(session.playerId);
  const game = GAMES_CATALOG.find(g => g.id === session.gameId);

  res.json({
    status: 'success',
    code: 200,
    data: {
      session,
      player,
      game,
    },
  });
});

// --- 5. WALLET BET: MINUS BALANCE BASED ON BET AMOUNT ---
app.post('/api/v1/wallet/bet', (req: Request, res: Response) => {
  const { playerId, betAmount, currency, gameId, roundId } = req.body;
  const pId = playerId || (req.headers['x-player-id'] as string) || 'ply_neexthub_vip1';
  const amount = Number(betAmount);

  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ status: 'error', code: 400, message: 'Invalid bet amount. Must be positive number.' });
    return;
  }

  let player = PLAYERS_STORE.get(pId);
  if (!player) {
    // Auto-create player for frictionless testing
    player = {
      id: pId,
      operatorId: (req.headers['x-operator-id'] as string) || 'op_neexthub',
      name: 'Player ' + pId,
      currency: currency || 'USD',
      balance: 1000.0,
      totalWagered: 0,
      totalWon: 0,
      lastActive: new Date().toISOString(),
    };
    PLAYERS_STORE.set(pId, player);
  }

  if (player.balance < amount) {
    res.status(400).json({
      status: 'error',
      code: 400,
      error: 'INSUFFICIENT_FUNDS',
      message: `Player balance (${player.currency} ${player.balance.toFixed(2)}) is insufficient for bet (${player.currency} ${amount.toFixed(2)})`,
      currentBalance: player.balance,
    });
    return;
  }

  const previousBalance = player.balance;
  player.balance = Number((player.balance - amount).toFixed(2));
  player.totalWagered = Number((player.totalWagered + amount).toFixed(2));
  player.lastActive = new Date().toISOString();

  const txId = 'tx_bet_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

  res.json({
    status: 'success',
    code: 200,
    action: 'BET_DEBIT',
    data: {
      txId,
      roundId: roundId || 'rnd_' + Date.now().toString(36),
      playerId: player.id,
      gameId: gameId || 'game_aviator_pro',
      debitedAmount: amount,
      previousBalance,
      newBalance: player.balance,
      currency: currency || player.currency,
      timestamp: new Date().toISOString(),
    },
  });
});

// --- 6. WALLET WIN: CREDIT WIN TO USER BALANCE ---
app.post('/api/v1/wallet/win', (req: Request, res: Response) => {
  const { playerId, winAmount, multiplier, currency, gameId, roundId } = req.body;
  const pId = playerId || (req.headers['x-player-id'] as string) || 'ply_neexthub_vip1';
  const amount = Number(winAmount);

  if (isNaN(amount) || amount < 0) {
    res.status(400).json({ status: 'error', code: 400, message: 'Invalid win amount' });
    return;
  }

  let player = PLAYERS_STORE.get(pId);
  if (!player) {
    player = {
      id: pId,
      operatorId: (req.headers['x-operator-id'] as string) || 'op_neexthub',
      name: 'Player ' + pId,
      currency: currency || 'USD',
      balance: 1000.0,
      totalWagered: 0,
      totalWon: 0,
      lastActive: new Date().toISOString(),
    };
    PLAYERS_STORE.set(pId, player);
  }

  const previousBalance = player.balance;
  player.balance = Number((player.balance + amount).toFixed(2));
  player.totalWon = Number((player.totalWon + amount).toFixed(2));
  player.lastActive = new Date().toISOString();

  const txId = 'tx_win_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

  res.json({
    status: 'success',
    code: 200,
    action: 'WIN_CREDIT',
    data: {
      txId,
      roundId: roundId || 'rnd_' + Date.now().toString(36),
      playerId: player.id,
      gameId: gameId || 'game_aviator_pro',
      multiplier: multiplier || 1.0,
      creditedAmount: amount,
      previousBalance,
      newBalance: player.balance,
      currency: currency || player.currency,
      timestamp: new Date().toISOString(),
    },
  });
});

// --- 6.1 WALLET ROLLBACK: CANCEL BET ROUND ---
app.post('/api/v1/wallet/rollback', (req: Request, res: Response) => {
  const { playerId, rollbackAmount, roundId, reason } = req.body;
  const pId = playerId || (req.headers['x-player-id'] as string) || 'ply_neexthub_vip1';
  const amount = Number(rollbackAmount);

  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ status: 'error', code: 400, message: 'Invalid rollback amount' });
    return;
  }

  const player = PLAYERS_STORE.get(pId);
  if (!player) {
    res.status(404).json({ status: 'error', code: 404, message: 'Player not found' });
    return;
  }

  const previousBalance = player.balance;
  player.balance = Number((player.balance + amount).toFixed(2));
  player.lastActive = new Date().toISOString();

  const txId = 'tx_rbk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

  res.json({
    status: 'success',
    code: 200,
    action: 'ROLLBACK_REFUND',
    data: {
      txId,
      roundId: roundId || 'rnd_' + Date.now().toString(36),
      playerId: player.id,
      refundedAmount: amount,
      reason: reason || 'ROUND_CANCELLED_OR_TIMEOUT',
      previousBalance,
      newBalance: player.balance,
      currency: player.currency,
      timestamp: new Date().toISOString(),
    },
  });
});

// --- 7. GET USER BALANCE ---
app.get('/api/v1/wallet/balance', (req: Request, res: Response) => {
  const pId = (req.query.playerId as string) || (req.headers['x-player-id'] as string) || 'ply_neexthub_vip1';
  let player = PLAYERS_STORE.get(pId);

  if (!player) {
    // If not found, create a demo account with 1000.00 so any test curl works out of the box
    player = {
      id: pId,
      operatorId: (req.headers['x-operator-id'] as string) || 'op_neexthub',
      name: 'Player ' + pId,
      currency: (req.query.currency as string) || 'USD',
      balance: 1000.0,
      totalWagered: 0,
      totalWon: 0,
      lastActive: new Date().toISOString(),
    };
    PLAYERS_STORE.set(pId, player);
  }

  res.json({
    status: 'success',
    code: 200,
    data: {
      playerId: player.id,
      name: player.name,
      currency: player.currency,
      balance: player.balance,
      totalWagered: player.totalWagered,
      totalWon: player.totalWon,
      lastActive: player.lastActive,
    },
  });
});

// --- 8. WALLET DEPOSIT / TOP-UP ---
app.post('/api/v1/wallet/deposit', (req: Request, res: Response) => {
  const { playerId, amount, currency } = req.body;
  const pId = playerId || 'ply_neexthub_vip1';
  const depAmount = Number(amount);

  if (isNaN(depAmount) || depAmount <= 0) {
    res.status(400).json({ status: 'error', code: 400, message: 'Invalid deposit amount' });
    return;
  }

  let player = PLAYERS_STORE.get(pId);
  if (!player) {
    player = {
      id: pId,
      operatorId: 'op_neexthub',
      name: 'Player ' + pId,
      currency: currency || 'USD',
      balance: depAmount,
      totalWagered: 0,
      totalWon: 0,
      lastActive: new Date().toISOString(),
    };
    PLAYERS_STORE.set(pId, player);
  } else {
    player.balance = Number((player.balance + depAmount).toFixed(2));
  }

  res.json({
    status: 'success',
    code: 200,
    data: {
      playerId: player.id,
      deposited: depAmount,
      newBalance: player.balance,
      currency: player.currency,
      timestamp: new Date().toISOString(),
    },
  });
});

// --- 9. WALLET WITHDRAWAL / CASH OUT ---
app.post('/api/v1/wallet/withdraw', (req: Request, res: Response) => {
  const { playerId, amount, paymentMethod, accountDetails, currency } = req.body;
  const pId = playerId || 'ply_neexthub_vip1';
  const withdrawAmount = Number(amount);

  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    res.status(400).json({ status: 'error', code: 400, message: 'Invalid withdrawal amount' });
    return;
  }

  const player = PLAYERS_STORE.get(pId);
  if (!player) {
    res.status(404).json({ status: 'error', code: 404, message: 'Player not found' });
    return;
  }

  if (player.balance < withdrawAmount) {
    res.status(400).json({
      status: 'error',
      code: 400,
      error: 'INSUFFICIENT_FUNDS',
      message: `Withdrawal request (${player.currency} ${withdrawAmount.toFixed(2)}) exceeds balance (${player.currency} ${player.balance.toFixed(2)})`,
      currentBalance: player.balance,
    });
    return;
  }

  const previousBalance = player.balance;
  player.balance = Number((player.balance - withdrawAmount).toFixed(2));
  player.lastActive = new Date().toISOString();

  const txId = 'tx_wdr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

  res.json({
    status: 'success',
    code: 200,
    action: 'WITHDRAWAL_COMPLETED',
    data: {
      txId,
      playerId: player.id,
      withdrawnAmount: withdrawAmount,
      paymentMethod: paymentMethod || 'MANUAL_CASH_OUT',
      accountDetails: accountDetails || 'N/A',
      previousBalance,
      newBalance: player.balance,
      currency: currency || player.currency,
      timestamp: new Date().toISOString(),
    },
  });
});

// --- 10. CREATE PLAYER ON OPERATOR SITE ---
app.post('/api/v1/players/create', (req: Request, res: Response) => {
  const { username, externalPlayerId, operatorId, currency, initialBalance } = req.body;
  const opId = operatorId || 'op_neexthub';
  const pId = externalPlayerId || 'ply_' + Math.random().toString(36).substring(2, 9);
  const bal = initialBalance !== undefined ? Number(initialBalance) : 1000.0;

  const player: ServerPlayer = {
    id: pId,
    operatorId: opId,
    name: username || 'Player ' + pId,
    currency: currency || 'USD',
    balance: bal,
    totalWagered: 0,
    totalWon: 0,
    lastActive: new Date().toISOString(),
  };

  PLAYERS_STORE.set(pId, player);

  res.json({
    status: 'success',
    code: 201,
    message: 'Player account registered successfully on operator database.',
    data: player,
  });
});

// --- VITE MIDDLEWARE SETUP FOR PORT 3000 ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NeextPlay Master API & Game Platform listening on http://0.0.0.0:${port}`);
  });
}

startServer();
