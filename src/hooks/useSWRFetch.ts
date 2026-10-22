import { useState, useEffect, useCallback, useRef } from 'react';
import { swrGlobalCache } from '../utils/swrCache';
import type { SWROptions, SWRResponse } from '../types/performance';

/**
 * Enterprise Stale-While-Revalidate (SWR) React Hook
 * Immediately returns cached data to achieve 0ms user wait time,
 * while asynchronously revalidating data in the background.
 */
export function useSWRFetch<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: SWROptions<T> = {}
): SWRResponse<T> {
  const {
    ttlMs = 60_000, // 60 seconds stale boundary
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupingIntervalMs = 2_000,
    fallbackData,
    onSuccess,
    onError,
  } = options;

  // Retrieve initial cached data snapshot
  const initialEntry = key ? swrGlobalCache.get<T>(key) : undefined;
  const [data, setData] = useState<T | undefined>(initialEntry ? initialEntry.data : fallbackData);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!initialEntry && !fallbackData);

  const lastFetchTimeRef = useRef<number>(initialEntry ? initialEntry.timestamp : 0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const revalidate = useCallback(
    async (force = false): Promise<T | undefined> => {
      if (!key) return undefined;

      const now = Date.now();
      const cached = swrGlobalCache.get<T>(key);

      // Skip revalidation if data is fresh within deduping interval, unless forced
      if (!force && cached && now - lastFetchTimeRef.current < dedupingIntervalMs) {
        return cached.data;
      }

      // Check if an inflight request already exists for this exact key (Deduplication)
      let inflight = swrGlobalCache.getInflight<T>(key);

      if (!inflight) {
        inflight = fetcher()
          .then((result) => {
            swrGlobalCache.set(key, result);
            swrGlobalCache.deleteInflight(key);
            lastFetchTimeRef.current = Date.now();
            return result;
          })
          .catch((err) => {
            swrGlobalCache.deleteInflight(key);
            throw err;
          });

        swrGlobalCache.setInflight(key, inflight);
      }

      if (isMountedRef.current) {
        setIsValidating(true);
      }

      try {
        const freshData = await inflight;
        if (isMountedRef.current) {
          setData(freshData);
          setError(null);
          setIsValidating(false);
          setIsLoading(false);
          onSuccess?.(freshData);
        }
        return freshData;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setError(errorObj);
          setIsValidating(false);
          setIsLoading(false);
          onError?.(errorObj);
        }
        return cached?.data;
      }
    },
    [key, fetcher, dedupingIntervalMs, onSuccess, onError]
  );

  // Synchronize with key changes or cache eviction
  useEffect(() => {
    if (!key) {
      setData(undefined);
      setIsLoading(false);
      return;
    }

    const cached = swrGlobalCache.get<T>(key);
    if (cached) {
      setData(cached.data);
      setIsLoading(false);
      // If cached data is older than TTL, trigger background revalidation
      if (Date.now() - cached.timestamp > ttlMs) {
        revalidate(false);
      }
    } else {
      setIsLoading(true);
      revalidate(true);
    }
  }, [key, ttlMs, revalidate]);

  // Revalidate on Window Focus
  useEffect(() => {
    if (!revalidateOnFocus || !key) return;

    const handleFocus = () => {
      const cached = swrGlobalCache.get<T>(key);
      if (!cached || Date.now() - cached.timestamp > ttlMs) {
        revalidate(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, key, ttlMs, revalidate]);

  // Revalidate on Network Online
  useEffect(() => {
    if (!revalidateOnReconnect || !key) return;

    const handleOnline = () => {
      revalidate(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, key, revalidate]);

  // Optimistic UI mutation helper
  const mutate = useCallback(
    async (newData?: T | Promise<T>, shouldRevalidate = true): Promise<T | undefined> => {
      if (!key) return undefined;

      if (newData !== undefined) {
        const resolvedData = await Promise.resolve(newData);
        swrGlobalCache.set(key, resolvedData);
        if (isMountedRef.current) {
          setData(resolvedData);
        }
      }

      if (shouldRevalidate) {
        return revalidate(true);
      }
      return newData;
    },
    [key, revalidate]
  );

  return {
    data,
    error,
    isValidating,
    isLoading,
    mutate,
  };
}

export default useSWRFetch;
