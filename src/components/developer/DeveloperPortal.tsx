import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Send,
  Download,
  Copy,
  Check,
  Key,
  Layers,
  CheckCircle2,
  FileCode,
  Building2,
  ShieldCheck,
  Zap,
  Globe2,
  Play,
  RotateCw,
  Rocket,
  BookOpen,
} from 'lucide-react';
import { platform } from '../../services/platformStore';
import { useAuth } from '../../services/authContext';
import { useI18n } from '../../services/i18nContext';
import { MasterApiLauncherStudio } from './MasterApiLauncherStudio';
import { MasterApiCurlSuite } from './MasterApiCurlSuite';

export const DeveloperPortal: React.FC<{ onLaunchDirectGame?: () => void; onRefresh?: () => void }> = ({
  onLaunchDirectGame,
  onRefresh = () => {},
}) => {
  const { user } = useAuth();
  const { t, language, currency, formatMoney } = useI18n();
  const isBn = language === 'bn';

  const [portalMode, setPortalMode] = useState<'CURL_SUITE' | 'MASTER_STUDIO' | 'DOCS_SANDBOX'>('CURL_SUITE');

  const activeOp = platform.getActiveOperator();
  const activePlayer = platform.getActivePlayer();
  const operatorCreds = platform.credentials.filter(c => c.operatorId === activeOp.id);
  const activeCred = operatorCreds[0] || {
    clientId: `np_client_live_${activeOp.code.toLowerCase()}_001`,
    clientSecretHash: activeOp.webhookSecret || 'np_sec_live_99a8b7c6d5e4f3a2b1c0',
    scopes: ['wallet:read', 'wallet:write', 'games:launch'],
  };

  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('LAUNCH_GAME');
  const [activeLang, setActiveLang] = useState<'TYPESCRIPT' | 'CURL' | 'PYTHON'>('TYPESCRIPT');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Personalized endpoints based on company details
  const endpoints = [
    {
      id: 'LAUNCH_GAME',
      method: 'POST',
      path: '/api/v1/games/launch',
      summary: isBn ? 'স্বাক্ষরিত গেম লঞ্চ টোকেন তৈরি' : 'Generate Signed Game Launch Token',
      description: isBn
        ? `${activeOp.name} এর খেলোয়াড়দের জন্য ১২০ মিনিটের স্বাক্ষরিত সেশন টোকেন তৈরি করুন।`
        : `Generates a short-lived signed launch session token customized for ${activeOp.name} players.`,
      defaultBody: {
        operatorId: activeOp.id,
        operatorPlayerId: `${activeOp.code.toLowerCase()}_player_991`,
        gameId: 'game_neext_fortune',
        currency: currency,
        language: language,
        returnUrl: `https://${activeOp.code.toLowerCase()}.com/casino/lobby`,
      },
    },
    {
      id: 'SLOT_SPIN',
      method: 'POST',
      path: '/api/v1/slot/spin',
      summary: isBn ? 'সার্ভার স্লট স্পিন ও নিষ্পত্তি' : 'Authoritative Slot Spin & Settlement',
      description: isBn
        ? `${activeOp.name} এর জন্য সার্টিফাইড ৫x৩ স্লট গণিত নির্বাহ, ব্যালেন্স ডেবিট এবং পে-লাইন মূল্যায়ন।`
        : `Executes certified 5x3 slot math for ${activeOp.name}, debits player balance, evaluates 20 paylines, and settles payout.`,
      defaultBody: {
        operatorId: activeOp.id,
        playerId: activePlayer.id,
        gameId: 'game_neext_fortune',
        betAmount: 10.00,
        currency: currency,
        requestId: `req_${activeOp.code.toLowerCase()}_${Date.now().toString(36)}`,
      },
    },
    {
      id: 'WALLET_DEBIT',
      method: 'POST',
      path: '/api/v1/wallet/debit',
      summary: isBn ? 'আইডেমপোটেন্ট ডাবল-এন্ট্রি ওয়ালেট ডেবিট' : 'Idempotent Double-Entry Wallet Debit',
      description: isBn
        ? `${activeOp.name} এর প্লেয়ার ওয়ালেট থেকে আইডেমপোটেন্সি-কি দ্বারা নিরাপদ অর্থ কর্তন।`
        : `Debits funds from ${activeOp.name}'s player wallet using an Idempotency-Key header.`,
      defaultBody: {
        operatorId: activeOp.id,
        playerId: activePlayer.id,
        amount: 50.00,
        currency: currency,
        idempotencyKey: `idem_deb_${activeOp.code.toLowerCase()}_${Date.now()}`,
        reason: 'EXTERNAL_ROUND_STAKE',
      },
    },
    {
      id: 'GET_BALANCE',
      method: 'GET',
      path: `/api/v1/wallet/balance?operatorId=${activeOp.id}&playerId=${activePlayer.id}`,
      summary: isBn ? 'প্লেয়ার ব্যালেন্স অনুসন্ধান' : 'Query Certified Player Balance',
      description: isBn
        ? `${activeOp.name} এর প্লেয়ারের বর্তমান লেজার ব্যালেন্স প্রাপ্তি।`
        : `Retrieves current ledger balance for ${activeOp.name} player account.`,
      defaultBody: null,
    },
    {
      id: 'GET_GAMES',
      method: 'GET',
      path: `/api/v1/operator/games?operatorId=${activeOp.id}`,
      summary: isBn ? 'কোম্পানির জন্য সক্রিয় গেম তালিকা' : 'List Activated Games for Company',
      description: isBn
        ? `${activeOp.name} এর জন্য অনুমোদিত গেম তালিকা, আরটিপি এবং বেটিং সীমা।`
        : `Fetches enabled titles, certified RTP profiles, and bet limits configured specifically for ${activeOp.name}.`,
      defaultBody: null,
    },
  ];

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint) || endpoints[0];

  const handleExecuteRequest = async () => {
    setIsSubmitting(true);
    setApiResponse(null);

    await new Promise(res => setTimeout(res, 220));

    let responseData: unknown = {};

    switch (currentEndpoint.id) {
      case 'LAUNCH_GAME': {
        const session = platform.createGameSession(activeOp.id, activePlayer.id, 'game_neext_fortune', currency);
        responseData = {
          status: 'success',
          code: 200,
          company: activeOp.name,
          data: {
            sessionToken: session.sessionToken,
            launchUrl: session.launchUrl,
            expiresAt: session.session.expiresAt,
            game: { id: 'game_neext_fortune', title: 'Neext Fortune', type: 'SLOT' },
            currency: currency,
            operatorCode: activeOp.code,
          },
        };
        break;
      }
      case 'SLOT_SPIN': {
        const spinRes = await platform.executeAuthoritativeSpin({
          playerId: activePlayer.id,
          gameId: 'game_neext_fortune',
          betAmount: 1.00,
          requestId: `sdk_req_${activeOp.code.toLowerCase()}_${Date.now()}`,
        });
        responseData = {
          ...spinRes,
          operator: activeOp.code,
          currency: currency,
        };
        break;
      }
      case 'WALLET_DEBIT': {
        const debitRes = platform.executeWalletTransaction({
          operatorId: activeOp.id,
          playerId: activePlayer.id,
          type: 'BET',
          amount: 10.00,
          currency: currency,
          idempotencyKey: `sdk_idem_${Date.now()}`,
        });
        responseData = debitRes;
        break;
      }
      case 'GET_BALANCE': {
        responseData = {
          status: 'success',
          code: 200,
          operator: activeOp.name,
          data: {
            playerId: activePlayer.id,
            externalPlayerId: activePlayer.externalPlayerId,
            currency: currency,
            balance: activePlayer.balance,
            lastActive: activePlayer.lastActiveAt,
          },
        };
        break;
      }
      case 'GET_GAMES': {
        const opConfigs = platform.configs.filter(c => c.operatorId === activeOp.id);
        responseData = {
          status: 'success',
          code: 200,
          operator: activeOp.name,
          totalActivated: opConfigs.filter(c => c.enabled).length,
          games: platform.games.map(g => {
            const cfg = opConfigs.find(c => c.gameId === g.id);
            return {
              id: g.id,
              name: g.name,
              type: g.type,
              enabled: cfg?.enabled ?? true,
              configuredRtp: cfg?.selectedRtpProfileId ?? 'RTP_STANDARD',
              minBet: cfg?.minBet ?? g.minBet,
              maxBet: cfg?.maxBet ?? g.maxBet,
              currency: currency,
            };
          }),
        };
        break;
      }
    }

    setApiResponse(JSON.stringify(responseData, null, 2));
    setIsSubmitting(false);
  };

  const codeSnippets: Record<string, Record<string, string>> = {
    LAUNCH_GAME: {
      TYPESCRIPT: `import { NeextPlayClient } from '@neextplay/sdk';

// ${activeOp.name} এর নিজস্ব ক্লায়েন্ট ক্রেডেনশিয়াল
const neextplay = new NeextPlayClient({
  clientId: '${activeCred.clientId}',
  clientSecret: process.env.NEEXTPLAY_SECRET,
  environment: 'production'
});

// গেম লঞ্চ সেশন তৈরি করুন
const session = await neextplay.games.launch({
  operatorId: '${activeOp.id}',
  operatorPlayerId: '${activeOp.code.toLowerCase()}_player_991',
  gameId: 'game_neext_fortune',
  currency: '${currency}',
  language: '${language}',
  returnUrl: 'https://${activeOp.code.toLowerCase()}.com/lobby'
});

console.log('Launch Frame URL:', session.launchUrl);`,
      CURL: `curl -X POST https://api.neextplay.com/api/v1/games/launch \\
  -H "X-Client-ID: ${activeCred.clientId}" \\
  -H "Authorization: Bearer ${activeCred.clientId}_live_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operatorId": "${activeOp.id}",
    "operatorPlayerId": "${activeOp.code.toLowerCase()}_player_991",
    "gameId": "game_neext_fortune",
    "currency": "${currency}"
  }'`,
      PYTHON: `import requests

headers = {
    "X-Client-ID": "${activeCred.clientId}",
    "Authorization": "Bearer ${activeCred.clientId}_live_token",
    "Content-Type": "application/json"
}

payload = {
    "operatorId": "${activeOp.id}",
    "operatorPlayerId": "${activeOp.code.toLowerCase()}_player_991",
    "gameId": "game_neext_fortune",
    "currency": "${currency}"
}

response = requests.post("https://api.neextplay.com/api/v1/games/launch", json=payload, headers=headers)
print(response.json())`,
    },
    SLOT_SPIN: {
      TYPESCRIPT: `const spinResult = await neextplay.slot.spin({
  operatorId: '${activeOp.id}',
  playerId: '${activePlayer.id}',
  gameId: 'game_neext_fortune',
  betAmount: 10.00,
  currency: '${currency}',
  requestId: 'spin_req_${activeOp.code.toLowerCase()}_123'
});

console.log('জয়লাভ (${currency}):', spinResult.totalPayout);
console.log('প্রমাণিত ফেয়ার হ্যাশ:', spinResult.serverSeedHash);`,
      CURL: `curl -X POST https://api.neextplay.com/api/v1/slot/spin \\
  -H "X-Client-ID: ${activeCred.clientId}" \\
  -H "Authorization: Bearer ${activeCred.clientId}_live_token" \\
  -H "Idempotency-Key: spin_req_${activeOp.code.toLowerCase()}_99214" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operatorId": "${activeOp.id}",
    "playerId": "${activePlayer.id}",
    "gameId": "game_neext_fortune",
    "betAmount": 10.00,
    "currency": "${currency}"
  }'`,
      PYTHON: `response = requests.post(
    "https://api.neextplay.com/api/v1/slot/spin",
    json={
        "operatorId": "${activeOp.id}",
        "playerId": "${activePlayer.id}",
        "gameId": "game_neext_fortune",
        "betAmount": 10.00,
        "currency": "${currency}"
    },
    headers={
        "X-Client-ID": "${activeCred.clientId}",
        "Authorization": "Bearer ${activeCred.clientId}_live_token",
        "Idempotency-Key": "spin_req_${activeOp.code.toLowerCase()}_99214"
    }
)
print(response.json())`,
    },
  };

  const codeToShow =
    codeSnippets[currentEndpoint.id]?.[activeLang] ||
    codeSnippets['LAUNCH_GAME'][activeLang];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Personalized Company Integration Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-3xl border border-indigo-900/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                {isBn ? 'ব্যক্তিগতকৃত ডেভেলপার ইন্টিগ্রেশন' : 'Personalized Developer Integration'}
              </span>
              <h1 className="text-2xl font-black text-white">{activeOp.name}</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl">
            {isBn
              ? `আপনার কোম্পানির ক্লায়েন্ট আইডি, সেটেলমেন্ট মুদ্রা (${currency}) এবং ওয়েবহুকের সরাসরি বিবরণ।`
              : `Live customized documentation with your company’s Client ID, settlement currency (${currency}), and webhook signatures.`}
          </p>
        </div>

        {/* Credentials Quick Pill */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500">{isBn ? 'আপনার ক্লায়েন্ট আইডি:' : 'Your Client ID:'}</span>
            <span className="text-indigo-300 font-bold truncate max-w-[180px]">{activeCred.clientId}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500">{isBn ? 'সেটেলমেন্ট মুদ্রা:' : 'Settlement:'}</span>
            <span className="text-amber-400 font-bold">{currency}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500">{isBn ? 'এপিআই স্ট্যাটাস:' : 'API Status:'}</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {isBn ? 'সক্রিয় (v1.0.0)' : 'Live (v1.0.0)'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setPortalMode('CURL_SUITE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            portalMode === 'CURL_SUITE'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-400'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Master API cURL Suite & Live Sandbox</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 text-[9px] font-black uppercase">
            CURL READY
          </span>
        </button>

        <button
          onClick={() => setPortalMode('MASTER_STUDIO')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            portalMode === 'MASTER_STUDIO'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg shadow-red-600/25 ring-1 ring-red-400'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>Category Launcher & Headers Studio</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
            LIVE
          </span>
        </button>

        <button
          onClick={() => setPortalMode('DOCS_SANDBOX')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            portalMode === 'DOCS_SANDBOX'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Personalized API Endpoints & SDKs</span>
        </button>
      </div>

      {portalMode === 'CURL_SUITE' ? (
        <MasterApiCurlSuite onRefresh={onRefresh} />
      ) : portalMode === 'MASTER_STUDIO' ? (
        <MasterApiLauncherStudio onRefresh={onRefresh} />
      ) : (
        /* Main Interactive Sandbox Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Endpoints List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isBn ? 'আপনার সক্রিয় এপিআই এন্ডপয়েন্ট' : 'Your Active Endpoints'}
            </h3>
          </div>

          <div className="space-y-1.5">
            {endpoints.map(ep => (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id);
                  setApiResponse(null);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition ${
                  selectedEndpoint === ep.id
                    ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-black ${
                      ep.method === 'POST' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-slate-200 font-semibold truncate">{ep.path}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">{ep.summary}</div>
              </button>
            ))}
          </div>

          {/* Quick Install SDK Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>{isBn ? `${activeOp.name} এর জন্য অফিশিয়াল SDK` : `Official SDK for ${activeOp.name}`}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-xs text-slate-300 flex items-center justify-between border border-slate-800">
              <span>npm i @neextplay/sdk</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('npm i @neextplay/sdk');
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="text-slate-400 hover:text-white"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Request Runner */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded font-mono text-xs font-black ${
                    currentEndpoint.method === 'POST' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentEndpoint.method}
                </span>
                <span className="font-mono text-sm font-bold text-white">{currentEndpoint.path}</span>
              </div>

              <button
                disabled={isSubmitting}
                onClick={handleExecuteRequest}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? (isBn ? 'সম্পন্ন হচ্ছে...' : 'Executing...') : (isBn ? 'আপনার কি দিয়ে টেস্ট করুন' : 'Test With Your Key')}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">{currentEndpoint.description}</p>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-xs">
                  {(['TYPESCRIPT', 'CURL', 'PYTHON'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                        activeLang === lang
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeToShow);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isBn ? 'কোড কপি করুন' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-200 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                {codeToShow}
              </div>
            </div>

            {/* Live API Response Output */}
            {apiResponse && (
              <div className="pt-3 border-t border-slate-800 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {isBn ? `সফল ২০০ ওকে রেসপন্স (${currency} এ নিষ্পত্তি)` : `Live 200 OK Response (Settled in ${currency})`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Format: application/json</span>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto max-h-64 scrollbar-thin">
                  {apiResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
