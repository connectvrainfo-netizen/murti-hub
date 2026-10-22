/**
 * Enterprise Performance Engineering Type Definitions
 * Covers Speculation Rules, Network Information API, Virtualization,
 * Cursor-based Keyset Pagination, and Stale-While-Revalidate Caching.
 */

// 1. Speculation Rules API Definitions (W3C Spec)
export type SpeculationAction = 'prefetch' | 'prerender';
export type SpeculationEagerness = 'immediate' | 'eager' | 'moderate' | 'conservative';

export interface SpeculationRule {
  source: 'list' | 'document';
  urls?: string[];
  where?: {
    href_matches?: string | string[];
    selector_matches?: string;
    and?: unknown[];
    not?: unknown;
  };
  eagerness?: SpeculationEagerness;
  requires?: Array<'anonymous-client-ip-when-cross-origin'>;
}

export interface SpeculationRulesPayload {
  prefetch?: SpeculationRule[];
  prerender?: SpeculationRule[];
}

// 2. Network Information API Definitions (W3C Network Information API)
export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g';
export type ConnectionType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

export interface NetworkInformation extends EventTarget {
  readonly effectiveType?: EffectiveConnectionType;
  readonly type?: ConnectionType;
  readonly downlink?: number; // Mb/s
  readonly rtt?: number; // ms
  readonly saveData?: boolean;
  onchange?: EventListener;
}

export interface NetworkAwareState {
  effectiveType: EffectiveConnectionType;
  downlink: number;
  rtt: number;
  saveData: boolean;
  isSlowConnection: boolean;
  shouldReduceMotion: boolean;
  recommendedImageQuality: 'low' | 'medium' | 'high';
}

// 3. Cursor-Based Pagination Definitions (Enterprise Keyset Pattern)
export interface CursorPaginationParams {
  limit?: number;
  cursor?: string | null;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPageInfo {
  startCursor: string | null;
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount?: number;
}

export interface CursorPaginatedResponse<T> {
  success: boolean;
  items: T[];
  pageInfo: CursorPageInfo;
  executionTimeMs?: number;
}

// 4. Stale-While-Revalidate (SWR) Definitions
export interface SWROptions<T> {
  ttlMs?: number; // Time to live in ms (default: 60_000)
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingIntervalMs?: number;
  fallbackData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface SWRResponse<T> {
  data: T | undefined;
  error: Error | null;
  isValidating: boolean;
  isLoading: boolean;
  mutate: (newData?: T | Promise<T>, shouldRevalidate?: boolean) => Promise<T | undefined>;
}

// 5. High-Throughput Virtualization
export interface VirtualGridItemProps<T> {
  item: T;
  index: number;
  style: React.CSSProperties;
}

// 6. User State Persistence (IndexedDB)
export interface PersistentCartItem {
  id: string;
  murtiId: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  primaryImage: string;
  updatedAt: number;
}

export interface RecentSearchItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
}
