/**
 * NeextPlay Real Database Engine
 * Integrates directly with real Firebase Firestore cloud database
 * with persistent local fallback for offline resilience.
 * Strictly configured for 2 core roles:
 * 1. COMPANY_ADMIN (Platform Control)
 * 2. DEVELOPER (Developer & Operator API Integration)
 */

import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'COMPANY_ADMIN' | 'DEVELOPER';
  companyName?: string;
  operatorId?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

const DB_NAME = 'NeextPlayPersistentDB';
const DB_VERSION = 3;

class RealDatabase {
  private localDb: IDBDatabase | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized && this.localDb) return;

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const d = (event.target as IDBOpenDBRequest).result;
        if (!d.objectStoreNames.contains('users')) {
          const s = d.createObjectStore('users', { keyPath: 'id' });
          s.createIndex('email', 'email', { unique: true });
        }
        if (!d.objectStoreNames.contains('operators')) d.createObjectStore('operators', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('players')) d.createObjectStore('players', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('ledger')) d.createObjectStore('ledger', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('game_rounds')) d.createObjectStore('game_rounds', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('credentials')) d.createObjectStore('credentials', { keyPath: 'id' });
      };

      request.onsuccess = async (event) => {
        this.localDb = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        await this.seedInitialDatabase();
        resolve();
      };

      request.onerror = () => {
        this.isInitialized = true;
        resolve();
      };
    });
  }

  private async seedInitialDatabase(): Promise<void> {
    const existing = await this.getAll<UserAccount>('users');
    if (existing.length > 0) return;

    const seedUsers: UserAccount[] = [
      {
        id: 'usr_developer_neexthub',
        email: 'neexthub@gmail.com',
        passwordHash: 'neext123',
        name: 'NeextHub Integration Lead',
        companyName: 'NeextHub Gaming Corp',
        role: 'DEVELOPER',
        operatorId: 'op_neexthub',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_company_admin',
        email: 'admin@neextplay.com',
        passwordHash: 'admin123',
        name: 'Alexander Vance',
        companyName: 'NeextPlay Studios HQ',
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_developer_nexus',
        email: 'dev@nexusbet.io',
        passwordHash: 'developer123',
        name: 'NexusBet Integration Lead',
        companyName: 'NexusBet International Ltd',
        role: 'DEVELOPER',
        operatorId: 'op_nexus',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const u of seedUsers) {
      await this.put('users', u);
    }
  }

  /**
   * Put record to Firebase Firestore and IndexedDB
   */
  public async put<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    // 1. Sync to Firebase Firestore cloud database
    try {
      const docRef = doc(db, storeName, item.id);
      await setDoc(docRef, item, { merge: true });
    } catch (e) {
      // cloud sync error, continues with local
    }

    // 2. Sync to local database
    if (this.localDb) {
      return new Promise((resolve) => {
        try {
          const tx = this.localDb!.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.put(item);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  }

  public async get<T>(storeName: string, key: string): Promise<T | null> {
    // Try Firebase Firestore first
    try {
      const docRef = doc(db, storeName, key);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as T;
      }
    } catch {
      // Fallback to local
    }

    if (!this.localDb) return null;
    return new Promise((resolve) => {
      try {
        const tx = this.localDb!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.localDb) return [];
    return new Promise((resolve) => {
      try {
        const tx = this.localDb!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  public async getUserByEmail(email: string): Promise<UserAccount | null> {
    const cleanEmail = email.toLowerCase().trim();

    // Check all users
    const all = await this.getAll<UserAccount>('users');
    const localMatch = all.find(u => u.email.toLowerCase() === cleanEmail);
    if (localMatch) return localMatch;

    return null;
  }
}

export const realDb = new RealDatabase();
