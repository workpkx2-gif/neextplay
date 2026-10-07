/**
 * NeextPlay HTML Iframe Embed Generator & Live Sandbox Simulator
 * Generates turnkey HTML <iframe> code and bi-directional postMessage API handlers
 * for embedding Aviator and other games into any external website or casino lobby.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Copy,
  Check,
  Play,
  Monitor,
  Smartphone,
  Terminal,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders,
  Maximize2,
  Send,
  Radio,
} from 'lucide-react';
import { platform } from '../../services/platformStore';
import { useI18n } from '../../services/i18nContext';

interface PostMessageLog {
  id: string;
  direction: 'INCOMING' | 'OUTGOING';
  event: string;
  payload: any;
  timestamp: string;
}

export const IframeEmbedGenerator: React.FC = () => {
  const { currency: currentCurrency, language: currentLanguage, formatMoney } = useI18n();
  const activeOp = platform.getActiveOperator();
  const activePlayer = platform.getActivePlayer();

  // Configuration state
  const [selectedGame, setSelectedGame] = useState<'aviator' | 'slot' | 'live'>('aviator');
  const [currency, setCurrency] = useState<string>(currentCurrency);
  const [lang, setLang] = useState<string>(currentLanguage);
  const [playerId, setPlayerId] = useState<string>(activePlayer.externalPlayerId || 'player_user_99182');
  const [operatorId, setOperatorId] = useState<string>(activeOp.id);
  const [returnUrl, setReturnUrl] = useState<string>(`https://${activeOp.code.toLowerCase()}.com/casino/lobby`);
  const [iframeHeight, setIframeHeight] = useState<number>(720);
  const [viewDevice, setViewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');

  // Copy states
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedJs, setCopiedJs] = useState<boolean>(false);

  // Live sandbox state
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [messageLogs, setMessageLogs] = useState<PostMessageLog[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Computed embed URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `${baseUrl}/?embed=true&game=${selectedGame}&operatorId=${operatorId}&playerId=${encodeURIComponent(
    playerId
  )}&currency=${currency}&lang=${lang}&returnUrl=${encodeURIComponent(returnUrl)}`;

  // Generated Clean HTML Snippet
  const generatedIframeHtml = `<!-- NeextPlay ${selectedGame.toUpperCase()} HTML Iframe Integration -->
<iframe
  src="${embedUrl}"
  width="100%"
  height="${iframeHeight}px"
  frameborder="0"
  allow="autoplay; fullscreen"
  allowfullscreen
  loading="lazy"
  title="NeextPlay ${selectedGame.toUpperCase()}"
  style="border: none; border-radius: 16px; width: 100%; height: ${iframeHeight}px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);"
></iframe>`;

  // Generated Parent Window JavaScript Event Listener
  const generatedParentJs = `// Listen for NeextPlay Game Events in Parent Window
window.addEventListener('message', function(event) {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  switch (data.type) {
    case 'NEEXTPLAY_GAME_LOADED':
      console.log('Game initialized:', data.game, data.version);
      break;

    case 'NEEXTPLAY_BET':
      console.log('Player placed bet:', data.amount, data.currency);
      break;

    case 'NEEXTPLAY_WIN':
      console.log('Player won:', data.winAmount, 'Multiplier:', data.multiplier);
      break;

    case 'NEEXTPLAY_BALANCE_UPDATE':
      console.log('Updated player wallet balance:', data.balance);
      break;

    case 'NEEXTPLAY_EXIT_GAME':
      console.log('Player clicked exit:', data.returnUrl);
      window.location.href = data.returnUrl || '/lobby';
      break;
  }
});

// Example: Dynamically update player balance from parent website
function updateGameBalance(newBalance) {
  const gameIframe = document.querySelector('iframe');
  if (gameIframe && gameIframe.contentWindow) {
    gameIframe.contentWindow.postMessage({
      type: 'NEEXTPLAY_SET_BALANCE',
      balance: newBalance
    }, '*');
  }
}`;

  // Listen to postMessages from child iframe in this preview sandbox
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (!data || typeof data !== 'object' || !data.type?.startsWith('NEEXTPLAY_')) return;

        setMessageLogs(prev => [
          {
            id: `msg_${Date.now()}_${Math.random()}`,
            direction: 'INCOMING',
            event: data.type,
            payload: data,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev.slice(0, 24),
        ]);
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Send test postMessage to iframe
  const sendPostMessageToIframe = (type: string, payload: any = {}) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const msg = { type, ...payload };
      iframeRef.current.contentWindow.postMessage(msg, '*');

      setMessageLogs(prev => [
        {
          id: `out_${Date.now()}`,
          direction: 'OUTGOING',
          event: type,
          payload: msg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 24),
      ]);
    }
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in">
      
      {/* Section Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#101624] to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase flex items-center gap-1">
              <span>✈️</span>
              <span>TURNKEY IFRAME INTEGRATION</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
              POSTMESSAGE API READY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
            HTML Iframe Embed Generator & Live Sandbox
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Embed Aviator or any NeextPlay game seamlessly inside your casino website or webview using a single HTML <code className="text-amber-400 font-mono">&lt;iframe&gt;</code> tag with bi-directional event communication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(generatedIframeHtml, setCopiedHtml)}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/25 flex items-center gap-2"
          >
            {copiedHtml ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedHtml ? 'HTML Copied!' : 'Copy Iframe HTML'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Iframe Launch Parameters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Game Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Target Game</label>
            <select
              value={selectedGame}
              onChange={e => {
                setSelectedGame(e.target.value as any);
                setIframeKey(k => k + 1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="aviator">✈️ Aviator (Crash Game)</option>
              <option value="slot">🎰 Neext Fortune (5x3 Slot)</option>
              <option value="live">🎲 Monaco VIP Roulette (Live)</option>
            </select>
          </div>

          {/* Currency Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Currency</label>
            <select
              value={currency}
              onChange={e => {
                setCurrency(e.target.value);
                setIframeKey(k => k + 1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-xs outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="BRL">BRL (R$ - Brazilian Real)</option>
              <option value="USDT">USDT (Tether)</option>
            </select>
          </div>

          {/* Language Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Language</label>
            <select
              value={lang}
              onChange={e => {
                setLang(e.target.value);
                setIframeKey(k => k + 1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="en">English (US/UK)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="es">Español (Spanish)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="pt">Português (Portuguese)</option>
              <option value="de">Deutsch (German)</option>
            </select>
          </div>

          {/* Custom Player ID */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Operator Player ID</label>
            <input
              type="text"
              value={playerId}
              onChange={e => {
                setPlayerId(e.target.value);
                setIframeKey(k => k + 1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-xs outline-none focus:border-red-500"
            />
          </div>

          {/* Iframe Height */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Iframe Height (px)</label>
            <input
              type="number"
              min="500"
              max="1200"
              step="50"
              value={iframeHeight}
              onChange={e => setIframeHeight(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs outline-none focus:border-red-500"
            />
          </div>

          {/* Return URL */}
          <div className="sm:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Return URL (Lobby Exit)</label>
            <input
              type="text"
              value={returnUrl}
              onChange={e => setReturnUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono text-xs outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Code Snippets & PostMessage API Docs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Code 1: Embed HTML Code */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-red-500" />
              <span className="font-mono text-slate-300 font-bold">index.html (Iframe Code)</span>
            </div>
            <button
              onClick={() => copyToClipboard(generatedIframeHtml, setCopiedHtml)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHtml ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 font-mono text-xs text-rose-300 overflow-x-auto leading-relaxed bg-black/40 flex-1 whitespace-pre">
            {generatedIframeHtml}
          </pre>
        </div>

        {/* Code 2: JavaScript PostMessage Listener */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-slate-300 font-bold">casino-wallet-bridge.js (Parent Listener)</span>
            </div>
            <button
              onClick={() => copyToClipboard(generatedParentJs, setCopiedJs)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
            >
              {copiedJs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJs ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed bg-black/40 flex-1 whitespace-pre">
            {generatedParentJs}
          </pre>
        </div>
      </div>

      {/* LIVE INTERACTIVE IFRAME SANDBOX PREVIEW & EVENT INSPECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        
        {/* Sandbox Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Play className="w-4 h-4 text-red-500 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Live Iframe Sandbox Simulator</h3>
              <p className="text-xs text-slate-400">Testing real embedding & postMessage communication</p>
            </div>
          </div>

          {/* Sandbox Controls (Device Toggle, Reload, PostMessage triggers) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Device Frame View */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewDevice('DESKTOP')}
                className={`p-1.5 rounded-lg transition ${
                  viewDevice === 'DESKTOP' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View (100%)"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewDevice('MOBILE')}
                className={`p-1.5 rounded-lg transition ${
                  viewDevice === 'MOBILE' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile View (420px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Test Parent Commands */}
            <button
              onClick={() => sendPostMessageToIframe('NEEXTPLAY_SET_BALANCE', { balance: 2500.0 })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1 text-[11px]"
              title="Simulate updating player wallet balance"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Send Balance ($2,500)</span>
            </button>

            <button
              onClick={() => sendPostMessageToIframe('NEEXTPLAY_PING')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1 text-[11px]"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ping Iframe</span>
            </button>

            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Reload Iframe"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Open Standalone Embed Window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Live Iframe Window */}
        <div className="flex justify-center bg-black/60 p-2 sm:p-4 rounded-2xl border border-slate-800/80">
          <div
            className={`transition-all duration-300 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-black ${
              viewDevice === 'MOBILE' ? 'w-[420px] max-w-full' : 'w-full'
            }`}
            style={{ height: `${iframeHeight}px` }}
          >
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
              className="w-full h-full block"
              title="NeextPlay Embed Sandbox"
            />
          </div>
        </div>

        {/* Realtime postMessage Event Stream Inspector */}
        <div className="bg-[#090d15] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE POSTMESSAGE CONSOLE ({messageLogs.length} events)
            </span>

            <button
              onClick={() => setMessageLogs([])}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-mono transition"
            >
              Clear Console
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
            {messageLogs.length === 0 ? (
              <div className="text-slate-600 text-xs py-2">
                Waiting for iframe events... Play the game above (Place Bet / Cash Out) to inspect live events.
              </div>
            ) : (
              messageLogs.map(log => (
                <div
                  key={log.id}
                  className={`p-1.5 rounded border flex items-start justify-between gap-2 ${
                    log.direction === 'INCOMING'
                      ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300'
                      : 'bg-indigo-950/30 border-indigo-500/20 text-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] font-black ${
                        log.direction === 'INCOMING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                      }`}
                    >
                      {log.direction}
                    </span>
                    <strong className="text-white">{log.event}</strong>
                    <span className="text-slate-400 text-[10px] truncate">{JSON.stringify(log.payload)}</span>
                  </div>
                  <span className="text-slate-500 text-[10px] flex-shrink-0">{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
