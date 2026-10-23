import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, Lenis } from '../utils/gsapSetup';

/**
 * useLenisSmoothScroll
 * Provides butter-smooth momentum scrolling integrated with GSAP ScrollTrigger
 * 
 * @param {Object} options
 * @param {boolean} options.isModalOpen - When any modal is active, stops scroll tracking
 * @param {string} options.currentPage - Dependency to refresh ScrollTrigger when route changes
 */
export function useLenisSmoothScroll({ isModalOpen = false, currentPage = 'home' } = {}) {
    const lenisRef = useRef(null);

    useEffect(() => {
        // Respect prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            return;
        }

        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.95,
            touchMultiplier: 1.2,
            infinite: false,
        });

        lenisRef.current = lenis;

        // Synchronize Lenis with GSAP ScrollTrigger
        const onScroll = () => {
            ScrollTrigger.update();
        };
        lenis.on('scroll', onScroll);

        // GSAP ticker integration for 60-120fps sync
        const updateRaf = (time) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(updateRaf);
        gsap.ticker.lagSmoothing(0);

        // Expose globally for convenience
        window.__lenis = lenis;

        return () => {
            lenis.off('scroll', onScroll);
            gsap.ticker.remove(updateRaf);
            lenis.destroy();
            lenisRef.current = null;
            delete window.__lenis;
        };
    }, []);

    // Stop / resume scrolling when modal is active or on standalone dedicated pages
    useEffect(() => {
        if (!lenisRef.current) return;
        if (isModalOpen || currentPage === 'admin' || currentPage === 'login') {
            lenisRef.current.stop();
        } else {
            lenisRef.current.start();
        }
    }, [isModalOpen, currentPage]);

    // Refresh ScrollTrigger and scroll to top on page change
    useEffect(() => {
        if (lenisRef.current) {
            lenisRef.current.scrollTo(0, { immediate: true });
        }
        const timer = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 150);
        return () => clearTimeout(timer);
    }, [currentPage]);

    const scrollTo = (target, options = {}) => {
        if (lenisRef.current) {
            lenisRef.current.scrollTo(target, { duration: 1.2, ...options });
        } else {
            if (typeof target === 'number') {
                window.scrollTo({ top: target, behavior: 'smooth' });
            } else if (typeof target === 'string') {
                const el = document.querySelector(target);
                el?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return { lenis: lenisRef.current, scrollTo };
}
