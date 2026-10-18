import { useEffect, useRef } from 'react';

/**
 * useContinuousScroll
 * Enables continuous, silky-smooth 60fps horizontal marquee scrolling on a track container.
 * 
 * Features:
 * - Constant, frame-rate independent velocity
 * - Infinite seamless looping using duplicated items
 * - Instant pause on mouse hover / cursor enter
 * - Instant pause on touch interaction with delayed auto-resume
 * - Custom pause event support when manual chevron buttons (< >) are clicked
 * - Respects prefers-reduced-motion accessibility preference
 * 
 * @param {Object} options
 * @param {string} options.trackId - ID of the container element (e.g. 'dark-overlay-track', 'festive-track')
 * @param {number} [options.speed=0.75] - Movement speed in pixels per 16.6ms frame (~45px/second)
 * @param {boolean} [options.pauseOnHover=true] - Whether to pause while mouse is over the track
 * @param {number} [options.totalCopies=3] - Number of duplicated item sets rendered
 * @param {boolean} [options.enabled=true] - Whether the auto-scroll is active
 */
export function useContinuousScroll({
    trackId,
    speed = 0.75,
    pauseOnHover = true,
    totalCopies = 3,
    enabled = true
} = {}) {
    const isPausedRef = useRef(false);
    const resumeTimerRef = useRef(null);

    useEffect(() => {
        if (!enabled || !trackId) return;

        // Respect users who prefer reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const el = document.getElementById(trackId);
        if (!el) return;

        let animationFrameId;
        let lastTimestamp = performance.now();
        let scrollPos = el.scrollLeft;

        // Initialize scroll position in the middle copy (copy index 1 of 0, 1, 2)
        // after images and layout have painted
        const initTimer = setTimeout(() => {
            if (el.scrollWidth > el.clientWidth && totalCopies >= 2) {
                const singleWidth = el.scrollWidth / totalCopies;
                if (el.scrollLeft < 10) {
                    el.scrollLeft = singleWidth;
                    scrollPos = singleWidth;
                }
            }
        }, 200);

        // Hover listeners
        const onMouseEnter = () => {
            if (pauseOnHover) {
                isPausedRef.current = true;
            }
        };

        const onMouseLeave = () => {
            if (pauseOnHover) {
                isPausedRef.current = false;
                scrollPos = el.scrollLeft;
            }
        };

        // Touch interaction listeners
        const onTouchStart = () => {
            isPausedRef.current = true;
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        };

        const onTouchEnd = () => {
            scrollPos = el.scrollLeft;
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = setTimeout(() => {
                isPausedRef.current = false;
                scrollPos = el.scrollLeft;
            }, 1800);
        };

        // Sync position on manual scroll
        const onScroll = () => {
            if (isPausedRef.current) {
                scrollPos = el.scrollLeft;
            }
        };

        // Listen for manual button clicks (< and >)
        const onPauseEvent = (e) => {
            if (!e.detail?.id || e.detail.id === trackId) {
                isPausedRef.current = true;
                if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = setTimeout(() => {
                    isPausedRef.current = false;
                    scrollPos = el.scrollLeft;
                }, 1200);
            }
        };

        el.addEventListener('mouseenter', onMouseEnter, { passive: true });
        el.addEventListener('mouseleave', onMouseLeave, { passive: true });
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchend', onTouchEnd, { passive: true });
        el.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('pauseContinuousScroll', onPauseEvent);

        // Continuous animation loop
        const tick = (now) => {
            const dt = Math.min((now - lastTimestamp) / 16.666, 2.5); // Normalize frame time
            lastTimestamp = now;

            if (!isPausedRef.current && el.scrollWidth > el.clientWidth) {
                const singleWidth = el.scrollWidth / totalCopies;
                scrollPos += speed * dt;

                // Infinite wrap check:
                // When passing the end of the second set, seamlessly wrap back to set 1
                if (scrollPos >= singleWidth * (totalCopies - 1)) {
                    scrollPos -= singleWidth;
                    el.scrollLeft = scrollPos;
                } else if (scrollPos <= 5) {
                    scrollPos += singleWidth;
                    el.scrollLeft = scrollPos;
                } else {
                    el.scrollLeft = scrollPos;
                }
            }

            animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => {
            clearTimeout(initTimer);
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
            cancelAnimationFrame(animationFrameId);
            el.removeEventListener('mouseenter', onMouseEnter);
            el.removeEventListener('mouseleave', onMouseLeave);
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('scroll', onScroll);
            window.removeEventListener('pauseContinuousScroll', onPauseEvent);
        };
    }, [trackId, speed, pauseOnHover, totalCopies, enabled]);

    return {
        pause: () => { isPausedRef.current = true; },
        resume: () => { isPausedRef.current = false; }
    };
}
