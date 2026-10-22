import { openDB, type IDBPDatabase } from 'idb';
import type { PersistentCartItem, RecentSearchItem } from '../types/performance';

const DB_NAME = 'MurtiEnterpriseStore';
const DB_VERSION = 1;

interface MurtiDBSchema {
  cart: {
    key: string;
    value: PersistentCartItem;
    indexes: { 'by-updated': number };
  };
  recentSearches: {
    key: string;
    value: RecentSearchItem;
    indexes: { 'by-timestamp': number };
  };
  apiCache: {
    key: string;
    value: { url: string; data: unknown; timestamp: number };
    indexes: { 'by-url': string };
  };
}

class IndexedDBStorageManager {
  private dbPromise: Promise<IDBPDatabase<MurtiDBSchema>> | null = null;
  private listeners = new Set<(event: string, payload?: unknown) => void>();

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBPDatabase<MurtiDBSchema>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<MurtiDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // 1. Cart Items Store
          if (!db.objectStoreNames.contains('cart')) {
            const cartStore = db.createObjectStore('cart', { keyPath: 'id' });
            cartStore.createIndex('by-updated', 'updatedAt');
          }
          // 2. Recent Searches Store
          if (!db.objectStoreNames.contains('recentSearches')) {
            const searchStore = db.createObjectStore('recentSearches', { keyPath: 'id' });
            searchStore.createIndex('by-timestamp', 'timestamp');
          }
          // 3. API Resilience Fallback Store
          if (!db.objectStoreNames.contains('apiCache')) {
            const apiStore = db.createObjectStore('apiCache', { keyPath: 'url' });
            apiStore.createIndex('by-url', 'url');
          }
        },
      });
    }
    return this.dbPromise;
  }

  public subscribe(listener: (event: string, payload?: unknown) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: string, payload?: unknown): void {
    this.listeners.forEach((fn) => fn(event, payload));
  }

  // ==========================================
  // CART OPERATIONS
  // ==========================================
  public async upsertCartItem(item: PersistentCartItem): Promise<void> {
    const db = await this.initDB();
    await db.put('cart', item);
    this.notify('cart_updated', item);
  }

  public async getCartItems(): Promise<PersistentCartItem[]> {
    const db = await this.initDB();
    const items = await db.getAllFromIndex('cart', 'by-updated');
    return items.reverse(); // Newest first
  }

  public async removeCartItem(id: string): Promise<void> {
    const db = await this.initDB();
    await db.delete('cart', id);
    this.notify('cart_item_removed', id);
  }

  public async clearCart(): Promise<void> {
    const db = await this.initDB();
    await db.clear('cart');
    this.notify('cart_cleared');
  }

  // ==========================================
  // SEARCH QUERIES RESILIENCE
  // ==========================================
  public async saveRecentSearch(query: string, resultCount = 0): Promise<void> {
    if (!query.trim()) return;
    const db = await this.initDB();
    const item: RecentSearchItem = {
      id: `search_${query.toLowerCase().trim()}`,
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
    };
    await db.put('recentSearches', item);
    this.notify('search_saved', item);
  }

  public async getRecentSearches(limit = 10): Promise<RecentSearchItem[]> {
    const db = await this.initDB();
    const all = await db.getAllFromIndex('recentSearches', 'by-timestamp');
    return all.reverse().slice(0, limit);
  }

  // ==========================================
  // API FALLBACK CACHE (OFFLINE RECOVERY)
  // ==========================================
  public async cacheApiResponse(url: string, data: unknown): Promise<void> {
    const db = await this.initDB();
    await db.put('apiCache', {
      url,
      data,
      timestamp: Date.now(),
    });
  }

  public async getCachedApiResponse<T>(url: string): Promise<T | null> {
    const db = await this.initDB();
    const entry = await db.get('apiCache', url);
    return entry ? (entry.data as T) : null;
  }
}

export const indexedDBCache = new IndexedDBStorageManager();
export default indexedDBCache;
