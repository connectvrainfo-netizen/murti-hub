import React, { useRef, useCallback } from 'react';

// In-memory set to prevent duplicate prefetch operations across session
const prefetchedUrls = new Set<string>();

interface PrefetchableLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  /**
   * Optional custom data prefetch function (e.g. SWR preload or API cache warmer)
   */
  prefetchData?: () => Promise<unknown> | void;
  /**
   * Hover dwell time in milliseconds before prefetching triggers (default: 65ms)
   */
  hoverDelayMs?: number;
  /**
   * Disables prefetch when user has Save-Data or slow connection
   */
  respectSaveData?: boolean;
  className?: string;
}

/**
 * Enterprise Predictive Prefetching Link Component
 * Implements hover-intent debouncing and touchstart preloading.
 * Used for navigation links, product cards, and category banners.
 */
export const PrefetchableLink: React.FC<PrefetchableLinkProps> = ({
  href,
  children,
  prefetchData,
  hoverDelayMs = 65,
  respectSaveData = true,
  className = '',
  ...rest
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldSkipPrefetch = useCallback((): boolean => {
    if (typeof navigator === 'undefined') return true;
    
    // Check Save-Data mode or 2G connections
    if (respectSaveData) {
      const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
        return true;
      }
    }
    return false;
  }, [respectSaveData]);

  const executePrefetch = useCallback(() => {
    if (shouldSkipPrefetch()) return;
    if (prefetchedUrls.has(href)) return;

    prefetchedUrls.add(href);

    // 1. Prefetch Document / Route HTML / JS chunk
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'document';
      document.head.appendChild(link);
    }

    // 2. Prefetch dynamic product / review API data if registered
    if (prefetchData) {
      try {
        prefetchData();
      } catch (err) {
        // Non-blocking prefetch failure
        console.debug('[Prefetch] Data preload skipped:', err);
      }
    }
  }, [href, prefetchData, shouldSkipPrefetch]);

  // Pointer Enter with hover-intent debounce
  const handleMouseEnter = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      executePrefetch();
    }, hoverDelayMs);
  }, [executePrefetch, hoverDelayMs]);

  // Pointer Leave cancels pending prefetch if user just breezed over
  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Touchstart triggers immediate prefetch (~100ms before touch click)
  const handleTouchStart = useCallback(() => {
    executePrefetch();
  }, [executePrefetch]);

  // Focus triggers prefetch for keyboard accessibility
  const handleFocus = useCallback(() => {
    executePrefetch();
  }, [executePrefetch]);

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onFocus={handleFocus}
      {...rest}
    >
      {children}
    </a>
  );
};

export default PrefetchableLink;
