/**
 * Enterprise In-Memory LRU Cache with Multi-Tab BroadcastChannel Sync
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SWRCacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inflightRequests = new Map<string, Promise<unknown>>();
  private broadcastChannel: BroadcastChannel | null = null;
  private maxEntries: number;

  constructor(maxEntries = 250) {
    this.maxEntries = maxEntries;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('swr_revalidation_bus');
        this.broadcastChannel.onmessage = (event) => {
          const { key, data, timestamp } = event.data || {};
          if (key && data) {
            this.setLocal(key, data, timestamp);
          }
        };
      } catch (err) {
        console.debug('[SWRCache] BroadcastChannel unavailable', err);
      }
    }
  }

  public get<T>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key) as CacheEntry<T> | undefined;
  }

  public set<T>(key: string, data: T, broadcast = true): void {
    const timestamp = Date.now();
    this.setLocal(key, data, timestamp);

    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({ key, data, timestamp });
    }
  }

  private setLocal(key: string, data: unknown, timestamp: number): void {
    // Evict oldest entry if exceeding max capacity (LRU order)
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, timestamp });
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public getInflight<T>(key: string): Promise<T> | undefined {
    return this.inflightRequests.get(key) as Promise<T> | undefined;
  }

  public setInflight<T>(key: string, promise: Promise<T>): void {
    this.inflightRequests.set(key, promise as Promise<unknown>);
  }

  public deleteInflight(key: string): void {
    this.inflightRequests.delete(key);
  }
}

export const swrGlobalCache = new SWRCacheManager();
