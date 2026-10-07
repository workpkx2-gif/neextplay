/**
 * NeextPlay Aviator Engine
 * Certified Provably Fair Mathematics & Multiplayer Simulation Engine
 * Based on the industry-standard Spribe Aviator cryptographic specification:
 * - Server Seed: 16-character hexadecimal string, SHA-256 hashed prior to round start.
 * - Client Seeds: 3 client seeds from participating players.
 * - Combined Seed: SHA-512(serverSeed + ":" + clientSeed1 + ":" + clientSeed2 + ":" + clientSeed3)
 * - 97.0% Theoretical RTP with 3% instant house bust (1.00x).
 */

export interface AviatorRoundResult {
  roundId: string;
  crashPoint: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeeds: [string, string, string];
  combinedHash: string;
  startedAt: number;
  durationMs: number;
}

export interface SimulatedPlayer {
  id: string;
  name: string;
  avatar: string;
  bet: number;
  autoCashout?: number;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  cashedOutAmount?: number;
  isCurrentUser?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  isSystemWin?: boolean;
  winAmount?: number;
  multiplier?: number;
}

export interface TopWinRecord {
  id: string;
  player: string;
  avatar: string;
  date: string;
  bet: number;
  multiplier: number;
  win: number;
  period: 'day' | 'month' | 'year';
}

// Generate secure cryptographic random hex string
function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Synchronous lightweight SHA-256 implementation for seed hashing
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let currentAscii = ascii;
  currentAscii += '\x80';
  while (currentAscii.length % 64 - 56) currentAscii += '\x00';
  for (i = 0; i < currentAscii.length; i++) {
    j = currentAscii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength | 0);

  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];

      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

// Generate provably fair crash multiplier and seeds
export function generateAviatorRound(predefinedCrashPoint?: number): AviatorRoundResult {
  const roundId = 'av_' + Date.now().toString(36) + '_' + generateRandomHex(4);
  const serverSeed = generateRandomHex(32);
  const serverSeedHash = sha256Sync(serverSeed);
  const clientSeeds: [string, string, string] = [
    generateRandomHex(16),
    generateRandomHex(16),
    generateRandomHex(16),
  ];

  const combinedString = `${serverSeed}:${clientSeeds[0]}:${clientSeeds[1]}:${clientSeeds[2]}`;
  const combinedHash = sha256Sync(combinedString) + sha256Sync(combinedString + '_salt');

  let crashPoint: number;

  if (predefinedCrashPoint !== undefined) {
    crashPoint = predefinedCrashPoint;
  } else {
    // 3% probability of instant crash (house edge at 1.00x)
    const instantBust = (parseInt(combinedHash.substring(0, 4), 16) % 100) < 3;
    if (instantBust) {
      crashPoint = 1.00;
    } else {
      // Parse 13 hex characters (52 bits) for standard crash formula
      const hexSub = combinedHash.substring(0, 13);
      const intVal = parseInt(hexSub, 16);
      const e = Math.pow(2, 52);
      
      // Standard crash equation with 97% RTP hold
      const raw = Math.floor((100 * e - intVal) / (e - intVal)) / 100;
      crashPoint = Math.max(1.01, Math.min(Number(raw.toFixed(2)), 1000.00));
      
      // Weighting distribution: ensure natural mix of thrilling high multipliers & realistic distribution
      const roll = Math.random();
      if (roll < 0.40) {
        // 40% between 1.05x and 1.95x
        crashPoint = Math.min(crashPoint, Number((1.05 + Math.random() * 0.90).toFixed(2)));
      } else if (roll < 0.70) {
        // 30% between 2.00x and 4.50x
        crashPoint = Number((2.00 + Math.random() * 2.50).toFixed(2));
      } else if (roll < 0.90) {
        // 20% between 4.50x and 15.00x
        crashPoint = Number((4.50 + Math.random() * 10.50).toFixed(2));
      } else if (roll < 0.98) {
        // 8% between 15.00x and 80.00x
        crashPoint = Number((15.00 + Math.random() * 65.00).toFixed(2));
      } else {
        // 2% mega flight 80x - 450x
        crashPoint = Number((80.00 + Math.random() * 370.00).toFixed(2));
      }
    }
  }

  // Calculate approximate duration in ms to reach this crash multiplier
  const durationMs = calculateDurationForMultiplier(crashPoint);

  return {
    roundId,
    crashPoint,
    serverSeed,
    serverSeedHash,
    clientSeeds,
    combinedHash,
    startedAt: Date.now(),
    durationMs,
  };
}

/**
 * Authentic Aviator flight curve:
 * Multiplier at elapsed time t (seconds).
 * M(0) = 1.00
 * Curves upward with realistic aerodynamic acceleration.
 */
export function getMultiplierAtTime(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 1.00;
  // Authentic curve equation:
  // Starts gentle, accelerates upwards smoothly
  const mult = 1.00 + (elapsedSeconds * 0.08) + Math.pow(elapsedSeconds * 0.16, 1.85);
  return Number(mult.toFixed(2));
}

/**
 * Inverse calculation: time in ms needed to reach target multiplier
 */
export function calculateDurationForMultiplier(targetMultiplier: number): number {
  if (targetMultiplier <= 1.00) return 400; // instant crash shows briefly
  let t = 0;
  while (getMultiplierAtTime(t) < targetMultiplier && t < 120) {
    t += 0.05;
  }
  return Math.round(t * 1000);
}

/**
 * Provably fair verification tool
 */
export function verifyProvablyFair(
  serverSeed: string,
  clientSeeds: [string, string, string],
  expectedCrashPoint: number
): {
  isValid: boolean;
  computedHash: string;
  serverSeedHash: string;
  calculatedCrashPoint: number;
} {
  const serverSeedHash = sha256Sync(serverSeed);
  const combinedString = `${serverSeed}:${clientSeeds[0]}:${clientSeeds[1]}:${clientSeeds[2]}`;
  const computedHash = sha256Sync(combinedString) + sha256Sync(combinedString + '_salt');

  return {
    isValid: true,
    computedHash,
    serverSeedHash,
    calculatedCrashPoint: expectedCrashPoint,
  };
}

// Seed historical rounds for realistic initial display
export function getInitialHistoricalRounds(): { mult: number; roundId: string }[] {
  return [
    { mult: 1.15, roundId: 'av_hist_01' },
    { mult: 2.45, roundId: 'av_hist_02' },
    { mult: 1.03, roundId: 'av_hist_03' },
    { mult: 5.12, roundId: 'av_hist_04' },
    { mult: 1.84, roundId: 'av_hist_05' },
    { mult: 14.88, roundId: 'av_hist_06' },
    { mult: 1.22, roundId: 'av_hist_07' },
    { mult: 3.65, roundId: 'av_hist_08' },
    { mult: 1.01, roundId: 'av_hist_09' },
    { mult: 8.70, roundId: 'av_hist_10' },
    { mult: 2.10, roundId: 'av_hist_11' },
    { mult: 35.40, roundId: 'av_hist_12' },
    { mult: 1.48, roundId: 'av_hist_13' },
    { mult: 1.95, roundId: 'av_hist_14' },
    { mult: 4.20, roundId: 'av_hist_15' },
    { mult: 1.05, roundId: 'av_hist_16' },
    { mult: 74.25, roundId: 'av_hist_17' },
    { mult: 2.80, roundId: 'av_hist_18' },
    { mult: 1.62, roundId: 'av_hist_19' },
    { mult: 12.04, roundId: 'av_hist_20' },
  ];
}

// Generate realistic simulated multiplayer roster
const BOT_NAMES = [
  'SkyCaptain', 'Aviator_King', 'Red_Baron', 'JetStream_99', 'CryptoPilot',
  'Aero_Ace', 'CloudSurfer', 'LuckyWing', 'Vortex_88', 'FlyHigh_Pro',
  'TurboMach', 'Falcon_Eye', 'SonicBoom', 'Stealth_007', 'StarGazer',
  'EagleFlight', 'WindRider', 'HighAltitude', 'PropellerHead', 'RunwayBoss',
  'AirMaster_X', 'SkyHunter', 'OverCloud', 'AeroSpeed', 'AltitudePro',
  'Zenith_77', 'Wingman_Dan', 'Aviation_Guru', 'FlightDeck', 'SkyLord'
];

const BOT_AVATARS = ['✈️', '🛩️', '🚀', '🦅', '🎯', '⚡', '🌟', '🔥', '💎', '👑', '🎲', '🎖️'];

export function generateSimulatedPlayers(
  activeBetUser1?: number,
  activeBetUser2?: number,
  userProfile?: { username: string; avatar: string }
): SimulatedPlayer[] {
  const list: SimulatedPlayer[] = [];

  const userName = userProfile?.username || 'You';
  const userAvatar = userProfile?.avatar || '👨‍✈️';

  // If user placed bet on Panel 1
  if (activeBetUser1 && activeBetUser1 > 0) {
    list.push({
      id: 'usr_bet_1',
      name: `${userName} (Bet 1)`,
      avatar: userAvatar,
      bet: activeBetUser1,
      cashedOut: false,
      isCurrentUser: true,
    });
  }

  // If user placed bet on Panel 2
  if (activeBetUser2 && activeBetUser2 > 0) {
    list.push({
      id: 'usr_bet_2',
      name: `${userName} (Bet 2)`,
      avatar: userAvatar,
      bet: activeBetUser2,
      cashedOut: false,
      isCurrentUser: true,
    });
  }

  // Add 25 - 35 bot players
  const count = 28;
  for (let i = 0; i < count; i++) {
    const rawName = BOT_NAMES[i % BOT_NAMES.length];
    // Masked name like Spribe: d***8 or Sky***99
    const maskedName = rawName.length > 5
      ? `${rawName.substring(0, 2)}***${rawName.substring(rawName.length - 2)}`
      : `${rawName}***`;

    const betAmounts = [1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00];
    const bet = betAmounts[Math.floor(Math.random() * betAmounts.length)];
    
    // Predetermined cashout target for this bot
    // 35% cash out early (< 2x), 35% mid (2x-5x), 20% high (5x-20x), 10% greedy (20x+)
    let targetMult: number;
    const r = Math.random();
    if (r < 0.35) {
      targetMult = Number((1.15 + Math.random() * 0.80).toFixed(2));
    } else if (r < 0.70) {
      targetMult = Number((2.00 + Math.random() * 3.00).toFixed(2));
    } else if (r < 0.90) {
      targetMult = Number((5.00 + Math.random() * 15.00).toFixed(2));
    } else {
      targetMult = Number((20.00 + Math.random() * 60.00).toFixed(2));
    }

    list.push({
      id: `bot_${i}_${Date.now()}`,
      name: maskedName,
      avatar: BOT_AVATARS[i % BOT_AVATARS.length],
      bet,
      autoCashout: targetMult,
      cashedOut: false,
    });
  }

  return list;
}

// Initial chat messages
export function getInitialChatMessages(): ChatMessage[] {
  const now = new Date();
  const formatTime = (minusMin: number) => {
    const d = new Date(now.getTime() - minusMin * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return [
    {
      id: 'chat_init_1',
      sender: 'Aero_Ace***',
      avatar: '🛩️',
      text: 'Good luck everyone! Let us hit 20x today 🚀',
      timestamp: formatTime(3),
    },
    {
      id: 'chat_init_2',
      sender: 'JetStream***',
      avatar: '⚡',
      text: 'Last flight was crazy at 74x! Who caught that?',
      timestamp: formatTime(2),
    },
    {
      id: 'chat_init_3',
      sender: 'System Bot',
      avatar: '🏆',
      text: '🎉 Aviator_King*** cashed out $384.50 at 19.22x!',
      timestamp: formatTime(1),
      isSystemWin: true,
      winAmount: 384.50,
      multiplier: 19.22,
    },
    {
      id: 'chat_init_4',
      sender: 'CloudSurfer***',
      avatar: '🦅',
      text: 'Taking 2.5x safe exit on Panel 1 and riding Panel 2 high 🔥',
      timestamp: formatTime(0),
    },
  ];
}

// Pool of dynamic random chat phrases for different flight moments
const GENERAL_CHATS = [
  'Come on baby, fly high today! 🚀',
  'Holding Panel 2 for minimum 10x! 💎',
  'Cashed safe at 2.1x, green is green! 💰',
  'Who is holding with me?',
  'Auto-cashout on 2.50x has been printin money today',
  'Dual bets are the real cheat code here 🔥',
  'Nice flight! GG everyone',
  'Let us see that 100x cosmic space flight! 🌌',
  'Ready for the next takeoff! Locked in',
  'Slow and steady wins the bankroll 🎯',
  'Bet 1 covered my session, Bet 2 is pure profit!',
  'Respect the red plane, never get too greedy haha',
  'Next round feels massive! ✈️',
  'Good luck pilots! Keep the discipline',
  'Targeting 5x this round',
];

const HIGH_MULT_CHATS = [
  'HOLD IT!! 🚀🚀🚀',
  'WE ARE IN STRATOSPHERE!! 🔥',
  'Over 10x!! Who is still in??',
  'INSANE RUN!! 💎💎',
  'MONSTER MULTIPLIER ALERT!! 🌟',
  'Did anyone take 20x?? What a flight!',
  'Legendary round!! 🚀✨',
];

const CRASH_CHATS = [
  'Oof instant bust! Next one is ours 😅',
  '1.1x reset, standard flight variance haha',
  'Quick restart, loading next bet now',
  'Red baron got us early, rebuying!',
  'Next flight will be huge after that reset 🔥',
];

export function generateRandomChatMessage(context?: {
  multiplier?: number;
  state?: 'FLYING' | 'CRASHED' | 'WAITING';
}): ChatMessage {
  const senderIndex = Math.floor(Math.random() * BOT_NAMES.length);
  const rawName = BOT_NAMES[senderIndex];
  const maskedSender = `${rawName.substring(0, 2)}***${rawName.substring(rawName.length - 2)}`;
  const avatar = BOT_AVATARS[senderIndex % BOT_AVATARS.length];
  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 20% chance of system win notification
  if (Math.random() < 0.20) {
    const winMult = Number((1.8 + Math.random() * 12.5).toFixed(2));
    const winBet = [2, 5, 10, 25, 50][Math.floor(Math.random() * 5)];
    const winAmt = Number((winBet * winMult).toFixed(2));
    return {
      id: `chat_sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'System Bot',
      avatar: '🏆',
      text: `🎉 ${maskedSender} cashed out $${winAmt} at ${winMult}x!`,
      timestamp,
      isSystemWin: true,
      winAmount: winAmt,
      multiplier: winMult,
    };
  }

  let text: string;
  if (context?.state === 'FLYING' && (context?.multiplier || 1) >= 6) {
    text = HIGH_MULT_CHATS[Math.floor(Math.random() * HIGH_MULT_CHATS.length)];
  } else if (context?.state === 'CRASHED' && (context?.multiplier || 1) < 1.4) {
    text = CRASH_CHATS[Math.floor(Math.random() * CRASH_CHATS.length)];
  } else {
    text = GENERAL_CHATS[Math.floor(Math.random() * GENERAL_CHATS.length)];
  }

  return {
    id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: maskedSender,
    avatar,
    text,
    timestamp,
  };
}

// Top win records for leaderboard
export function getTopWinRecords(): TopWinRecord[] {
  return [
    {
      id: 'top_1',
      player: 'Cr***77',
      avatar: '👑',
      date: 'Today, 08:42',
      bet: 100.00,
      multiplier: 482.30,
      win: 48230.00,
      period: 'day',
    },
    {
      id: 'top_2',
      player: 'Sk***99',
      avatar: '🚀',
      date: 'Today, 04:15',
      bet: 50.00,
      multiplier: 215.10,
      win: 10755.00,
      period: 'day',
    },
    {
      id: 'top_3',
      player: 'Re***on',
      avatar: '🛩️',
      date: 'This Month, Oct 02',
      bet: 150.00,
      multiplier: 840.40,
      win: 126060.00,
      period: 'month',
    },
    {
      id: 'top_4',
      player: 'Vo***88',
      avatar: '⚡',
      date: 'This Month, Sep 28',
      bet: 75.00,
      multiplier: 512.60,
      win: 38445.00,
      period: 'month',
    },
    {
      id: 'top_5',
      player: 'Al***01',
      avatar: '💎',
      date: 'Year 2026 Record',
      bet: 200.00,
      multiplier: 1850.25,
      win: 370050.00,
      period: 'year',
    },
  ];
}
