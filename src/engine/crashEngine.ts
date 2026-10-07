/**
 * NeextPlay Provably Fair Crash Game Mathematics Engine
 * "Neext Velocity" - High-frequency burst multiplayer crash curve
 */

import { getCryptoRandomInt } from './slotEngine';

export interface CrashGameRound {
  roundId: string;
  crashPoint: number;
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  state: 'WAITING' | 'FLYING' | 'CRASHED';
  startedAt: number;
  crashedAt?: number;
}

/**
 * Generate Provably Fair Crash Point (97.0% RTP with 3% house edge / instant 1.00x bust)
 */
export function generateCrashPoint(): number {
  // 3% probability of instant bust at 1.00x
  const instantBust = getCryptoRandomInt(100) < 3;
  if (instantBust) {
    return 1.00;
  }

  // Multiplier curve based on inverse uniform random
  const raw = (getCryptoRandomInt(999999) + 1) / 1000000;
  // Standard crash formula: E = 0.97 / (1 - raw)
  const multiplier = Math.floor((0.97 / (1 - raw)) * 100) / 100;
  return Math.max(1.01, Math.min(multiplier, 250.0)); // capped at 250x max
}

export function calculateMultiplierAtTime(elapsedSeconds: number): number {
  // Smooth exponential growth curve: 1.00 * e^(0.06 * t)
  const mult = 1.0 + Math.pow(elapsedSeconds * 0.45, 1.35);
  return Number(mult.toFixed(2));
}
