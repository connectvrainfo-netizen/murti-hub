import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Volume2, VolumeX } from 'lucide-react';

export default function IntroAnimation({ onComplete, autoDismissMs = 4800 }) {
    const [phase, setPhase] = useState('initial'); // 'initial' | 'entering' | 'settled' | 'exiting'
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Trigger entrance immediately on mount
        const enterTimer = setTimeout(() => {
            setPhase('entering');
        }, 100);

        // Transition into settled floating state
        const settleTimer = setTimeout(() => {
            setPhase('settled');
        }, 1800);

        // Auto dismiss after specified time
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
        { id: 1, left: '15%', delay: '0.2s', dur: '4s', size: 6 },
        { id: 2, left: '25%', delay: '1.2s', dur: '5s', size: 8 },
        { id: 3, left: '38%', delay: '0.6s', dur: '4.5s', size: 5 },
        { id: 4, left: '50%', delay: '1.8s', dur: '6s', size: 9 },
        { id: 5, left: '62%', delay: '0.4s', dur: '4.2s', size: 6 },
        { id: 6, left: '74%', delay: '1.5s', dur: '5.2s', size: 7 },
        { id: 7, left: '86%', delay: '0.9s', dur: '4.8s', size: 5 },
        { id: 8, left: '45%', delay: '2.1s', dur: '5.5s', size: 8 },
        { id: 9, left: '68%', delay: '2.4s', dur: '4.6s', size: 6 },
        { id: 10, left: '30%', delay: '2.8s', dur: '5.1s', size: 7 },
    ];

    return (
        <div
            className={`fixed inset-0 z-[120] h-[100dvh] min-h-[100dvh] overflow-hidden flex flex-col items-center justify-between transition-all duration-700 select-none pb-safe ${
                isExiting
                    ? 'opacity-0 scale-105 pointer-events-none'
                    : 'opacity-100 scale-100'
            }`}
            style={{
                backgroundColor: '#1c0f06',
            }}
        >
            {/* ================= 1. DIVINE BACKGROUND LAYER ================= */}
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
                        background: 'radial-gradient(circle at 50% 50%, rgba(255, 170, 0, 0.15) 0%, rgba(180, 50, 0, 0.35) 60%, rgba(20, 5, 0, 0.85) 100%)',
                    }}
                />

                {/* Rotating Sacred Golden Mandala in Background */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[540px] md:w-[680px] lg:w-[820px] aspect-square rounded-full pointer-events-none animate-mandala-rotate opacity-30"
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
            <div className="absolute top-4 sm:top-6 right-4 sm:right-8 z-30">
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Skip intro and enter store"
                    className="group relative flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase text-amber-100 bg-black/50 hover:bg-black/70 border border-amber-400/60 hover:border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
                >
                    <span className="text-amber-300 group-hover:rotate-12 transition-transform">
                        <Sparkles className="w-4 h-4" />
                    </span>
                    <span>प्रवेश करा • Enter Store</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* ================= 2. TOP CENTER: 1ST IMAGE (Amol Marble Murti Bhandar Logo) ================= */}
            <header className="relative z-20 w-full flex flex-col items-center pt-3 sm:pt-6 md:pt-8 px-4">
                <div
                    className={`transition-all duration-1000 ease-out flex flex-col items-center ${
                        phase === 'initial'
                            ? 'opacity-0 -translate-y-12 scale-90'
                            : 'opacity-100 translate-y-0 scale-100'
                    }`}
                    style={{
                        filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 25px rgba(245, 158, 11, 0.45))',
                    }}
                >
                    {/* 1st Image: Amol Marble Murti Bhandar Logo */}
                    <img
                        src="/images/intro/amol-murti-logo.png"
                        alt="अमोल मार्बल मूर्ती भंडार - Amol Marble Murti Bhandar"
                        className="w-auto object-contain hover:scale-105 transition-transform duration-500"
                        style={{ maxHeight: 'clamp(70px, 12vh, 195px)' }}
                    />

                    {/* Auspicious Subtitle Tagline */}
                    <div className="mt-1 sm:mt-2 flex items-center gap-2 text-[10px] sm:text-xs tracking-[0.25em] uppercase text-amber-200/90 font-medium">
                        <span className="w-6 sm:w-10 h-[1px] bg-gradient-to-r from-transparent to-amber-400" />
                        <span>|| ॐ श्री गजाननाय नमः ||</span>
                        <span className="w-6 sm:w-10 h-[1px] bg-gradient-to-l from-transparent to-amber-400" />
                    </div>
                </div>
            </header>

            {/* ================= 3. CENTER: 3RD IMAGE (Gajanan Maharaj with ZOOM-IN Effect) ================= */}
            <main className="relative z-10 flex-1 flex items-center justify-center w-full px-4 my-auto min-h-0">
                <div className="relative flex items-center justify-center max-w-full">
                    {/* Golden Back Halo Rings */}
                    <div
                        className={`absolute w-[240px] sm:w-[340px] md:w-[440px] lg:w-[500px] aspect-square rounded-full transition-all duration-1000 ${
                            phase === 'initial'
                                ? 'scale-0 opacity-0'
                                : 'scale-100 opacity-90'
                        }`}
                        style={{
                            background: 'radial-gradient(circle, rgba(255, 220, 100, 0.6) 0%, rgba(245, 158, 11, 0.35) 45%, transparent 72%)',
                            filter: 'blur(16px)',
                        }}
                    />

                    {/* 3rd Image with Dramatic ZOOM-IN Animation & Gentle Floating */}
                    <div
                        className={`relative transition-all duration-1000 ease-out ${
                            phase === 'initial'
                                ? 'scale-[0.25] opacity-0 blur-md'
                                : phase === 'entering'
                                ? 'scale-100 opacity-100 blur-0 animate-intro-zoom'
                                : 'scale-100 opacity-100 blur-0 animate-intro-float'
                        }`}
                        style={{
                            filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 35px rgba(255, 190, 40, 0.65))',
                        }}
                    >
                        <img
                            src="/images/intro/gajanan-maharaj-cutout.png"
                            onError={(e) => {
                                // Fallback to original image if cutout is not supported
                                e.currentTarget.src = '/images/intro/gajanan-maharaj-seated.jpg';
                            }}
                            alt="Sant Shiromani Shri Gajanan Maharaj"
                            className="w-auto object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                            style={{ maxHeight: 'clamp(160px, 42vh, 450px)' }}
                            onClick={handleDismiss}
                        />
                    </div>
                </div>
            </main>

            {/* ================= 4. BOTTOM CENTER: 2ND IMAGE (|| ब्रम्हांडनायक || Banner) ================= */}
            <footer className="relative z-20 w-full flex flex-col items-center pb-4 sm:pb-7 md:pb-8 px-4">
                <div
                    className={`transition-all duration-1000 ease-out delay-200 flex flex-col items-center ${
                        phase === 'initial'
                            ? 'opacity-0 translate-y-12 scale-90'
                            : 'opacity-100 translate-y-0 scale-100'
                    }`}
                >
                    {/* 2nd Image: Brahmandnayak Saffron Banner */}
                    <div
                        className="relative rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.7)] border-2 border-amber-400/60 p-1 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 animate-pulse"
                        style={{
                            animationDuration: '4s',
                            filter: 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.55))',
                        }}
                    >
                        <img
                            src="/images/intro/brahmandnayak-banner.png"
                            alt="|| ब्रम्हांडनायक ||"
                            className="w-auto object-contain rounded-lg"
                            style={{ maxHeight: 'clamp(36px, 7vh, 90px)' }}
                        />
                    </div>

                    {/* Tap to enter hint */}
                    <button
                        type="button"
                        onClick={handleDismiss}
                        aria-label="Click anywhere to enter store"
                        className="mt-3 text-xs text-amber-200/90 hover:text-amber-100 transition tracking-widest uppercase flex items-center justify-center gap-1.5 px-4 py-3 min-h-[48px] rounded-full active:scale-95"
                    >
                        <span>क्लिक करा • Click anywhere to enter</span>
                    </button>
                </div>
            </footer>
        </div>
    );
}
