import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '../utils/gsapSetup';

/**
 * useGsapScrollAnimations
 * Initializes high-performance 60fps GSAP ScrollTrigger animations across the website.
 * 
 * @param {Object} params
 * @param {string} params.currentPage - Active route ('home', 'shop-all', 'product', etc.)
 * @param {boolean} params.showIntro - Whether the intro animation is still active
 */
export function useGsapScrollAnimations({ currentPage = 'home', showIntro = false } = {}) {
    useEffect(() => {
        // If the intro animation is actively covering the screen, wait until it finishes
        if (showIntro) return;

        // Respect prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        // Create a scoped GSAP context so all animations and triggers are cleanly reverted on cleanup
        const ctx = gsap.context(() => {

            // =========================================================================
            // 1. STICKY NAVIGATION BAR SCROLL TRANSFORMATION
            // =========================================================================
            ScrollTrigger.create({
                start: 'top -50',
                end: 99999,
                toggleClass: {
                    className: 'header-scrolled',
                    targets: 'header'
                }
            });

            // =========================================================================
            // 2. HOMEPAGE SCROLL ANIMATIONS
            // =========================================================================
            if (currentPage === 'home') {

                // --- 2A. DEITY CATEGORY BAR STAGGER ---
                const deityItems = document.querySelectorAll('.deity-cat-item');
                if (deityItems.length > 0) {
                    gsap.fromTo(deityItems, 
                        { opacity: 0, y: 16, scale: 0.94 },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.55,
                            stagger: 0.035,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: '#deity-category-bar',
                                start: 'top 95%',
                                once: true
                            }
                        }
                    );
                }

                // --- 2B. HERO SLIDER PARALLAX EFFECT ---
                const heroSlider = document.querySelector('#hero-slider');
                if (heroSlider) {
                    gsap.to('#hero-slider .hero-slide img', {
                        y: 35,
                        scale: 0.97,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: '#hero-slider',
                            start: 'top top',
                            end: 'bottom top',
                            scrub: 0.6
                        }
                    });

                    gsap.to('#hero-slider video', {
                        scale: 1.06,
                        y: 20,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: '#hero-slider',
                            start: 'top top',
                            end: 'bottom top',
                            scrub: 0.6
                        }
                    });
                }

                // --- 2C. 3 CATEGORY SPOTLIGHT CARDS ---
                const spotlightCards = document.querySelectorAll('.spotlight-card');
                if (spotlightCards.length > 0) {
                    gsap.fromTo(spotlightCards,
                        { opacity: 0, y: 35, scale: 0.95 },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.75,
                            stagger: 0.12,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: '#spotlight-section',
                                start: 'top 85%',
                                once: true
                            }
                        }
                    );
                }

                // --- 2D. WHY AMOL MARBLE MURTI BHANDAR ---
                const whySection = document.querySelector('#why-section');
                if (whySection) {
                    // Divider lines expanding outward
                    gsap.fromTo('#why-section .why-divider-line',
                        { scaleX: 0, transformOrigin: 'center' },
                        {
                            scaleX: 1,
                            duration: 0.9,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: '#why-section',
                                start: 'top 85%',
                                once: true
                            }
                        }
                    );

                    // 4 Pedestals Stagger Up
                    const whyPillars = document.querySelectorAll('.why-pillar-card');
                    if (whyPillars.length > 0) {
                        gsap.fromTo(whyPillars,
                            { opacity: 0, y: 30, scale: 0.92 },
                            {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration: 0.7,
                                stagger: 0.1,
                                ease: 'back.out(1.4)',
                                scrollTrigger: {
                                    trigger: '#why-section',
                                    start: 'top 80%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2E. MOST LOVED IDOLS CAROUSEL ---
                const mostLovedSection = document.querySelector('#most-loved-section');
                if (mostLovedSection) {
                    gsap.fromTo('#most-loved-section .section-header-reveal',
                        { opacity: 0, y: 25 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: '#most-loved-section',
                                start: 'top 82%',
                                once: true
                            }
                        }
                    );

                    const mostLovedCards = document.querySelectorAll('#most-loved-track > div');
                    if (mostLovedCards.length > 0) {
                        gsap.fromTo(mostLovedCards,
                            { opacity: 0, y: 30 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.65,
                                stagger: 0.06,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: '#most-loved-section',
                                    start: 'top 75%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2F. FESTIVE NAVRATRI COLLECTION ---
                const navratriSection = document.querySelector('#navratri-section');
                if (navratriSection) {
                    gsap.fromTo('#navratri-section .section-header-reveal',
                        { opacity: 0, y: 25 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: '#navratri-section',
                                start: 'top 82%',
                                once: true
                            }
                        }
                    );

                    const navratriCards = document.querySelectorAll('#festive-track > div, #navratri-track > div');
                    if (navratriCards.length > 0) {
                        gsap.fromTo(navratriCards,
                            { opacity: 0, y: 30 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.65,
                                stagger: 0.03,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: '#navratri-section',
                                    start: 'top 75%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2G. FULL-BLEED DARK OVERLAY CAROUSEL ---
                const darkSection = document.querySelector('#dark-overlay-section');
                if (darkSection) {
                    const darkCards = document.querySelectorAll('#dark-overlay-track > div');
                    if (darkCards.length > 0) {
                        gsap.fromTo(darkCards,
                            { opacity: 0, y: 30, scale: 0.94 },
                            {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration: 0.7,
                                stagger: 0.04,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: '#dark-overlay-section',
                                    start: 'top 80%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2H. ART THAT BRINGS DIVINITY HOME & ANIMATED STAT COUNTERS ---
                const divinitySection = document.querySelector('#divinity-section');
                if (divinitySection) {
                    // Left images
                    gsap.fromTo('#divinity-section .editorial-img-card',
                        { opacity: 0, x: -30, scale: 0.96 },
                        {
                            opacity: 1,
                            x: 0,
                            scale: 1,
                            duration: 0.9,
                            stagger: 0.15,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: '#divinity-section',
                                start: 'top 75%',
                                once: true
                            }
                        }
                    );

                    // Right text
                    gsap.fromTo('#divinity-section .divinity-text-content > *',
                        { opacity: 0, y: 20 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.75,
                            stagger: 0.08,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: '#divinity-section',
                                start: 'top 75%',
                                once: true
                            }
                        }
                    );

                    // Animated Counters (50+, 100%, 2L+)
                    const statCounters = document.querySelectorAll('.stat-counter-number');
                    statCounters.forEach(counter => {
                        const target = parseFloat(counter.getAttribute('data-target') || '0');
                        const suffix = counter.getAttribute('data-suffix') || '';
                        const obj = { val: 0 };

                        gsap.to(obj, {
                            val: target,
                            duration: 1.8,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: counter,
                                start: 'top 88%',
                                once: true
                            },
                            onUpdate: () => {
                                if (Number.isInteger(target)) {
                                    counter.textContent = Math.round(obj.val) + suffix;
                                } else {
                                    counter.textContent = obj.val.toFixed(1) + suffix;
                                }
                            }
                        });
                    });
                }

                // --- 2I. OUR SACRED PROCESS (BENTO GRID) ---
                const bentoSection = document.querySelector('#bento-process-section');
                if (bentoSection) {
                    gsap.fromTo('#bento-process-section .section-header-reveal',
                        { opacity: 0, y: 25 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: '#bento-process-section',
                                start: 'top 82%',
                                once: true
                            }
                        }
                    );

                    const bentoCards = document.querySelectorAll('.bento-process-card');
                    if (bentoCards.length > 0) {
                        gsap.fromTo(bentoCards,
                            { opacity: 0, y: 35, scale: 0.96 },
                            {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration: 0.75,
                                stagger: 0.1,
                                ease: 'power3.out',
                                scrollTrigger: {
                                    trigger: '#bento-process-section',
                                    start: 'top 76%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2J. CORPORATE & BULK GIFTING ---
                const corpSection = document.querySelector('#corporate-gifting');
                if (corpSection) {
                    gsap.fromTo('#corporate-gifting .corp-header-reveal',
                        { opacity: 0, y: 25 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.75,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: '#corporate-gifting',
                                start: 'top 80%',
                                once: true
                            }
                        }
                    );

                    const corpCards = document.querySelectorAll('.corp-benefit-card');
                    if (corpCards.length > 0) {
                        gsap.fromTo(corpCards,
                            { opacity: 0, y: 20 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.6,
                                stagger: 0.08,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: '#corporate-gifting',
                                    start: 'top 75%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2K. FEATURED COLLECTIBLES (4 COLUMNS) ---
                const featuredSection = document.querySelector('#featured-collectibles-section');
                if (featuredSection) {
                    const featuredCards = document.querySelectorAll('.featured-product-card');
                    if (featuredCards.length > 0) {
                        gsap.fromTo(featuredCards,
                            { opacity: 0, y: 30, scale: 0.96 },
                            {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration: 0.7,
                                stagger: 0.08,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: '#featured-collectibles-section',
                                    start: 'top 80%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2L. SACRED STORIES & BLOG CARDS ---
                const blogSection = document.querySelector('#blog-posts-section');
                if (blogSection) {
                    const blogCards = document.querySelectorAll('.blog-card-item');
                    if (blogCards.length > 0) {
                        gsap.fromTo(blogCards,
                            { opacity: 0, y: 30, scale: 0.96 },
                            {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration: 0.7,
                                stagger: 0.1,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: '#blog-posts-section',
                                    start: 'top 80%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2M. FREQUENTLY ASKED QUESTIONS ---
                const faqSection = document.querySelector('#faq-section');
                if (faqSection) {
                    const faqItems = document.querySelectorAll('.faq-row-item');
                    if (faqItems.length > 0) {
                        gsap.fromTo(faqItems,
                            { opacity: 0, y: 18 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.5,
                                stagger: 0.05,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: '#faq-section',
                                    start: 'top 82%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2N. 3 TRUST SERVICE BLOCKS ---
                const trustSection = document.querySelector('#trust-blocks-section');
                if (trustSection) {
                    const trustCards = document.querySelectorAll('.trust-service-card');
                    if (trustCards.length > 0) {
                        gsap.fromTo(trustCards,
                            { opacity: 0, y: 30, scale: 0.96 },
                            {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration: 0.7,
                                stagger: 0.12,
                                ease: 'power3.out',
                                scrollTrigger: {
                                    trigger: '#trust-blocks-section',
                                    start: 'top 82%',
                                    once: true
                                }
                            }
                        );
                    }
                }

                // --- 2O. JAIPUR SCULPTING ATELIER MAP ---
                const atelierSection = document.querySelector('#atelier-map-section');
                if (atelierSection) {
                    gsap.fromTo('#atelier-map-section .atelier-card',
                        { opacity: 0, y: 35, scale: 0.97 },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.8,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: '#atelier-map-section',
                                start: 'top 80%',
                                once: true
                            }
                        }
                    );
                }

                // --- 2P. SITE FOOTER ---
                const footer = document.querySelector('#site-footer');
                if (footer) {
                    gsap.fromTo('#site-footer',
                        { opacity: 0 },
                        {
                            opacity: 1,
                            duration: 0.8,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: '#site-footer',
                                start: 'top 92%',
                                once: true
                            }
                        }
                    );
                }
            }

            // =========================================================================
            // 3. COLLECTION & CATALOG PAGE SCROLL ANIMATIONS
            // =========================================================================
            if (currentPage !== 'home' && currentPage !== 'product') {
                const catalogCards = document.querySelectorAll('.catalog-grid-card');
                if (catalogCards.length > 0) {
                    gsap.fromTo(catalogCards,
                        { opacity: 0, y: 25, scale: 0.97 },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.5,
                            stagger: 0.04,
                            ease: 'power2.out'
                        }
                    );
                }
            }

            // Refresh ScrollTrigger calculations after DOM painting
            ScrollTrigger.refresh();
        });

        // Trigger an extra refresh slightly later in case images/fonts load
        const refreshTimer = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 300);

        return () => {
            clearTimeout(refreshTimer);
            ctx.revert(); // Automatically kills all tweens, timelines, and ScrollTriggers created in context
        };
    }, [currentPage, showIntro]);
}
