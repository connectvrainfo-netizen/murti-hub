import { useState, useEffect } from 'react';
import type {
  NetworkAwareState,
  NetworkInformation,
  EffectiveConnectionType,
} from '../types/performance';

/**
 * Enterprise Network-Aware Custom Hook
 * Uses W3C Network Information API + prefers-reduced-motion media query
 * Dynamically signals network downgrade to reduce assets and disable heavy animations.
 */
export function useNetworkAware(): NetworkAwareState {
  const getNetworkState = (): NetworkAwareState => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        isSlowConnection: false,
        shouldReduceMotion: false,
        recommendedImageQuality: 'high',
      };
    }

    // Access navigator.connection safely
    const conn = (
      navigator as unknown as {
        connection?: NetworkInformation;
        mozConnection?: NetworkInformation;
        webkitConnection?: NetworkInformation;
      }
    ).connection ||
      (navigator as unknown as { mozConnection?: NetworkInformation }).mozConnection ||
      (navigator as unknown as { webkitConnection?: NetworkInformation }).webkitConnection;

    const effectiveType: EffectiveConnectionType = conn?.effectiveType || '4g';
    const downlink = conn?.downlink ?? 10;
    const rtt = conn?.rtt ?? 50;
    const saveData = Boolean(conn?.saveData);

    // Evaluate slow network criteria: 2G/3G, or high latency (> 400ms), or low throughput (< 1.5 Mbps)
    const isSlowConnection =
      saveData ||
      effectiveType === 'slow-2g' ||
      effectiveType === '2g' ||
      effectiveType === '3g' ||
      downlink < 1.5 ||
      rtt > 400;

    // Check system accessibility preference for reduced motion
    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Should disable GSAP/Lenis/3D animations if user is on slow network or requested reduced motion
    const shouldReduceMotion = isSlowConnection || prefersReducedMotion;

    // Determine target media quality tier
    let recommendedImageQuality: 'low' | 'medium' | 'high' = 'high';
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
      recommendedImageQuality = 'low';
    } else if (effectiveType === '3g' || downlink < 3.0) {
      recommendedImageQuality = 'medium';
    }

    return {
      effectiveType,
      downlink,
      rtt,
      saveData,
      isSlowConnection,
      shouldReduceMotion,
      recommendedImageQuality,
    };
  };

  const [networkState, setNetworkState] = useState<NetworkAwareState>(getNetworkState);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const conn = (
      navigator as unknown as {
        connection?: NetworkInformation;
      }
    ).connection;

    const updateState = () => {
      setNetworkState(getNetworkState());
    };

    // Listen to network transitions (e.g. mobile switching between 4G and 3G)
    conn?.addEventListener?.('change', updateState);

    // Listen to OS prefers-reduced-motion changes
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionMedia?.addEventListener?.('change', updateState);

    return () => {
      conn?.removeEventListener?.('change', updateState);
      motionMedia?.removeEventListener?.('change', updateState);
    };
  }, []);

  return networkState;
}

export default useNetworkAware;
