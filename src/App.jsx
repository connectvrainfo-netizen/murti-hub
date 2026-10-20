import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft, ChevronRight, User, Search, ShoppingBag,
    ShoppingCart, Sparkles, Gift, ShieldCheck, ArrowRight, Tag,
    Truck, PackageCheck, Award, CheckCircle2, Pause,
    Play, Volume2, VolumeX, Columns, LayoutGrid, Grid, Instagram,
    Youtube, Gem, Heart, SlidersHorizontal, RotateCcw, Percent, Check, Star, Menu, X,
    MapPin, Clock, Banknote, Eye
} from 'lucide-react';
import { deityCategories, catalog, overlayCards, pageMeta, faqs } from './data/catalog';
import ProductDetailPage from './components/ProductDetailPage';
import ProductDetailModal from './components/ProductDetailModal';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import BulkQuoteModal from './components/BulkQuoteModal';
import InquiryModal from './components/InquiryModal';
import InfoModal from './components/InfoModal';
import FilterDrawer from './components/FilterDrawer';
import IntroAnimation from './components/IntroAnimation';
import ScrollProgress from './components/ScrollProgress';
import { useLenisSmoothScroll } from './hooks/useLenisSmoothScroll';
import { useGsapScrollAnimations } from './hooks/useGsapScrollAnimations';
import { useContinuousScroll } from './hooks/useContinuousScroll';

export default function App() {
    // 0. Starting Animation State
    const [showIntro, setShowIntro] = useState(true);

    // 1. Navigation & Page View State
    const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'shop-all' | 'navratri' | 'sacred' | 'baal-roop'
    const [activeDeityFilter, setActiveDeityFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [gridCols, setGridCols] = useState(4);
    const [sortBy, setSortBy] = useState('featured');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 2. Collection Filters
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterPriceRange, setFilterPriceRange] = useState('all'); // 'all' | 'under-1000' | '1000-2000' | 'above-2000'
    const [filterPlacement, setFilterPlacement] = useState('all');

    // 3. Wishlist State
    const [wishlist, setWishlist] = useState([1, 4]); // Pre-loaded with popular idols
    const [isWishlistFilterActive, setIsWishlistFilterActive] = useState(false);
    const toggleWishlist = (productId, e) => {
        e?.stopPropagation();
        setWishlist(prev => {
            const exists = prev.includes(productId);
            const updated = exists ? prev.filter(id => id !== productId) : [...prev, productId];
            showToast(exists ? 'Removed from Sacred Wishlist' : 'Saved to Sacred Wishlist ❤️');
            return updated;
        });
    };

    // 4. Modals State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingOrderId, setTrackingOrderId] = useState('');
    const [isBulkQuoteOpen, setIsBulkQuoteOpen] = useState(false);
    const [infoModalKey, setInfoModalKey] = useState(null);



    // 6. Hero Video State
    const videoRef = useRef(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const [activeHeroSlide, setActiveHeroSlide] = useState(1); // Default to Showroom Walkthrough Video slide

    // Auto-play hero showroom video when active
    useEffect(() => {
        if (activeHeroSlide === 1 && videoRef.current && isVideoPlaying) {
            videoRef.current.play().catch(() => {
                // Autoplay policy fallback
            });
        }
    }, [activeHeroSlide, isVideoPlaying, showIntro]);

    const toggleHeroVideoPlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsVideoPlaying(true);
            showToast('Showroom tour video playing');
        } else {
            videoRef.current.pause();
            setIsVideoPlaying(false);
            showToast('Showroom tour video paused');
        }
    };

    const toggleHeroVideoSound = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsVideoMuted(videoRef.current.muted);
        showToast(videoRef.current.muted ? 'Showroom sound muted' : 'Showroom sound enabled');
    };

    // 7. Cart State & Safe Normalization
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null); // { code: 'DIVINE15', discountPercent: 15 }

    const addToCart = (product, openDrawer = false) => {
        const priceNum = typeof product.price === 'string'
            ? parseInt(product.price.replace(/[^\d]/g, ''), 10) || 999
            : product.price;

        const oldPriceNum = product.oldPrice || (typeof product.old === 'string' ? parseInt(product.old.replace(/[^\d]/g, ''), 10) : priceNum + 700);

        const normalizedProduct = {
            ...product,
            price: priceNum,
            oldPrice: oldPriceNum
        };

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...normalizedProduct, qty: 1 }];
        });

        if (openDrawer) {
            setIsCartOpen(true);
        } else {
            showToast(`Added "${product.title.slice(0, 24)}..." to Cart`);
        }
    };

    // Buy Now opens this inquiry form to collect customer details before messaging WhatsApp
    const [inquiryProduct, setInquiryProduct] = useState(null);
    const buyOnWhatsApp = (product) => setInquiryProduct(product);

    const submitWhatsAppInquiry = (product, customer) => {
        const priceNum = typeof product.price === 'string'
            ? parseInt(product.price.replace(/[^\d]/g, ''), 10) || 999
            : product.price;
        const message = `Hi, I'm interested in this idol:\n\n*${product.title}*\nPrice: ₹${priceNum.toLocaleString('en-IN')}\n\n*My Details:*\nName: ${customer.name}\nPhone: ${customer.phone}\nAddress: ${customer.address}\nPincode: ${customer.pincode}\n\nPlease share more details and availability.`;
        window.open(`https://wa.me/917020676423?text=${encodeURIComponent(message)}`, '_blank');
        setInquiryProduct(null);
    };

    const updateCartQty = (productId, delta) => {
        setCart(prev => {
            return prev
                .map(item => item.id === productId ? { ...item, qty: item.qty + delta } : item)
                .filter(item => item.qty > 0);
        });
    };

    // Subtotals & Discounts
    const rawSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = appliedCoupon ? Math.round((rawSubtotal * appliedCoupon.discountPercent) / 100) : 0;
    const cartTotal = Math.max(0, rawSubtotal - discountAmount);
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

    const applyCoupon = (code) => {
        const c = code.trim().toUpperCase();
        if (c === 'DIVINE15') {
            setAppliedCoupon({ code: 'DIVINE15', discountPercent: 15 });
            showToast('Coupon DIVINE15 Applied: 15% OFF!');
        } else if (c === 'FESTIVE10') {
            setAppliedCoupon({ code: 'FESTIVE10', discountPercent: 10 });
            showToast('Coupon FESTIVE10 Applied: 10% OFF!');
        } else {
            showToast('Invalid Coupon. Try DIVINE15');
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        showToast('Coupon removed');
    };

    // 8. Toast Notification State
    const [toastMessage, setToastMessage] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);
    const toastTimerRef = useRef(null);

    const showToast = (msg) => {
        setToastMessage(msg);
        setIsToastVisible(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setIsToastVisible(false);
        }, 3000);
    };

    // 9. KwikPass Modal State
    const [isKwikPassOpen, setIsKwikPassOpen] = useState(false);
    const [kwikPhone, setKwikPhone] = useState('');

    const handleKwikPassSubmit = (e) => {
        e?.preventDefault();
        setIsKwikPassOpen(false);
        showToast(kwikPhone.length === 10 ? `OTP sent to +91 ${kwikPhone}` : 'OTP sent! Welcome to Amol Marble Murti Bhandar.');
        setKwikPhone('');
    };

    // 10. Google Quality Scorecard State
    const [isGoogleQualityOpen, setIsGoogleQualityOpen] = useState(false);

    // 12. Newsletter State
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (!newsletterEmail || !newsletterEmail.includes('@')) {
            showToast('Please enter a valid email address');
            return;
        }
        showToast('Subscribed! Check inbox for code DIVINE15');
        setNewsletterEmail('');
    };

    // Check if any modal is active (pauses smooth momentum background scroll)
    const isAnyModalOpen = Boolean(
        isCheckoutOpen ||
        isTrackingModalOpen ||
        isBulkQuoteOpen ||
        infoModalKey ||
        isFilterDrawerOpen ||
        isCartOpen ||
        isMobileMenuOpen ||
        inquiryProduct
    );

    // 60fps Lenis Smooth Momentum Scroll & GSAP ScrollTrigger Integration
    const { scrollTo } = useLenisSmoothScroll({
        isModalOpen: isAnyModalOpen,
        currentPage
    });

    // High Performance GSAP Scroll Animations Hook
    useGsapScrollAnimations({
        currentPage,
        showIntro
    });

    // Continuous Horizontal Marquee Scrollers (Active on Homepage)
    useContinuousScroll({
        trackId: 'most-loved-track',
        speed: 0.7,
        pauseOnHover: true,
        totalCopies: 3,
        enabled: currentPage === 'home' && !showIntro
    });

    useContinuousScroll({
        trackId: 'festive-track',
        speed: 0.75,
        pauseOnHover: true,
        totalCopies: 3,
        enabled: currentPage === 'home' && !showIntro
    });

    useContinuousScroll({
        trackId: 'dark-overlay-track',
        speed: 0.75,
        pauseOnHover: true,
        totalCopies: 3,
        enabled: currentPage === 'home' && !showIntro
    });

    // Navigation Handler
    const navigateTo = (pageKey, deity = null) => {
        setCurrentPage(pageKey);
        setActiveDeityFilter(deity);
        setFilterPlacement('all');
        setFilterPriceRange('all');
        setSearchQuery('');
        setIsWishlistFilterActive(false);
        if (pageKey !== 'product') setSelectedProduct(null);
        if (pageKey === 'home') setActiveHeroSlide(1);
        setIsMobileMenuOpen(false);
        scrollTo(0);
    };

    // Dedicated Product Page Opener
    const openProductPage = (product) => {
        if (!product) return;
        setSelectedProduct(product);
        setCurrentPage('product');
        setIsSearchOpen(false);
        setIsCartOpen(false);
        setIsMobileMenuOpen(false);
        scrollTo(0);
    };

    const handleBackFromProduct = () => {
        setSelectedProduct(null);
        setCurrentPage('shop-all');
        scrollTo(0);
    };

    // Collection Items Computation with multi-filters
    const getFilteredCollectionItems = () => {
        let items = [...catalog];
        if (currentPage !== 'home' && currentPage !== 'shop-all') {
            const meta = pageMeta[currentPage];
            if (meta) items = meta.getItems();
        }

        if (isWishlistFilterActive) {
            items = items.filter(p => wishlist.includes(p.id));
        }

        if (activeDeityFilter) {
            items = items.filter(p =>
                p.deity?.toLowerCase().includes(activeDeityFilter.toLowerCase()) ||
                p.title.toLowerCase().includes(activeDeityFilter.toLowerCase())
            );
        }

        if (filterPriceRange !== 'all') {
            if (filterPriceRange === 'under-1000') items = items.filter(p => p.price < 1000);
            if (filterPriceRange === '1000-2000') items = items.filter(p => p.price >= 1000 && p.price <= 2000);
            if (filterPriceRange === 'above-2000') items = items.filter(p => p.price > 2000);
        }

        if (filterPlacement !== 'all') {
            items = items.filter(p =>
                p.title.toLowerCase().includes(filterPlacement.toLowerCase()) ||
                p.deity?.toLowerCase().includes(filterPlacement.toLowerCase())
            );
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            items = items.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.deity?.toLowerCase().includes(q)
            );
        }

        if (sortBy === 'az') items.sort((a, b) => a.title.localeCompare(b.title));
        if (sortBy === 'low') items.sort((a, b) => a.price - b.price);
        if (sortBy === 'high') items.sort((a, b) => b.price - a.price);

        return items;
    };

    const collectionItems = getFilteredCollectionItems();

    // Horizontal Scroll Helper with Continuous Marquee Pause
    const scrollTrack = (id, delta) => {
        const el = document.getElementById(id);
        if (el) {
            window.dispatchEvent(new CustomEvent('pauseContinuousScroll', { detail: { id } }));
            el.scrollBy({ left: delta, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF5] text-[#161616] pb-24 lg:pb-0">

            {/* ================= STARTING DEVOTIONAL ANIMATION ================= */}
            {showIntro && (
                <IntroAnimation onComplete={() => setShowIntro(false)} />
            )}

            {/* ================= SACRED GOLDEN SCROLL PROGRESS & BACK TO TOP ================= */}
            <ScrollProgress onScrollTop={() => scrollTo(0)} />

            {/* ================= 2. STICKY NAVIGATION HEADER ================= */}
            <header className="sticky top-0 z-40 bg-[#FAF5E8]/95 backdrop-blur-md border-b border-[#E8DEC8] transition-shadow duration-300">
                <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-3.5 flex items-center justify-between gap-4">

                    {/* Amol Marble Murti Bhandar Brand Logo */}
                    <button onClick={() => navigateTo('home')} className="flex items-center select-none group text-left outline-none focus:outline-none flex-shrink-0 py-0.5">
                        <img
                            src="/images/logo.png"
                            alt="अमोल मार्बल मूर्ती भंडार - Amol Marble Murti Bhandar"
                            width="220"
                            height="56"
                            className="h-11 sm:h-13 md:h-14 w-auto object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                        />
                    </button>

                    {/* Center Unified Single-Line Navigation Menu */}
                    <nav className="desktop-nav-menu hidden lg:flex flex-1 items-center justify-center gap-10 xl:gap-14 2xl:gap-16 text-[12px] xl:text-[12.5px] font-semibold tracking-[0.14em] uppercase text-[#222222] whitespace-nowrap">
                        <button
                            onClick={() => navigateTo('home')}
                            className={`nav-item-link ${currentPage === 'home' ? 'active-nav' : ''}`}>
                            HOME
                        </button>
                        <button
                            onClick={() => { navigateTo('home'); setTimeout(() => document.getElementById('hero-slider')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                            className="nav-item-link">
                            ABOUT
                        </button>
                        <button
                            onClick={() => navigateTo('shop-all')}
                            className={`nav-item-link ${currentPage === 'shop-all' && !activeDeityFilter ? 'active-nav' : ''}`}>
                            SHOP
                        </button>
                        <button
                            onClick={() => setInfoModalKey('contact')}
                            className="nav-item-link">
                            CONTACT
                        </button>
                    </nav>

                    {/* Right Utility Icons */}
                    <div className="flex items-center space-x-1 sm:space-x-2 text-[#1C1C1C] flex-shrink-0">
                        {/* Mobile & Tablet Darshan Intro Replay Badge */}
                        <button
                            type="button"
                            onClick={() => setShowIntro(true)}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded-full text-[10.5px] sm:text-[11px] font-bold text-[#9D6809] bg-[#FAF2DE] hover:bg-[#F4E3BF] border border-[#E5CD96] transition-all active:scale-95 shadow-2xs"
                            title="Replay Sacred Intro Animation"
                            aria-label="Replay Sacred Intro Animation"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[#C69722]" />
                            <span className="hidden min-[390px]:inline">दर्शन Intro</span>
                        </button>

                        {/* Search Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-stone-800 hover:text-[#C69722] hover:bg-[#FAF2DE]/50 active:scale-95 transition tap-target-44"
                            aria-label={isSearchOpen ? "Close search bar" : "Open search bar"}
                            title="Search Sacred Murtis"
                        >
                            <Search className="w-5 h-5 stroke-[1.8]" />
                        </button>

                        {/* Account Login Button (Desktop & Tablet) */}
                        <button
                            type="button"
                            onClick={() => setIsKwikPassOpen(true)}
                            className="hidden md:flex w-auto px-3 h-10 items-center justify-center gap-1.5 rounded-full text-stone-800 hover:text-[#C69722] hover:bg-[#FAF2DE]/50 active:scale-95 transition text-xs font-semibold"
                            aria-label="Account Login"
                        >
                            <User className="w-4.5 h-4.5 stroke-[1.8]" />
                            <span className="text-[11px] font-semibold tracking-wider">LOGIN</span>
                        </button>

                        {/* Wishlist Button with Live Counter Badge */}
                        <button
                            type="button"
                            onClick={() => {
                                if (wishlist.length === 0) {
                                    showToast('Your Sacred Wishlist is empty. Tap ❤️ on idols to save.');
                                } else {
                                    setIsWishlistFilterActive(true);
                                    setCurrentPage('shop-all');
                                    setActiveDeityFilter(null);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    showToast(`Showing ${wishlist.length} saved idols in your Sacred Wishlist ❤️`);
                                }
                            }}
                            className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-stone-800 hover:text-[#C69722] hover:bg-[#FAF2DE]/50 active:scale-95 transition tap-target-44"
                            aria-label={`Sacred Wishlist, ${wishlist.length} saved items`}
                            title="Sacred Wishlist"
                        >
                            <Heart className={`w-5 h-5 stroke-[1.8] ${wishlist.length > 0 ? 'text-red-500 fill-red-100' : ''}`} />
                            {wishlist.length > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                                    {wishlist.length}
                                </span>
                            )}
                        </button>

                        {/* Cart Button with Live Counter Badge */}
                        <button
                            type="button"
                            onClick={() => setIsCartOpen(true)}
                            className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-stone-800 hover:text-[#C69722] hover:bg-[#FAF2DE]/50 active:scale-95 transition tap-target-44"
                            aria-label={`Shopping Cart, ${cartCount} items`}
                            title="Shopping Cart"
                        >
                            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 bg-[#C69722] text-white text-[9.5px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Mobile Menu Hamburger Button */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="mobile-hamburger-btn lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-stone-800 hover:text-[#C69722] hover:bg-[#FAF2DE]/50 active:scale-95 transition tap-target-44"
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-5.5 h-5.5 stroke-[2]" />
                            ) : (
                                <Menu className="w-5.5 h-5.5 stroke-[1.8]" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-[#FAF5E8] border-t border-[#E2D4B7] px-4 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-center pb-3 border-b border-[#E2D4B7]">
                            <img
                                src="/images/logo.png"
                                alt="अमोल मार्बल मूर्ती भंडार"
                                className="h-14 w-auto object-contain"
                                width="180"
                                height="56"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold tracking-wider uppercase">
                            <button
                                type="button"
                                onClick={() => navigateTo('home')}
                                className={`min-h-[48px] px-3.5 py-3 rounded-xl text-left flex items-center transition active:scale-98 ${currentPage === 'home' ? 'bg-[#C69722] text-white' : 'bg-white text-stone-800 shadow-xs'}`}
                            >
                                Home
                            </button>
                            <button
                                type="button"
                                onClick={() => navigateTo('shop-all')}
                                className={`min-h-[48px] px-3.5 py-3 rounded-xl text-left flex items-center transition active:scale-98 ${currentPage === 'shop-all' ? 'bg-[#C69722] text-white' : 'bg-white text-stone-800 shadow-xs'}`}
                            >
                                Shop All
                            </button>
                            <button
                                type="button"
                                onClick={() => navigateTo('navratri')}
                                className="min-h-[48px] px-3.5 py-3 rounded-xl text-left flex items-center bg-white text-stone-800 shadow-xs transition active:scale-98"
                            >
                                Navratri Drop
                            </button>
                            <button
                                type="button"
                                onClick={() => navigateTo('sacred')}
                                className="min-h-[48px] px-3.5 py-3 rounded-xl text-left flex items-center bg-white text-stone-800 shadow-xs transition active:scale-98"
                            >
                                Sacred Idols
                            </button>
                            <button
                                type="button"
                                onClick={() => navigateTo('baal-roop')}
                                className="min-h-[48px] px-3.5 py-3 rounded-xl text-left flex items-center bg-white text-stone-800 shadow-xs transition active:scale-98"
                            >
                                Baal Roop
                            </button>
                        </div>
                        <div className="pt-2 border-t border-[#E2D4B7] flex flex-col gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => { setIsMobileMenuOpen(false); setShowIntro(true); }}
                                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#FAF2DE] border border-[#E5CD96] text-[#9D6809] font-bold text-center flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
                            >
                                <Sparkles className="w-4 h-4 text-[#C69722]" />
                                <span>Play Sacred Intro (दर्शन)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsMobileMenuOpen(false); setIsBulkQuoteOpen(true); }}
                                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-center flex items-center justify-center active:scale-98 transition shadow-sm"
                            >
                                Bulk & Corporate Gifting
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsMobileMenuOpen(false); setIsTrackingModalOpen(true); }}
                                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-center flex items-center justify-center active:scale-98 transition shadow-xs"
                            >
                                Track My Order
                            </button>
                        </div>
                    </div>
                )}

                {/* Search Bar Slide-Down with Live Preview */}
                {isSearchOpen && (
                    <div className="bg-white border-t border-stone-200 px-4 sm:px-8 py-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
                        <div className="max-w-3xl mx-auto space-y-3">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (searchQuery.trim() && currentPage === 'home') setCurrentPage('shop-all');
                                    setIsSearchOpen(false);
                                }}
                                className="flex items-center gap-2 border border-stone-300 rounded-xl px-3 py-1.5 focus-within:border-black bg-stone-50/50"
                            >
                                <label htmlFor="header-search-input" className="sr-only">Search sacred marble idols</label>
                                <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
                                <input
                                    id="header-search-input"
                                    name="search"
                                    type="search"
                                    inputMode="search"
                                    enterKeyHint="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search Shiva, Hanuman, Ram Darbar, Ganesha..."
                                    className="w-full text-base bg-transparent focus:outline-none py-1.5"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-black text-xs font-bold"
                                        aria-label="Clear search input"
                                    >
                                        ✕
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 min-h-[44px] bg-[#161616] text-white text-xs font-semibold rounded-lg hover:bg-[#C69722] transition flex-shrink-0"
                                >
                                    Search
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center text-xs text-stone-400 hover:text-black ml-1 flex-shrink-0"
                                    aria-label="Close search"
                                >
                                    ✕
                                </button>
                            </form>

                            {/* Popular Quick Searches */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                <span className="text-stone-400 font-medium">Trending:</span>
                                {['Ram Darbar', 'Standing Mahadev', 'Panchmukhi Hanuman', 'Ganesha Trio', 'Durga'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setSearchQuery(tag);
                                            if (currentPage === 'home') setCurrentPage('shop-all');
                                            setIsSearchOpen(false);
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-[#FAF5E8] hover:text-[#C69722] text-stone-700 transition border border-stone-200"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {/* Live Matches Preview (if typing) */}
                            {searchQuery.trim().length > 1 && (
                                <div className="pt-2 border-t border-stone-100">
                                    <p className="text-[11px] font-semibold text-stone-500 mb-2">Matching Idols:</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
                                        {catalog.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.deity.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4).map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => openProductPage(p)}
                                                className="flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 hover:border-[#C69722] cursor-pointer bg-white transition group"
                                            >
                                                <img src={p.img} alt={p.title} className="w-10 h-10 rounded-lg object-cover bg-stone-50" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-medium text-stone-900 truncate group-hover:text-[#C69722]">{p.title}</p>
                                                    <p className="text-[10px] font-bold text-[#C69722]">Rs. {p.price.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* ========================================================================= */}
            {/*                             HOMEPAGE VIEW                                 */}
            {/* ========================================================================= */}
            {currentPage === 'home' && (
                <div>
                    {/* ================= 3. DEITY CATEGORY BAR ================= */}
                    <section id="deity-category-bar" className="bg-[#FAF5E8]/60 py-4 sm:py-5 lg:py-6 border-b border-[#E8DEC8]">
                        <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-12 2xl:px-16">
                            <div className="flex items-start justify-start lg:justify-between w-full overflow-x-auto no-scrollbar scroll-smooth py-1">
                                {deityCategories.map(item => {
                                    const isSelected = Boolean(
                                        (activeDeityFilter && item.deity && activeDeityFilter.toLowerCase() === item.deity.toLowerCase()) ||
                                        (item.route === 'navratri' && currentPage === 'navratri') ||
                                        (item.route === 'sacred' && currentPage === 'sacred')
                                    );
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => navigateTo(item.route, item.deity)}
                                            className={`deity-cat-item group ${isSelected ? 'active-category' : ''}`}
                                        >
                                            <div className="deity-cat-card">
                                                <img src={item.img} alt={item.name} loading="eager" />
                                            </div>
                                            <span className="deity-cat-label">{item.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* ================= 4. HERO SECTION WITH CINEMATIC SHOWROOM & PRODUCT SHOWCASE ================= */}
                    <section id="hero-slider" className="relative w-full overflow-hidden select-none bg-[#FAF5E8] border-b border-[#E6D6B8] group">
                        <div className="relative w-full min-h-[420px] min-[360px]:min-h-[440px] sm:min-h-[480px] sm:aspect-[16/9] lg:aspect-[21/9] sm:max-h-[640px]">

                            {/* HERO SLIDE 0: PRODUCT-FOCUSED SHOWCASE (REFERENCE LAYOUT ARRANGEMENT) */}
                            <div className={`hero-slide absolute inset-0 transition-opacity duration-700 bg-gradient-to-br from-[#FAF5E8] via-[#FFFDF9] to-[#F3EAD3] ${activeHeroSlide === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-12 lg:px-16 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-10 py-3 sm:py-10">
                                    
                                    {/* Product Visual on Left / Top */}
                                    <div className="w-full sm:w-1/2 flex items-center justify-center relative order-1 sm:order-1 pt-1 sm:pt-0">
                                        <div className="relative w-40 h-40 min-[360px]:w-48 min-[360px]:h-48 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#F7C600]/30 via-[#E8DEC8]/50 to-transparent blur-2xl transform scale-100"></div>
                                            <img
                                                src="/images/products/ram-darbar.png"
                                                alt="Shri Ram Darbar - Pure White Makrana Marble"
                                                className="relative max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)] hover:scale-105 transition duration-500 cursor-pointer"
                                                onClick={() => {
                                                    const ramItem = catalog.find(i => i.id === 1);
                                                    if (ramItem) openProductPage(ramItem);
                                                }}
                                            />
                                            <span className="absolute -bottom-1 sm:bottom-2 right-1 sm:right-4 bg-white/95 backdrop-blur-xs text-[#8E5B00] border border-[#E6D6B8] text-[9.5px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-xs">
                                                ✦ Hand-Carved Makrana Marble
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product Details, Price & CTA on Right / Bottom */}
                                    <div className="w-full sm:w-1/2 text-center sm:text-left space-y-1.5 sm:space-y-3.5 order-2 sm:order-2 pb-6 sm:pb-0">
                                        <div className="inline-flex items-center gap-1.5 text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#8E5B00] bg-[#FAF2DE] border border-[#E6D6B8] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-2xs">
                                            <Sparkles className="w-3 h-3 text-[#C69722]" />
                                            <span>SANCTIFIED SACRED COLLECTION 2026</span>
                                        </div>

                                        <h1 className="font-serif text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-bold text-[#161616] leading-tight">
                                            Shri Ram Darbar<br />
                                            <span className="italic text-[#8E5B00] font-normal text-base min-[360px]:text-lg sm:text-3xl lg:text-3xl">Pure Makrana White Marble</span>
                                        </h1>

                                        <p className="hidden min-[400px]:block text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto sm:mx-0 line-clamp-2 sm:line-clamp-none">
                                            Lord Ram, Mata Sita, Laxman & Hanuman hand-chiseled with 24K gold foil embellishments. Consecrated for home mandir altars and daily pooja.
                                        </p>

                                        {/* Price Callout (From ₹1,499) */}
                                        <div className="flex items-baseline justify-center sm:justify-start gap-2 pt-0.5">
                                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">From</span>
                                            <span className="font-serif text-2xl sm:text-3xl font-black text-[#8E5B00]">₹1,499</span>
                                            <span className="text-xs text-stone-400 line-through">₹2,599</span>
                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                Save 42%
                                            </span>
                                        </div>

                                        {/* Primary CTA (Shop Now) */}
                                        <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const ramItem = catalog.find(i => i.id === 1);
                                                    if (ramItem) openProductPage(ramItem);
                                                }}
                                                className="flex-1 sm:flex-none min-h-[46px] sm:min-h-[48px] px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#F7C600] hover:bg-[#E2B400] text-[#161616] text-xs font-black tracking-widest uppercase transition shadow-md hover:scale-102 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <span>EXPLORE IDOL</span>
                                                <ArrowRight className="w-4 h-4 text-[#161616]" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveHeroSlide(1)}
                                                className="min-h-[46px] sm:min-h-[48px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold tracking-wider uppercase transition shadow-2xs flex items-center justify-center gap-1.5"
                                            >
                                                <Eye className="w-4 h-4 text-[#8E5B00]" />
                                                <span>Tour</span>
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* HERO SLIDE 1: CINEMATIC SHOWROOM WALKTHROUGH VIDEO */}
                            <div className={`hero-slide absolute inset-0 transition-opacity duration-700 bg-[#161616] ${activeHeroSlide === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover object-center pointer-events-none select-none"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    preload="auto"
                                    poster="/images/banners/hero-most-loved.png"
                                    disablePictureInPicture
                                    disableRemotePlayback
                                    controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                                    tabIndex={-1}
                                >
                                    <source src="/gemini_generated_video_0ac5f0f2.mp4" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>

                                <div className="hero-video-gradient absolute inset-0 pointer-events-none"></div>

                                <div className="absolute inset-0 flex flex-col justify-end p-4 min-[360px]:p-5 sm:p-12 lg:p-16 z-10 pointer-events-none pb-6 sm:pb-12">
                                    <div className="max-w-2xl space-y-2 sm:space-y-4 mb-2 sm:mb-6 pointer-events-auto">
                                        <div className="inline-flex items-center gap-1.5 text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#F7C600] bg-black/50 backdrop-blur-md px-2.5 py-0.5 sm:py-1 rounded-full border border-[#F7C600]/30 w-fit">
                                            <Sparkles className="w-3 h-3 text-[#F7C600]" />
                                            <span>SANCTIFIED MAKRANA MARBLE ART</span>
                                        </div>

                                        <h2 className="font-serif text-[24px] min-[360px]:text-[28px] sm:text-5xl lg:text-6xl text-white font-medium leading-[1.1] drop-shadow-md">
                                            Where Faith<br />
                                            <span className="italic text-[#F7C600] font-normal">Finds Form.</span>
                                        </h2>

                                        <p className="text-[11px] min-[360px]:text-xs sm:text-sm text-stone-200/95 leading-relaxed max-w-lg drop-shadow line-clamp-2 sm:line-clamp-none">
                                            Step inside अमोल मार्बल मूर्ती भंडार — India's home for hand-carved Makrana marble idols, home mandir deities, and handcrafted sacred temple collectibles.
                                        </p>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('most-loved-section')?.scrollIntoView({ behavior: 'smooth' })}
                                                className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#F7C600] hover:bg-[#E2B400] text-[#161616] text-[11px] min-[360px]:text-xs font-black tracking-[0.14em] uppercase transition shadow-xl hover:scale-102 active:scale-95 flex items-center justify-center gap-2 tap-target-44"
                                            >
                                                <ShoppingBag className="w-4 h-4 text-[#161616]" />
                                                <span>EXPLORE MOST LOVED</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => navigateTo('shop-all')}
                                                className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/40 hover:border-white text-white text-[11px] min-[360px]:text-xs font-bold tracking-[0.14em] uppercase transition shadow-lg flex items-center justify-center gap-2 tap-target-44"
                                            >
                                                <span>VIEW ENTIRE CATALOG</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-[#F7C600]" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mobile-Visible Sacred Trust Strip */}
                                    <div className="flex items-center gap-3 sm:gap-6 border-t border-white/20 pt-2.5 sm:pt-3.5 text-stone-300 text-[10px] sm:text-[11px] font-medium tracking-wide pointer-events-auto overflow-x-auto no-scrollbar py-0.5">
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Gem className="w-3.5 h-3.5 text-[#F7C600]" />
                                            <span>Makrana Marble</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Sparkles className="w-3.5 h-3.5 text-[#F7C600]" />
                                            <span>Pran Pratishtha Ready</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <ShieldCheck className="w-3.5 h-3.5 text-[#F7C600]" />
                                            <span>Zero-Breakage Crating</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* HERO SLIDE 2: RAM DARBAR BANNER */}
                            <div
                                onClick={() => navigateTo('shop-all')}
                                className={`hero-slide absolute inset-0 transition-opacity duration-700 bg-cover bg-center cursor-pointer ${activeHeroSlide === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                style={{ backgroundImage: "url('/images/banners/hero-new-arrivals.png')" }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 flex flex-col justify-end p-4 min-[360px]:p-5 sm:p-14 pb-6 sm:pb-12">
                                    <div className="inline-flex items-center gap-1.5 text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#F7C600] bg-black/50 backdrop-blur-md px-2.5 py-0.5 sm:py-1 rounded-full border border-[#F7C600]/30 w-fit mb-1.5">
                                        <Sparkles className="w-3 h-3 text-[#F7C600]" />
                                        <span>NEW ARRIVALS 2026</span>
                                    </div>
                                    <h2 className="font-serif text-2xl min-[360px]:text-3xl sm:text-5xl text-white font-medium">Shri Ram Darbar & Divine Idols</h2>
                                    <p className="text-stone-300 text-[11px] min-[360px]:text-xs sm:text-sm mt-1 max-w-lg line-clamp-2 sm:line-clamp-none">
                                        Exquisitely sculpted pure Makrana white marble sanctified for temple altars and prestigious home spaces.
                                    </p>
                                    <div className="mt-2.5 sm:mt-5">
                                        <button
                                            type="button"
                                            className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#F7C600] text-[#161616] text-[11px] min-[360px]:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg tap-target-44"
                                        >
                                            <span>SHOP NEW ARRIVALS</span>
                                            <ArrowRight className="w-4 h-4 text-[#161616]" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Slide Controls (Hidden on mobile to prevent blocking headline text) */}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveHeroSlide(prev => (prev === 0 ? 2 : prev - 1)); }}
                                className="hidden sm:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md items-center justify-center transition shadow-xl opacity-80 sm:opacity-0 sm:group-hover:opacity-90 hover:scale-105 border border-white/20"
                                aria-label="Previous hero slide"
                            >
                                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveHeroSlide(prev => (prev + 1) % 3); }}
                                className="hidden sm:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md items-center justify-center transition shadow-xl opacity-80 sm:opacity-0 sm:group-hover:opacity-90 hover:scale-105 border border-white/20"
                                aria-label="Next hero slide"
                            >
                                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full shadow-lg border border-white/20">
                                <button
                                    type="button"
                                    onClick={() => setActiveHeroSlide(0)}
                                    className="min-w-[40px] min-h-[40px] flex items-center justify-center tap-target-48"
                                    aria-label="Slide 1: Featured Showcase"
                                >
                                    <span className={`h-2 rounded-full transition-all duration-300 ${activeHeroSlide === 0 ? 'w-7 sm:w-8 bg-[#F7C600]' : 'w-2 bg-white/50'}`}></span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveHeroSlide(1)}
                                    className="min-w-[40px] min-h-[40px] flex items-center justify-center tap-target-48"
                                    aria-label="Slide 2: Showroom Walkthrough"
                                >
                                    <span className={`h-2 rounded-full transition-all duration-300 ${activeHeroSlide === 1 ? 'w-7 sm:w-8 bg-[#F7C600]' : 'w-2 bg-white/50'}`}></span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveHeroSlide(2)}
                                    className="min-w-[40px] min-h-[40px] flex items-center justify-center tap-target-48"
                                    aria-label="Slide 3: New Arrivals"
                                >
                                    <span className={`h-2 rounded-full transition-all duration-300 ${activeHeroSlide === 2 ? 'w-7 sm:w-8 bg-[#F7C600]' : 'w-2 bg-white/50'}`}></span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ================= 5. WHY AMOL MARBLE MURTI BHANDAR ================= */}
                    <section id="why-section" className="bg-why-murtihub py-5 sm:py-12 border-y border-[#E2C88B] reveal-section is-visible">
                        <div className="max-w-5xl mx-auto px-4 text-center">
                            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-9">
                                <span className="why-divider-line h-[1px] w-6 sm:w-32 bg-gradient-to-r from-transparent to-[#B88921]"></span>
                                <span className="text-[#B88921] text-xs">✦</span>
                                <h2 className="font-serif text-base sm:text-2xl md:text-[30px] font-semibold text-[#1E1912] px-1 sm:px-2">Why Amol Marble Murti Bhandar</h2>
                                <span className="text-[#B88921] text-xs">✦</span>
                                <span className="why-divider-line h-[1px] w-6 sm:w-32 bg-gradient-to-l from-transparent to-[#B88921]"></span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6">
                                <div className="why-pillar-card flex flex-col items-center group p-1 sm:p-2">
                                    <div className="w-10 h-11 sm:w-16 sm:h-20 gold-pedestal-icon flex items-center justify-center text-[#2B1F06] mb-1.5 sm:mb-3.5 group-hover:-translate-y-1.5 transition duration-300">
                                        <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 stroke-[1.8]" />
                                    </div>
                                    <h3 className="font-serif text-xs sm:text-lg md:text-[19px] font-semibold text-[#161616]">Hand finish</h3>
                                    <p className="text-[9.5px] sm:text-[11px] text-stone-600 mt-0.5 leading-snug">Intricate hand-painted detailing</p>
                                </div>

                                <div className="why-pillar-card flex flex-col items-center group p-1 sm:p-2">
                                    <div className="w-10 h-11 sm:w-16 sm:h-20 gold-pedestal-icon flex items-center justify-center text-[#2B1F06] mb-1.5 sm:mb-3.5 group-hover:-translate-y-1.5 transition duration-300">
                                        <Gift className="w-5 h-5 sm:w-7 sm:h-7 stroke-[1.8]" />
                                    </div>
                                    <h3 className="font-serif text-xs sm:text-lg md:text-[19px] font-semibold text-[#161616]">Perfect for gifting</h3>
                                    <p className="text-[9.5px] sm:text-[11px] text-stone-600 mt-0.5 leading-snug">Comes in velvet gift packaging</p>
                                </div>

                                <div className="why-pillar-card flex flex-col items-center group p-1 sm:p-2">
                                    <div className="w-10 h-11 sm:w-16 sm:h-20 gold-pedestal-icon flex items-center justify-center text-[#2B1F06] mb-1.5 sm:mb-3.5 group-hover:-translate-y-1.5 transition duration-300">
                                        <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 stroke-[1.8]" />
                                    </div>
                                    <h3 className="font-serif text-xs sm:text-lg md:text-[19px] font-semibold text-[#161616]">Premium quality</h3>
                                    <p className="text-[9.5px] sm:text-[11px] text-stone-600 mt-0.5 leading-snug">Pure Makrana marble & lasting finish</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ================= 6. MOST LOVED IDOLS CAROUSEL ================= */}
                    <section id="most-loved-section" className="bg-jaali-gold py-7 sm:py-14 relative reveal-section is-visible">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
                            <div className="section-header-reveal flex items-center justify-center gap-2.5 mb-5 sm:mb-6">
                                <span className="h-[1px] w-16 sm:w-36 bg-gradient-to-r from-transparent to-[#C69722]"></span>
                                <span className="text-[#C69722] text-xs">•</span>
                                <h2 className="font-serif text-2xl sm:text-[40px] font-semibold text-[#161616] px-2">
                                    Featured <span className="text-[#C69722]">Idols</span>
                                </h2>
                                <span className="text-[#C69722] text-xs">•</span>
                                <span className="h-[1px] w-16 sm:w-36 bg-gradient-to-l from-transparent to-[#C69722]"></span>
                            </div>

                            {/* Reference-Layout "Featured" Category Tabs */}
                            <div className="flex items-center justify-start sm:justify-center gap-2 mb-6 sm:mb-8 overflow-x-auto no-scrollbar py-1 px-1 sm:px-0">
                                <button
                                    onClick={() => { setActiveDeityFilter(null); setFilterPlacement('all'); }}
                                    className="px-4 py-2 rounded-full bg-[#161616] text-[#F7C600] text-xs font-bold uppercase tracking-wider shadow-xs tap-target-48 flex items-center gap-1.5 shrink-0"
                                >
                                    <span>★ All Featured</span>
                                </button>
                                <button
                                    onClick={() => { setActiveDeityFilter(null); setFilterPlacement('mandir'); navigateTo('shop-all'); }}
                                    className="px-4 py-2 rounded-full bg-white hover:bg-stone-50 text-stone-700 hover:text-black border border-stone-200 text-xs font-semibold uppercase tracking-wider tap-target-48 shrink-0 transition"
                                >
                                    <span>Home Mandir</span>
                                </button>
                                <button
                                    onClick={() => navigateTo('navratri')}
                                    className="px-4 py-2 rounded-full bg-white hover:bg-stone-50 text-stone-700 hover:text-black border border-stone-200 text-xs font-semibold uppercase tracking-wider tap-target-48 shrink-0 transition"
                                >
                                    <span>Festive & New</span>
                                </button>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => scrollTrack('most-loved-track', -320)}
                                    className="hidden sm:flex absolute -left-4 top-[36%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-xl border border-stone-200 items-center justify-center hover:scale-110 transition text-stone-800"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                <div id="most-loved-track" className="continuous-marquee-track flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar pb-3 sm:pb-4 px-1 sm:px-2">
                                    {[...catalog.slice(0, 6), ...catalog.slice(0, 6), ...catalog.slice(0, 6)].map((p, idx) => (
                                        <div key={`${p.id}-${idx}`} className="w-[230px] sm:w-[272px] flex-shrink-0 flex flex-col justify-between group bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition">
                                            <div>
                                                <div 
                                                    onClick={() => openProductPage(p)}
                                                    className="relative rounded-xl overflow-hidden aspect-square sm:aspect-[3/4] bg-[#FDFBF5] mb-2.5 sm:mb-3 border border-stone-100 cursor-pointer"
                                                >
                                                    <img src={p.img} alt={p.title} className="w-full h-full object-contain p-2 img-studio-contrast group-hover:scale-105 transition duration-300 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]" loading="lazy" />
                                                    <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-[#161616]/90 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#F7C600]"></span> Most Loved
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleWishlist(p.id, e)}
                                                        className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition shadow-md z-10 tap-target-44 ${
                                                            wishlist.includes(p.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-stone-600 hover:text-red-500 hover:scale-110'
                                                        }`}
                                                        aria-label={wishlist.includes(p.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                                    >
                                                        <Heart className={`w-4 h-4 ${wishlist.includes(p.id) ? 'fill-current' : ''}`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between text-[9.5px] sm:text-[10px] font-bold tracking-widest uppercase text-[#9E781E] mb-1 sm:mb-1.5">
                                                    <span className="truncate max-w-[120px] sm:max-w-none">{p.deity ? `${p.deity}` : 'Sacred Idol'}</span>
                                                    <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold shrink-0">
                                                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> 4.9
                                                    </span>
                                                </div>

                                                <h3 
                                                    onClick={() => openProductPage(p)}
                                                    className="text-xs sm:text-sm font-semibold text-[#181411] line-clamp-2 leading-snug cursor-pointer group-hover:text-[#C69722] transition-colors min-h-[36px] sm:min-h-[40px]"
                                                >
                                                    {p.title}
                                                </h3>

                                                <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2.5 mb-2 sm:mb-3 flex-wrap">
                                                    <span className="font-serif text-base sm:text-2xl font-bold text-[#161616]">₹{p.price.toLocaleString('en-IN')}</span>
                                                    {p.oldPrice && (
                                                        <span className="text-xs text-stone-400 line-through">₹{p.oldPrice.toLocaleString('en-IN')}</span>
                                                    )}
                                                    {p.off && (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-bold tracking-wide border border-emerald-200/50">
                                                            {p.off}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-auto pt-2.5 border-t border-stone-100">
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(p)}
                                                    className="w-full min-h-[40px] sm:min-h-[42px] py-2 px-1 rounded-xl bg-[#161616] hover:bg-[#C69722] text-[#F7C600] hover:text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-1 active:scale-95 shadow-2xs tap-target-44"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">ADD TO CART</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => buyOnWhatsApp(p)}
                                                    className="w-full min-h-[40px] sm:min-h-[42px] py-2 px-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] hover:from-[#C69722] hover:to-[#B3810E] text-[#161616] text-[10px] sm:text-[11px] font-black uppercase transition-all duration-150 shadow-2xs flex items-center justify-center active:scale-95 tap-target-44"
                                                    title="Inquire on WhatsApp"
                                                >
                                                    <span className="truncate">BUY NOW</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => scrollTrack('most-loved-track', 320)}
                                    className="hidden sm:flex absolute -right-4 top-[36%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-xl border border-stone-200 items-center justify-center hover:scale-110 transition text-stone-800"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="text-center mt-9">
                                <button
                                    type="button"
                                    onClick={() => navigateTo('shop-all')}
                                    className="min-h-[48px] px-8 py-3.5 rounded-xl border border-stone-800 text-xs font-bold tracking-[0.2em] uppercase text-[#161616] bg-white/70 hover:bg-[#161616] hover:text-white transition shadow-sm tap-target-48 active:scale-95 inline-flex items-center justify-center"
                                >
                                    VIEW ALL IDOLS
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ================= 7. FESTIVE EDIT: NAVRATRI COLLECTION (MOBILE-FIRST REDESIGN) ================= */}
                    <section id="navratri-section" className="bg-jaali-ivory py-4 sm:py-14 border-y border-[#EAE0CA] reveal-section is-visible">
                        <div className="max-w-[1440px] mx-auto px-3 sm:px-8">
                            <div className="section-header-reveal grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-stretch">
                                
                                {/* Left / Top Festive Announcement Card */}
                                <div className="lg:col-span-3 xl:col-span-3 bg-gradient-to-br from-[#FFF9EE] via-[#FDF7E7] to-[#F5E8C7] rounded-xl sm:rounded-[26px] p-3 sm:p-6 lg:p-7 border border-[#E2CAA0] shadow-2xs flex flex-col justify-between relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-1.5 sm:mb-3.5">
                                            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold tracking-[0.22em] uppercase text-[#9E781E]">
                                                <span>✦</span> <span>FESTIVE EDIT</span>
                                            </div>
                                            <span className="text-[9.5px] sm:text-[11px] font-bold text-[#8E5B00] bg-[#FAF2DE] px-2 py-0.5 rounded-full border border-[#DFC48D] shadow-2xs">
                                                Navratri 2026 Special
                                            </span>
                                        </div>

                                        <h2 className="font-serif text-lg min-[360px]:text-xl sm:text-3xl lg:text-[40px] font-normal text-[#161616] leading-[1.15]">
                                            Navratri<br className="hidden sm:inline" /> Collection
                                        </h2>

                                        <p className="text-[11px] sm:text-xs text-stone-600 mt-1.5 sm:mt-3 leading-relaxed">
                                            A Meaningful Gift. A Blessing That Stays. Consecrated Sherawali Maa Durga, Lakshmi & Parvati in pristine white Makrana marble with 24K gold foil detailing.
                                        </p>

                                        {/* Sacred Quality Trust Points */}
                                        <div className="mt-2.5 sm:mt-4 flex flex-wrap gap-x-3 gap-y-1 sm:block sm:space-y-1.5 text-[10px] sm:text-[11px] text-stone-700 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[#C69722] text-xs">✓</span>
                                                <span>Pran Pratishtha Ready</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[#C69722] text-xs">✓</span>
                                                <span>24K Pure Gold Detailing</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[#C69722] text-xs">✓</span>
                                                <span>Zero-Breakage Guarantee</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile & Desktop Action Row */}
                                    <div className="mt-3 sm:mt-6 pt-2 sm:pt-3 border-t border-[#E8DEC8]/80 flex items-center justify-between gap-2 relative z-10">
                                        <button
                                            type="button"
                                            onClick={() => navigateTo('navratri')}
                                            className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-[#F7C600] hover:bg-[#E0B200] text-[#161616] font-bold text-[11px] sm:text-xs tracking-wider uppercase transition shadow-sm active:scale-95 flex items-center gap-1.5 tap-target-44"
                                        >
                                            <span>SHOP GIFTS</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Mobile Swipe Navigation Controls */}
                                        <div className="lg:hidden flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => scrollTrack('festive-track', -250)}
                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF2DE] hover:bg-[#F3EAD3] border border-[#DFC48D] text-stone-800 flex items-center justify-center transition shadow-2xs active:scale-95 tap-target-44"
                                                aria-label="Scroll left"
                                                title="Scroll left"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => scrollTrack('festive-track', 250)}
                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF2DE] hover:bg-[#F3EAD3] border border-[#DFC48D] text-stone-800 flex items-center justify-center transition shadow-2xs active:scale-95 tap-target-44"
                                                aria-label="Scroll right"
                                                title="Scroll right"
                                            >
                                                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right / Main Product Showcase Carousel (All 4 Festive Idols - Horizontal on Mobile/Tablet, 4-Col Grid on Desktop) */}
                                <div className="lg:col-span-9 xl:col-span-9 flex flex-col justify-between relative">
                                    {/* Floating Navigation Arrows */}
                                    <button
                                        type="button"
                                        onClick={() => scrollTrack('festive-track', -280)}
                                        className="hidden sm:flex absolute -left-3 top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-xl border border-[#DFC48D] items-center justify-center hover:scale-110 transition text-stone-800"
                                        aria-label="Previous festive idols"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => scrollTrack('festive-track', 280)}
                                        className="hidden sm:flex absolute -right-3 top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-xl border border-[#DFC48D] items-center justify-center hover:scale-110 transition text-stone-800"
                                        aria-label="Next festive idols"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    <div
                                        id="festive-track"
                                        className="continuous-marquee-track flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto no-scrollbar pb-3 sm:pb-4 px-1"
                                    >
                                        {[...catalog.slice(6, 10), ...catalog.slice(6, 10), ...catalog.slice(6, 10)].map((p, idx) => (
                                            <div
                                                key={`${p.id}-${idx}`}
                                                className="w-[230px] sm:w-[260px] lg:w-[270px] flex-shrink-0 bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-xl hover:border-[#D4AF37]/60 transition-all duration-300 flex flex-col justify-between group p-3 sm:p-4"
                                            >
                                                <div>
                                                    {/* Full-Height Portrait Deity Image Container */}
                                                    <div 
                                                        onClick={() => openProductPage(p)}
                                                        className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-square sm:aspect-[3/4] mb-2.5 sm:mb-3 bg-gradient-to-b from-[#FAF5E8] to-[#F3EAD3] border border-stone-100 cursor-pointer"
                                                    >
                                                        <img
                                                            src={p.img}
                                                            alt={p.title}
                                                            className="w-full h-full object-contain p-2 sm:p-3 img-studio-contrast group-hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.08)]"
                                                            loading="lazy"
                                                        />
                                                        
                                                        {/* Discount Pill with Golden Dot */}
                                                        {p.off && (
                                                            <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-[#161616]/95 backdrop-blur-xs text-[#F7C600] text-[9px] sm:text-[11px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md flex items-center gap-1 sm:gap-1.5 z-10">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#F7C600]"></span>
                                                                {p.off.toUpperCase()}
                                                            </span>
                                                        )}

                                                        {/* Circular Wishlist Button */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => toggleWishlist(p.id, e)}
                                                            className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-md z-10 tap-target-44 ${
                                                                wishlist.includes(p.id)
                                                                    ? 'bg-rose-50 text-rose-500 scale-105'
                                                                    : 'bg-white/95 text-stone-700 hover:text-rose-500 hover:scale-110'
                                                            }`}
                                                            aria-label={wishlist.includes(p.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                                        >
                                                            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${wishlist.includes(p.id) ? 'fill-current text-rose-500' : ''}`} />
                                                        </button>
                                                    </div>

                                                    {/* Category & Star Rating Row */}
                                                    <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-bold tracking-widest uppercase text-[#9E781E] mb-1 sm:mb-1.5">
                                                        <span className="truncate max-w-[110px] sm:max-w-none">{p.deity ? `${p.deity.toUpperCase()} MURTI` : 'SACRED IDOL'}</span>
                                                        <span className="flex items-center gap-0.5 sm:gap-1 text-[#8E5B00] bg-[#FAF2DE] border border-[#DFC48D]/70 px-1.5 py-0.5 rounded text-[9px] sm:text-[11px] font-bold shrink-0">
                                                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-500" /> 4.9
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 
                                                        onClick={() => openProductPage(p)}
                                                        className="text-xs sm:text-sm font-semibold text-[#181411] line-clamp-2 leading-snug cursor-pointer group-hover:text-[#C69722] transition-colors min-h-[36px] sm:min-h-[40px]"
                                                    >
                                                        {p.title}
                                                    </h3>

                                                    {/* Price Row with Strikethrough & Savings Tag */}
                                                    <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2.5 mb-2 sm:mb-3 flex-wrap">
                                                        <span className="font-serif font-bold text-base sm:text-xl text-[#161616]">
                                                            ₹{p.price.toLocaleString('en-IN')}
                                                        </span>
                                                        {p.oldPrice && (
                                                            <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                                                                ₹{p.oldPrice.toLocaleString('en-IN')}
                                                            </span>
                                                        )}
                                                        {p.off && (
                                                            <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-[#E8F8F0] text-[#1B8053] text-[8.5px] sm:text-[10px] font-bold tracking-wide border border-[#BDE8D3]">
                                                                {p.off}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons: Add to Cart & Buy Now */}
                                                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-auto pt-2 sm:pt-2.5 border-t border-stone-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => addToCart(p)}
                                                        className="w-full min-h-[38px] sm:min-h-[42px] py-1.5 sm:py-2 px-1 rounded-xl bg-[#161616] hover:bg-[#C69722] text-[#F7C600] hover:text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-1 active:scale-95 shadow-2xs tap-target-44"
                                                    >
                                                        <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">ADD TO CART</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => buyOnWhatsApp(p)}
                                                        className="w-full min-h-[38px] sm:min-h-[42px] py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] hover:from-[#C69722] hover:to-[#B3810E] text-[#161616] text-[10px] sm:text-[11px] font-black uppercase transition-all duration-150 shadow-2xs flex items-center justify-center active:scale-95 tap-target-44"
                                                        title="Inquire on WhatsApp"
                                                    >
                                                        <span className="truncate">BUY NOW</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom View All Link */}
                                    <div className="text-center mt-5 sm:mt-7">
                                        <button
                                            type="button"
                                            onClick={() => navigateTo('navratri')}
                                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8E5B00] hover:text-black transition group py-1"
                                        >
                                            <span>Explore All 8 Navratri Festive Idols</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section>

                    {/* ================= 8. FULL-BLEED DARK OVERLAY CAROUSEL ================= */}
                    <section id="dark-overlay-section" className="bg-[#121212] py-12 reveal-section is-visible">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 relative">
                            <div className="flex items-center justify-between mb-6 px-1">
                                <div>
                                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F7C600]">✦ SACRED HIGHLIGHTS ✦</span>
                                    <h3 className="font-serif text-2xl sm:text-3xl text-white mt-1">Sacred Altar Idols</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => scrollTrack('dark-overlay-track', -300)}
                                        className="w-9 h-9 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-[#F7C600] hover:text-black transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => scrollTrack('dark-overlay-track', 300)}
                                        className="w-9 h-9 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-[#F7C600] hover:text-black transition"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div id="dark-overlay-track" className="continuous-marquee-track flex gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar pb-2">
                                {[...overlayCards, ...overlayCards, ...overlayCards].map((c, idx) => (
                                    <div key={`${c.id}-${idx}`} className="w-[180px] sm:w-[220px] flex-shrink-0 rounded-2xl overflow-hidden relative group shadow-lg flex flex-col justify-end h-[270px] sm:h-[310px] bg-stone-900 border border-stone-800">
                                        <div 
                                            onClick={() => openProductPage(c)}
                                            className="absolute inset-0 cursor-pointer"
                                        >
                                            <img src={c.img} alt={c.title} className="w-full h-full object-cover img-studio-contrast group-hover:scale-105 transition duration-300" loading="lazy" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => toggleWishlist(c.id, e)}
                                            className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition shadow-md z-20 tap-target-44 ${
                                                wishlist.includes(c.id) ? 'bg-red-50 text-red-500' : 'bg-black/60 text-white hover:text-red-400'
                                            }`}
                                            aria-label={wishlist.includes(c.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                        >
                                            <Heart className={`w-4 h-4 ${wishlist.includes(c.id) ? 'fill-current' : ''}`} />
                                        </button>
                                        <div 
                                            onClick={() => openProductPage(c)}
                                            className="relative z-10 p-3 sm:p-3.5 text-white cursor-pointer"
                                        >
                                            <h4 className="text-xs sm:text-[11px] font-semibold leading-snug line-clamp-2 hover:text-[#F7C600] transition">{c.title}</h4>
                                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 text-xs">
                                                <span className="font-bold text-[#F7C600]">{c.price}</span>
                                                <span className="text-stone-400 line-through text-[10px]">{c.old}</span>
                                            </div>
                                        </div>
                                        <div className="relative z-10 grid grid-cols-2 divide-x divide-white/10 bg-[#181818] border-t border-white/10">
                                            <button
                                                type="button"
                                                onClick={() => addToCart(c)}
                                                className="w-full text-white hover:text-[#F7C600] text-[10px] sm:text-xs font-semibold min-h-[38px] sm:min-h-[42px] py-2 px-1 transition tap-target-44 active:scale-95 flex items-center justify-center gap-1"
                                            >
                                                <ShoppingCart className="w-3 h-3 shrink-0" />
                                                <span className="truncate">Add to Cart</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => buyOnWhatsApp(c)}
                                                className="w-full text-[#F7C600] hover:text-white text-[10px] sm:text-xs font-semibold min-h-[38px] sm:min-h-[42px] py-2 px-1 transition tap-target-44 active:scale-95 flex items-center justify-center gap-1"
                                                title="Inquire on WhatsApp"
                                            >
                                                <span className="truncate">Buy Now</span>
                                                <ArrowRight className="w-3 h-3 shrink-0" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ================= 9. ART THAT BRINGS DIVINITY HOME ================= */}
                    <section id="divinity-section" className="bg-jaali-ivory py-8 sm:py-16 reveal-section is-visible">
                        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-6 sm:gap-10 items-center">
                            <div className="lg:col-span-6 grid grid-cols-2 gap-2.5 sm:gap-4">
                                <div className="editorial-img-card rounded-2xl sm:rounded-[24px] overflow-hidden h-[220px] min-[400px]:h-[260px] sm:h-[460px] shadow-lg bg-stone-900 group">
                                    <img src="/images/editorial/durga-feature.png" alt="Hand-Painted Durga" className="w-full h-full object-cover img-studio-contrast" />
                                </div>
                                <div className="editorial-img-card rounded-2xl sm:rounded-[24px] overflow-hidden h-[220px] min-[400px]:h-[260px] sm:h-[460px] shadow-lg bg-stone-900 group">
                                    <img src="/images/editorial/hanuman-feature.png" alt="Veer Hanuman Sanjeevani" className="w-full h-full object-cover img-studio-contrast" />
                                </div>
                            </div>

                            <div className="divinity-text-content lg:col-span-6 space-y-3 sm:space-y-5">
                                <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-[#9E781E] font-semibold">
                                    <span>───•</span> <span>ART THAT BRINGS DIVINITY HOME</span>
                                </div>

                                <h2 className="font-serif text-2xl min-[400px]:text-3xl sm:text-4xl lg:text-[52px] text-[#161616] leading-[1.1]">
                                    Every Detail,<br />
                                    <span className="italic text-[#C69722] font-normal">Painted With Devotion.</span>
                                </h2>

                                <p className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-stone-500 font-semibold pt-0.5 sm:pt-1">
                                    A PIECE OF TIMELESS ART.
                                </p>

                                <p className="text-[11.5px] sm:text-sm text-stone-600 leading-relaxed max-w-lg">
                                    Every murti in our Jaipur studio is meticulously hand-sculpted and finished by master artisans. From 24K gold foil embellishments to serene facial expressions, our idols transform everyday surroundings into sacred sanctuaries.
                                </p>

                                <p className="text-[10.5px] sm:text-xs text-stone-500 font-medium">
                                    Makrana Marble • Hand-Finished • Sanctified
                                </p>

                                <div className="pt-1 sm:pt-2">
                                    <button
                                        onClick={() => navigateTo('sacred')}
                                        className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] uppercase border-b-2 border-[#161616] pb-1 hover:text-[#C69722] hover:border-[#C69722] transition"
                                    >
                                        EXPLORE HAND-PAINTED MURTIS <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-stone-200/90 max-w-md">
                                    <div>
                                        <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#B88921] font-semibold">
                                            <span className="stat-counter-number" data-target="50" data-suffix="+">50+</span>
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-stone-500 mt-0.5 sm:mt-1">DESIGNS</p>
                                    </div>
                                    <div>
                                        <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#B88921] font-semibold">
                                            <span className="stat-counter-number" data-target="100" data-suffix="%">100%</span>
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-stone-500 mt-0.5 sm:mt-1">MADE BY HAND</p>
                                    </div>
                                    <div>
                                        <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#B88921] font-semibold">
                                            <span className="stat-counter-number" data-target="2" data-suffix="L+">2L+</span>
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-stone-500 mt-0.5 sm:mt-1">HOMES SERVED</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ================= 10. OUR PROCESS — BENTO GRID ================= */}
                    <section id="bento-process-section" className="bg-jaali-gold py-8 sm:py-16 border-y border-[#E6D6B8] reveal-section is-visible">
                        <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
                            <div className="text-center mb-7 sm:mb-12 section-header-reveal">
                                <div className="flex items-center justify-center gap-2 text-[10px] tracking-[0.24em] uppercase text-[#9E781E] font-semibold mb-2">
                                    <span>───✦</span> <span>• OUR SACRED PROCESS •</span> <span>✦───</span>
                                </div>
                                <h2 className="font-serif text-2xl min-[400px]:text-3xl sm:text-4xl lg:text-5xl text-[#161616]">Where Faith Finds Form.</h2>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                                <div className="bento-process-card bg-white rounded-2xl p-4 sm:p-8 border border-[#E6D6B8]/80 shadow-xs space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-2.5 sm:gap-3.5 border-b border-stone-200 pb-2.5 sm:pb-3">
                                        <span className="font-serif text-2xl sm:text-4xl text-[#C69722] font-normal">01</span>
                                        <div className="border-l border-stone-200 pl-2.5 sm:pl-3.5">
                                            <h3 className="font-serif text-base sm:text-xl font-semibold text-[#161616] leading-tight">Traditional<br />Design</h3>
                                            <p className="text-[8px] sm:text-[9px] tracking-[0.16em] uppercase text-stone-400 mt-0.5 sm:mt-1">CONCEPT & CRAFTSMANSHIP</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                                        Every Murti begins with sacred Shilpa Shastra proportions, inspired by ancient Indian temple art.
                                    </p>
                                </div>

                                <div className="bento-process-card bg-white rounded-2xl p-4 sm:p-8 border border-[#E6D6B8]/80 shadow-xs space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-2.5 sm:gap-3.5 border-b border-stone-200 pb-2.5 sm:pb-3">
                                        <span className="font-serif text-2xl sm:text-4xl text-[#C69722] font-normal">02</span>
                                        <div className="border-l border-stone-200 pl-2.5 sm:pl-3.5">
                                            <h3 className="font-serif text-base sm:text-xl font-semibold text-[#161616] leading-tight">Premium<br />Materials</h3>
                                            <p className="text-[8px] sm:text-[9px] tracking-[0.16em] uppercase text-stone-400 mt-0.5 sm:mt-1">QUALITY & DURABILITY</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                                        Pure white Makrana marble and heavy virgin brass — lustrous, chip-resistant, consecrated for generations.
                                    </p>
                                </div>

                                <div className="bento-process-card bg-white rounded-2xl p-4 sm:p-8 border border-[#E6D6B8]/80 shadow-xs space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-2.5 sm:gap-3.5 border-b border-stone-200 pb-2.5 sm:pb-3">
                                        <span className="font-serif text-2xl sm:text-4xl text-[#C69722] font-normal">03</span>
                                        <div className="border-l border-stone-200 pl-2.5 sm:pl-3.5">
                                            <h3 className="font-serif text-base sm:text-xl font-semibold text-[#161616] leading-tight">Expert<br />Craftsmanship</h3>
                                            <p className="text-[8px] sm:text-[9px] tracking-[0.16em] uppercase text-stone-400 mt-0.5 sm:mt-1">MADE WITH PRECISION</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                                        Generational sculptors carve every contour, weapon, crown, and sacred posture with chisel and mallet.
                                    </p>
                                </div>

                                <div className="bento-process-card bg-white rounded-2xl p-4 sm:p-8 border border-[#E6D6B8]/80 shadow-xs space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-2.5 sm:gap-3.5 border-b border-stone-200 pb-2.5 sm:pb-3">
                                        <span className="font-serif text-2xl sm:text-4xl text-[#C69722] font-normal">04</span>
                                        <div className="border-l border-stone-200 pl-2.5 sm:pl-3.5">
                                            <h3 className="font-serif text-base sm:text-xl font-semibold text-[#161616] leading-tight">Hand-Finished<br />with Care</h3>
                                            <p className="text-[8px] sm:text-[9px] tracking-[0.16em] uppercase text-stone-400 mt-0.5 sm:mt-1">DETAILING & FINISHING</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                                        From real gold-work to the compassionate gaze painted in each deity's eyes.
                                    </p>
                                </div>

                                <div className="bento-process-card bg-white rounded-2xl p-4 sm:p-8 border border-[#E6D6B8]/80 shadow-xs space-y-2.5 sm:space-y-4 lg:col-span-2">
                                    <div className="flex items-center gap-3 sm:gap-4 border-b border-stone-200 pb-2.5 sm:pb-3">
                                        <span className="font-serif text-2xl sm:text-4xl text-[#C69722] font-normal">05</span>
                                        <div className="border-l border-stone-200 pl-3 sm:pl-4">
                                            <h3 className="font-serif text-base sm:text-xl font-semibold text-[#161616]">Ready for Your Space</h3>
                                            <p className="text-[8px] sm:text-[9px] tracking-[0.16em] uppercase text-stone-400 mt-0.5">BLESSED & BEAUTIFUL</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                                        Cushioned in custom impact-proof foam and elegant red velvet boxes, each murti is cleansed and prepared for immediate placement.
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2.5 pt-0.5 sm:pt-1">
                                        <span className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#FAF5E8] text-[10px] sm:text-[11px] font-medium text-stone-700 border border-[#E6D6B8]">• Quality Tested</span>
                                        <span className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#FAF5E8] text-[10px] sm:text-[11px] font-medium text-stone-700 border border-[#E6D6B8]">• Handmade</span>
                                        <span className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#FAF5E8] text-[10px] sm:text-[11px] font-medium text-stone-700 border border-[#E6D6B8]">• Safe Transit</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ================= 11. CORPORATE & BULK GIFTING ================= */}
                    <section id="corporate-gifting" className="bg-jaali-ivory py-8 sm:py-16 reveal-section is-visible">
                        <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
                                <div className="space-y-2 sm:space-y-3 max-w-xl corp-header-reveal">
                                    <h2 className="font-serif text-2xl min-[400px]:text-3xl sm:text-4xl lg:text-5xl text-[#161616]">Corporate & Bulk Gifting</h2>
                                    <p className="font-serif italic text-base sm:text-xl lg:text-2xl text-[#B88921]">Meaningful gifts. Crafted for your people.</p>
                                    <p className="text-[11.5px] sm:text-sm text-stone-500 leading-relaxed pt-0.5 sm:pt-1">
                                        Celebrate Diwali, milestone anniversaries, team recognitions, and client onboarding with sacred idols and custom-engraved brass pedestals.
                                    </p>
                                    <div className="flex flex-col min-[400px]:flex-row gap-2.5 sm:gap-3 pt-2 sm:pt-3">
                                        <button
                                            onClick={() => setIsBulkQuoteOpen(true)}
                                            className="w-full min-[400px]:w-auto min-h-[44px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#C69722] hover:bg-[#A67B14] text-white text-[11px] font-bold tracking-wider uppercase transition shadow-xs tap-target-48 active:scale-95 text-center"
                                        >
                                            GET A BULK QUOTE
                                        </button>
                                        <button
                                            onClick={() => navigateTo('navratri')}
                                            className="w-full min-[400px]:w-auto min-h-[44px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-stone-300 hover:border-[#161616] text-stone-700 text-[11px] font-semibold tracking-wider uppercase transition bg-white tap-target-48 active:scale-95 text-center"
                                        >
                                            EXPLORE CORPORATE GIFTS
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-1 sm:mt-0">
                                    <span className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#2B2927] text-white text-[11px] sm:text-xs font-medium shadow-xs">
                                        <span className="w-4 h-4 rounded-full bg-[#C69722]/30 text-[#F7C600] flex items-center justify-center text-[10px]">✓</span>
                                        Trusted by 500+ Indian Businesses
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 sm:mt-10 p-3.5 sm:p-5 rounded-2xl border border-[#E6D6B8] bg-[#FAF5E8]/60 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                                <div className="corp-benefit-card bg-white p-3 sm:p-4 rounded-xl border border-stone-200/80 flex items-start gap-2.5 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 rounded-lg bg-[#FAF5E8] text-[#B88921] flex-shrink-0"><Tag className="w-4 h-4" /></div>
                                    <div className="min-w-0">
                                        <h4 className="font-serif font-semibold text-sm sm:text-base text-[#161616]">Bulk Pricing</h4>
                                        <p className="text-[10px] sm:text-[11px] text-stone-500">Tiered pricing for corporate orders</p>
                                    </div>
                                </div>
                                <div className="corp-benefit-card bg-white p-3 sm:p-4 rounded-xl border border-stone-200/80 flex items-start gap-2.5 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 rounded-lg bg-[#FAF5E8] text-[#B88921] flex-shrink-0"><Sparkles className="w-4 h-4" /></div>
                                    <div className="min-w-0">
                                        <h4 className="font-serif font-semibold text-sm sm:text-base text-[#161616]">Personalized</h4>
                                        <p className="text-[10px] sm:text-[11px] text-stone-500">Logo, plaques & custom packaging</p>
                                    </div>
                                </div>
                                <div className="corp-benefit-card bg-white p-3 sm:p-4 rounded-xl border border-stone-200/80 flex items-start gap-2.5 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 rounded-lg bg-[#FAF5E8] text-[#B88921] flex-shrink-0"><Truck className="w-4 h-4" /></div>
                                    <div className="min-w-0">
                                        <h4 className="font-serif font-semibold text-sm sm:text-base text-[#161616]">Pan-India</h4>
                                        <p className="text-[10px] sm:text-[11px] text-stone-500">Express delivery 1,000+ cities</p>
                                    </div>
                                </div>
                                <div className="corp-benefit-card bg-white p-3 sm:p-4 rounded-xl border border-stone-200/80 flex items-start gap-2.5 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 rounded-lg bg-[#FAF5E8] text-[#B88921] flex-shrink-0"><PackageCheck className="w-4 h-4" /></div>
                                    <div className="min-w-0">
                                        <h4 className="font-serif font-semibold text-sm sm:text-base text-[#161616]">Gift-Ready</h4>
                                        <p className="text-[10px] sm:text-[11px] text-stone-500">Velvet-lined gift boxes included</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ================= 14. FREQUENTLY ASKED QUESTIONS ================= */}
                    <section id="faq-section" className="bg-white py-8 sm:py-14 border-t border-stone-100 reveal-section is-visible">
                        <div className="max-w-2xl mx-auto px-4 sm:px-6">
                            <div className="text-center mb-6 sm:mb-10">
                                <p className="text-[11px] sm:text-xs text-stone-500 mb-1">Need help with your order?</p>
                                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#161616]">Frequently Asked Questions</h2>
                            </div>

                            <h3 className="font-serif text-base sm:text-xl text-stone-700 mb-3 sm:mb-4">Orders, Shipping & Consecration</h3>

                            <div className="divide-y divide-stone-200 border-y border-stone-200">
                                {faqs.map((faq, idx) => (
                                    <details key={idx} className="faq-row-item group py-3 sm:py-4">
                                        <summary className="flex items-center justify-between cursor-pointer text-[12px] sm:text-sm font-medium text-stone-800 list-none gap-3">
                                            <span className="flex-1">{faq.question}</span>
                                            <span className="text-lg font-light group-open:rotate-45 transition-transform flex-shrink-0 w-6 h-6 flex items-center justify-center">+</span>
                                        </summary>
                                        <p className="text-[11px] sm:text-xs text-stone-500 mt-2.5 sm:mt-3 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ================= 14B. 3 TRUST SERVICE BLOCKS (REFERENCE LAYOUT ARRANGEMENT) ================= */}
                    <section id="trust-blocks-section" className="bg-[#FAF5E8] py-8 sm:py-12 border-t border-[#E6D6B8] reveal-section is-visible">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
                            <div className="flex sm:grid sm:grid-cols-3 gap-3.5 sm:gap-5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 px-1 sm:px-0 no-scrollbar snap-x snap-mandatory">
                                {/* Trust 1: Order Return */}
                                <div className="trust-service-card w-[82vw] min-w-[270px] max-w-[330px] sm:w-auto flex-shrink-0 snap-center p-5 sm:p-6 rounded-2xl bg-white border border-[#E6D6B8] shadow-xs hover:shadow-md transition flex flex-col justify-between group">
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center justify-center text-[#8E5B00] mb-3.5 group-hover:scale-105 transition">
                                            <RotateCcw className="w-6 h-6 stroke-[2]" />
                                        </div>
                                        <h4 className="font-serif text-lg font-bold text-[#161616]">Order Return & Transit Cover</h4>
                                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                                            100% Zero-Breakage Crating Guarantee. In the rare event of transit damage, receive a free consecrated replacement within 7 days.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setInfoModalKey('returns')}
                                        className="mt-4 text-xs font-bold text-[#8E5B00] hover:text-black uppercase tracking-wider inline-flex items-center gap-1.5 pt-2"
                                    >
                                        <span>Read Return Policy →</span>
                                    </button>
                                </div>

                                {/* Trust 2: Free Shipping */}
                                <div className="trust-service-card w-[82vw] min-w-[270px] max-w-[330px] sm:w-auto flex-shrink-0 snap-center p-5 sm:p-6 rounded-2xl bg-white border border-[#E6D6B8] shadow-xs hover:shadow-md transition flex flex-col justify-between group">
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center justify-center text-[#8E5B00] mb-3.5 group-hover:scale-105 transition">
                                            <Truck className="w-6 h-6 stroke-[2]" />
                                        </div>
                                        <h4 className="font-serif text-lg font-bold text-[#161616]">Free Insured Shipping</h4>
                                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                                            Complimentary insured express air shipping across India on all orders over ₹999 via BlueDart & India Post Express.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setInfoModalKey('shipping')}
                                        className="mt-4 text-xs font-bold text-[#8E5B00] hover:text-black uppercase tracking-wider inline-flex items-center gap-1.5 pt-2"
                                    >
                                        <span>Read Shipping Terms →</span>
                                    </button>
                                </div>

                                {/* Trust 3: COD */}
                                <div className="trust-service-card w-[82vw] min-w-[270px] max-w-[330px] sm:w-auto flex-shrink-0 snap-center p-5 sm:p-6 rounded-2xl bg-white border border-[#E6D6B8] shadow-xs hover:shadow-md transition flex flex-col justify-between group">
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center justify-center text-[#8E5B00] mb-3.5 group-hover:scale-105 transition">
                                            <Banknote className="w-6 h-6 stroke-[2]" />
                                        </div>
                                        <h4 className="font-serif text-lg font-bold text-[#161616]">Cash on Delivery (COD)</h4>
                                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                                            Shop with total peace of mind. Pay with cash upon delivery at your doorstep across 19,000+ Indian PIN codes.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setInfoModalKey('contact')}
                                        className="mt-4 text-xs font-bold text-[#8E5B00] hover:text-black uppercase tracking-wider inline-flex items-center gap-1.5 pt-2"
                                    >
                                        <span>Check Pincode Service →</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ================= 14C. JAIPUR SCULPTING ATELIER MAP & ADDRESS (REFERENCE LAYOUT ARRANGEMENT) ================= */}
                    <section id="atelier-map-section" className="bg-white py-8 sm:py-12 border-t border-[#E6D6B8] reveal-section is-visible">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
                            <div className="atelier-card bg-[#FAF5E8] rounded-2xl sm:rounded-3xl border border-[#E6D6B8] overflow-hidden shadow-sm flex flex-col md:flex-row">
                                <div className="p-5 sm:p-10 md:w-1/2 flex flex-col justify-between space-y-3 sm:space-y-4">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#8E5B00] mb-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-[#C69722]" />
                                            <span>VISIT OUR HERITAGE ATELIER</span>
                                        </div>
                                        <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#161616]">
                                            Amol Marble Murti Bhandar
                                        </h3>
                                        <p className="text-[11.5px] sm:text-sm text-stone-600 mt-1.5 sm:mt-2 leading-relaxed">
                                            Step inside our flagship artisan workshop in Jaipur, Rajasthan. Meet master sculptors and witness sacred consecration rituals in person.
                                        </p>
                                    </div>

                                    <div className="space-y-2 sm:space-y-2.5 text-[11px] sm:text-xs text-stone-700 bg-white/70 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E6D6B8]/70">
                                        <p className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8E5B00] flex-shrink-0 mt-0.5" />
                                            <span className="font-medium">Khazane Walon Ka Rasta, Chandpole Bazar, Jaipur, Rajasthan 302001</span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8E5B00] flex-shrink-0" />
                                            <span>Open Daily: 9 AM – 8:30 PM</span>
                                        </p>
                                    </div>

                                    <div className="pt-1 sm:pt-2 flex flex-col min-[400px]:flex-row gap-2 sm:gap-3">
                                        <a
                                            href="https://maps.google.com/?q=Jaipur+Marble+Murti"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="min-h-[44px] px-4 sm:px-6 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider transition inline-flex items-center justify-center gap-2 tap-target-48 active:scale-95"
                                        >
                                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F7C600]" />
                                            <span>Get Directions</span>
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setInfoModalKey('contact')}
                                            className="min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition tap-target-48 inline-flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <span>Book Visit</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Stylized Visual Map Card */}
                                <div className="md:w-1/2 bg-[#F3EAD3] min-h-[180px] sm:min-h-[300px] relative overflow-hidden flex items-center justify-center p-4 sm:p-6 border-t md:border-t-0 md:border-l border-[#E6D6B8]">
                                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#8E5B00_1px,transparent_1px)] [background-size:20px_20px]"></div>
                                    <div className="relative text-center p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-sm border border-[#E6D6B8] shadow-md max-w-sm">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FAF5E8] border border-[#C69722] mx-auto flex items-center justify-center text-[#8E5B00] mb-2 sm:mb-2.5 shadow-xs">
                                            <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <h5 className="font-serif font-bold text-[#161616] text-base sm:text-lg">Jaipur Sculpting Atelier</h5>
                                        <p className="text-[10.5px] sm:text-xs text-stone-500 mt-1">Rajasthan's Heritage Center of Makrana Marble Idols</p>
                                        <div className="mt-2.5 sm:mt-3.5 inline-block px-3 sm:px-3.5 py-1 sm:py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] sm:text-[10.5px] font-bold border border-emerald-200">
                                            ● Open for Visits Today
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* ========================================================================= */}
            {/*                     DEDICATED SEPARATE PRODUCT PAGE                       */}
            {/* ========================================================================= */}
            {currentPage === 'product' && selectedProduct && (
                <ProductDetailPage
                    product={selectedProduct}
                    onBack={handleBackFromProduct}
                    onAddToCart={addToCart}
                    onBuyNow={(prod) => buyOnWhatsApp(prod)}
                    isWishlisted={wishlist.includes(selectedProduct?.id)}
                    onToggleWishlist={toggleWishlist}
                    onSelectProduct={openProductPage}
                />
            )}

            {/* ========================================================================= */}
            {/*                           COLLECTION PAGE VIEW                            */}
            {/* ========================================================================= */}
            {currentPage !== 'home' && currentPage !== 'product' && (
                <div className="min-h-screen bg-white">
                    <div className="bg-jaali-gold py-5 sm:py-10 px-4 text-center border-b border-[#E6D6B8]">
                        <div className="max-w-3xl mx-auto space-y-1.5 sm:space-y-3">
                            <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl text-[#161616]">
                                {activeDeityFilter ? `${activeDeityFilter} Collection` : (pageMeta[currentPage]?.title || 'Products')}
                            </h1>
                            {!activeDeityFilter && pageMeta[currentPage]?.subtitle && (
                                <p className="font-serif text-xs sm:text-lg md:text-xl font-semibold text-stone-800">
                                    {pageMeta[currentPage].subtitle}
                                </p>
                            )}
                            {!activeDeityFilter && pageMeta[currentPage]?.desc && (
                                <p className="hidden sm:block text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl mx-auto">
                                    {pageMeta[currentPage].desc}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-5 border-b border-stone-200 flex items-center gap-4">
                        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-stone-500 whitespace-nowrap">RELEVANT COLLECTIONS</span>
                        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-1">
                            {deityCategories.map(cat => {
                                const isCatActive = Boolean(
                                    (cat.deity && activeDeityFilter && cat.deity.toLowerCase() === activeDeityFilter.toLowerCase()) ||
                                    (!cat.deity && cat.route === currentPage)
                                );
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => navigateTo(cat.route, cat.deity)}
                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition whitespace-nowrap text-xs ${
                                            isCatActive
                                                ? 'border-[#C69722] bg-[#FAF5E8] text-[#161616] font-bold shadow-xs'
                                                : 'border-stone-200 bg-white hover:border-[#C69722] text-stone-700 font-medium'
                                        }`}
                                    >
                                        <img src={cat.img} alt={cat.name} className="w-5 h-5 rounded-full object-cover" />
                                        <span className="pr-1">{cat.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-3 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600 gap-2">
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-3">
                                <button onClick={() => setGridCols(2)} className={`p-1 ${gridCols === 2 ? 'text-black font-bold' : 'hover:text-black'}`} title="2 Columns"><Columns className="w-4 h-4" /></button>
                                <button onClick={() => setGridCols(3)} className={`p-1 ${gridCols === 3 ? 'text-black font-bold' : 'hover:text-black'}`} title="3 Columns"><LayoutGrid className="w-4 h-4" /></button>
                                <button onClick={() => setGridCols(4)} className={`p-1 ${gridCols === 4 ? 'text-black font-bold' : 'hover:text-black'}`} title="4 Columns"><Grid className="w-4 h-4" /></button>
                            </div>
                            <div className="text-xs text-stone-600 font-semibold whitespace-nowrap">
                                {collectionItems.length} Idols
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-stone-50 focus:outline-none font-medium text-stone-800"
                                >
                                    <option value="featured">Featured</option>
                                    <option value="az">A to Z</option>
                                    <option value="low">Price: Low to High</option>
                                    <option value="high">Price: High to Low</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setIsFilterDrawerOpen(true)}
                                className="flex items-center gap-1.5 pl-2.5 sm:pl-4 border-l border-stone-200 hover:text-[#C69722] font-semibold text-stone-800 transition py-1"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C69722]" />
                                <span>Filter</span>
                                {(activeDeityFilter || filterPriceRange !== 'all' || filterPlacement !== 'all') && (
                                    <span className="w-2 h-2 rounded-full bg-[#C69722]"></span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Active Filters Bar */}
                    {(activeDeityFilter || filterPriceRange !== 'all' || filterPlacement !== 'all' || isWishlistFilterActive) && (
                        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-2.5 flex flex-wrap items-center gap-2 bg-[#FAF5E8]/60 border-b border-[#E8DEC8] text-xs">
                            <span className="text-stone-500 font-medium">Active filters:</span>
                            {isWishlistFilterActive && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-300 text-red-800 font-semibold text-[11px]">
                                    ❤️ Sacred Wishlist ({wishlist.length})
                                    <button onClick={() => setIsWishlistFilterActive(false)} className="hover:text-red-950 ml-1 font-bold">✕</button>
                                </span>
                            )}
                            {activeDeityFilter && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#C69722] text-[#161616] font-semibold text-[11px]">
                                    Deity: {activeDeityFilter}
                                    <button onClick={() => setActiveDeityFilter(null)} className="hover:text-red-500 ml-1">✕</button>
                                </span>
                            )}
                            {filterPriceRange !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#C69722] text-[#161616] font-semibold text-[11px]">
                                    Price: {filterPriceRange === 'under-1000' ? '< ₹1,000' : filterPriceRange === '1000-2000' ? '₹1,000 - ₹2,000' : '> ₹2,000'}
                                    <button onClick={() => setFilterPriceRange('all')} className="hover:text-red-500 ml-1">✕</button>
                                </span>
                            )}
                            {filterPlacement !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#C69722] text-[#161616] font-semibold text-[11px]">
                                    Placement: {filterPlacement === 'mandir' ? 'Home Mandir' : filterPlacement}
                                    <button onClick={() => setFilterPlacement('all')} className="hover:text-red-500 ml-1">✕</button>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setActiveDeityFilter(null);
                                    setFilterPriceRange('all');
                                    setFilterPlacement('all');
                                    setIsWishlistFilterActive(false);
                                    setSearchQuery('');
                                }}
                                className="text-[11px] text-[#C69722] hover:underline font-semibold ml-2"
                            >
                                Reset All
                            </button>
                        </div>
                    )}

                    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
                        {collectionItems.length === 0 ? (
                            <div className="text-center py-20 bg-stone-50 rounded-3xl border border-stone-200 my-8 p-8 max-w-lg mx-auto">
                                <Sparkles className="w-10 h-10 text-[#C69722] mx-auto mb-3" />
                                <h3 className="font-serif text-2xl font-semibold text-[#161616]">No Sacred Idols Found</h3>
                                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-2">
                                    No idols match your selected filters. Try clearing some filters or searching for another deity.
                                </p>
                                <button
                                    onClick={() => {
                                        setActiveDeityFilter(null);
                                        setFilterPriceRange('all');
                                        setFilterPlacement('all');
                                        setSearchQuery('');
                                    }}
                                    className="mt-5 px-6 py-2.5 rounded-full bg-[#161616] hover:bg-[#C69722] text-white text-xs font-semibold uppercase tracking-wider transition"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-2 sm:grid-cols-2 ${gridCols === 2 ? 'lg:grid-cols-2' : gridCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-2.5 sm:gap-6`}>
                                {collectionItems.map(p => (
                                    <div key={p.id} className="catalog-grid-card group flex flex-col justify-between bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xl hover:border-[#D4AF37]/50 transition-all duration-300">
                                        <div>
                                            <div 
                                                onClick={() => openProductPage(p)}
                                                className="relative rounded-lg sm:rounded-xl overflow-hidden aspect-square sm:aspect-[3/4] bg-gradient-to-b from-[#FAF5E8] to-[#F3EAD3] mb-1.5 sm:mb-3.5 border border-stone-100 cursor-pointer"
                                            >
                                                <img src={p.img} alt={p.title} className="w-full h-full object-contain p-1.5 sm:p-2 img-studio-contrast group-hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]" loading="lazy" />
                                                {p.off && (
                                                    <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 bg-[#161616]/90 backdrop-blur-xs text-[#F7C600] text-[8px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md flex items-center gap-1">
                                                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#F7C600]"></span>
                                                        {p.off.toUpperCase()}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleWishlist(p.id, e)}
                                                    className={`absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-md z-10 ${
                                                        wishlist.includes(p.id) ? 'bg-rose-50 text-rose-500 scale-105' : 'bg-white/95 text-stone-700 hover:text-rose-500 hover:scale-110'
                                                    }`}
                                                    aria-label={wishlist.includes(p.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                                >
                                                    <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${wishlist.includes(p.id) ? 'fill-current text-rose-500' : ''}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-bold tracking-wider uppercase text-[#9E781E] mb-1">
                                                <span className="truncate max-w-[80px] sm:max-w-none">{p.deity ? `${p.deity}` : 'Idol'}</span>
                                                <span className="flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9.5px] font-bold shrink-0">
                                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> 4.9
                                                </span>
                                            </div>

                                            <h3 
                                                onClick={() => openProductPage(p)}
                                                className="text-[11.5px] sm:text-sm font-semibold text-[#181411] line-clamp-2 leading-tight cursor-pointer group-hover:text-[#C69722] transition-colors min-h-[28px] sm:min-h-[38px]"
                                            >
                                                {p.title}
                                            </h3>

                                            <div className="flex items-baseline gap-1 sm:gap-1.5 mt-1 sm:mt-2.5 mb-1.5 sm:mb-3 flex-wrap">
                                                <span className="font-serif text-sm sm:text-2xl font-bold text-[#161616]">₹{p.price.toLocaleString('en-IN')}</span>
                                                {p.oldPrice && (
                                                    <span className="text-[10px] sm:text-xs text-stone-400 line-through">₹{p.oldPrice.toLocaleString('en-IN')}</span>
                                                )}
                                                {p.off && (
                                                    <span className="px-1.5 py-0.2 sm:px-1.5 sm:py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8px] sm:text-[10px] font-bold border border-emerald-200/50">
                                                        {p.off}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-auto pt-2 sm:pt-3 border-t border-stone-100">
                                            <button
                                                type="button"
                                                onClick={() => addToCart(p)}
                                                className="w-full min-h-[36px] sm:min-h-[44px] py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl bg-[#161616] hover:bg-[#C69722] text-[#F7C600] hover:text-white text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
                                            >
                                                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                                <span className="truncate">ADD</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => buyOnWhatsApp(p)}
                                                className="w-full min-h-[36px] sm:min-h-[44px] py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] hover:from-[#C69722] hover:to-[#B3810E] text-[#161616] text-[9.5px] sm:text-[11px] font-black uppercase transition-all duration-150 shadow-2xs flex items-center justify-center active:scale-95"
                                                title="Inquire on WhatsApp"
                                            >
                                                <span className="truncate">BUY</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= 15. FOOTER ================= */}
            <footer id="site-footer" className="bg-jaali-gold border-t border-[#E6D6B8] pt-16 pb-10 text-stone-700">
                <div className="max-w-[1320px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <img
                                src="/images/logo.png"
                                alt="अमोल मार्बल मूर्ती भंडार - Amol Marble Murti Bhandar"
                                className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => { navigateTo('home'); scrollTo(0); }}
                            />
                        </div>
                        <p className="font-serif italic text-base text-stone-600 max-w-xs">
                            Handcrafted Makrana marble idols & sanctified temple art, chosen with care for your home mandir, altar and journey.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <a href="#footer" onClick={(e) => { e.preventDefault(); showToast('Visiting Amol Marble Facebook'); }} className="w-8 h-8 rounded-full border border-stone-300 bg-white/70 flex items-center justify-center hover:bg-[#161616] hover:text-white transition text-xs font-bold">f</a>
                            <a href="#footer" onClick={(e) => { e.preventDefault(); showToast('Visiting Amol Marble Instagram'); }} className="w-8 h-8 rounded-full border border-stone-300 bg-white/70 flex items-center justify-center hover:bg-[#161616] hover:text-white transition"><Instagram className="w-3.5 h-3.5" /></a>
                            <a href="#footer" onClick={(e) => { e.preventDefault(); showToast('Visiting Amol Marble YouTube'); }} className="w-8 h-8 rounded-full border border-stone-300 bg-white/70 flex items-center justify-center hover:bg-[#161616] hover:text-white transition"><Youtube className="w-3.5 h-3.5" /></a>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-3">
                        <h4 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#161616]">• HELP & INFO</h4>
                        <ul className="space-y-2.5 text-xs text-stone-600">
                            <li><button onClick={() => setIsSearchOpen(true)} className="hover:text-black">Search Idols</button></li>
                            <li><button onClick={() => { navigateTo('home'); setTimeout(() => document.getElementById('hero-slider')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-black">Our Showroom Story</button></li>
                            <li><button onClick={() => setIsBulkQuoteOpen(true)} className="hover:text-black">Bulk & Corporate Orders</button></li>
                            <li><button onClick={() => setIsTrackingModalOpen(true)} className="hover:text-black font-semibold text-[#161616]">Track Your Order</button></li>
                            <li><button onClick={() => setInfoModalKey('privacy')} className="hover:text-black">Your Privacy Choices</button></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-3 space-y-3">
                        <h4 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#161616]">• SHOPPING POLICIES</h4>
                        <ul className="space-y-2.5 text-xs text-stone-600">
                            <li><button onClick={() => setInfoModalKey('terms')} className="hover:text-black">Terms of Service</button></li>
                            <li><button onClick={() => setInfoModalKey('privacy')} className="hover:text-black">Privacy Policy</button></li>
                            <li><button onClick={() => setInfoModalKey('shipping')} className="hover:text-black">Shipping Policy</button></li>
                            <li><button onClick={() => setInfoModalKey('returns')} className="hover:text-black">Return & Exchange Policy</button></li>
                            <li><button onClick={() => setInfoModalKey('contact')} className="hover:text-black font-semibold text-[#161616]">Contact Concierge</button></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-3">
                        <h4 className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#161616]">• OUR COLLECTION</h4>
                        <ul className="space-y-2.5 text-xs text-stone-600">
                            {['Hanuman', 'Shiva', 'Ganesha', 'Ram', 'Durga', 'Gajanan Maharaj'].map(d => (
                                <li key={d}>
                                    <button onClick={() => navigateTo('shop-all', d)} className="hover:text-black">{d}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Newsletter Subscription Row */}
                <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8 border-t border-[#E6D6B8] flex flex-col md:flex-row items-center justify-between gap-5">
                    <div className="text-center md:text-left">
                        <h4 className="font-serif text-xl font-semibold text-[#161616]">Join the Amol Murti Parivar</h4>
                        <p className="text-xs text-stone-600 mt-1">Receive auspicious dates, consecration notifications, and 15% off code.</p>
                    </div>
                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row w-full md:w-auto max-w-md gap-2">
                        <label htmlFor="newsletter-email-input" className="sr-only">Email Address</label>
                        <input
                            id="newsletter-email-input"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="px-4 py-3 text-base rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-black flex-1 md:w-64 shadow-xs"
                            required
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 min-h-[48px] rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm active:scale-98 flex items-center justify-center"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>

                <div className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-6 border-t border-[#E6D6B8] text-center">
                    <p className="text-[11px] text-stone-500">© 2026 अमोल मार्बल मूर्ती भंडार (Amol Marble Murti Bhandar). All rights reserved. Sanctified Marble Idols.</p>
                </div>
            </footer>

            {/* ================= 16. KWIKPASS LOGIN MODAL ================= */}
            {isKwikPassOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl grid sm:grid-cols-12 relative animate-in fade-in zoom-in duration-200">
                        <button
                            type="button"
                            onClick={() => setIsKwikPassOpen(false)}
                            className="absolute top-3 right-3 w-11 h-11 rounded-full text-stone-500 hover:text-black flex items-center justify-center text-lg active:scale-95"
                            aria-label="Close login modal"
                        >
                            ✕
                        </button>

                        <div className="sm:col-span-5 bg-black text-white p-8 flex flex-col items-center justify-center text-center">
                            <div className="bg-white/95 p-3.5 rounded-2xl mb-5 shadow-xl flex items-center justify-center">
                                <img
                                    src="/images/logo.png"
                                    alt="अमोल मार्बल मूर्ती भंडार"
                                    className="h-16 w-auto object-contain"
                                    width="160"
                                    height="64"
                                />
                            </div>
                            <h4 className="font-semibold text-base">Login now to avail best offers!</h4>
                            <p className="text-[11px] text-stone-400 mt-2">Get flat 15% off on your first sacred idol order.</p>
                        </div>

                        <form onSubmit={handleKwikPassSubmit} className="sm:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-4">
                            <label htmlFor="kwikpass-mobile-input" className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                                Mobile Number (+91):
                            </label>
                            <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden focus-within:border-black">
                                <span className="px-3.5 py-3 bg-stone-50 text-xs font-semibold text-stone-600 border-r border-stone-300">+91</span>
                                <input
                                    id="kwikpass-mobile-input"
                                    name="phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    maxLength="10"
                                    value={kwikPhone}
                                    onChange={(e) => setKwikPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 10-digit Mobile Number"
                                    className="w-full px-3.5 py-3 text-base focus:outline-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white font-bold text-xs uppercase tracking-wider transition duration-200 active:scale-98 shadow-sm flex items-center justify-center"
                            >
                                Submit OTP
                            </button>
                            <label className="flex items-start gap-2 text-[10px] text-stone-500 cursor-pointer pt-1">
                                <input type="checkbox" defaultChecked className="mt-0.5 rounded w-4 h-4 text-[#C69722]" />
                                <span>I agree to Amol Marble Murti Bhandar & GoKwik using my data for login & offers. <u className="text-stone-700">Read details</u></span>
                            </label>
                            <p className="text-[10px] text-center text-stone-400 pt-1">Powered by <strong className="text-black">Kwik⚡Pass</strong></p>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= 17. SLIDE-OUT CART DRAWER ================= */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50">
                    <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-xs"></div>
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col justify-between">
                        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-[#FAF5E8]">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-[#C69722]" />
                                <h3 className="font-serif text-lg sm:text-xl text-[#161616] font-semibold">Your Sacred Cart ({cartCount})</h3>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-11 h-11 flex items-center justify-center rounded-full text-stone-500 hover:text-black hover:bg-stone-200/60 active:scale-95 text-lg transition tap-target-44"
                                aria-label="Close cart drawer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Free Shipping Progress Indicator */}
                        <div className="px-5 py-3 bg-[#FFFDF9] border-b border-[#EFE5D1]">
                            <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                                <span>{rawSubtotal >= 999 ? '🎉 You have unlocked FREE Insured Shipping!' : `Add ₹${(999 - rawSubtotal).toLocaleString('en-IN')} for FREE Pan-India Delivery`}</span>
                                <span className="text-[#C69722] font-bold">{Math.min(100, Math.round((rawSubtotal / 999) * 100))}%</span>
                            </div>
                            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#C69722] transition-all duration-500 rounded-full"
                                    style={{ width: `${Math.min(100, Math.round((rawSubtotal / 999) * 100))}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                                    <ShoppingBag className="w-12 h-12 text-stone-300" />
                                    <p className="font-serif text-lg text-stone-700">Your sacred cart is empty</p>
                                    <p className="text-xs text-stone-500 max-w-xs">Explore our sanctified Makrana marble collection and bring divine blessings home.</p>
                                    <button
                                        onClick={() => { setIsCartOpen(false); navigateTo('shop-all'); }}
                                        className="mt-3 px-6 py-2.5 rounded-full bg-[#161616] hover:bg-[#C69722] text-white text-xs font-semibold tracking-wider uppercase transition"
                                    >
                                        Explore All Murtis
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-3 items-center border-b border-stone-100 pb-3">
                                            <img
                                                src={item.img}
                                                alt={item.title}
                                                className="w-16 h-16 rounded-xl object-contain bg-[#FAF5E8] border border-stone-200 p-1 flex-shrink-0"
                                            />
                                            <div className="flex-1">
                                                <h4
                                                    onClick={() => openProductPage(item)}
                                                    className="text-xs font-semibold text-[#161616] line-clamp-1 cursor-pointer hover:text-[#C69722]"
                                                >
                                                    {item.title}
                                                </h4>
                                                <p className="text-xs font-bold text-[#C69722] mt-0.5">Rs. {item.price.toLocaleString('en-IN')}</p>
                                                 <div className="flex items-center gap-2 mt-2">
                                                     <button
                                                         type="button"
                                                         onClick={() => updateCartQty(item.id, -1)}
                                                         className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg border border-stone-300 text-sm flex items-center justify-center hover:bg-stone-100 font-bold active:scale-95 transition"
                                                         aria-label="Decrease quantity"
                                                     >
                                                         -
                                                     </button>
                                                     <span className="text-xs font-semibold px-2 min-w-[20px] text-center">{item.qty}</span>
                                                     <button
                                                         type="button"
                                                         onClick={() => updateCartQty(item.id, 1)}
                                                         className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg border border-stone-300 text-sm flex items-center justify-center hover:bg-stone-100 font-bold active:scale-95 transition"
                                                         aria-label="Increase quantity"
                                                     >
                                                         +
                                                     </button>
                                                     <button
                                                         type="button"
                                                         onClick={() => updateCartQty(item.id, -item.qty)}
                                                         className="text-[11px] text-stone-400 hover:text-red-500 ml-auto min-h-[40px] flex items-center px-2"
                                                     >
                                                         Remove
                                                     </button>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}

                                     {/* Coupon Section inside Cart */}
                                     <div className="pt-2">
                                         {appliedCoupon ? (
                                             <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200 text-xs">
                                                 <div className="flex items-center gap-2 text-green-800 font-semibold">
                                                     <Tag className="w-3.5 h-3.5 text-green-600" />
                                                     <span>{appliedCoupon.code} applied ({appliedCoupon.discountPercent}% OFF)</span>
                                                 </div>
                                                 <button
                                                     type="button"
                                                     onClick={removeCoupon}
                                                     className="text-red-500 text-[11px] font-bold hover:underline min-h-[40px] px-2 flex items-center"
                                                 >
                                                     Remove
                                                 </button>
                                             </div>
                                         ) : (
                                             <div className="p-3 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] space-y-2">
                                                 <div className="flex items-center justify-between">
                                                     <span className="text-[11px] font-semibold text-stone-700">Sacred Blessing Code:</span>
                                                     <button
                                                         type="button"
                                                         onClick={() => applyCoupon('DIVINE15')}
                                                         className="text-[10px] font-bold text-[#C69722] hover:underline"
                                                     >
                                                         Use DIVINE15 (15% OFF)
                                                     </button>
                                                 </div>
                                                 <div className="flex gap-2">
                                                     <label htmlFor="cart-coupon-input" className="sr-only">Coupon code</label>
                                                     <input
                                                         id="cart-coupon-input"
                                                         name="coupon"
                                                         type="text"
                                                         inputMode="text"
                                                         autoCapitalize="characters"
                                                         placeholder="Coupon code (e.g. DIVINE15)"
                                                         className="flex-1 px-3 py-2 text-base sm:text-xs rounded-lg border border-stone-300 uppercase bg-white focus:outline-none focus:border-[#C69722]"
                                                     />
                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             const el = document.getElementById('cart-coupon-input');
                                                             if (el?.value) applyCoupon(el.value);
                                                         }}
                                                         className="px-4 py-2 min-h-[44px] rounded-lg bg-[#161616] text-white text-xs font-bold hover:bg-[#C69722] transition active:scale-98"
                                                     >
                                                         Apply
                                                     </button>
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             )}
                         </div>

                         {cart.length > 0 && (
                             <div className="p-4 sm:p-5 border-t border-stone-200 bg-[#FAF5E8] space-y-2.5 safe-bottom-pad">
                                 <div className="flex items-center gap-1.5 text-xs text-green-800 font-semibold">
                                     <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                     <span>COD Available • Free Pan-India Insured Delivery</span>
                                 </div>

                                 {appliedCoupon && (
                                     <div className="flex justify-between text-xs text-green-700 font-semibold">
                                         <span>Discount ({appliedCoupon.code})</span>
                                         <span>- Rs. {discountAmount.toLocaleString('en-IN')}.00</span>
                                     </div>
                                 )}

                                 <div className="flex justify-between text-base font-bold text-[#161616] pt-1 border-t border-stone-200">
                                     <span>Total Amount</span>
                                     <span className="text-[#C69722]">Rs. {cartTotal.toLocaleString('en-IN')}.00</span>
                                 </div>

                                 <button
                                     type="button"
                                     onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                                     className="w-full py-4 min-h-[48px] rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
                                 >
                                     <span>PROCEED TO SECURE CHECKOUT</span>
                                     <ArrowRight className="w-3.5 h-3.5" />
                                 </button>
                             </div>
                         )}
                     </div>
                 </div>
             )}

             {/* ================= 18. FLOATING SCORECARD & ACCESSIBILITY ================= */}
             <div className="hidden sm:block fixed bottom-4 left-4 z-30">
                 {isGoogleQualityOpen && (
                     <div className="mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                         <div className="flex items-center justify-between">
                             <h4 className="font-bold text-sm text-[#161616]">Shop quality<br /><span className="text-[11px] font-normal text-stone-500">by Google</span></h4>
                             <button
                                 type="button"
                                 onClick={() => setIsGoogleQualityOpen(false)}
                                 className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-black"
                                 aria-label="Close scorecard"
                             >
                                 ✕
                             </button>
                         </div>
                         <p className="text-[11px] text-stone-500 leading-snug">These scores show how this shop stacks up against others for delivery speed, authentic marble, and return policies.</p>
                         <div className="space-y-1.5 pt-1 border-t border-stone-100 text-[11px]">
                             <div className="flex justify-between">
                                 <span>Shipping<br /><em className="not-italic text-[10px] text-stone-400">Free delivery across India</em></span>
                                 <span className="text-green-700 font-semibold">● Good</span>
                             </div>
                             <div className="flex justify-between">
                                 <span>Returns<br /><em className="not-italic text-[10px] text-stone-400">7-day returns for all idols</em></span>
                                 <span className="text-green-700 font-semibold">● Great</span>
                             </div>
                             <div className="flex justify-between">
                                 <span>Craft authenticity</span>
                                 <span className="text-green-700 font-semibold">● 100% Hand-Carved</span>
                             </div>
                             <div className="flex justify-between">
                                 <span>Payment options<br /><em className="not-italic text-[10px] text-stone-400">UPI, COD, NetBanking</em></span>
                                 <span className="text-green-700 font-semibold">● Good</span>
                             </div>
                         </div>
                     </div>
                 )}

                 <button
                     type="button"
                     onClick={() => setIsGoogleQualityOpen(!isGoogleQualityOpen)}
                     className="bg-white hover:bg-stone-50 border border-stone-200 shadow-lg rounded-xl px-3.5 py-2.5 min-h-[44px] flex items-center gap-2 text-xs font-medium text-stone-800 transition active:scale-95"
                     aria-label="Toggle Google shop quality scorecard"
                 >
                     <Award className="w-4 h-4 text-[#C69722]" />
                     <span>Shop quality by Google</span>
                 </button>
             </div>

             {/* ================= 20. MULTI-STEP CHECKOUT MODAL ================= */}
             <CheckoutModal
                 isOpen={isCheckoutOpen}
                 onClose={() => setIsCheckoutOpen(false)}
                 cart={cart}
                 cartTotal={cartTotal}
                 onOrderPlaced={(order) => {
                     setCart([]);
                     setPlacedOrder(order);
                     setTrackingOrderId(order.orderId);
                 }}
                 appliedCoupon={appliedCoupon}
                 onApplyCoupon={applyCoupon}
                 onRemoveCoupon={removeCoupon}
                 onOpenTracking={(id) => {
                     setTrackingOrderId(id);
                     setIsTrackingModalOpen(true);
                 }}
             />

             {/* ================= 21. REAL-TIME ORDER TRACKING MODAL ================= */}
             <OrderTrackingModal
                 isOpen={isTrackingModalOpen}
                 onClose={() => setIsTrackingModalOpen(false)}
                 initialOrderId={trackingOrderId}
             />

             {/* ================= 22. CORPORATE & BULK QUOTE MODAL ================= */}
             <BulkQuoteModal
                 isOpen={isBulkQuoteOpen}
                 onClose={() => setIsBulkQuoteOpen(false)}
                 onQuoteSubmitted={(data) => {
                     showToast(`Bulk inquiry received for ${data.company || 'your team'}! We will contact you shortly.`);
                 }}
             />

             {/* ================= 23. WHATSAPP BUY NOW INQUIRY MODAL ================= */}
             <InquiryModal
                 product={inquiryProduct}
                 onClose={() => setInquiryProduct(null)}
                 onSubmit={(customer) => submitWhatsAppInquiry(inquiryProduct, customer)}
             />

             {/* ================= 24. SHOPPING POLICIES & CONCIERGE MODAL ================= */}
             <InfoModal
                 contentKey={infoModalKey}
                 onClose={() => setInfoModalKey(null)}
             />

             {/* ================= 25. MULTI-ATTRIBUTE FILTER DRAWER ================= */}
             <FilterDrawer
                 isOpen={isFilterDrawerOpen}
                 onClose={() => setIsFilterDrawerOpen(false)}
                 activeDeity={activeDeityFilter}
                 onSelectDeity={setActiveDeityFilter}
                 priceRange={filterPriceRange}
                 onSelectPriceRange={setFilterPriceRange}
                 placement={filterPlacement}
                 onSelectPlacement={setFilterPlacement}
                 onResetAll={() => {
                     setActiveDeityFilter(null);
                     setFilterPriceRange('all');
                     setFilterPlacement('all');
                 }}
                 itemsCount={collectionItems.length}
             />

             {/* Custom Toast Notification */}
             {isToastVisible && (
                 <div className="fixed bottom-20 sm:bottom-5 right-5 z-50 flex items-center gap-2 bg-[#161616] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                     <span className="w-2 h-2 rounded-full bg-[#F7C600]"></span>
                     <span>{toastMessage}</span>
                 </div>
             )}

         </div>
     );
 }
