import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { gsap, ScrollTrigger } from '../utils/gsapSetup';

export default function ScrollProgress({ onScrollTop }) {
    const barRef = useRef(null);
    const fabRef = useRef(null);
    const [showFab, setShowFab] = useState(false);

    useEffect(() => {
        const bar = barRef.current;
        if (!bar) return;

        // Animate the golden progress line from scaleX 0 to 1 across the full page height
        const st = ScrollTrigger.create({
            start: 'top top',
            end: 'max',
            onUpdate: (self) => {
                const progress = self.progress;
                gsap.set(bar, { scaleX: progress, transformOrigin: 'left center' });
                setShowFab(self.scroll() > 400);
            }
        });

        return () => {
            st.kill();
        };
    }, []);

    // Animate the floating "Back to Top" button on show/hide
    useEffect(() => {
        if (!fabRef.current) return;
        if (showFab) {
            gsap.to(fabRef.current, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.35,
                ease: 'back.out(1.7)',
                pointerEvents: 'auto'
            });
        } else {
            gsap.to(fabRef.current, {
                opacity: 0,
                scale: 0.8,
                y: 20,
                duration: 0.25,
                ease: 'power2.in',
                pointerEvents: 'none'
            });
        }
    }, [showFab]);

    const handleScrollTop = () => {
        if (onScrollTop) {
            onScrollTop();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <>
            {/* Top Sacred Golden Progress Bar */}
            <div
                className="fixed top-0 left-0 right-0 h-[3.5px] z-[99] pointer-events-none bg-stone-200/30 overflow-hidden"
                aria-hidden="true"
            >
                <div
                    ref={barRef}
                    className="h-full w-full bg-gradient-to-r from-[#B88921] via-[#F7C600] to-[#E6D6B8] origin-left shadow-[0_0_12px_rgba(247,198,0,0.85)]"
                    style={{ transform: 'scaleX(0)' }}
                />
            </div>

            {/* Floating Back to Top Button */}
            <div
                ref={fabRef}
                className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-40 opacity-0 scale-75 pointer-events-none flex flex-col items-center gap-1.5"
            >
                <button
                    onClick={handleScrollTop}
                    aria-label="Scroll back to top"
                    className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#FAF5E8] via-white to-[#F7E8C3] text-[#8E5B00] border-2 border-[#C69722]/60 shadow-[0_8px_20px_rgba(198,151,34,0.35)] hover:shadow-[0_12px_28px_rgba(198,151,34,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center"
                >
                    <ArrowUp className="w-5 h-5 text-[#8E5B00] group-hover:-translate-y-0.5 transition-transform duration-300 stroke-[2.4]" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F7C600] ring-2 ring-white animate-pulse" />
                </button>
            </div>
        </>
    );
}
