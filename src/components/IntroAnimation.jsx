import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function IntroAnimation({ onComplete, autoDismissMs = 5200 }) {
    const [phase, setPhase] = useState('initial'); // 'initial' | 'entering' | 'settled' | 'exiting'
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Trigger entrance immediately on mount
        const enterTimer = setTimeout(() => {
            setPhase('entering');
        }, 80);

        // Transition into settled state
        const settleTimer = setTimeout(() => {
            setPhase('settled');
        }, 1200);

        // Auto dismiss after specified time (matches GIF full duration)
        const autoDismissTimer = setTimeout(() => {
            handleDismiss();
        }, autoDismissMs);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(settleTimer);
            clearTimeout(autoDismissTimer);
        };
    }, [autoDismissMs]);

    const handleDismiss = () => {
        if (isExiting) return;
        setIsExiting(true);
        setPhase('exiting');
        setTimeout(() => {
            onComplete?.();
        }, 650);
    };

    // Golden dust particles floating upwards
    const particles = [
        { id: 1, left: '12%', delay: '0.2s', dur: '4s', size: 6 },
        { id: 2, left: '22%', delay: '1.2s', dur: '5s', size: 8 },
        { id: 3, left: '35%', delay: '0.6s', dur: '4.5s', size: 5 },
        { id: 4, left: '48%', delay: '1.8s', dur: '6s', size: 9 },
        { id: 5, left: '60%', delay: '0.4s', dur: '4.2s', size: 6 },
        { id: 6, left: '72%', delay: '1.5s', dur: '5.2s', size: 7 },
        { id: 7, left: '84%', delay: '0.9s', dur: '4.8s', size: 5 },
        { id: 8, left: '42%', delay: '2.1s', dur: '5.5s', size: 8 },
        { id: 9, left: '65%', delay: '2.4s', dur: '4.6s', size: 6 },
        { id: 10, left: '28%', delay: '2.8s', dur: '5.1s', size: 7 },
    ];

    return (
        <div
            onClick={handleDismiss}
            className={`fixed inset-0 z-[120] h-[100dvh] min-h-[100dvh] overflow-hidden flex flex-col items-center justify-between transition-all duration-700 select-none cursor-pointer pb-safe ${
                isExiting
                    ? 'opacity-0 scale-105 pointer-events-none'
                    : 'opacity-100 scale-100'
            }`}
            style={{
                backgroundColor: '#1c0f06',
            }}
            title="Click anywhere to enter store"
        >
            {/* ================= 1. DIVINE AMBIENT BACKGROUND LAYER ================= */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Primary Radiant Divine Aura Background Image */}
                <img
                    src="/images/intro/divine-aura-bg.jpg"
                    alt="Divine Celestial Aura"
                    className="w-full h-full object-cover object-center scale-105 animate-pulse"
                    style={{
                        animationDuration: '7s',
                        filter: 'brightness(0.92) contrast(1.12)',
                    }}
                />

                {/* Saffron and Deep Crimson Temple Gradient Overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(circle at 50% 50%, rgba(255, 170, 0, 0.18) 0%, rgba(180, 50, 0, 0.35) 60%, rgba(20, 5, 0, 0.88) 100%)',
                    }}
                />

                {/* Rotating Sacred Golden Mandala in Background */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[540px] md:w-[680px] lg:w-[820px] aspect-square rounded-full pointer-events-none animate-mandala-rotate opacity-25"
                    style={{
                        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.35) 0%, rgba(245, 158, 11, 0.15) 45%, transparent 70%)',
                        border: '1px dashed rgba(255, 215, 0, 0.35)',
                    }}
                />

                {/* Divine Light Rays & Halo Glow Center */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[420px] md:w-[540px] aspect-square rounded-full pointer-events-none animate-halo-aura"
                    style={{
                        background: 'radial-gradient(circle, rgba(255, 230, 120, 0.55) 0%, rgba(245, 158, 11, 0.3) 45%, transparent 75%)',
                        filter: 'blur(20px)',
                    }}
                />

                {/* Golden Floating Sparkle Particles */}
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute bottom-10 rounded-full pointer-events-none"
                        style={{
                            left: p.left,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: '#FDE047',
                            boxShadow: '0 0 12px #F59E0B, 0 0 24px #FDE047',
                            animation: `sparkleRise ${p.dur} infinite ease-out`,
                            animationDelay: p.delay,
                        }}
                    />
                ))}
            </div>

            {/* Top Right Skip & Enter Button */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-8 z-30" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Skip intro and enter store"
                    className="group relative flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase text-amber-100 bg-black/60 hover:bg-black/80 border border-amber-400/60 hover:border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
                >
                    <span className="text-amber-300 group-hover:rotate-12 transition-transform">
                        <Sparkles className="w-4 h-4" />
                    </span>
                    <span>प्रवेश करा • Enter Store</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Spacer for top padding */}
            <div className="w-full pt-10 sm:pt-12 pointer-events-none" />

            {/* ================= 2. CENTER: SACRED GAJANAN MAHARAJ DEVOTIONAL ANIMATED GIF ================= */}
            <main className="relative z-10 flex-1 flex items-center justify-center w-full px-3 sm:px-6 my-auto min-h-0">
                <div
                    className={`relative max-w-full flex items-center justify-center transition-all duration-1000 ease-out ${
                        phase === 'initial'
                            ? 'scale-90 opacity-0 blur-xs'
                            : 'scale-100 opacity-100 blur-0'
                    }`}
                    style={{
                        filter: 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 35px rgba(245, 158, 11, 0.45))',
                    }}
                >
                    <img
                        src="/images/intro/gajanan-intro.gif"
                        onError={(e) => {
                            // Fallback to original URL encoded filename if needed
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = encodeURI('/ॐ गजाननाय नमः (1).gif');
                        }}
                        alt="|| ॐ श्री गजाननाय नमः || - अमोल मार्बल मूर्ती भंडार"
                        className="w-auto h-auto max-h-[76vh] sm:max-h-[80vh] md:max-h-[82vh] max-w-[95vw] md:max-w-[90vw] object-contain rounded-2xl sm:rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
                    />
                </div>
            </main>

            {/* ================= 3. BOTTOM: TAP TO ENTER HINT ================= */}
            <footer className="relative z-20 w-full flex flex-col items-center pb-4 sm:pb-6 px-4">
                <div
                    className={`transition-all duration-1000 ease-out delay-200 flex flex-col items-center ${
                        phase === 'initial'
                            ? 'opacity-0 translate-y-6'
                            : 'opacity-100 translate-y-0'
                    }`}
                >
                    <button
                        type="button"
                        onClick={handleDismiss}
                        aria-label="Click anywhere to enter store"
                        className="text-xs text-amber-200/90 hover:text-amber-100 transition tracking-widest uppercase flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full active:scale-95 animate-pulse"
                    >
                        <span>क्लिक करा • Click anywhere to enter</span>
                    </button>
                </div>
            </footer>
        </div>
    );
}
