import React, { useState } from 'react';
import { X, Star, ShieldCheck, Gem, Sparkles, Truck, Check, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import SafeImage from './SafeImage';

export default function ProductDetailModal({
    product,
    onClose,
    onAddToCart,
    isWishlisted,
    onToggleWishlist
}) {
    if (!product) return null;

    const [selectedSize, setSelectedSize] = useState('9 cm (Compact / Small Altar)');
    const [selectedFinish, setSelectedFinish] = useState('Pure Makrana White');
    const [qty, setQty] = useState(1);
    const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'vaastu' | 'care'

    const priceNum = typeof product.price === 'string'
        ? parseInt(product.price.replace(/[^\d]/g, ''), 10) || 999
        : product.price;

    const oldPriceNum = product.oldPrice || (typeof product.old === 'string' ? parseInt(product.old.replace(/[^\d]/g, ''), 10) : priceNum + 700);

    const sizePriceAdd = selectedSize.includes('15 cm') ? 600 : selectedSize.includes('24 cm') ? 1500 : 0;
    const finalPrice = priceNum + sizePriceAdd;
    const finalOldPrice = oldPriceNum + sizePriceAdd;

    const handleAdd = (buyNow = false) => {
        onAddToCart({
            ...product,
            price: finalPrice,
            title: `${product.title} (${selectedSize.split(' ')[0]} - ${selectedFinish})`
        }, buyNow);
        if (buyNow) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E6D6B8] animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-black hover:text-white shadow-md flex items-center justify-center text-stone-700 transition tap-target-48 active:scale-95"
                    aria-label="Close product view"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="grid md:grid-cols-12 max-h-[85vh] overflow-y-auto">
                    {/* Left: Image Gallery */}
                    <div className="md:col-span-5 bg-[#FAF5E8] p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E8DEC8]">
                        <div className="relative rounded-2xl overflow-hidden aspect-square bg-white shadow-sm border border-[#E6D6B8]/80 group">
                            <SafeImage
                                src={product.img}
                                fallbackSrc="/images/products/ram-darbar.png"
                                alt={product.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <span className="absolute top-3 left-3 bg-[#161616]/90 text-[#F7C600] text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow">
                                ✦ {product.deity || 'Sacred Idol'}
                            </span>
                            <button
                                onClick={(e) => onToggleWishlist(product.id, e)}
                                className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center transition tap-target-48 active:scale-95 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-stone-500 hover:text-red-500'}`}
                                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            >
                                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                            </button>
                        </div>

                        {/* Guarantee Badges */}
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#E6D6B8]/60 space-y-2 text-[11px] text-stone-700 font-medium">
                            <div className="flex items-center gap-2">
                                <Gem className="w-4 h-4 text-[#C69722] flex-shrink-0" />
                                <span>100% Authentic Hand-Carved Makrana Marble</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#C69722] flex-shrink-0" />
                                <span>Pran Pratishtha Ready (Vedic Consecration)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-[#C69722] flex-shrink-0" />
                                <span>Insured Wooden-Crate Zero Breakage Delivery</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Details & Purchase Form */}
                    <div className="md:col-span-7 p-4 sm:p-8 flex flex-col justify-between space-y-4 sm:space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                                <div className="flex text-[#C69722]">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                    ))}
                                </div>
                                <span className="font-bold text-[#161616]">4.9 / 5</span>
                                <span className="text-stone-400">• 142 Verified Temple Buyers</span>
                            </div>

                            <h2 className="font-serif text-2xl sm:text-3xl text-[#161616] font-semibold leading-snug">
                                {product.title}
                            </h2>

                            <div className="flex items-baseline gap-3 pt-1">
                                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C69722]">
                                    ₹{finalPrice.toLocaleString('en-IN')}.00
                                </span>
                                <span className="text-sm text-stone-400 line-through">
                                    ₹{finalOldPrice.toLocaleString('en-IN')}.00
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                                    Save ₹{(finalOldPrice - finalPrice).toLocaleString('en-IN')}
                                </span>
                            </div>

                            <p className="text-xs text-stone-500 leading-relaxed">
                                Tax included. Free insured delivery across India. COD available at checkout with zero extra fees.
                            </p>

                            {/* Size Selection */}
                            <div className="space-y-1.5 pt-2">
                                <label className="text-xs font-bold text-[#161616] tracking-wider uppercase">
                                    Select Size:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                        '9 cm (Compact)',
                                        '15 cm (Home Mandir)',
                                        '24 cm (Grand Temple)'
                                    ].map(sz => (
                                        <button
                                            key={sz}
                                            type="button"
                                            onClick={() => setSelectedSize(sz)}
                                            className={`min-h-[44px] p-2.5 text-left rounded-xl border text-xs font-medium transition tap-target-48 active:scale-98 ${selectedSize.startsWith(sz.split(' ')[0]) ? 'border-[#C69722] bg-[#FAF5E8] text-[#161616] font-bold shadow-xs' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}
                                        >
                                            {sz}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Finish Selection */}
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-bold text-[#161616] tracking-wider uppercase">
                                    Sacred Finish:
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        'Pure Makrana White',
                                        '24K Gold Zaree Painted',
                                        'Antique Polished Brass'
                                    ].map(finish => (
                                        <button
                                            key={finish}
                                            type="button"
                                            onClick={() => setSelectedFinish(finish)}
                                            className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-medium transition tap-target-48 active:scale-98 ${selectedFinish === finish ? 'border-[#C69722] bg-[#161616] text-[#F7C600] font-bold' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}
                                        >
                                            {finish}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-3 pt-2">
                                <span className="text-xs font-bold text-[#161616] tracking-wider uppercase">Quantity:</span>
                                <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-stone-50">
                                    <button
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-stone-200 text-stone-700 font-bold tap-target-44 active:scale-95"
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <span className="w-10 text-center text-xs font-bold text-[#161616]">{qty}</span>
                                    <button
                                        onClick={() => setQty(qty + 1)}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-stone-200 text-stone-700 font-bold tap-target-44 active:scale-95"
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 pt-3 border-t border-stone-200">
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                <button
                                    onClick={() => handleAdd(false)}
                                    className="w-full min-h-[46px] py-3 rounded-xl bg-[#161616] hover:bg-black text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition shadow-md active:scale-95 tap-target-48"
                                >
                                    <ShoppingBag className="w-4 h-4" /> ADD TO CART
                                </button>
                                <button
                                    onClick={() => handleAdd(true)}
                                    className="w-full min-h-[46px] py-3 rounded-xl bg-[#F7C600] hover:bg-[#E2B400] text-[#161616] text-xs font-black tracking-wider uppercase transition shadow-md active:scale-95 tap-target-48"
                                >
                                    BUY NOW ➔
                                </button>
                            </div>
                        </div>

                        {/* Tabbed Info */}
                        <div className="border-t border-stone-200 pt-3">
                            <div className="flex gap-4 border-b border-stone-100 text-xs font-semibold pb-2">
                                <button
                                    onClick={() => setActiveTab('specs')}
                                    className={`pb-1 ${activeTab === 'specs' ? 'text-[#C69722] border-b-2 border-[#C69722]' : 'text-stone-400 hover:text-stone-700'}`}
                                >
                                    Craft Specifications
                                </button>
                                <button
                                    onClick={() => setActiveTab('vaastu')}
                                    className={`pb-1 ${activeTab === 'vaastu' ? 'text-[#C69722] border-b-2 border-[#C69722]' : 'text-stone-400 hover:text-stone-700'}`}
                                >
                                    Vaastu Directions
                                </button>
                                <button
                                    onClick={() => setActiveTab('care')}
                                    className={`pb-1 ${activeTab === 'care' ? 'text-[#C69722] border-b-2 border-[#C69722]' : 'text-stone-400 hover:text-stone-700'}`}
                                >
                                    Care & Cleansing
                                </button>
                            </div>

                            <div className="pt-2 text-xs text-stone-600 leading-relaxed">
                                {activeTab === 'specs' && (
                                    <p>
                                        Hand-chiseled from single-block white Makrana marble by master carvers. Sealed with organic non-yellowing protective wax to maintain sacred luster for generations.
                                    </p>
                                )}
                                {activeTab === 'vaastu' && (
                                    <p>
                                        Place in the North-East (Ishanya) corner of your home or on your car dashboard facing front. Maintain clean surroundings to channel divine vibrations and peace.
                                    </p>
                                )}
                                {activeTab === 'care' && (
                                    <p>
                                        Cleanse softly with sacred Ganga Jal and a soft lint-free cotton cloth. Avoid chemical detergents or abrasive brushes to preserve the consecrated marble polish.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
