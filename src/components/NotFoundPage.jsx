import React, { useEffect } from 'react';
import { Home, Sparkles, ArrowRight } from 'lucide-react';

export default function NotFoundPage({ onReturnToStore, onNavigateToShop }) {
    useEffect(() => {
        const originalTitle = document.title;
        document.title = '404 - Page Not Found | Amol Marble Murti Bhandar';

        const metaRobots = document.querySelector('meta[name="robots"]');
        const prevContent = metaRobots ? metaRobots.getAttribute('content') : 'index, follow';
        if (metaRobots) {
            metaRobots.setAttribute('content', 'noindex, nofollow');
        } else {
            const meta = document.createElement('meta');
            meta.name = 'robots';
            meta.content = 'noindex, nofollow';
            document.head.appendChild(meta);
        }

        return () => {
            document.title = originalTitle;
            const currentMeta = document.querySelector('meta[name="robots"]');
            if (currentMeta) {
                currentMeta.setAttribute('content', prevContent || 'index, follow');
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#FAF5E8] text-[#1c0f06] flex items-center justify-center p-4 sm:p-6 text-center">
            <div className="max-w-md w-full bg-white border border-[#E6D6B8] rounded-3xl p-6 sm:p-10 shadow-xl space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#8E5B00] bg-[#FAF2DE] border border-[#E6D6B8] px-3.5 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-[#C69722]" />
                    <span>|| ॐ श्री गजाननाय नमः ||</span>
                </div>

                <div className="text-7xl font-black text-[#C69722] tracking-tight leading-none">
                    404
                </div>

                <h1 className="text-2xl font-serif font-bold text-[#161616]">
                    Page Not Found
                </h1>

                <div className="text-sm font-semibold text-[#8E5B00]">
                    हे पृष्ठ उपलब्ध नाही किंवा हलवले गेले आहे
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
                    The requested page could not be found. Discover authentic hand-carved Makrana marble murtis, Gajanan Maharaj idols, and temple statues in Shegaon.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                        type="button"
                        onClick={onReturnToStore}
                        aria-label="Return to store homepage"
                        className="min-h-[48px] px-6 py-3 rounded-xl bg-[#F7C600] hover:bg-[#E2B400] text-[#161616] text-xs font-black tracking-wider uppercase transition shadow-sm hover:scale-102 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4 text-[#161616]" />
                        <span>Return to Home</span>
                    </button>
                    <button
                        type="button"
                        onClick={onNavigateToShop}
                        aria-label="Explore marble murti catalog"
                        className="min-h-[48px] px-6 py-3 rounded-xl bg-[#FAF5E8] hover:bg-[#F2E7CD] text-[#8E5B00] border border-[#E6D6B8] text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5"
                    >
                        <span>Explore Catalog</span>
                        <ArrowRight className="w-4 h-4 text-[#8E5B00]" />
                    </button>
                </div>

                <div className="pt-4 border-t border-stone-200/80 text-[11px] text-stone-500">
                    Need help? Call or WhatsApp:{' '}
                    <a href="tel:+917020676423" className="font-semibold text-[#8E5B00] underline">
                        +91 70206 76423
                    </a>
                </div>
            </div>
        </div>
    );
}

