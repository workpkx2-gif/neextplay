/**
 * NeextPlay Live Casino Provider Adapter Layer
 * Integrates external and simulated high-definition live tables
 */

import { LiveDealerTable } from '../types';

export interface LiveProviderState {
  providerName: string;
  status: 'ONLINE' | 'DEGRADED' | 'FAILOVER';
  latencyMs: number;
  activeTables: LiveDealerTable[];
}

export const INITIAL_LIVE_TABLES: LiveDealerTable[] = [
  {
    id: 'live_roulette_01',
    name: 'Monaco VIP Lightning Roulette',
    game: 'ROULETTE',
    dealerName: 'Anastasia V.',
    dealerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'BETTING_OPEN',
    secondsRemaining: 14,
    minBet: 1,
    maxBet: 5000,
    currentRoundId: 'ROU-9924-01',
    lastResults: [32, 15, 19, 4, 21, 2, 25, 17, 34, 6],
    streamQuality: '4K UHD',
  },
  {
    id: 'live_blackjack_01',
    name: 'Neext Royale Blackjack 7-Seat',
    game: 'BLACKJACK',
    dealerName: 'Marcus Sterling',
    dealerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'ROUND_IN_PROGRESS',
    secondsRemaining: 6,
    minBet: 10,
    maxBet: 10000,
    currentRoundId: 'BJ-8831-44',
    lastResults: ['Dealer 20', 'Player 21', 'Push 19', 'Player 18', 'Dealer Bust'],
    streamQuality: '1080p 60fps',
  },
  {
    id: 'live_baccarat_01',
    name: 'Macau Imperial Speed Baccarat',
    game: 'BACCARAT',
    dealerName: 'Li Wei',
    dealerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'BETTING_OPEN',
    secondsRemaining: 9,
    minBet: 5,
    maxBet: 25000,
    currentRoundId: 'BAC-7742-19',
    lastResults: ['B', 'P', 'B', 'B', 'T', 'P', 'B', 'P'],
    streamQuality: '4K UHD',
  },
];
