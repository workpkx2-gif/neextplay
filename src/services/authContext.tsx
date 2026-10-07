/**
 * NeextPlay Authentication Context & User Service
 * Manages 2 distinct enterprise roles:
 * 1. COMPANY_ADMIN (Platform Control)
 * 2. DEVELOPER (Developer & Operator API Integration)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { realDb, UserAccount } from '../db/indexedDbEngine';
import { platform } from './platformStore';
import { Operator } from '../types';

export type UserRole = 'COMPANY_ADMIN' | 'DEVELOPER';

interface AuthContextType {
  user: UserAccount | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerDeveloper: (data: {
    companyName: string;
    email: string;
    password: string;
    country: string;
    currency: string;
  }) => Promise<{ success: boolean; error?: string }>;
  quickLoginAs: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'neextplay_auth_session_user_v2';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await realDb.init();
        const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession) as UserAccount;
          const existing = await realDb.getUserByEmail(parsed.email);
          if (existing) {
            setUser(existing);
            syncPlatformContext(existing);
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const syncPlatformContext = (userAccount: UserAccount) => {
    if (userAccount.role === 'COMPANY_ADMIN') {
      platform.currentRole = 'SUPER_ADMIN';
    } else {
      platform.currentRole = 'OPERATOR';
      if (userAccount.operatorId) {
        platform.selectedOperatorId = userAccount.operatorId;
      }
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const found = await realDb.getUserByEmail(email);
      if (!found) {
        return { success: false, error: 'Account not found with this email address.' };
      }

      if (found.passwordHash !== pass) {
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      if (found.status === 'SUSPENDED') {
        return { success: false, error: 'Your account has been suspended by compliance.' };
      }

      setUser(found);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
      syncPlatformContext(found);

      platform.auditLogs.unshift({
        id: 'audit_login_' + Date.now().toString(36),
        operatorId: found.operatorId,
        actor: found.email,
        action: 'USER_LOGGED_IN',
        category: 'AUTH',
        details: `Authenticated as ${found.role} (${found.companyName || found.name})`,
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
      });

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Database authentication error occurred.' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerDeveloper = async (data: {
    companyName: string;
    email: string;
    password: string;
    country: string;
    currency: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const existing = await realDb.getUserByEmail(data.email);
      if (existing) {
        return { success: false, error: 'An account with this email already exists.' };
      }

      const opId = 'op_' + data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
      const code = data.companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

      // Create new operator entity in platform and database
      const newOperator: Operator = {
        id: opId,
        name: data.companyName,
        code,
        email: data.email,
        country: data.country,
        status: 'ACTIVE',
        currency: data.currency,
        allowedCurrencies: [data.currency, 'EUR', 'USD'],
        createdAt: new Date().toISOString(),
        totalGgr: 0,
        totalTurnover: 0,
        companyBalance: 100000.00,
        activePlayers: 1,
        ipWhitelist: ['127.0.0.1'],
        webhookUrl: 'https://api.' + code.toLowerCase() + '.com/neextplay/webhooks',
        webhookSecret: 'whsec_' + Math.random().toString(36).substring(2, 16),
      };

      platform.operators.push(newOperator);
      await realDb.put('operators', newOperator);

      // Generate custom API credentials for this developer
      const customCred = platform.generateApiKey(opId, `${data.companyName} Primary Live Key`, [
        'wallet:read',
        'wallet:write',
        'games:launch',
      ]);
      await realDb.put('credentials', customCred);

      // Create Developer user account
      const newUser: UserAccount = {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        email: data.email.toLowerCase().trim(),
        passwordHash: data.password,
        name: data.companyName + ' Developer',
        companyName: data.companyName,
        role: 'DEVELOPER',
        operatorId: opId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      await realDb.put('users', newUser);

      // Set initial game configurations
      platform.games.forEach(g => {
        platform.configs.push({
          gameId: g.id,
          operatorId: opId,
          enabled: true,
          selectedRtpProfileId: g.availableRtpProfiles[0]?.id || 'RTP_STANDARD',
          minBet: g.minBet,
          maxBet: g.maxBet,
          allowedCurrencies: [data.currency],
          jackpotContributionPct: 1.0,
        });
      });

      // Seed initial test player
      const initialPlayer = {
        id: 'ply_' + Math.random().toString(36).substring(2, 10),
        operatorId: opId,
        externalPlayerId: `${code.toLowerCase()}_player_001`,
        username: `dev_tester_${code.toLowerCase()}`,
        currency: data.currency,
        balance: 1000.0,
        status: 'ACTIVE' as const,
        rgLimits: { dailyDepositLimit: 5000, dailyLossLimit: 2000 },
        createdAt: new Date().toISOString(),
        lastActiveAt: 'Just now',
        totalWagered: 0,
        totalWon: 0,
        sessionCount: 1,
      };
      platform.players.push(initialPlayer);
      await realDb.put('players', initialPlayer);

      setUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      syncPlatformContext(newUser);

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Registration failed due to database error.' };
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = async (role: UserRole) => {
    let email = 'admin@neextplay.com';
    let pass = 'admin123';

    if (role === 'DEVELOPER') {
      email = 'neexthub@gmail.com';
      pass = 'neext123';
    }

    const res = await login(email, pass);
    if (!res.success && role === 'DEVELOPER') {
      await login('dev@nexusbet.io', 'developer123');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        registerDeveloper,
        quickLoginAs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
