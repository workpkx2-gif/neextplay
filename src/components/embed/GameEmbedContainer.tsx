/**
 * NeextPlay Game Embed Container
 * Dedicated edge-to-edge container designed strictly for HTML <iframe> integration.
 * - Handles URL query parameters: ?embed=true&game=aviator&token=...&currency=USD&lang=en&operatorId=...
 * - Emits and listens to Bi-Directional window.postMessage API events
 * - Seamless zero-login embedded operation with persistent double-entry ledger wallet
 * - Supports fullscreen toggle, exit callback, audio sync, and live ledger balance updates
 */

import React, { useState, useEffect } from 'react';
import { AviatorGameClient } from '../game/AviatorGameClient';
import { SlotGameClient } from '../game/SlotGameClient';
import { LiveCasinoClient } from '../game/LiveCasinoClient';
import { platform } from '../../services/platformStore';
import { useI18n } from '../../services/i18nContext';
import { soundFx } from '../../utils/audio';

export const GameEmbedContainer: React.FC = () => {
  const { setCurrency, setLanguage } = useI18n();
  const [activePlayer, setActivePlayer] = useState(() => platform.getActivePlayer());
  const [, setTick] = useState(0);

  // Parse URL query parameters
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const gameKey = (urlParams.get('game') || 'aviator').toLowerCase();
  const currencyParam = urlParams.get('currency') || urlParams.get('curr');
  const langParam = urlParams.get('lang') || urlParams.get('language');
  const operatorIdParam = urlParams.get('operatorId') || urlParams.get('op');
  const playerIdParam = urlParams.get('playerId') || urlParams.get('player');
  const returnUrlParam = urlParams.get('returnUrl') || '';
  const tokenParam = urlParams.get('token') || urlParams.get('session');

  // Initialize session & postMessage bridge
  useEffect(() => {
    // 1. Sync currency & language if passed in query params
    if (currencyParam) {
      setCurrency(currencyParam);
      if (activePlayer) {
        activePlayer.currency = currencyParam;
      }
    }
    if (langParam) {
      setLanguage(langParam);
    }

    // 2. Select operator if specified
    if (operatorIdParam) {
      const op = platform.operators.find(o => o.id === operatorIdParam || o.code.toLowerCase() === operatorIdParam.toLowerCase());
      if (op) {
        platform.selectedOperatorId = op.id;
      }
    }

    // 3. Connect player
    if (playerIdParam) {
      const existing = platform.players.find(p => p.id === playerIdParam || p.externalPlayerId === playerIdParam);
      if (existing) {
        platform.activePlayerId = existing.id;
        setActivePlayer(existing);
      }
    }

    // 4. Send INITIAL READY postMessage to parent window
    const notifyReady = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'NEEXTPLAY_GAME_LOADED',
            game: gameKey,
            sessionToken: tokenParam || 'demo_iframe_token',
            currency: currencyParam || activePlayer.currency,
            version: '3.1.0',
            timestamp: Date.now(),
          },
          '*'
        );
      }
    };
    notifyReady();

    // 5. Setup postMessage event listener from parent window
    const handleParentMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        switch (data.type) {
          case 'NEEXTPLAY_SET_BALANCE':
            if (typeof data.balance === 'number') {
              const curPlayer = platform.getActivePlayer();
              curPlayer.balance = data.balance;
              setActivePlayer({ ...curPlayer });
              setTick(t => t + 1);
              if (window.parent) {
                window.parent.postMessage(
                  { type: 'NEEXTPLAY_BALANCE_CONFIRMED', balance: curPlayer.balance },
                  '*'
                );
              }
            }
            break;

          case 'NEEXTPLAY_SET_MUTED':
            if (typeof data.muted === 'boolean') {
              if (soundFx.getMuted() !== data.muted) {
                soundFx.toggleMute();
              }
            }
            break;

          case 'NEEXTPLAY_PING':
            if (window.parent) {
              window.parent.postMessage({ type: 'NEEXTPLAY_PONG', timestamp: Date.now() }, '*');
            }
            break;

          case 'NEEXTPLAY_TRIGGER_EXIT':
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'NEEXTPLAY_EXIT_GAME', returnUrl: returnUrlParam }, '*');
            }
            if (returnUrlParam) {
              window.location.href = returnUrlParam;
            }
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => {
      window.removeEventListener('message', handleParentMessage);
    };
  }, []);

  const handleRefresh = () => {
    const p = platform.getActivePlayer();
    setActivePlayer({ ...p });
    setTick(t => t + 1);

    // Notify parent window of balance update
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'NEEXTPLAY_BALANCE_UPDATE',
          balance: p.balance,
          currency: p.currency,
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  const isAviator = gameKey === 'aviator' || gameKey === 'crash' || gameKey.includes('aviator') || gameKey === 'game_aviator_pro';
  const isSlot = gameKey === 'slot' || gameKey.includes('fortune') || gameKey === 'game_neext_fortune';
  const isLive = gameKey === 'live' || gameKey.includes('roulette') || gameKey === 'game_monaco_roulette';

  return (
    <div className="w-full h-screen max-h-screen bg-[#070a10] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Direct Pure Game Client Edge-to-Edge: Iframe header layer removed */}
      <main className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
        {isAviator && <AviatorGameClient onRefresh={handleRefresh} />}
        {isSlot && <SlotGameClient onRefresh={handleRefresh} />}
        {isLive && <LiveCasinoClient onRefresh={handleRefresh} />}
      </main>
    </div>
  );
};
