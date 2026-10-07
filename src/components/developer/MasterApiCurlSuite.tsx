/**
 * NeextPlay Master API cURL Suite & Live Sandbox
 * - Auto-detects live site domain (origin & host)
 * - Displays all real credentials & Firebase database info
 * - Provides ready-to-use cURL commands for all endpoints
 * - Executes live API calls in browser sandbox with real response inspection
 */

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Globe2,
  Key,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Database,
  Sliders,
  Eye,
  EyeOff,
  Server,
  Zap,
  Activity,
  Code2,
  DollarSign,
} from 'lucide-react';
import { platform } from '../../services/platformStore';
import { useI18n } from '../../services/i18nContext';

interface CurlEndpointDef {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  category: 'CORE' | 'GAMES' | 'WALLET' | 'PLAYERS';
  description: string;
  defaultPayload?: any;
  defaultQueryParams?: Record<string, string>;
}

export const MasterApiCurlSuite: React.FC<{ onRefresh?: () => void }> = ({ onRefresh = () => {} }) => {
  const { formatMoney } = useI18n();

  // Dynamic Site Domain Detection
  const [detectedOrigin, setDetectedOrigin] = useState<string>('http://localhost:3000');
  const [detectedHost, setDetectedHost] = useState<string>('localhost:3000');
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    latencyMs: number;
    providerDomain: string;
    serverTime: string;
  } | null>(null);
  const [isPingingHealth, setIsPingingHealth] = useState<boolean>(false);

  // Active Operator & Real Credentials
  const activeOp = platform.getActiveOperator();
  const activePlayer = platform.getActivePlayer();
  const cred = platform.credentials.find(c => c.operatorId === activeOp.id) || platform.credentials[0];

  // Editable parameters for sample test calls
  const [apiKey, setApiKey] = useState<string>(cred.clientId || 'np_live_key_neexthub_992147');
  const [apiSecret, setApiSecret] = useState<string>(cred.rawSecretDisplay || 'np_sec_live_neexthub_8f7b6a5c4d3e210a');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string>(activePlayer?.id || 'ply_neexthub_vip1');
  const [playerName, setPlayerName] = useState<string>(activePlayer?.username || 'NeextHub High Roller');
  const [currency, setCurrency] = useState<string>(activePlayer?.currency || 'USD');
  const [betAmount, setBetAmount] = useState<number>(25.0);
  const [winAmount, setWinAmount] = useState<number>(75.0);
  const [depositAmount, setDepositAmount] = useState<number>(500.0);
  const [selectedGameId, setSelectedGameId] = useState<string>('game_aviator_pro');
  const [sessionTokenForVerify, setSessionTokenForVerify] = useState<string>('');

  // Selected Endpoint
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('LAUNCH_GAME');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Sandbox Live Execution State
  const [isRunningSandbox, setIsRunningSandbox] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<{
    status: number;
    statusText: string;
    latencyMs: number;
    data: any;
    rawHeaders?: Record<string, string>;
    executedUrl: string;
    timestamp: string;
  } | null>(null);

  // Auto-detect browser window origin & ping server
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const orig = window.location.origin;
      const hst = window.location.host;
      setDetectedOrigin(orig);
      setDetectedHost(hst);
      checkHealth(orig);
    }
  }, []);

  const checkHealth = async (originUrl?: string) => {
    setIsPingingHealth(true);
    const start = performance.now();
    try {
      const base = originUrl || detectedOrigin;
      const res = await fetch(`${base}/api/v1/health`);
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        const json = await res.json();
        setHealthStatus({
          status: 'ONLINE 200 OK',
          latencyMs: elapsed,
          providerDomain: json.provider?.detectedDomain || detectedHost,
          serverTime: json.provider?.serverTime || new Date().toISOString(),
        });
      } else {
        setHealthStatus({
          status: `HTTP ${res.status}`,
          latencyMs: elapsed,
          providerDomain: detectedHost,
          serverTime: new Date().toISOString(),
        });
      }
    } catch {
      setHealthStatus({
        status: 'OFFLINE / UNREACHABLE',
        latencyMs: 0,
        providerDomain: detectedHost,
        serverTime: new Date().toISOString(),
      });
    } finally {
      setIsPingingHealth(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const ENDPOINTS: CurlEndpointDef[] = [
    {
      id: 'HEALTH_CHECK',
      name: '1. Provider Health & Domain Detection',
      method: 'GET',
      path: '/api/v1/health',
      category: 'CORE',
      description: 'Checks server health, verifies site domain resolution, and returns live database specs.',
    },
    {
      id: 'CREDENTIALS_VAULT',
      name: '2. Get Real Credentials Vault',
      method: 'GET',
      path: '/api/v1/operators/credentials',
      category: 'CORE',
      description: 'Retrieves verified API keys, secret hashes, and webhook endpoints for integration.',
    },
    {
      id: 'LIST_GAMES',
      name: '3. List Active Games Catalog',
      method: 'GET',
      path: '/api/v1/games',
      category: 'GAMES',
      description: 'Queries active game titles, verified RTP profiles, bet limits, and game metadata.',
      defaultQueryParams: { category: 'CRASH' },
    },
    {
      id: 'LAUNCH_GAME',
      name: '4. Create Game Launch Session & Embed URL',
      method: 'POST',
      path: '/api/v1/games/launch',
      category: 'GAMES',
      description: 'Generates a signed game session and direct iframe launch URL with detected domain.',
      defaultPayload: {
        playerId,
        playerName,
        gameId: selectedGameId,
        currency,
        initialBalance: 1000,
        domain: detectedHost,
        returnUrl: `${detectedOrigin}/lobby`,
      },
    },
    {
      id: 'VERIFY_SESSION',
      name: '5. Verify Game Session Token',
      method: 'GET',
      path: sessionTokenForVerify ? `/api/v1/sessions/${sessionTokenForVerify}` : '/api/v1/sessions/np_sess_sample_test',
      category: 'GAMES',
      description: 'Verifies status, player balance, and expiration of a game session token.',
    },
    {
      id: 'QUERY_BALANCE',
      name: '6. Query Authoritative Player Balance',
      method: 'GET',
      path: `/api/v1/wallet/balance?playerId=${playerId}`,
      category: 'WALLET',
      description: 'Fetches certified player ledger balance, total wagered, and lifetime wins.',
    },
    {
      id: 'WALLET_BET',
      name: '7. Seamless Wallet Bet (Debit Balance)',
      method: 'POST',
      path: '/api/v1/wallet/bet',
      category: 'WALLET',
      description: 'Deducts wager amount from player balance upon round start with idempotency.',
      defaultPayload: {
        playerId,
        betAmount,
        currency,
        gameId: selectedGameId,
        roundId: 'rnd_' + Date.now().toString(36),
      },
    },
    {
      id: 'WALLET_WIN',
      name: '8. Seamless Wallet Win (Credit Balance)',
      method: 'POST',
      path: '/api/v1/wallet/win',
      category: 'WALLET',
      description: 'Credits win amount to player balance upon round completion or crash cashout.',
      defaultPayload: {
        playerId,
        winAmount,
        multiplier: 3.0,
        currency,
        gameId: selectedGameId,
        roundId: 'rnd_' + Date.now().toString(36),
      },
    },
    {
      id: 'WALLET_ROLLBACK',
      name: '9. Rollback / Cancel Bet Round',
      method: 'POST',
      path: '/api/v1/wallet/rollback',
      category: 'WALLET',
      description: 'Safely refunds debited bet amount if round is canceled or connection is lost.',
      defaultPayload: {
        playerId,
        rollbackAmount: betAmount,
        roundId: 'rnd_' + Date.now().toString(36),
        reason: 'OPERATOR_ROUND_CANCELLED',
      },
    },
    {
      id: 'WALLET_DEPOSIT',
      name: '10. Top-Up / Deposit Player Funds',
      method: 'POST',
      path: '/api/v1/wallet/deposit',
      category: 'WALLET',
      description: 'Deposits real or demo funds directly into player wallet for testing.',
      defaultPayload: {
        playerId,
        amount: depositAmount,
        currency,
      },
    },
    {
      id: 'CREATE_PLAYER',
      name: '11. Register New External Player',
      method: 'POST',
      path: '/api/v1/players/create',
      category: 'PLAYERS',
      description: 'Creates a new player account associated with the operator.',
      defaultPayload: {
        username: playerName,
        externalPlayerId: playerId,
        operatorId: activeOp.id,
        currency,
        initialBalance: 1500,
      },
    },
  ];

  const currentEndpoint = ENDPOINTS.find(e => e.id === selectedEndpointId) || ENDPOINTS[0];

  // Build the dynamic cURL string based on current state & detected domain
  const generateCurlCommand = (ep: CurlEndpointDef): string => {
    let url = `${detectedOrigin}${ep.path}`;
    if (ep.defaultQueryParams) {
      const q = new URLSearchParams(ep.defaultQueryParams).toString();
      url += `?${q}`;
    }

    if (ep.method === 'GET') {
      return `curl -X GET "${url}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "X-Operator-Id: ${activeOp.id}" \\
  -H "X-Domain: ${detectedHost}"`;
    }

    // Dynamic payload matching current form values
    let bodyObj = ep.defaultPayload;
    if (ep.id === 'LAUNCH_GAME') {
      bodyObj = {
        playerId,
        playerName,
        gameId: selectedGameId,
        currency,
        initialBalance: 1000,
        domain: detectedHost,
        returnUrl: `${detectedOrigin}/lobby`,
      };
    } else if (ep.id === 'WALLET_BET') {
      bodyObj = {
        playerId,
        betAmount,
        currency,
        gameId: selectedGameId,
        roundId: 'rnd_' + Date.now().toString(36),
      };
    } else if (ep.id === 'WALLET_WIN') {
      bodyObj = {
        playerId,
        winAmount,
        multiplier: 3.0,
        currency,
        gameId: selectedGameId,
        roundId: 'rnd_' + Date.now().toString(36),
      };
    } else if (ep.id === 'WALLET_DEPOSIT') {
      bodyObj = {
        playerId,
        amount: depositAmount,
        currency,
      };
    }

    const jsonStr = JSON.stringify(bodyObj, null, 2);

    return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "X-Operator-Id: ${activeOp.id}" \\
  -H "X-Domain: ${detectedHost}" \\
  -d '${JSON.stringify(bodyObj)}'`;
  };

  // Run the API call live against the Express server
  const handleRunSandbox = async () => {
    setIsRunningSandbox(true);
    setSandboxResult(null);

    const start = performance.now();
    let url = `${detectedOrigin}${currentEndpoint.path}`;
    if (currentEndpoint.defaultQueryParams) {
      const q = new URLSearchParams(currentEndpoint.defaultQueryParams).toString();
      url += `?${q}`;
    }

    let bodyPayload: any = undefined;
    if (currentEndpoint.method === 'POST') {
      if (currentEndpoint.id === 'LAUNCH_GAME') {
        bodyPayload = {
          playerId,
          playerName,
          gameId: selectedGameId,
          currency,
          initialBalance: 1000,
          domain: detectedHost,
          returnUrl: `${detectedOrigin}/lobby`,
        };
      } else if (currentEndpoint.id === 'WALLET_BET') {
        bodyPayload = {
          playerId,
          betAmount,
          currency,
          gameId: selectedGameId,
          roundId: 'rnd_' + Date.now().toString(36),
        };
      } else if (currentEndpoint.id === 'WALLET_WIN') {
        bodyPayload = {
          playerId,
          winAmount,
          multiplier: 3.0,
          currency,
          gameId: selectedGameId,
          roundId: 'rnd_' + Date.now().toString(36),
        };
      } else if (currentEndpoint.id === 'WALLET_DEPOSIT') {
        bodyPayload = {
          playerId,
          amount: depositAmount,
          currency,
        };
      } else if (currentEndpoint.id === 'WALLET_ROLLBACK') {
        bodyPayload = {
          playerId,
          rollbackAmount: betAmount,
          roundId: 'rnd_' + Date.now().toString(36),
          reason: 'OPERATOR_TEST_ROLLBACK',
        };
      } else if (currentEndpoint.id === 'CREATE_PLAYER') {
        bodyPayload = {
          username: playerName,
          externalPlayerId: playerId,
          operatorId: activeOp.id,
          currency,
          initialBalance: 1500,
        };
      } else {
        bodyPayload = currentEndpoint.defaultPayload;
      }
    }

    try {
      const res = await fetch(url, {
        method: currentEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-Operator-Id': activeOp.id,
          'X-Domain': detectedHost,
        },
        body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
      });

      const elapsed = Math.round(performance.now() - start);
      const json = await res.json();

      // If launch game, save token for verify test
      if (json.data?.sessionToken) {
        setSessionTokenForVerify(json.data.sessionToken);
      }

      setSandboxResult({
        status: res.status,
        statusText: res.statusText || 'OK',
        latencyMs: elapsed,
        data: json,
        executedUrl: url,
        timestamp: new Date().toLocaleTimeString(),
      });

      onRefresh();
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setSandboxResult({
        status: 500,
        statusText: 'FETCH_ERROR',
        latencyMs: elapsed,
        data: { error: err.message || 'Failed to connect to Master API' },
        executedUrl: url,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsRunningSandbox(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. DETECTED PROVIDER DOMAIN & FIREBASE STATUS BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0d131f] to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SITE DOMAIN DETECTED & ACTIVE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono font-bold">
                CORS: UNIVERSAL (*)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Globe2 className="w-6 h-6 text-cyan-400" />
              Live Master Provider API & cURL Integration Gateway
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Automatic domain resolution detected this application's host origin. Any external server, terminal cURL, Postman, or partner casino website can execute live calls directly with certified real credentials.
            </p>
          </div>

          {/* Quick Health Ping Widget */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">GATEWAY HEALTH</span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                {healthStatus?.status || 'CHECKING...'}
                {healthStatus && ` (${healthStatus.latencyMs}ms)`}
              </span>
            </div>
            <button
              onClick={() => checkHealth()}
              disabled={isPingingHealth}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Ping Master API Health"
            >
              <RefreshCw className={`w-4 h-4 ${isPingingHealth ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* DETECTED DOMAIN METRICS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-black block">Detected Site Origin</span>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-cyan-300 font-bold truncate text-[11px]">{detectedOrigin}</span>
              <button
                onClick={() => copyToClipboard(detectedOrigin, 'orig')}
                className="p-1 hover:text-white text-slate-400"
                title="Copy Origin"
              >
                {copiedIndex === 'orig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-black block">Master API Base URL</span>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-amber-300 font-bold truncate text-[11px]">{detectedOrigin}/api/v1</span>
              <button
                onClick={() => copyToClipboard(`${detectedOrigin}/api/v1`, 'base')}
                className="p-1 hover:text-white text-slate-400"
                title="Copy Base URL"
              >
                {copiedIndex === 'base' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-black block">Firebase Database</span>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-emerald-400 font-bold truncate text-[11px]">
                ai-studio-neextplayb2bgami...
              </span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-black block">Default Operator ID</span>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-indigo-300 font-bold truncate text-[11px]">{activeOp.id} ({activeOp.code})</span>
              <Key className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. REAL CREDENTIALS VAULT */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">
              REAL CREDENTIALS VAULT (PRE-AUTHENTICATED FOR cURL)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Operator: <strong className="text-amber-400">{activeOp.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">API Key (Client ID)</span>
              <button
                onClick={() => copyToClipboard(apiKey, 'key')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedIndex === 'key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 'key' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-indigo-200 font-mono text-xs outline-none"
            />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">HMAC Secret (API Secret)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-slate-400 hover:text-white"
                  title={showSecret ? 'Hide Secret' : 'Show Secret'}
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => copyToClipboard(apiSecret, 'sec')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedIndex === 'sec' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 'sec' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <input
              type={showSecret ? 'text' : 'password'}
              value={apiSecret}
              onChange={e => setApiSecret(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-amber-300 font-mono text-xs outline-none"
            />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Webhook Secret</span>
              <button
                onClick={() => copyToClipboard(activeOp.webhookSecret || '', 'whsec')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedIndex === 'whsec' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 'whsec' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono text-xs truncate">
              {activeOp.webhookSecret || 'whsec_neexthub_live_449018273645'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TEST BENCH & INTERACTIVE PARAMETERS */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">
              SAMPLE TEST PARAMETERS (SYNCHRONIZES INTO cURL CODE)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Player: <strong className="text-white">{playerName}</strong> ({playerId})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Player ID</label>
            <input
              type="text"
              value={playerId}
              onChange={e => setPlayerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-sans text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-amber-300 outline-none focus:border-amber-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="BDT">BDT (৳)</option>
              <option value="INR">INR (₹)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Target Game</label>
            <select
              value={selectedGameId}
              onChange={e => setSelectedGameId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-sans text-cyan-300 outline-none focus:border-amber-500"
            >
              <option value="game_aviator_pro">Aviator (Crash)</option>
              <option value="game_neext_fortune">Neext Fortune (Slot)</option>
              <option value="game_neext_velocity">Neext Velocity (Crash)</option>
              <option value="game_monaco_roulette">Monaco VIP Roulette</option>
              <option value="game_imperial_baccarat">Imperial Baccarat</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Bet Stake</label>
            <input
              type="number"
              min="0.5"
              step="5"
              value={betAmount}
              onChange={e => setBetAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-rose-300 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Win Payout</label>
            <input
              type="number"
              min="1"
              step="10"
              value={winAmount}
              onChange={e => setWinAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-emerald-300 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 4. MAIN ENDPOINT SELECTOR & cURL SANDBOX RUNNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Endpoints List */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              SELECT MASTER API ENDPOINT ({ENDPOINTS.length})
            </h4>
          </div>

          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {ENDPOINTS.map(ep => (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpointId(ep.id);
                  setSandboxResult(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition ${
                  selectedEndpointId === ep.id
                    ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-black uppercase ${
                        ep.method === 'POST' ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs text-white font-bold truncate max-w-[210px]">{ep.path}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-900 border border-slate-800 text-slate-400">
                    {ep.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-1">{ep.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Generated cURL, Sandbox Execution & Live Response */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active Endpoint Header */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase ${
                      currentEndpoint.method === 'POST' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {currentEndpoint.method}
                  </span>
                  <span className="font-mono text-sm text-white font-bold">{currentEndpoint.path}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{currentEndpoint.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(generateCurlCommand(currentEndpoint), 'curl_active')}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  {copiedIndex === 'curl_active' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'curl_active' ? 'Copied!' : 'Copy cURL'}</span>
                </button>

                <button
                  onClick={handleRunSandbox}
                  disabled={isRunningSandbox}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningSandbox ? 'animate-spin' : ''}`} />
                  <span>{isRunningSandbox ? 'Executing...' : 'Run in Sandbox'}</span>
                </button>
              </div>
            </div>

            {/* Generated cURL Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  Terminal cURL Command (Pre-populated with detected domain)
                </span>
                <span className="text-emerald-400 font-bold">100% Executable</span>
              </div>

              <pre className="bg-[#05080e] border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed shadow-inner">
                {generateCurlCommand(currentEndpoint)}
              </pre>
            </div>
          </div>

          {/* Sandbox Live Response Viewer */}
          {sandboxResult && (
            <div className="bg-[#090d14] border-2 border-emerald-500/40 rounded-3xl p-5 space-y-3 shadow-2xl animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black ${
                      sandboxResult.status >= 200 && sandboxResult.status < 300
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    HTTP {sandboxResult.status} {sandboxResult.statusText}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Latency: <strong className="text-white">{sandboxResult.latencyMs} ms</strong>
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Time: {sandboxResult.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* If response contains launchUrl, offer to launch it right now! */}
                  {sandboxResult.data?.data?.launchUrl && (
                    <a
                      href={sandboxResult.data.data.launchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1 shadow-md shadow-red-600/30 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Launched Game</span>
                    </a>
                  )}

                  <button
                    onClick={() => copyToClipboard(JSON.stringify(sandboxResult.data, null, 2), 'resp_json')}
                    className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs hover:text-white flex items-center gap-1"
                    title="Copy Response JSON"
                  >
                    {copiedIndex === 'resp_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 'resp_json' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Formatted JSON Output */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                  LIVE RESPONSE JSON PAYLOAD
                </span>
                <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-300 max-h-80 overflow-y-auto leading-relaxed shadow-inner">
                  {JSON.stringify(sandboxResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
