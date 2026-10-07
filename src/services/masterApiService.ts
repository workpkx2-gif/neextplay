/**
 * NeextPlay Master API & Game Launch Domain Service
 * Handles:
 * 1. Category hierarchy & games grouping (CRASH, SLOT, LIVE_CASINO, TABLE)
 * 2. Authenticated Domain Header passing for game launch
 * 3. Authoritative User Balance System (Minus on Bet, Plus on Win, Real-time Ledger)
 * 4. External site simulation & live webhook audit trail
 */

import { platform } from './platformStore';
import { GameDefinition, LedgerEntry, GameSession } from '../types';

export interface GameCategory {
  id: 'ALL' | 'CRASH' | 'SLOT' | 'LIVE_CASINO' | 'TABLE';
  name: string;
  badge: string;
  description: string;
  icon: string;
  color: string;
  accentClass: string;
}

export interface LaunchHeaders {
  authorization: string;
  'x-operator-id': string;
  'x-player-id': string;
  'x-player-name': string;
  'x-currency': string;
  'x-initial-balance': number;
  'x-domain': string;
  'x-session-token'?: string;
  'x-signature-hmac'?: string;
}

export interface GameLaunchResult {
  status: 'SUCCESS' | 'ERROR';
  statusCode: number;
  message: string;
  data?: {
    sessionToken: string;
    launchUrl: string;
    game: GameDefinition;
    player: {
      id: string;
      name: string;
      currency: string;
      balance: number;
    };
    operator: {
      id: string;
      code: string;
      name: string;
    };
    headersPassed: LaunchHeaders;
    expiresAt: string;
  };
  error?: string;
}

export interface BalanceEventLog {
  id: string;
  timestamp: string;
  type: 'BET_MINUS' | 'WIN_PLUS' | 'DEPOSIT' | 'WITHDRAWAL' | 'BALANCE_CHECK';
  gameId: string;
  gameName: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  currency: string;
  playerId: string;
  txId: string;
  idempotencyKey: string;
}

type BalanceListener = (balance: number, log?: BalanceEventLog) => void;

class MasterApiService {
  private balanceListeners: BalanceListener[] = [];
  public balanceLogs: BalanceEventLog[] = [];

  public readonly categories: GameCategory[] = [
    {
      id: 'ALL',
      name: 'All Categories',
      badge: 'All Titles',
      description: 'Comprehensive catalogue of all certified iGaming systems.',
      icon: '✨',
      color: '#f59e0b',
      accentClass: 'from-amber-500 to-amber-600',
    },
    {
      id: 'CRASH',
      name: 'Crash & Multiplier',
      badge: 'High Frequency',
      description: 'Provably fair high-speed burst multiplier games with instant cashouts (Aviator NextGen, Neext Velocity).',
      icon: '✈️',
      color: '#ef4444',
      accentClass: 'from-red-600 to-rose-600',
    },
    {
      id: 'SLOT',
      name: 'Video Slots',
      badge: 'Certified RNG',
      description: 'Feature-rich 5x3 video slot mathematics engines with Free Spins, Wild multipliers, and fixed paylines.',
      icon: '🎰',
      color: '#8b5cf6',
      accentClass: 'from-purple-600 to-indigo-600',
    },
    {
      id: 'LIVE_CASINO',
      name: 'Live Casino Tables',
      badge: '4K Ultra-HD',
      description: 'Low-latency live dealer streaming tables with automated OCR ball tracking (Monaco VIP Roulette, Baccarat).',
      icon: '🎙️',
      color: '#10b981',
      accentClass: 'from-emerald-600 to-teal-600',
    },
    {
      id: 'TABLE',
      name: 'RNG Table Games',
      badge: 'Classic Rules',
      description: 'Single-deck blackjack, classic roulette, and baccarat table games.',
      icon: '♠️',
      color: '#06b6d4',
      accentClass: 'from-cyan-600 to-blue-600',
    },
  ];

  /**
   * Subscribe to real-time user balance updates
   */
  public subscribeBalance(listener: BalanceListener): () => void {
    this.balanceListeners.push(listener);
    return () => {
      this.balanceListeners = this.balanceListeners.filter(l => l !== listener);
    };
  }

  private notifyBalance(balance: number, log?: BalanceEventLog) {
    this.balanceListeners.forEach(listener => {
      try {
        listener(balance, log);
      } catch (e) {
        console.error('Balance listener error:', e);
      }
    });
  }

  /**
   * Get all active categories with game counts
   */
  public getCategories() {
    return this.categories.map(cat => {
      const count =
        cat.id === 'ALL'
          ? platform.games.length
          : platform.games.filter(g => g.type === cat.id).length;
      return {
        ...cat,
        gameCount: count,
      };
    });
  }

  /**
   * Get games filtered by category
   */
  public getGamesByCategory(categoryId: 'ALL' | 'CRASH' | 'SLOT' | 'LIVE_CASINO' | 'TABLE' = 'ALL'): GameDefinition[] {
    if (categoryId === 'ALL') {
      return platform.games;
    }
    return platform.games.filter(g => g.type === categoryId);
  }

  /**
   * Get games grouped into category map
   */
  public getGamesGroupedByCategory(): Record<string, { category: GameCategory; games: GameDefinition[] }> {
    const result: Record<string, { category: GameCategory; games: GameDefinition[] }> = {};
    this.categories.forEach(cat => {
      if (cat.id !== 'ALL') {
        result[cat.id] = {
          category: cat,
          games: platform.games.filter(g => g.type === cat.id),
        };
      }
    });
    return result;
  }

  /**
   * Launch game passing Domain Headers and initializing player balance
   */
  public launchGameWithDomainHeaders(params: {
    operatorId: string;
    apiKey?: string;
    playerId: string;
    playerName?: string;
    currency?: string;
    initialBalance?: number;
    gameId: string;
    domain?: string;
    returnUrl?: string;
  }): GameLaunchResult {
    const op = platform.operators.find(o => o.id === params.operatorId) || platform.getActiveOperator();
    const game = platform.games.find(g => g.id === params.gameId) || platform.games[0];
    const currency = params.currency || op.currency || 'USD';
    const domain = params.domain || `${op.code.toLowerCase()}.casino.com`;

    // Find or create player
    let player = platform.players.find(p => p.id === params.playerId || p.externalPlayerId === params.playerId);
    if (!player) {
      player = {
        id: params.playerId,
        operatorId: op.id,
        externalPlayerId: params.playerId,
        username: params.playerName || `${op.code.toLowerCase()}_user_${Date.now().toString(36).substring(3, 7)}`,
        currency,
        balance: params.initialBalance !== undefined ? Number(params.initialBalance) : 1000.00,
        status: 'ACTIVE',
        rgLimits: { dailyDepositLimit: 10000, dailyLossLimit: 5000 },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        totalWagered: 0,
        totalWon: 0,
        sessionCount: 1,
      };
      platform.players.unshift(player);
    } else {
      // If initial balance was explicitly passed in headers, sync player's balance to it
      if (params.initialBalance !== undefined) {
        player.balance = Number(params.initialBalance);
      }
      if (params.playerName) {
        player.username = params.playerName;
      }
      player.currency = currency;
      player.lastActiveAt = new Date().toISOString();
    }

    // Set as active player context in platform
    platform.activePlayerId = player.id;
    platform.selectedOperatorId = op.id;

    // Create Game Session with signed token
    const sessionRes = platform.createGameSession(op.id, player.id, game.id, currency);

    // Build the authentic domain headers
    const rawApiKey = params.apiKey || `np_live_${op.code.toLowerCase()}_${Date.now().toString(36)}`;
    const headersPassed: LaunchHeaders = {
      authorization: `Bearer ${rawApiKey}`,
      'x-operator-id': op.id,
      'x-player-id': player.id,
      'x-player-name': player.username,
      'x-currency': currency,
      'x-initial-balance': player.balance,
      'x-domain': domain,
      'x-session-token': sessionRes.sessionToken,
      'x-signature-hmac': 'hmac_sha256_' + Math.random().toString(36).substring(2, 14),
    };

    // Log the authenticated launch in audit log
    platform.auditLogs.unshift({
      id: 'audit_launch_' + Date.now().toString(36),
      operatorId: op.id,
      actor: `${op.code}_API_GATEWAY`,
      action: 'GAME_SESSION_LAUNCHED_WITH_HEADERS',
      category: 'GAME_ENGINE',
      details: `Launched ${game.name} for player ${player.username} (${player.id}) with initial balance ${currency} ${player.balance.toFixed(2)} via domain ${domain}`,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1',
    });

    this.notifyBalance(player.balance);

    return {
      status: 'SUCCESS',
      statusCode: 200,
      message: 'Game session generated successfully with authenticated headers.',
      data: {
        sessionToken: sessionRes.sessionToken,
        launchUrl: sessionRes.launchUrl,
        game,
        player: {
          id: player.id,
          name: player.username,
          currency: player.currency,
          balance: player.balance,
        },
        operator: {
          id: op.id,
          code: op.code,
          name: op.name,
        },
        headersPassed,
        expiresAt: sessionRes.session.expiresAt,
      },
    };
  }

  /**
   * Deduct user balance based on bet amount (Minus on Bet)
   */
  public executeWalletBet(params: {
    operatorId?: string;
    playerId?: string;
    gameId: string;
    betAmount: number;
    currency?: string;
    roundId?: string;
    panel?: number;
  }): { success: boolean; newBalance: number; previousBalance: number; error?: string; log?: BalanceEventLog } {
    const player = params.playerId
      ? platform.players.find(p => p.id === params.playerId) || platform.getActivePlayer()
      : platform.getActivePlayer();
    
    const opId = params.operatorId || player.operatorId;
    const currency = params.currency || player.currency;
    const game = platform.games.find(g => g.id === params.gameId) || { name: 'Casino Game' };

    if (player.balance < params.betAmount) {
      return {
        success: false,
        newBalance: player.balance,
        previousBalance: player.balance,
        error: 'INSUFFICIENT_BALANCE',
      };
    }

    const previousBalance = player.balance;
    const idempotencyKey = `idem_bet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const walletRes = platform.executeWalletTransaction({
      operatorId: opId,
      playerId: player.id,
      type: 'BET',
      amount: params.betAmount,
      currency,
      idempotencyKey,
      roundId: params.roundId,
      metadata: { gameId: params.gameId, panel: params.panel },
    });

    if (!walletRes.success) {
      return {
        success: false,
        newBalance: player.balance,
        previousBalance,
        error: walletRes.error,
      };
    }

    const eventLog: BalanceEventLog = {
      id: 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'BET_MINUS',
      gameId: params.gameId,
      gameName: game.name,
      amount: params.betAmount,
      previousBalance,
      newBalance: walletRes.newBalance,
      currency,
      playerId: player.id,
      txId: walletRes.ledgerEntry?.id || 'tx_' + Date.now().toString(36),
      idempotencyKey,
    };

    this.balanceLogs.unshift(eventLog);
    if (this.balanceLogs.length > 50) this.balanceLogs.pop();

    this.notifyBalance(walletRes.newBalance, eventLog);

    return {
      success: true,
      newBalance: walletRes.newBalance,
      previousBalance,
      log: eventLog,
    };
  }

  /**
   * Credit user balance with win amount (Plus on Win)
   */
  public executeWalletWin(params: {
    operatorId?: string;
    playerId?: string;
    gameId: string;
    winAmount: number;
    multiplier?: number;
    currency?: string;
    roundId?: string;
    panel?: number;
  }): { success: boolean; newBalance: number; previousBalance: number; error?: string; log?: BalanceEventLog } {
    const player = params.playerId
      ? platform.players.find(p => p.id === params.playerId) || platform.getActivePlayer()
      : platform.getActivePlayer();
    
    const opId = params.operatorId || player.operatorId;
    const currency = params.currency || player.currency;
    const game = platform.games.find(g => g.id === params.gameId) || { name: 'Casino Game' };

    const previousBalance = player.balance;
    const idempotencyKey = `idem_win_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const walletRes = platform.executeWalletTransaction({
      operatorId: opId,
      playerId: player.id,
      type: 'WIN',
      amount: params.winAmount,
      currency,
      idempotencyKey,
      roundId: params.roundId,
      metadata: { gameId: params.gameId, multiplier: params.multiplier, panel: params.panel },
    });

    const eventLog: BalanceEventLog = {
      id: 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'WIN_PLUS',
      gameId: params.gameId,
      gameName: game.name,
      amount: params.winAmount,
      previousBalance,
      newBalance: walletRes.newBalance,
      currency,
      playerId: player.id,
      txId: walletRes.ledgerEntry?.id || 'tx_' + Date.now().toString(36),
      idempotencyKey,
    };

    this.balanceLogs.unshift(eventLog);
    if (this.balanceLogs.length > 50) this.balanceLogs.pop();

    this.notifyBalance(walletRes.newBalance, eventLog);

    return {
      success: true,
      newBalance: walletRes.newBalance,
      previousBalance,
      log: eventLog,
    };
  }

  /**
   * Top-Up or Deposit to player balance
   */
  public depositBalance(amount: number, playerId?: string): number {
    const player = playerId
      ? platform.players.find(p => p.id === playerId) || platform.getActivePlayer()
      : platform.getActivePlayer();
    
    const previousBalance = player.balance;
    const idempotencyKey = `idem_dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const walletRes = platform.executeWalletTransaction({
      operatorId: player.operatorId,
      playerId: player.id,
      type: 'DEPOSIT',
      amount,
      currency: player.currency,
      idempotencyKey,
      metadata: { channel: 'OPERATOR_SEAMLESS_TOPUP' },
    });

    const eventLog: BalanceEventLog = {
      id: 'log_' + Date.now().toString(36),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'DEPOSIT',
      gameId: 'system_wallet',
      gameName: 'Operator Balance Top-Up',
      amount,
      previousBalance,
      newBalance: walletRes.newBalance,
      currency: player.currency,
      playerId: player.id,
      txId: walletRes.ledgerEntry?.id || 'tx_dep',
      idempotencyKey,
    };

    this.balanceLogs.unshift(eventLog);
    this.notifyBalance(walletRes.newBalance, eventLog);

    return walletRes.newBalance;
  }

  /**
   * Withdraw from player balance (Cash Out)
   */
  public withdrawBalance(
    amount: number,
    playerId?: string,
    metadata?: { method: string; account: string }
  ): { success: boolean; newBalance: number; error?: string } {
    const player = playerId
      ? platform.players.find(p => p.id === playerId) || platform.getActivePlayer()
      : platform.getActivePlayer();

    if (player.balance < amount) {
      return { success: false, newBalance: player.balance, error: 'INSUFFICIENT_BALANCE' };
    }

    const previousBalance = player.balance;
    const idempotencyKey = `idem_wdr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const walletRes = platform.executeWalletTransaction({
      operatorId: player.operatorId,
      playerId: player.id,
      type: 'WITHDRAWAL',
      amount,
      currency: player.currency,
      idempotencyKey,
      metadata: { channel: metadata?.method || 'MANUAL_CASH_OUT', account: metadata?.account },
    });

    if (!walletRes.success) {
      return { success: false, newBalance: player.balance, error: walletRes.error };
    }

    const eventLog: BalanceEventLog = {
      id: 'log_' + Date.now().toString(36),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'WITHDRAWAL',
      gameId: 'system_wallet',
      gameName: `Payout (${metadata?.method || 'Cash Out'})`,
      amount,
      previousBalance,
      newBalance: walletRes.newBalance,
      currency: player.currency,
      playerId: player.id,
      txId: walletRes.ledgerEntry?.id || 'tx_wdr',
      idempotencyKey,
    };

    this.balanceLogs.unshift(eventLog);
    this.notifyBalance(walletRes.newBalance, eventLog);

    return { success: true, newBalance: walletRes.newBalance };
  }

  /**
   * Reset or set explicit player balance
   */
  public setPlayerBalance(newAmount: number, playerId?: string): number {
    const player = playerId
      ? platform.players.find(p => p.id === playerId) || platform.getActivePlayer()
      : platform.getActivePlayer();
    
    const delta = newAmount - player.balance;
    if (delta > 0) {
      return this.depositBalance(delta, player.id);
    } else if (delta < 0) {
      const absAmount = Math.abs(delta);
      const idempotencyKey = `idem_adj_${Date.now()}`;
      platform.executeWalletTransaction({
        operatorId: player.operatorId,
        playerId: player.id,
        type: 'WITHDRAWAL',
        amount: absAmount,
        currency: player.currency,
        idempotencyKey,
      });
      this.notifyBalance(player.balance);
      return player.balance;
    }
    return player.balance;
  }
}

export const masterApi = new MasterApiService();
