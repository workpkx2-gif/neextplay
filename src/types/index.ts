/**
 * NeextPlay - B2B Gaming Provider Platform
 * Core Domain Types & Data Contracts
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'FINANCE' | 'SUPPORT' | 'VIEWER';

export type OperatorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';

export interface Operator {
  id: string;
  name: string;
  code: string;
  email: string;
  country: string;
  status: OperatorStatus;
  currency: string;
  allowedCurrencies: string[];
  createdAt: string;
  totalGgr: number;
  totalTurnover: number;
  companyBalance: number;
  activePlayers: number;
  ipWhitelist: string[];
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface ApiCredential {
  id: string;
  operatorId: string;
  name: string;
  clientId: string;
  clientSecretHash: string;
  rawSecretDisplay?: string; // shown once upon creation
  status: 'ACTIVE' | 'REVOKED';
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export type GameType = 'SLOT' | 'CRASH' | 'TABLE' | 'LIVE_CASINO' | 'ARCADE';
export type GameStatus = 'ACTIVE' | 'MAINTENANCE' | 'DISABLED' | 'DRAFT';

export interface GameDefinition {
  id: string;
  slug: string;
  name: string;
  type: GameType;
  provider: string;
  version: string;
  status: GameStatus;
  thumbnail: string;
  description: string;
  defaultRtp: number;
  availableRtpProfiles: {
    id: string;
    label: string;
    rtp: number;
    volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  }[];
  minBet: number;
  maxBet: number;
  maxMultiplier: number;
  features: string[];
  linesCount?: number;
  releaseDate: string;
}

export interface OperatorGameConfig {
  gameId: string;
  operatorId: string;
  enabled: boolean;
  selectedRtpProfileId: string;
  minBet: number;
  maxBet: number;
  allowedCurrencies: string[];
  jackpotContributionPct: number;
}

export type PlayerStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'SELF_EXCLUDED';

export interface ResponsibleGamingLimits {
  dailyDepositLimit?: number;
  dailyLossLimit?: number;
  sessionTimeMinutes?: number;
  coolingOffUntil?: string;
}

export interface Player {
  id: string;
  operatorId: string;
  externalPlayerId: string;
  username: string;
  currency: string;
  balance: number;
  status: PlayerStatus;
  rgLimits: ResponsibleGamingLimits;
  createdAt: string;
  lastActiveAt: string;
  totalWagered: number;
  totalWon: number;
  sessionCount: number;
  avatar?: string;
  vipLevel?: number;
  vipPoints?: number;
  bestMultiplier?: number;
  isAutoRegistered?: boolean;
}

export interface GameSession {
  id: string;
  token: string;
  operatorId: string;
  playerId: string;
  gameId: string;
  currency: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  device: string;
}

export type LedgerTransactionType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'BET' 
  | 'WIN' 
  | 'REFUND' 
  | 'REVERSAL' 
  | 'ADJUSTMENT' 
  | 'COMMISSION';

export interface LedgerEntry {
  id: string;
  operatorId: string;
  playerId: string;
  roundId?: string;
  idempotencyKey: string;
  type: LedgerTransactionType;
  debit: number;
  credit: number;
  balanceAfter: number;
  currency: string;
  timestamp: string;
  status: 'COMPLETED' | 'FAILED' | 'REVERSED';
  metadata?: Record<string, unknown>;
}

export interface GameRound {
  id: string;
  operatorId: string;
  playerId: string;
  gameId: string;
  roundId: string;
  sessionId: string;
  betAmount: number;
  winAmount: number;
  payoutMultiplier: number;
  currency: string;
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  timestamp: string;
  rngSeed: string;
  details: Record<string, unknown>;
}

export interface WebhookEventRecord {
  id: string;
  operatorId: string;
  eventType: 'GAME_ROUND_COMPLETED' | 'WALLET_TRANSACTION' | 'PLAYER_STATUS_CHANGED' | 'SUSPICIOUS_RISK_TRIGGER';
  payload: Record<string, unknown>;
  signature: string;
  endpointUrl: string;
  statusCode: number;
  deliveredAt: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface RiskRule {
  id: string;
  name: string;
  description: string;
  triggerType: 'WIN_MULTIPLIER' | 'RAPID_BETS' | 'NEGATIVE_DELTA' | 'BOT_PATTERN' | 'LOCATION_SWITCH';
  threshold: number;
  action: 'ALLOW' | 'FLAG_REVIEW' | 'TEMP_SUSPEND' | 'BLOCK';
  enabled: boolean;
}

export interface RiskAlert {
  id: string;
  operatorId: string;
  playerId: string;
  ruleName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  timestamp: string;
  resolved: boolean;
}

export interface AuditLog {
  id: string;
  operatorId?: string;
  actor: string;
  action: string;
  category: 'AUTH' | 'CONFIG' | 'WALLET' | 'GAME_ENGINE' | 'RISK';
  details: string;
  timestamp: string;
  ip: string;
}

export interface SlotSpinResult {
  roundId: string;
  grid: string[][]; // 5 columns x 3 rows
  winningLines: {
    lineIndex: number;
    symbol: string;
    count: number;
    payout: number;
    positions: [number, number][]; // [col, row]
  }[];
  isFreeSpinsTriggered: boolean;
  freeSpinsAwarded: number;
  totalPayout: number;
  payoutMultiplier: number;
  clientSeed: string;
  serverSeedHash: string;
  nextBalance: number;
}

export interface LiveDealerTable {
  id: string;
  name: string;
  game: 'ROULETTE' | 'BLACKJACK' | 'BACCARAT';
  dealerName: string;
  dealerAvatar: string;
  status: 'BETTING_OPEN' | 'ROUND_IN_PROGRESS' | 'SETTLING';
  secondsRemaining: number;
  minBet: number;
  maxBet: number;
  currentRoundId: string;
  lastResults: (string | number)[];
  streamQuality: '1080p 60fps' | '4K UHD';
}
