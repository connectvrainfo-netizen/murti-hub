import React from 'react';
import { X, Calendar, Clock, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

export default function ArticleModal({ article, onClose, onExploreDeity }) {
    if (!article) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E6D6B8] animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center text-sm transition"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Hero Banner */}
                <div className="relative h-64 sm:h-72 overflow-hidden bg-stone-900">
                    <img
                        src={article.img}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#C69722] text-[#161616] text-[10px] font-bold uppercase tracking-wider mb-2 w-max">
                            {article.tag}
                        </span>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                            {article.title}
                        </h2>
                    </div>
                </div>

                {/* Article Content */}
                <div className="p-6 sm:p-8 space-y-5 max-h-[60vh] overflow-y-auto text-xs sm:text-sm text-stone-700 leading-relaxed">
                    <div className="flex items-center gap-4 text-xs text-stone-400 border-b border-stone-100 pb-3">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C69722]" /> Published in Sacred Journal</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#C69722]" /> 4 Min Spiritual Read</span>
                    </div>

                    <p className="font-serif italic text-base sm:text-lg text-stone-800 leading-relaxed bg-[#FAF5E8] p-4 rounded-2xl border border-[#E6D6B8]">
                        "{article.desc}"
                    </p>

                    <div className="space-y-3">
                        <h4 className="font-serif text-lg font-bold text-[#161616]">
                            1. The Sacred Architecture of Vaastu Shastra
                        </h4>
                        <p>
                            According to the Vedic texts of Manasara and Mayamatam, deities carved from virgin Makrana marble hold immense sattvic resonance. To maximize peace, vitality, and prosperity, placing your murti in the Ishanya (North-East) quadrant invites cosmic energy aligned with sunrise.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-serif text-lg font-bold text-[#161616]">
                            2. Pran Pratishtha & Daily Devotional Care
                        </h4>
                        <p>
                            Before placing the idol permanently in your temple or on your vehicle's dashboard, wash your hands and sprinkle three drops of sacred Ganga Jal. Light a ghee diya or incense stick, chanting the moola mantra of the respective deity 108 times.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-serif text-lg font-bold text-[#161616]">
                            3. Preservation of Hand-Carved Marble
                        </h4>
                        <p>
                            Makrana marble is non-porous and resilient. Wipe gently with dry, soft muslin cotton. Never use commercial acidic detergents or floor cleaners. Once a year, apply a minute dab of virgin sandalwood paste to retain the stone’s radiant temple shine.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <span className="text-xs text-stone-500 font-medium">Ready to bring this divine energy home?</span>
                        <button
                            onClick={() => {
                                onClose();
                                onExploreDeity('shop-all');
                            }}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold uppercase tracking-wider transition shadow"
                        >
                            Explore Consecrated Idols ➔
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
