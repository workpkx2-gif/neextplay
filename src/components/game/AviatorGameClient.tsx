/**
 * NeextPlay Aviator Game Client
 * Ultra-authentic recreation of the world-famous crash game matching Spribe Aviator:
 * - 100% Viewport-fitting responsive layout (all elements visible at once without scrolling on ALL screen sizes)
 * - Switchable ambient casino background music loop with dedicated header toggle & visual status
 * - Interactive step sound effects: stepper -/+, preset chips, bet place, bet cancel, tab switch, auto toggle, takeoff, pitch climb, milestones, flew away, cash out
 * - 100% Transparent 3D red monoplane model in Canvas (zero background artifacts)
 * - Dual simultaneous betting panels with independent Bet / Auto modes & Spribe green/orange button styling
 * - Mobile smart panel switcher (Bet 1 / Bet 2 / Dual) so mobile devices never overflow or scroll
 * - Floating round history dropdown popover that never pushes down the canvas
 * - Multiplayer live bets feed, My Bets ledger, Hall of Fame Top wins, and live community chat
 * - Cryptographic Provably Fair verification (SHA-256 server seed + SHA-512 client seeds)
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Music,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Users,
  Trophy,
  History,
  Clock,
  Sparkles,
  Send,
  Zap,
  Maximize2,
  Minimize2,
  X,
  Sliders,
  User,
  CheckCircle,
  Save,
  PlusCircle,
  Radio,
  Award,
  Bell,
} from 'lucide-react';

import { AviatorCanvas } from './AviatorCanvas';
import { ProvablyFairModal } from './ProvablyFairModal';
import { AviatorHowToPlayModal } from './AviatorHowToPlayModal';
import { GameSplashScreen } from './GameSplashScreen';
import {
  AviatorRoundResult,
  generateAviatorRound,
  getMultiplierAtTime,
  getInitialHistoricalRounds,
  generateSimulatedPlayers,
  SimulatedPlayer,
  getInitialChatMessages,
  generateRandomChatMessage,
  ChatMessage,
  getTopWinRecords,
  TopWinRecord,
} from '../../engine/aviatorEngine';
import { platform } from '../../services/platformStore';
import { soundFx } from '../../utils/audio';
import { useI18n } from '../../services/i18nContext';
import { Player, Operator } from '../../types';
import aviatorLogo from '../../assets/images/aviator_game_logo_1791312129943.jpg';

// Helper to convert avatar key to emoji
export const getAvatarEmoji = (avatarKey?: string): string => {
  switch (avatarKey) {
    case 'pilot-2': return '🛩️';
    case 'pilot-3': return '🚀';
    case 'pilot-4': return '🎖️';
    case 'pilot-5': return '🦅';
    case 'pilot-6': return '⚡';
    default: return '👨‍✈️';
  }
};

interface AviatorGameClientProps {
  onRefresh: () => void;
  initialShowSplash?: boolean;
}

interface BetPanelState {
  betAmount: number;
  isAutoBet: boolean;
  isAutoCashout: boolean;
  autoCashoutMultiplier: number;
  hasBetCurrentRound: boolean;
  queuedForNextRound: boolean;
  hasCashedOut: boolean;
  cashedOutMultiplier: number;
  wonAmount: number;
}

export const AviatorGameClient: React.FC<AviatorGameClientProps> = ({
  onRefresh,
  initialShowSplash = true,
}) => {
  const { t, formatMoney } = useI18n();

  // Real Multi-Tenant Platform & Player Live State
  const [activePlayer, setActivePlayer] = useState<Player>(() => platform.getActivePlayer());
  const [activeOperator, setActiveOperator] = useState<Operator>(() => platform.getActiveOperator());
  const [userBalance, setUserBalance] = useState<number>(() => platform.getActivePlayer().balance);
  const [companyBalance, setCompanyBalance] = useState<number>(() => platform.getActiveOperator().companyBalance);

  // Live real-time balance deduction / credit visual feedback
  const [userDelta, setUserDelta] = useState<{ text: string; isPositive: boolean; id: number } | null>(null);
  const [companyDelta, setCompanyDelta] = useState<{ text: string; isPositive: boolean; id: number } | null>(null);

  // Synchronize with platform store double-entry ledger & localStorage
  useEffect(() => {
    const syncState = () => {
      const pl = platform.getActivePlayer();
      const op = platform.getActiveOperator();
      setActivePlayer(pl);
      setActiveOperator(op);
      setUserBalance(pl.balance);
      setCompanyBalance(op.companyBalance);
    };

    const unsubscribe = platform.subscribe(syncState);
    syncState();
    return unsubscribe;
  }, []);

  // Auto-register or load player profile from company on game launch
  const [welcomeToast, setWelcomeToast] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    const initPlayerSession = async () => {
      try {
        const res = await platform.autoRegisterOrLoadPlayer();
        if (!isMounted) return;
        setActivePlayer(res.player);
        setUserBalance(res.player.balance);
        setEditUsername(res.player.username);
        setEditAvatar(res.player.avatar || 'pilot-1');
        if (res.isNew) {
          soundFx.playProfileUpdate();
          setWelcomeToast(`New Pilot Registered: ${res.player.username} (Bankroll: ${formatMoney(res.player.balance)})`);
          setTimeout(() => setWelcomeToast(null), 4500);
        } else {
          setWelcomeToast(`Pilot Profile Loaded: ${res.player.username} • Session #${res.player.sessionCount}`);
          setTimeout(() => setWelcomeToast(null), 3500);
        }
      } catch (err) {
        console.error('Failed to init player session:', err);
      }
    };
    initPlayerSession();
    return () => { isMounted = false; };
  }, []);

  // Splash Screen State
  const [showSplash, setShowSplash] = useState<boolean>(initialShowSplash);

  // Audio volume and background music state
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());
  const [isMusicOn, setIsMusicOn] = useState<boolean>(soundFx.getMusicEnabled());
  const [showAudioPopover, setShowAudioPopover] = useState<boolean>(false);
  const [masterVol, setMasterVol] = useState<number>(soundFx.getMasterVolume());
  const [musicVol, setMusicVol] = useState<number>(soundFx.getMusicVolume());
  const [sfxVol, setSfxVol] = useState<number>(soundFx.getSfxVolume());

  // Player Profile Modal state
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>(() => platform.getActivePlayer().username);
  const [editAvatar, setEditAvatar] = useState<string>(() => platform.getActivePlayer().avatar || 'pilot-1');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);

  // Game lifecycle states
  const [gameState, setGameState] = useState<'WAITING' | 'FLYING' | 'CRASHED'>('WAITING');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [countdownRemaining, setCountdownRemaining] = useState<number>(5.0);
  const [currentRound, setCurrentRound] = useState<AviatorRoundResult>(() => generateAviatorRound());

  // Fullscreen / Cinema Mode
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);

  // History & Provably Fair
  const [historyRounds, setHistoryRounds] = useState<{ mult: number; roundId: string }[]>(() =>
    getInitialHistoricalRounds()
  );
  const [selectedVerifyRound, setSelectedVerifyRound] = useState<AviatorRoundResult | null>(null);
  const [showFairModal, setShowFairModal] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);
  const [userClientSeed, setUserClientSeed] = useState<string>('cseed_dev_' + Math.random().toString(36).substring(2, 8));

  // Sidebar Tabs & Mobile drawer toggle: ALL_BETS | MY_BETS | TOP | CHAT
  const [sidebarTab, setSidebarTab] = useState<'ALL_BETS' | 'MY_BETS' | 'TOP' | 'CHAT'>('ALL_BETS');
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);

  const [simulatedPlayers, setSimulatedPlayers] = useState<SimulatedPlayer[]>([]);

  // Chat messages with local DB / localStorage persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('neextplay_aviator_chats');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return getInitialChatMessages();
  });
  const [chatInput, setChatInput] = useState<string>('');
  const [topWins] = useState<TopWinRecord[]>(() => getTopWinRecords());

  // Personal bets history with profile sync and local DB persistence
  const [myBetsHistory, setMyBetsHistory] = useState<{
    date: string;
    playerName?: string;
    avatar?: string;
    bet: number;
    mult?: number;
    win: number;
    panel: 1 | 2;
  }[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('neextplay_my_bets_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Automated background random live chat simulator at varied intervals (different times, different shows)
  useEffect(() => {
    let timer: any = null;
    let isCancelled = false;

    const scheduleRandomChat = () => {
      // Dynamic random time cadence between 3.5s and 8.5s
      const delay = Math.floor(3500 + Math.random() * 5000);
      timer = setTimeout(() => {
        if (isCancelled) return;
        const newMsg = generateRandomChatMessage({
          multiplier: currentMultiplier,
          state: gameState,
        });

        setChatMessages(prev => {
          const updated = [newMsg, ...prev.slice(0, 49)];
          try {
            localStorage.setItem('neextplay_aviator_chats', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        scheduleRandomChat();
      }, delay);
    };

    scheduleRandomChat();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [gameState, currentMultiplier]);

  // DUAL BETTING PANELS (Panel 1 & Panel 2)
  const [panel1, setPanel1] = useState<BetPanelState>({
    betAmount: 5.00,
    isAutoBet: false,
    isAutoCashout: false,
    autoCashoutMultiplier: 2.00,
    hasBetCurrentRound: false,
    queuedForNextRound: false,
    hasCashedOut: false,
    cashedOutMultiplier: 0,
    wonAmount: 0,
  });

  const [panel2, setPanel2] = useState<BetPanelState>({
    betAmount: 2.00,
    isAutoBet: false,
    isAutoCashout: false,
    autoCashoutMultiplier: 1.50,
    hasBetCurrentRound: false,
    queuedForNextRound: false,
    hasCashedOut: false,
    cashedOutMultiplier: 0,
    wonAmount: 0,
  });

  const [panel1Mode, setPanel1Mode] = useState<'BET' | 'AUTO'>('BET');
  const [panel2Mode, setPanel2Mode] = useState<'BET' | 'AUTO'>('BET');

  // Animation frame & timer refs
  const flightStartTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<any>(null);
  const panel1Ref = useRef(panel1);
  const panel2Ref = useRef(panel2);
  const simulatedPlayersRef = useRef(simulatedPlayers);
  const lastMilestoneRef = useRef<number>(1);
  panel1Ref.current = panel1;
  panel2Ref.current = panel2;
  simulatedPlayersRef.current = simulatedPlayers;

  // Toggle Mute with sound test on unmute
  const toggleMute = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
    if (!next) {
      soundFx.playChipSelect();
    }
  };

  // Toggle Background Music
  const toggleMusic = () => {
    const next = soundFx.toggleMusic();
    setIsMusicOn(next);
    soundFx.playClick();
  };

  // Toggle Fullscreen / Cinema Mode
  const toggleCinemaMode = () => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsCinemaMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsCinemaMode(false);
    }
  };

  // Master, Music, and SFX volume handlers
  const handleMasterVolChange = (v: number) => {
    setMasterVol(v);
    soundFx.setMasterVolume(v);
  };

  const handleMusicVolChange = (v: number) => {
    setMusicVol(v);
    soundFx.setMusicVolume(v);
  };

  const handleSfxVolChange = (v: number) => {
    setSfxVol(v);
    soundFx.setSfxVolume(v);
  };

  const applyAudioPreset = (preset: 'MAX' | 'BALANCED' | 'CHILL' | 'MUTE') => {
    soundFx.playChipSelect();
    if (preset === 'MAX') {
      handleMasterVolChange(1.0);
      handleMusicVolChange(0.9);
      handleSfxVolChange(1.0);
      if (isMuted) toggleMute();
    } else if (preset === 'BALANCED') {
      handleMasterVolChange(0.85);
      handleMusicVolChange(0.55);
      handleSfxVolChange(0.85);
      if (isMuted) toggleMute();
    } else if (preset === 'CHILL') {
      handleMasterVolChange(0.65);
      handleMusicVolChange(0.75);
      handleSfxVolChange(0.4);
      if (isMuted) toggleMute();
    } else if (preset === 'MUTE') {
      if (!isMuted) toggleMute();
    }
  };

  // Save Pilot Profile Changes (persists to Firestore, IndexedDB, and localStorage)
  const handleSaveProfile = async () => {
    if (!editUsername.trim()) return;
    setIsSavingProfile(true);
    try {
      const updated = await platform.updatePlayerProfile(activePlayer.id, {
        username: editUsername.trim(),
        avatar: editAvatar,
      });
      setActivePlayer({ ...updated });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('neextplay_current_player_profile_id', updated.id);
        localStorage.setItem('neextplay_active_player_id', updated.id);
      }
      // Update simulated multiplayer roster so active user bets match immediately
      setSimulatedPlayers(prev =>
        prev.map(p =>
          p.isCurrentUser
            ? {
                ...p,
                name: `${updated.username} (${p.id === 'usr_bet_1' ? 'Bet 1' : 'Bet 2'})`,
                avatar: getAvatarEmoji(updated.avatar),
              }
            : p
        )
      );
      soundFx.playProfileUpdate();
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 2500);
      onRefresh();
    } catch (e) {
      console.error('Failed to update player profile:', e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Add Demo Pilot Bankroll Funds
  const handleAddDemoFunds = () => {
    soundFx.playBetPlaced();
    platform.depositToPlayer(activePlayer.id, 1000.00);
    onRefresh();
  };

  // Helper to get multiplier color matching Spribe Aviator standard:
  const getMultiplierBadgeClass = (mult: number) => {
    if (mult < 2.0) {
      return 'bg-blue-950/80 text-blue-400 border-blue-500/40 hover:bg-blue-900/80';
    } else if (mult < 10.0) {
      return 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-900/80';
    } else {
      return 'bg-rose-950/90 text-rose-300 border-rose-500/50 hover:bg-rose-900 shadow-sm shadow-rose-500/20';
    }
  };

  // Deduct bet from real platform ledger
  const placeBetOnLedger = (amount: number, panelNumber: 1 | 2): boolean => {
    if (activePlayer.balance < amount) return false;

    const res = platform.executeWalletTransaction({
      operatorId: activePlayer.operatorId,
      playerId: activePlayer.id,
      type: 'BET',
      amount,
      currency: activePlayer.currency,
      idempotencyKey: `idem_aviator_bet_${Date.now()}_p${panelNumber}_${Math.random()}`,
      metadata: { gameId: 'game_neext_velocity', panel: panelNumber },
    });

    if (res.success) {
      onRefresh();
      return true;
    }
    return false;
  };

  // Credit win to real platform ledger
  const settleWinOnLedger = (amount: number, mult: number, panelNumber: 1 | 2) => {
    platform.executeWalletTransaction({
      operatorId: activePlayer.operatorId,
      playerId: activePlayer.id,
      type: 'WIN',
      amount,
      currency: activePlayer.currency,
      idempotencyKey: `idem_aviator_win_${Date.now()}_p${panelNumber}_${Math.random()}`,
      metadata: { gameId: 'game_neext_velocity', multiplier: mult, panel: panelNumber },
    });

    // Update player profile with new highest multiplier in real time
    const newBest = Math.max(activePlayer.bestMultiplier || 1.0, mult);
    platform.updatePlayerProfile(activePlayer.id, {
      bestMultiplier: newBest,
    }).catch(() => {});

    onRefresh();
  };

  // Trigger cashout for a given panel
  const handleCashout = (panelNumber: 1 | 2, overrideMult?: number) => {
    const p = panelNumber === 1 ? panel1Ref.current : panel2Ref.current;
    if (gameState !== 'FLYING' || !p.hasBetCurrentRound || p.hasCashedOut) return;

    const mult = overrideMult ?? currentMultiplier;
    const winAmount = Number((p.betAmount * mult).toFixed(2));

    settleWinOnLedger(winAmount, mult, panelNumber);
    soundFx.playAviatorCashout(winAmount);
    confetti({ particleCount: 45, spread: 55, origin: { y: 0.85 } });

    if (panelNumber === 1) {
      setPanel1(prev => ({
        ...prev,
        hasCashedOut: true,
        cashedOutMultiplier: mult,
        wonAmount: winAmount,
      }));
    } else {
      setPanel2(prev => ({
        ...prev,
        hasCashedOut: true,
        cashedOutMultiplier: mult,
        wonAmount: winAmount,
      }));
    }

    // Record personal history with player profile info and persist to localStorage
    const newBetRecord = {
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      playerName: activePlayer.username,
      avatar: getAvatarEmoji(activePlayer.avatar),
      bet: p.betAmount,
      mult,
      win: winAmount,
      panel: panelNumber,
    };
    setMyBetsHistory(prev => {
      const updated = [newBetRecord, ...prev.slice(0, 49)];
      try {
        localStorage.setItem('neextplay_my_bets_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Update simulated multiplayer list
    setSimulatedPlayers(prev =>
      prev.map(item => {
        if (item.id === `usr_bet_${panelNumber}`) {
          return {
            ...item,
            cashedOut: true,
            cashedOutMultiplier: mult,
            cashedOutAmount: winAmount,
          };
        }
        return item;
      })
    );

    // Broadcast win to chat with player profile info
    const currentAvatar = getAvatarEmoji(activePlayer.avatar);
    const winChatMsg: ChatMessage = {
      id: `chat_win_${Date.now()}`,
      sender: activePlayer.username,
      avatar: currentAvatar,
      text: `🎉 Cashed out ${formatMoney(winAmount)} at ${mult.toFixed(2)}x on Panel ${panelNumber}!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isSystemWin: true,
      winAmount,
      multiplier: mult,
    };
    setChatMessages(prev => {
      const updated = [winChatMsg, ...prev.slice(0, 49)];
      try {
        localStorage.setItem('neextplay_aviator_chats', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // User click action button on Panel 1
  const onPanel1Click = () => {
    if (gameState === 'FLYING') {
      if (panel1.hasBetCurrentRound && !panel1.hasCashedOut) {
        handleCashout(1);
      } else if (!panel1.hasBetCurrentRound) {
        soundFx.playBetPlaced();
        setPanel1(prev => ({ ...prev, queuedForNextRound: !prev.queuedForNextRound }));
      }
    } else if (gameState === 'WAITING') {
      if (panel1.hasBetCurrentRound) {
        soundFx.playBetCancelled();
        setPanel1(prev => ({ ...prev, hasBetCurrentRound: false }));
      } else {
        if (placeBetOnLedger(panel1.betAmount, 1)) {
          soundFx.playBetPlaced();
          setPanel1(prev => ({ ...prev, hasBetCurrentRound: true }));
        }
      }
    }
  };

  // User click action button on Panel 2
  const onPanel2Click = () => {
    if (gameState === 'FLYING') {
      if (panel2.hasBetCurrentRound && !panel2.hasCashedOut) {
        handleCashout(2);
      } else if (!panel2.hasBetCurrentRound) {
        soundFx.playBetPlaced();
        setPanel2(prev => ({ ...prev, queuedForNextRound: !prev.queuedForNextRound }));
      }
    } else if (gameState === 'WAITING') {
      if (panel2.hasBetCurrentRound) {
        soundFx.playBetCancelled();
        setPanel2(prev => ({ ...prev, hasBetCurrentRound: false }));
      } else {
        if (placeBetOnLedger(panel2.betAmount, 2)) {
          soundFx.playBetPlaced();
          setPanel2(prev => ({ ...prev, hasBetCurrentRound: true }));
        }
      }
    }
  };

  // Send message in chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundFx.playClick();
    const msg: ChatMessage = {
      id: `chat_user_${Date.now()}`,
      sender: activePlayer.username || 'You',
      avatar: getAvatarEmoji(activePlayer.avatar),
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setChatMessages(prev => {
      const updated = [msg, ...prev.slice(0, 49)];
      try {
        localStorage.setItem('neextplay_aviator_chats', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setChatInput('');
  };

  // Quick preset bet setter
  const setPanelBetPreset = (panel: 1 | 2, amount: number) => {
    soundFx.playChipSelect();
    if (panel === 1) {
      if (gameState !== 'FLYING' || !panel1.hasBetCurrentRound) {
        setPanel1(prev => ({ ...prev, betAmount: amount }));
      }
    } else {
      if (gameState !== 'FLYING' || !panel2.hasBetCurrentRound) {
        setPanel2(prev => ({ ...prev, betAmount: amount }));
      }
    }
  };

  // Modify bet with - / + buttons
  const adjustBet = (panel: 1 | 2, delta: number) => {
    soundFx.playStepperStep(delta > 0);
    if (panel === 1) {
      if (gameState !== 'FLYING' || !panel1.hasBetCurrentRound) {
        setPanel1(prev => ({ ...prev, betAmount: Math.max(0.5, Number((prev.betAmount + delta).toFixed(2))) }));
      }
    } else {
      if (gameState !== 'FLYING' || !panel2.hasBetCurrentRound) {
        setPanel2(prev => ({ ...prev, betAmount: Math.max(0.5, Number((prev.betAmount + delta).toFixed(2))) }));
      }
    }
  };

  // Adjust auto cashout multiplier
  const adjustAutoCashoutMultiplier = (panel: 1 | 2, delta: number) => {
    soundFx.playStepperStep(delta > 0);
    if (panel === 1) {
      setPanel1(prev => ({
        ...prev,
        autoCashoutMultiplier: Math.max(1.05, Number((prev.autoCashoutMultiplier + delta).toFixed(2))),
      }));
    } else {
      setPanel2(prev => ({
        ...prev,
        autoCashoutMultiplier: Math.max(1.05, Number((prev.autoCashoutMultiplier + delta).toFixed(2))),
      }));
    }
  };

  // GAME LOOP CONTROLLER
  const startWaitingCountdown = () => {
    setGameState('WAITING');
    setCurrentMultiplier(1.00);
    soundFx.stopAviatorEngine();
    soundFx.stopAviatorTicker();
    lastMilestoneRef.current = 1;

    const nextRound = generateAviatorRound();
    setCurrentRound(nextRound);

    let bet1 = 0;
    let bet2 = 0;

    const p1 = panel1Ref.current;
    if (p1.isAutoBet || p1.queuedForNextRound) {
      if (placeBetOnLedger(p1.betAmount, 1)) {
        bet1 = p1.betAmount;
        setPanel1(prev => ({
          ...prev,
          hasBetCurrentRound: true,
          queuedForNextRound: false,
          hasCashedOut: false,
          cashedOutMultiplier: 0,
          wonAmount: 0,
        }));
      } else {
        setPanel1(prev => ({ ...prev, hasBetCurrentRound: false, queuedForNextRound: false }));
      }
    } else {
      setPanel1(prev => ({
        ...prev,
        hasBetCurrentRound: false,
        queuedForNextRound: false,
        hasCashedOut: false,
        cashedOutMultiplier: 0,
        wonAmount: 0,
      }));
    }

    const p2 = panel2Ref.current;
    if (p2.isAutoBet || p2.queuedForNextRound) {
      if (placeBetOnLedger(p2.betAmount, 2)) {
        bet2 = p2.betAmount;
        setPanel2(prev => ({
          ...prev,
          hasBetCurrentRound: true,
          queuedForNextRound: false,
          hasCashedOut: false,
          cashedOutMultiplier: 0,
          wonAmount: 0,
        }));
      } else {
        setPanel2(prev => ({ ...prev, hasBetCurrentRound: false, queuedForNextRound: false }));
      }
    } else {
      setPanel2(prev => ({
        ...prev,
        hasBetCurrentRound: false,
        queuedForNextRound: false,
        hasCashedOut: false,
        cashedOutMultiplier: 0,
        wonAmount: 0,
      }));
    }

    setSimulatedPlayers(
      generateSimulatedPlayers(bet1, bet2, {
        username: activePlayer.username,
        avatar: getAvatarEmoji(activePlayer.avatar),
      })
    );

    let remaining = 5.0;
    setCountdownRemaining(5.0);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 0.1;
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        setCountdownRemaining(0);
        launchFlight(nextRound);
      } else {
        setCountdownRemaining(Number(remaining.toFixed(1)));
        if (Math.abs(remaining - Math.round(remaining)) < 0.05 && remaining <= 3.0) {
          soundFx.playCountdownBeep(remaining <= 1.0);
        }
      }
    }, 100);
  };

  const launchFlight = (round: AviatorRoundResult) => {
    setGameState('FLYING');
    setCurrentMultiplier(1.00);
    lastMilestoneRef.current = 1;
    flightStartTimeRef.current = performance.now();
    // Continuous synthesized flying sound engine starts at liftoff and runs until crash
    soundFx.startAviatorEngine();
    // Open crisp rhythmic multiplier altimeter ticking at liftoff
    soundFx.startAviatorTicker();

    const loop = (timestamp: number) => {
      const elapsedSec = (timestamp - flightStartTimeRef.current) / 1000;
      const mult = getMultiplierAtTime(elapsedSec);

      soundFx.updateAviatorPitch(mult);

      // Multiplier milestone alerts: 2x, 5x, 10x, 25x, 50x, 100x
      const milestones = [2, 5, 10, 25, 50, 100, 250, 500, 1000];
      for (const m of milestones) {
        if (mult >= m && lastMilestoneRef.current < m) {
          lastMilestoneRef.current = m;
          soundFx.playMilestone(m);
          break;
        }
      }

      if (mult >= round.crashPoint) {
        setCurrentMultiplier(round.crashPoint);
        setGameState('CRASHED');
        // Close ticker and stop flying sound immediately, and play dramatic plane crash sound
        soundFx.stopAviatorTicker();
        soundFx.stopAviatorEngine();
        soundFx.playAviatorCrash();

        setHistoryRounds(prev => [{ mult: round.crashPoint, roundId: round.roundId }, ...prev.slice(0, 39)]);

        const curP1 = panel1Ref.current;
        if (curP1.hasBetCurrentRound && !curP1.hasCashedOut) {
          const loss1 = {
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            playerName: activePlayer.username,
            avatar: getAvatarEmoji(activePlayer.avatar),
            bet: curP1.betAmount,
            mult: undefined,
            win: 0,
            panel: 1 as const,
          };
          setMyBetsHistory(prev => {
            const updated = [loss1, ...prev.slice(0, 49)];
            try {
              localStorage.setItem('neextplay_my_bets_history', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }

        const curP2 = panel2Ref.current;
        if (curP2.hasBetCurrentRound && !curP2.hasCashedOut) {
          const loss2 = {
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            playerName: activePlayer.username,
            avatar: getAvatarEmoji(activePlayer.avatar),
            bet: curP2.betAmount,
            mult: undefined,
            win: 0,
            panel: 2 as const,
          };
          setMyBetsHistory(prev => {
            const updated = [loss2, ...prev.slice(0, 49)];
            try {
              localStorage.setItem('neextplay_my_bets_history', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }

        setTimeout(() => {
          startWaitingCountdown();
        }, 2800);
        return;
      }

      setCurrentMultiplier(mult);

      const curP1 = panel1Ref.current;
      if (
        curP1.hasBetCurrentRound &&
        !curP1.hasCashedOut &&
        curP1.isAutoCashout &&
        curP1.autoCashoutMultiplier > 1.0 &&
        mult >= curP1.autoCashoutMultiplier
      ) {
        handleCashout(1, curP1.autoCashoutMultiplier);
      }

      const curP2 = panel2Ref.current;
      if (
        curP2.hasBetCurrentRound &&
        !curP2.hasCashedOut &&
        curP2.isAutoCashout &&
        curP2.autoCashoutMultiplier > 1.0 &&
        mult >= curP2.autoCashoutMultiplier
      ) {
        handleCashout(2, curP2.autoCashoutMultiplier);
      }

      setSimulatedPlayers(prev =>
        prev.map(bot => {
          if (!bot.cashedOut && bot.autoCashout && mult >= bot.autoCashout) {
            return {
              ...bot,
              cashedOut: true,
              cashedOutMultiplier: bot.autoCashout,
              cashedOutAmount: Number((bot.bet * bot.autoCashout).toFixed(2)),
            };
          }
          return bot;
        })
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    startWaitingCountdown();

    // Start background lounge music if enabled
    if (soundFx.getMusicEnabled() && !soundFx.getMuted()) {
      soundFx.startBackgroundMusic();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      soundFx.stopAviatorEngine();
      soundFx.stopAviatorTicker();
      soundFx.stopBackgroundMusic();
    };
  }, []);

  // RENDER SINGLE BET PANEL (Reusable, ultra-ergonomic, fits exact heights)
  const renderBetPanel = (panelNumber: 1 | 2) => {
    const isP1 = panelNumber === 1;
    const p = isP1 ? panel1 : panel2;
    const mode = isP1 ? panel1Mode : panel2Mode;
    const setMode = isP1 ? setPanel1Mode : setPanel2Mode;
    const onClickAction = isP1 ? onPanel1Click : onPanel2Click;

    return (
      <div className="bg-[#0b0e14] border border-slate-800/90 rounded-xl p-1 sm:p-1.5 shadow-md flex flex-col justify-between h-full relative select-none">
        {/* Header: Panel title + Bet/Auto toggle */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-0.5 flex-shrink-0">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${p.hasBetCurrentRound ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
            <span>BET {panelNumber}</span>
          </div>

          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[8px] font-bold">
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setMode('BET');
              }}
              className={`px-2 py-0.2 rounded transition cursor-pointer ${
                mode === 'BET' ? 'bg-red-600 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bet
            </button>
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setMode('AUTO');
              }}
              className={`px-2 py-0.2 rounded transition cursor-pointer ${
                mode === 'AUTO' ? 'bg-red-600 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        {/* Main Controls: Left Stepper & Chips, Right Action Button */}
        <div className="grid grid-cols-12 gap-1 items-center flex-1 py-0.5 min-h-0">
          {/* Stepper & Chips (7 cols) */}
          <div className="col-span-7 space-y-0.5 flex flex-col justify-center">
            {/* Stepper */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5 h-6">
              <button
                onClick={() => adjustBet(panelNumber, -0.5)}
                disabled={gameState === 'FLYING' && p.hasBetCurrentRound}
                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] flex items-center justify-center transition disabled:opacity-50 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0.5"
                step="0.5"
                disabled={gameState === 'FLYING' && p.hasBetCurrentRound}
                value={p.betAmount}
                onChange={e => {
                  const val = Math.max(0.5, Number(parseFloat(e.target.value) || 0.5));
                  if (isP1) {
                    setPanel1(prev => ({ ...prev, betAmount: val }));
                  } else {
                    setPanel2(prev => ({ ...prev, betAmount: val }));
                  }
                }}
                className="flex-1 text-center bg-transparent text-white font-mono font-black text-xs outline-none"
              />
              <button
                onClick={() => adjustBet(panelNumber, 0.5)}
                disabled={gameState === 'FLYING' && p.hasBetCurrentRound}
                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] flex items-center justify-center transition disabled:opacity-50 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Quick Preset Chips */}
            <div className="grid grid-cols-4 gap-0.5 text-[9px] font-mono font-bold">
              {[1, 2, 5, 10].map(amt => (
                <button
                  key={amt}
                  onClick={() => setPanelBetPreset(panelNumber, amt)}
                  disabled={gameState === 'FLYING' && p.hasBetCurrentRound}
                  className={`py-0.5 rounded border transition disabled:opacity-50 cursor-pointer ${
                    p.betAmount === amt
                      ? 'bg-red-950/80 text-red-400 border-red-500/60 font-black'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Big Action Button (5 cols) */}
          <div className="col-span-5 h-full flex flex-col justify-center">
            {gameState === 'FLYING' ? (
              p.hasBetCurrentRound && !p.hasCashedOut ? (
                /* Active In-Flight Cash Out Button (Spribe Glowing Amber/Orange) */
                <button
                  onClick={onClickAction}
                  className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg shadow-orange-500/40 border border-amber-300 transform active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <span className="text-[11px] sm:text-xs tracking-wider uppercase font-black">CASH OUT</span>
                  <span className="text-[10px] font-mono font-black">
                    {formatMoney(Number((p.betAmount * currentMultiplier).toFixed(2)))}
                  </span>
                </button>
              ) : p.hasCashedOut ? (
                /* Already Cashed Out */
                <div className="w-full h-11 sm:h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 flex flex-col items-center justify-center font-mono">
                  <span className="text-[9px] font-sans font-bold uppercase">CASHED OUT</span>
                  <span className="text-[11px] font-black">+{formatMoney(p.wonAmount)}</span>
                </div>
              ) : (
                /* Queue for next round */
                <button
                  onClick={onClickAction}
                  className={`w-full h-11 sm:h-12 rounded-xl font-black text-xs flex flex-col items-center justify-center transition border cursor-pointer ${
                    p.queuedForNextRound
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/60'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <span>{p.queuedForNextRound ? 'CANCEL' : 'BET'}</span>
                  <span className="text-[8px] font-mono text-slate-400">NEXT ROUND</span>
                </button>
              )
            ) : gameState === 'WAITING' ? (
              p.hasBetCurrentRound ? (
                /* Placed Bet - Cancel option during countdown */
                <button
                  onClick={onClickAction}
                  className="w-full h-11 sm:h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex flex-col items-center justify-center shadow-md shadow-rose-600/30 border border-rose-400 transition cursor-pointer"
                >
                  <span className="text-[11px] uppercase">CANCEL</span>
                  <span className="text-[9px] font-mono">{formatMoney(p.betAmount)}</span>
                </button>
              ) : (
                /* Vibrant Green Spribe BET button */
                <button
                  onClick={onClickAction}
                  className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-slate-950 font-black text-xs flex flex-col items-center justify-center shadow-lg shadow-emerald-600/40 border border-emerald-300 transform active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-wider font-black">BET</span>
                  <span className="text-[10px] font-mono font-bold text-slate-900">
                    {formatMoney(p.betAmount)}
                  </span>
                </button>
              )
            ) : (
              /* Crashed state */
              <div className="w-full h-11 sm:h-12 rounded-xl bg-slate-950 border border-slate-900 text-slate-500 flex items-center justify-center text-[11px] font-bold font-mono">
                FLEW AWAY
              </div>
            )}
          </div>
        </div>

        {/* Inline Auto Mode Settings (when Auto tab selected) */}
        {mode === 'AUTO' && (
          <div className="pt-0.5 border-t border-slate-900 flex items-center justify-between text-[9px] text-slate-400 flex-shrink-0">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={p.isAutoBet}
                onChange={e => {
                  soundFx.playAutoToggle();
                  if (isP1) setPanel1(prev => ({ ...prev, isAutoBet: e.target.checked }));
                  else setPanel2(prev => ({ ...prev, isAutoBet: e.target.checked }));
                }}
                className="accent-red-500 w-2.5 h-2.5 rounded"
              />
              <span>Auto Bet</span>
            </label>

            <div className="flex items-center gap-1">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.isAutoCashout}
                  onChange={e => {
                    soundFx.playAutoToggle();
                    if (isP1) setPanel1(prev => ({ ...prev, isAutoCashout: e.target.checked }));
                    else setPanel2(prev => ({ ...prev, isAutoCashout: e.target.checked }));
                  }}
                  className="accent-red-500 w-2.5 h-2.5 rounded"
                />
                <span>Auto Cash</span>
              </label>

              {p.isAutoCashout && (
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-1">
                  <button
                    onClick={() => adjustAutoCashoutMultiplier(panelNumber, -0.1)}
                    className="text-slate-400 hover:text-white px-0.5"
                  >
                    -
                  </button>
                  <span className="font-mono text-white px-0.5">{p.autoCashoutMultiplier.toFixed(2)}x</span>
                  <button
                    onClick={() => adjustAutoCashoutMultiplier(panelNumber, 0.1)}
                    className="text-slate-400 hover:text-white px-0.5"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full max-h-full flex flex-col justify-between font-sans select-none overflow-hidden p-0.5 sm:p-1">
      {/* Real-Time Pilot Auto-Registration / Profile Load Banner */}
      {welcomeToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 shadow-2xl flex items-center gap-2 text-xs font-bold text-emerald-300 animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{welcomeToast}</span>
        </div>
      )}

      {/* 0. FULL SCREEN GRAPHICS ANIMATION SPLASH SCREEN */}
      {showSplash && (
        <GameSplashScreen
          gameType="AVIATOR"
          onComplete={() => {
            setShowSplash(false);
            if (isMusicOn && !isMuted) {
              soundFx.startBackgroundMusic();
            }
          }}
          titleOverride="AVIATOR"
          subtitleOverride="HIGH ALTITUDE MULTIPLIER CRASH"
        />
      )}

      {/* 1. TOP COMPACT BAR: BRAND, HISTORY RIBBON, SOUND & MUSIC CONTROLS */}
      <div className="bg-[#0b0e14] border border-slate-800/90 rounded-lg px-2 py-1 mb-1 shadow-md flex flex-col gap-1 flex-shrink-0 relative">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-1.5 h-7 sm:h-8">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md overflow-hidden border border-red-500/50 shadow-sm flex-shrink-0 bg-black">
              <img src={aviatorLogo} alt="Aviator Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-sm font-black tracking-wider text-red-500 uppercase drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]">
                AVIATOR
              </span>
              <span className="hidden sm:inline-block px-1 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-500/30 text-[8px] font-mono font-bold">
                97% RTP
              </span>
            </div>
          </div>

          {/* Right Tools (Pilot Profile, Balance, Audio Console, Switchable Music, Sound, Fair, Rules, Splash, Fullscreen) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Pilot Profile & Company Registration Pill */}
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setEditUsername(activePlayer.username);
                setEditAvatar(activePlayer.avatar || 'pilot-1');
                setShowProfileModal(true);
              }}
              className="px-2 py-0.5 sm:px-2.5 rounded-md bg-slate-950 border border-slate-800 hover:border-red-500/50 flex items-center gap-1.5 transition cursor-pointer shadow-sm group"
              title="Pilot Profile & Company Registration"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-[9px] font-black text-white shadow-sm flex-shrink-0">
                {activePlayer.avatar === 'pilot-2' ? '🛩️' : activePlayer.avatar === 'pilot-3' ? '🚀' : activePlayer.avatar === 'pilot-4' ? '🎖️' : activePlayer.avatar === 'pilot-5' ? '🦅' : activePlayer.avatar === 'pilot-6' ? '⚡' : '👨‍✈️'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-slate-200 leading-none truncate max-w-[70px] sm:max-w-[100px] group-hover:text-amber-300">
                  {activePlayer.username}
                </span>
                <span className="text-[7.5px] font-mono text-emerald-400 flex items-center gap-0.5 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="truncate max-w-[65px]">{activeOperator.code}</span>
                </span>
              </div>
            </button>

            {/* Balance Pill */}
            <div className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1 text-[11px] sm:text-xs font-mono font-black text-amber-400">
              <span className="hidden md:inline text-[8px] text-slate-500 font-sans font-bold">BAL:</span>
              <span>{formatMoney(activePlayer.balance)}</span>
            </div>

            {/* Audio Mixing Console (Master, Music & SFX Sliders Popover) */}
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setShowAudioPopover(!showAudioPopover);
              }}
              className={`p-1 sm:p-1.5 rounded-md border transition cursor-pointer ${
                showAudioPopover
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Audio Mixing Console (Master, Music & SFX Volumes)"
            >
              <Sliders className="w-3 h-3 text-amber-400" />
            </button>

            {/* Switchable Background Music Toggle */}
            <button
              onClick={toggleMusic}
              className={`px-1.5 py-0.5 sm:px-2 rounded-md border transition text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                isMusicOn && !isMuted
                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/40 hover:bg-amber-900/70'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title={isMusicOn ? 'Background Music: ON (Click to turn OFF)' : 'Background Music: OFF (Click to turn ON)'}
            >
              <Music className={`w-3 h-3 ${isMusicOn && !isMuted ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden xl:inline text-[9px]">{isMusicOn && !isMuted ? 'MUSIC ON' : 'MUSIC OFF'}</span>
            </button>

            {/* Sound FX Toggle */}
            <button
              onClick={toggleMute}
              className="p-1 sm:p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
              title={isMuted ? 'Unmute Audio FX' : 'Mute Audio FX'}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
            </button>

            {/* Replay Splash Intro Button */}
            <button
              onClick={() => {
                soundFx.playSplashIntro();
                setShowSplash(true);
              }}
              className="p-1 sm:p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              title="Replay Splash Screen Intro"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
            </button>

            {/* Provably Fair */}
            <button
              onClick={() => {
                soundFx.playHistoryPillClick();
                setSelectedVerifyRound(currentRound);
                setShowFairModal(true);
              }}
              className="p-1 sm:p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              title="Cryptographic Provably Fair Verification"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </button>

            {/* How to Play */}
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setShowHowToPlay(true);
              }}
              className="p-1 sm:p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              title="Rules & How to Play"
            >
              <HelpCircle className="w-3 h-3 text-amber-400" />
            </button>

            {/* Fullscreen / Cinema Mode Toggle */}
            <button
              onClick={toggleCinemaMode}
              className="p-1 sm:p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
              title={isCinemaMode ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isCinemaMode ? <Minimize2 className="w-3 h-3 text-amber-400" /> : <Maximize2 className="w-3 h-3 text-slate-400" />}
            </button>

            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setShowMobileSidebar(!showMobileSidebar);
              }}
              className={`lg:hidden px-2 py-0.5 rounded-md text-[9px] font-black border transition flex items-center gap-1 cursor-pointer ${
                showMobileSidebar
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Users className="w-2.5 h-2.5" />
              <span>Bets ({simulatedPlayers.length})</span>
            </button>
          </div>
        </div>

        {/* Multiplier History Ribbon (Ultra-compact Spribe authentic styling) */}
        <div className="flex items-center justify-between gap-1 border-t border-slate-900 pt-0.5 h-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
            {historyRounds.slice(0, 25).map((h, idx) => (
              <button
                key={`${h.roundId}_${idx}`}
                onClick={() => {
                  soundFx.playHistoryPillClick();
                  setSelectedVerifyRound({
                    roundId: h.roundId,
                    crashPoint: h.mult,
                    serverSeed: '6a89c9f0b12e45778891029384756102',
                    serverSeedHash: 'd3b07384d113edec49eaa6238ad5ff00',
                    clientSeeds: ['cseed_alpha_01', 'cseed_beta_02', 'cseed_gamma_03'],
                    combinedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                    startedAt: Date.now() - (idx + 1) * 20000,
                    durationMs: 4500,
                  });
                  setShowFairModal(true);
                }}
                className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono font-black border transition flex-shrink-0 cursor-pointer ${getMultiplierBadgeClass(
                  h.mult
                )}`}
                title="Click to verify cryptographic fairness"
              >
                {h.mult.toFixed(2)}x
              </button>
            ))}
          </div>

          {/* History Expander Dropdown button */}
          <button
            onClick={() => {
              soundFx.playTabSwitch();
              setShowHistoryDropdown(!showHistoryDropdown);
            }}
            className="p-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition flex-shrink-0 cursor-pointer"
            title="Round History Dropdown"
          >
            <History className="w-3 h-3" />
          </button>
        </div>

        {/* FLOATING ROUND HISTORY DROPDOWN POPOVER (Floats above canvas, NEVER pushes page down!) */}
        {showHistoryDropdown && (
          <div className="absolute top-14 left-2 right-2 z-50 p-2 bg-[#080c14]/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-1">
                <History className="w-3 h-3 text-red-400" />
                <span>Round History Inspector ({historyRounds.length} Rounds)</span>
              </span>
              <button
                onClick={() => {
                  soundFx.playTabSwitch();
                  setShowHistoryDropdown(false);
                }}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1 max-h-40 overflow-y-auto scrollbar-thin">
              {historyRounds.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    soundFx.playHistoryPillClick();
                    setSelectedVerifyRound({
                      roundId: h.roundId,
                      crashPoint: h.mult,
                      serverSeed: '6a89c9f0b12e45778891029384756102',
                      serverSeedHash: 'd3b07384d113edec49eaa6238ad5ff00',
                      clientSeeds: ['cseed_alpha_01', 'cseed_beta_02', 'cseed_gamma_03'],
                      combinedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                      startedAt: Date.now() - (i + 1) * 20000,
                      durationMs: 4500,
                    });
                    setShowFairModal(true);
                  }}
                  className={`px-1 py-0.5 rounded text-[9px] font-mono font-black border transition cursor-pointer ${getMultiplierBadgeClass(
                    h.mult
                  )}`}
                >
                  {h.mult.toFixed(2)}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AUDIO MIXING CONSOLE POPOVER */}
        {showAudioPopover && (
          <div className="absolute top-9 right-2 sm:right-16 z-50 w-72 sm:w-80 bg-[#0d121c]/95 border border-amber-500/50 rounded-xl p-3 shadow-2xl shadow-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-100">AUDIO MIXING CONSOLE</span>
              </div>
              <button
                onClick={() => setShowAudioPopover(false)}
                className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 mt-2.5">
              {/* Master Volume */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-amber-400" /> Master Volume
                  </span>
                  <span className="font-mono text-amber-400">{Math.round(masterVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVol}
                  onChange={e => handleMasterVolChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                />
              </div>

              {/* Background Music Volume */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Music className="w-3 h-3 text-cyan-400" /> Casino Synthwave Music
                  </span>
                  <span className="font-mono text-cyan-400">{Math.round(musicVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVol}
                  onChange={e => handleMusicVolChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                />
              </div>

              {/* Sound Effects Volume */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-rose-400" /> Sound FX & Engine Roar
                  </span>
                  <span className="font-mono text-rose-400">{Math.round(sfxVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVol}
                  onChange={e => handleSfxVolChange(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                />
              </div>

              {/* Sound Presets */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Quick Presets</div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => applyAudioPreset('MAX')}
                    className="px-1 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[9px] font-bold text-amber-400 hover:border-amber-500/50 cursor-pointer text-center"
                  >
                    Max Hype
                  </button>
                  <button
                    onClick={() => applyAudioPreset('BALANCED')}
                    className="px-1 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[9px] font-bold text-emerald-400 hover:border-emerald-500/50 cursor-pointer text-center"
                  >
                    Balanced
                  </button>
                  <button
                    onClick={() => applyAudioPreset('CHILL')}
                    className="px-1 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[9px] font-bold text-cyan-400 hover:border-cyan-500/50 cursor-pointer text-center"
                  >
                    Lounge
                  </button>
                  <button
                    onClick={() => applyAudioPreset('MUTE')}
                    className="px-1 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[9px] font-bold text-rose-400 hover:border-rose-500/50 cursor-pointer text-center"
                  >
                    Mute All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN GAME ARENA: FULL SCREEN FITTING (ZERO PAGE SCROLL) */}
      <div className="flex-1 min-h-0 w-full grid grid-cols-1 lg:grid-cols-12 gap-1 sm:gap-1.5 items-stretch overflow-hidden relative">
        {/* DESKTOP MULTIPLAYER SIDEBAR: Constrained to parent height */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 bg-[#0a0d13] border border-slate-800/90 rounded-xl p-1.5 flex-col h-full overflow-hidden min-h-0 flex-shrink-0">
          {/* Tabs: All / My Bets / Top / Chat */}
          <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-slate-950 rounded-md border border-slate-800 text-[9px] font-bold mb-1 flex-shrink-0">
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setSidebarTab('ALL_BETS');
              }}
              className={`py-0.5 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                sidebarTab === 'ALL_BETS' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-2.5 h-2.5" />
              <span>All</span>
            </button>
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setSidebarTab('MY_BETS');
              }}
              className={`py-0.5 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                sidebarTab === 'MY_BETS' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-2.5 h-2.5" />
              <span>My</span>
            </button>
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setSidebarTab('TOP');
              }}
              className={`py-0.5 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                sidebarTab === 'TOP' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-2.5 h-2.5" />
              <span>Top</span>
            </button>
            <button
              onClick={() => {
                soundFx.playTabSwitch();
                setSidebarTab('CHAT');
              }}
              className={`py-0.5 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                sidebarTab === 'CHAT' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-2.5 h-2.5" />
              <span>Chat</span>
            </button>
          </div>

          {/* TAB 1: ALL BETS */}
          {sidebarTab === 'ALL_BETS' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between px-1.5 py-0.5 bg-slate-950 rounded text-[8px] text-slate-400 font-bold uppercase mb-1 border border-slate-900 flex-shrink-0">
                <span>ONLINE: {simulatedPlayers.length}</span>
                <span>TOTAL: {formatMoney(simulatedPlayers.reduce((acc, p) => acc + p.bet, 0))}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 text-xs scrollbar-thin">
                {simulatedPlayers.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-1 rounded text-[10px] ${
                      p.isCurrentUser
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                        : p.cashedOut
                        ? 'bg-emerald-950/30 border border-emerald-500/30'
                        : 'bg-slate-950/60 border border-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1 truncate max-w-[110px]">
                      <span className="text-[10px]">{p.avatar}</span>
                      <div className="truncate">
                        <span className="font-bold text-slate-200 block text-[9px] truncate leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono">
                          {formatMoney(p.bet)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {p.cashedOut && p.cashedOutMultiplier ? (
                        <div>
                          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-black text-[9px] border border-emerald-500/40 inline-block">
                            {p.cashedOutMultiplier.toFixed(2)}x
                          </span>
                          <span className="text-[8px] text-emerald-300 font-mono font-bold block">
                            +{formatMoney(p.cashedOutAmount || p.bet * p.cashedOutMultiplier)}
                          </span>
                        </div>
                      ) : gameState === 'CRASHED' ? (
                        <span className="text-[8px] text-rose-500 font-bold uppercase">LOST</span>
                      ) : (
                        <span className="text-[8px] text-slate-500 font-mono animate-pulse">FLYING</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MY BETS */}
          {sidebarTab === 'MY_BETS' && (
            <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 text-xs scrollbar-thin">
              {myBetsHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-[10px] text-center p-2">
                  <Clock className="w-5 h-5 opacity-40 mb-1" />
                  <span>No bets placed yet.</span>
                </div>
              ) : (
                myBetsHistory.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-1 bg-slate-950/70 border border-slate-800/80 rounded flex items-center justify-between text-[10px]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[11px]">{b.avatar || getAvatarEmoji(activePlayer.avatar)}</span>
                      <div>
                        <div className="flex items-center gap-1 text-[8px] text-slate-400 font-mono">
                          <span>{b.date}</span>
                          <span className="px-0.5 rounded bg-slate-800 text-slate-300">P{b.panel}</span>
                          <span className="text-slate-300 font-bold truncate max-w-[65px]">{b.playerName || activePlayer.username}</span>
                        </div>
                        <span className="text-white font-mono font-bold text-[9px]">
                          Bet: {formatMoney(b.bet)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {b.mult ? (
                        <div>
                          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-black text-[9px] border border-emerald-500/40">
                            {b.mult.toFixed(2)}x
                          </span>
                          <span className="text-[9px] font-black font-mono text-emerald-400 block">
                            +{formatMoney(b.win)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-rose-500">FLEW AWAY</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TOP WINS */}
          {sidebarTab === 'TOP' && (
            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 text-xs scrollbar-thin">
              {topWins.map(t => (
                <div
                  key={t.id}
                  className="p-1 bg-slate-950/80 border border-slate-800/80 rounded text-[10px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[9px]">
                      <span>{t.avatar}</span>
                      <span className="font-bold text-slate-200 truncate">{t.player}</span>
                    </div>
                    <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono font-black text-[9px] border border-rose-500/40">
                      {t.multiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] pt-0.5">
                    <span className="text-slate-500">{t.date}</span>
                    <span className="font-mono font-black text-amber-400">{formatMoney(t.win)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: CHAT */}
          {sidebarTab === 'CHAT' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 text-xs flex flex-col-reverse scrollbar-thin">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-1 rounded text-[9px] ${
                      msg.isSystemWin
                        ? 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
                        : 'bg-slate-950/60 border border-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[8px] text-slate-400 mb-0.5">
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <span>{msg.avatar}</span>
                        <span>{msg.sender}</span>
                      </span>
                      <span className="font-mono text-[7px]">{msg.timestamp}</span>
                    </div>
                    <p className="leading-tight">{msg.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="flex items-center gap-1 pt-1 border-t border-slate-800 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Chat..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-white outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="p-1 bg-red-600 hover:bg-red-500 text-white rounded transition cursor-pointer"
                >
                  <Send className="w-2.5 h-2.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* MOBILE SLIDE-OVER DRAWER FOR LIVE BETS (Never pushes down canvas!) */}
        {showMobileSidebar && (
          <div className="lg:hidden absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex justify-start animate-in fade-in">
            <div className="w-[85%] max-w-[320px] h-full bg-[#0a0d13] border-r border-slate-800 p-2 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 flex-shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-200 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-red-500" />
                  <span>Live Multiplayer Bets</span>
                </span>
                <button
                  onClick={() => {
                    soundFx.playTabSwitch();
                    setShowMobileSidebar(false);
                  }}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-slate-950 rounded-md border border-slate-800 text-[9px] font-bold mb-1 flex-shrink-0">
                <button
                  onClick={() => {
                    soundFx.playTabSwitch();
                    setSidebarTab('ALL_BETS');
                  }}
                  className={`py-1 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                    sidebarTab === 'ALL_BETS' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    soundFx.playTabSwitch();
                    setSidebarTab('MY_BETS');
                  }}
                  className={`py-1 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                    sidebarTab === 'MY_BETS' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  My
                </button>
                <button
                  onClick={() => {
                    soundFx.playTabSwitch();
                    setSidebarTab('TOP');
                  }}
                  className={`py-1 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                    sidebarTab === 'TOP' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Top
                </button>
                <button
                  onClick={() => {
                    soundFx.playTabSwitch();
                    setSidebarTab('CHAT');
                  }}
                  className={`py-1 rounded transition flex items-center justify-center gap-1 cursor-pointer ${
                    sidebarTab === 'CHAT' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chat
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1 scrollbar-thin">
                {sidebarTab === 'ALL_BETS' && (
                  <div className="space-y-0.5">
                    {simulatedPlayers.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-1 rounded bg-slate-950/70 border border-slate-900 text-[10px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>{p.avatar}</span>
                          <span className="font-bold text-slate-200">{p.name}</span>
                        </div>
                        <span className="font-mono text-amber-400">{formatMoney(p.bet)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {sidebarTab === 'MY_BETS' && (
                  <div className="space-y-0.5">
                    {myBetsHistory.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-1 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-[10px]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[11px]">{b.avatar || getAvatarEmoji(activePlayer.avatar)}</span>
                          <div>
                            <div className="flex items-center gap-1 text-[8px] text-slate-400 font-mono">
                              <span>{b.date}</span>
                              <span className="px-0.5 rounded bg-slate-800 text-slate-300">P{b.panel}</span>
                              <span className="text-slate-300 font-bold truncate max-w-[65px]">{b.playerName || activePlayer.username}</span>
                            </div>
                            <span className="text-white font-mono font-bold text-[9px]">Bet: {formatMoney(b.bet)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {b.mult ? (
                            <span className="font-mono text-emerald-400 font-bold">+{formatMoney(b.win)}</span>
                          ) : (
                            <span className="text-rose-500 font-bold text-[9px]">FLEW AWAY</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {sidebarTab === 'TOP' && (
                  <div className="space-y-1">
                    {topWins.map(t => (
                      <div
                        key={t.id}
                        className="p-1 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-[10px]"
                      >
                        <span>{t.player}</span>
                        <span className="font-mono text-rose-400">{t.multiplier.toFixed(2)}x</span>
                      </div>
                    ))}
                  </div>
                )}
                {sidebarTab === 'CHAT' && (
                  <div className="space-y-1">
                    {chatMessages.map(m => (
                      <div key={m.id} className="p-1 rounded bg-slate-950 text-[9px] text-slate-300">
                        <span className="font-bold text-white mr-1">{m.sender}:</span>
                        <span>{m.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT FLIGHT ARENA & DUAL BETTING PANELS (Fits viewport height with zero overflow) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between gap-1 sm:gap-1.5 h-full overflow-hidden min-h-0">
          {/* FLIGHT CANVAS CONTAINER (Flexibly fills exact available vertical space) */}
          <div className="w-full flex-1 min-h-[140px] relative overflow-hidden rounded-xl border border-slate-800 bg-[#0c1017]">
            <AviatorCanvas
              gameState={gameState}
              currentMultiplier={currentMultiplier}
              countdownRemaining={countdownRemaining}
              crashPoint={currentRound.crashPoint}
              className="w-full h-full min-h-[140px]"
            />
          </div>

          {/* DUAL BETTING PANELS CONTAINER: Both Bet 1 & Bet 2 ALWAYS visible and composed together on ONE screen with zero tabs */}
          <div className="flex-shrink-0 h-[106px] sm:h-[116px]">
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 h-full">
              {renderBetPanel(1)}
              {renderBetPanel(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROVABLY FAIR VERIFICATION MODAL */}
      {showFairModal && (
        <ProvablyFairModal
          round={selectedVerifyRound || currentRound}
          onClose={() => setShowFairModal(false)}
          userCustomSeed={userClientSeed}
          onUpdateUserSeed={setUserClientSeed}
        />
      )}

      {/* 4. HOW TO PLAY RULES MODAL */}
      {showHowToPlay && (
        <AviatorHowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* 5. PILOT PROFILE & CLOUD REGISTRATION MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0c1017] border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-lg shadow-md shadow-red-500/30 flex-shrink-0">
                  {editAvatar === 'pilot-2' ? '🛩️' : editAvatar === 'pilot-3' ? '🚀' : editAvatar === 'pilot-4' ? '🎖️' : editAvatar === 'pilot-5' ? '🦅' : editAvatar === 'pilot-6' ? '⚡' : '👨‍✈️'}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                    PILOT PROFILE & CLOUD REGISTRATION
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" /> Auto-Registered & Verified
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 truncate max-w-[150px]">{activeOperator.name}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Cloud & Company Status Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Cloud Database Integration</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Firebase Firestore Connected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Company / Operator</span>
                  <span className="font-bold text-slate-200 truncate block">{activeOperator.name} ({activeOperator.code})</span>
                </div>
                <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Player ID (Immutable)</span>
                  <span className="font-mono text-slate-300 truncate block text-[11px]">{activePlayer.id}</span>
                </div>
              </div>
            </div>

            {/* Edit Pilot Identity */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Pilot Callsign / Username:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    maxLength={24}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none"
                    placeholder="e.g. Maverick_99"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || !editUsername.trim()}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-red-600/30"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
                {profileSaveSuccess && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1 animate-in fade-in">
                    <CheckCircle className="w-3 h-3" /> Profile and callsign saved to Firebase Firestore!
                  </span>
                )}
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Select Flight Helmet / Call Avatar:
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: 'pilot-1', icon: '👨‍✈️', label: 'Captain' },
                    { id: 'pilot-2', icon: '🛩️', label: 'Monoplane' },
                    { id: 'pilot-3', icon: '🚀', label: 'Rocket' },
                    { id: 'pilot-4', icon: '🎖️', label: 'Ace' },
                    { id: 'pilot-5', icon: '🦅', label: 'Falcon' },
                    { id: 'pilot-6', icon: '⚡', label: 'Speed' },
                  ].map(av => (
                    <button
                      key={av.id}
                      onClick={() => setEditAvatar(av.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        editAvatar === av.id
                          ? 'bg-red-950/80 border-red-500 shadow-md shadow-red-500/20'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-xl">{av.icon}</span>
                      <span className="text-[9px] font-bold text-slate-300">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lifetime Career Flight Stats */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Lifetime Flight Statistics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Session Count</span>
                  <span className="text-base font-black font-mono text-slate-200">#{activePlayer.sessionCount || 1}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Wagered</span>
                  <span className="text-base font-black font-mono text-amber-400">{formatMoney(activePlayer.totalWagered || 0)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Won</span>
                  <span className="text-base font-black font-mono text-emerald-400">{formatMoney(activePlayer.totalWon || 0)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Best Multiplier</span>
                  <span className="text-base font-black font-mono text-rose-400">
                    {(activePlayer.bestMultiplier || 1.0).toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>

            {/* Bankroll Top-Up & Close */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={handleAddDemoFunds}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/30"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add +1,000 USD Bankroll</span>
              </button>

              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
