import React, { useEffect, useId } from 'react';
import type { SpeculationRulesPayload, SpeculationRule } from '../types/performance';

interface SpeculationRulesProps {
  /**
   * High-probability routes to prefetch in the background
   */
  prefetchUrls?: string[];
  /**
   * Extreme-confidence routes to prerender fully in memory (e.g. /checkout, primary category)
   */
  prerenderUrls?: string[];
  /**
   * Eagerness level: 'immediate' | 'eager' | 'moderate' | 'conservative'
   */
  eagerness?: 'immediate' | 'eager' | 'moderate' | 'conservative';
  /**
   * Custom raw speculation rules definition
   */
  customRules?: SpeculationRulesPayload;
}

/**
 * Modern Speculation Rules API Component
 * Generates and injects standard <script type="speculationrules"> into DOM.
 * Provides graceful fallback via <link rel="prefetch"> for Safari/Firefox.
 */
export const SpeculationRules: React.FC<SpeculationRulesProps> = ({
  prefetchUrls = [],
  prerenderUrls = [],
  eagerness = 'moderate',
  customRules,
}) => {
  const scriptId = useId();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Check if browser natively supports the Speculation Rules API
    const isSpeculationRulesSupported =
      HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');

    // Build the rules payload
    const payload: SpeculationRulesPayload = customRules || {};

    if (!customRules) {
      if (prefetchUrls.length > 0) {
        const prefetchRule: SpeculationRule = {
          source: 'list',
          urls: prefetchUrls,
          eagerness,
        };
        payload.prefetch = [prefetchRule];
      }

      if (prerenderUrls.length > 0) {
        const prerenderRule: SpeculationRule = {
          source: 'list',
          urls: prerenderUrls,
          eagerness: 'conservative', // Prerender is resource-intensive; default conservative/on-hover
        };
        payload.prerender = [prerenderRule];
      }
    }

    if (isSpeculationRulesSupported) {
      // Modern Chromium path: Inject JSON speculation rules
      const elementId = `speculation-rules-${scriptId.replace(/[:]/g, '')}`;
      let script = document.getElementById(elementId) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.id = elementId;
        script.type = 'speculationrules';
        document.head.appendChild(script);
      }

      script.textContent = JSON.stringify(payload);

      return () => {
        script?.remove();
      };
    } else {
      // Fallback path for Safari / Firefox: Standard link prefetch
      const createdLinks: HTMLLinkElement[] = [];

      prefetchUrls.forEach((url) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        document.head.appendChild(link);
        createdLinks.push(link);
      });

      return () => {
        createdLinks.forEach((link) => link.remove());
      };
    }
  }, [prefetchUrls, prerenderUrls, eagerness, customRules, scriptId]);

  return null;
};

export default SpeculationRules;
