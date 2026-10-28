import React, { useState, useEffect } from 'react';
import {
    Star, ShieldCheck, Gem, Sparkles, Truck, Check, Heart, ShoppingBag,
    ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw,
    ThumbsUp, ThumbsDown, MessageSquare, Award, Share2, MapPin,
    PackageCheck, Clock, Calendar, AlertCircle, Eye, HelpCircle
} from 'lucide-react';
import { catalog } from '../data/catalog';

export default function ProductDetailPage({
    product,
    onBack,
    onAddToCart,
    onBuyNow,
    isWishlisted,
    onToggleWishlist,
    onSelectProduct
}) {
    if (!product) return null;

    // Scroll to top on product change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [product.id]);

    // Product Variations State
    const [selectedSize, setSelectedSize] = useState('9 cm (Car Dashboard / Small Altar)');
    const [selectedFinish, setSelectedFinish] = useState('Pure Makrana White');
    const [qty, setQty] = useState(1);
    const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'vaastu' | 'care' | 'shipping'
    const [activeImageIdx, setActiveImageIdx] = useState(0);

    // Delivery Pincode Checker State
    const [pincode, setPincode] = useState('');
    const [pincodeResult, setPincodeResult] = useState(null);

    // Review Filters & Interactive Voting State
    const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | '5' | 'with-photos' | 'car-dash'
    const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
    const [newReview, setNewReview] = useState({ name: '', rating: 5, title: '', comment: '', location: '' });
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    // Initial Reviews Data with User-Requested Fields:
    // Customer name/avatar, Star rating, Title & description, Verified badge, Purchase date, Helpful/not helpful, Seller response
    const [reviews, setReviews] = useState([
        {
            id: 1,
            author: "Radha Raman S.",
            avatarColor: "bg-amber-700",
            location: "Jaipur, Rajasthan",
            rating: 5,
            date: "10 Oct 2026",
            verified: true,
            title: "The divine serenity on the face is hypnotic — sits rock steady on my car dash!",
            content: "Ordered this sacred murti for my new Mahindra XUV700. The weight of the Makrana marble combined with the complimentary anti-skid base keeps it completely secure on highway drives. The hand-painted 24K gold accents reflect the morning sun beautifully. Pran Pratishtha fragrance was still fresh when unboxed!",
            helpfulCount: 42,
            unhelpfulCount: 1,
            userVote: null,
            tag: "car-dash",
            hasPhoto: true,
            photoUrl: product.img,
            sellerReply: {
                author: "Amol Murti Concierge (Master Sculptor Team)",
                date: "11 Oct 2026",
                text: "Namaste Radha Raman ji! We are deeply humbled to know that Bhagwan is accompanying your journeys with grace and safety. May every drive bring divine peace and protection to you and your family. Jai Shri Krishna!"
            }
        },
        {
            id: 2,
            author: "Dr. Ananya Iyer",
            avatarColor: "bg-emerald-700",
            location: "Bengaluru, Karnataka",
            rating: 5,
            date: "04 Oct 2026",
            verified: true,
            title: "Arrived in a 7-layer cushioned wooden crate in pristine condition",
            content: "Living in South India, I was initially anxious about fragile marble delivery from Rajasthan. But the packaging exceeded all expectations! The idol was nestled inside custom impact-resistant velvet casing within an outer wooden crate. Flawless chisel symmetry, no scratches, pure white Makrana marble stone density. Highly recommended for home mandir installation.",
            helpfulCount: 29,
            unhelpfulCount: 0,
            userVote: null,
            tag: "mandir",
            hasPhoto: false,
            sellerReply: {
                author: "Amol Murti Concierge",
                date: "05 Oct 2026",
                text: "Pranam Dr. Ananya ji! Thank you for placing your faith in our Jaipur artisans. Our Zero-Breakage Crating guarantee exists precisely so devotees across India receive their sanctified idols without a scratch. Shubham Bhavatu!"
            }
        },
        {
            id: 3,
            author: "Vikramaditya Pant",
            avatarColor: "bg-indigo-700",
            location: "Mumbai, Maharashtra",
            rating: 5,
            date: "28 Sep 2026",
            verified: true,
            title: "Exquisite hand-carved detailing that pictures cannot do justice to",
            content: "The facial expression, the folds of the dhoti, and the intricate crown detailing are unbelievable. You can instantly tell this isn't cheap synthetic plastic — it has the cool, dense touch of authentic Makrana marble. Placed it in our North-East Ishanya mandir according to Vaastu directions provided in the box.",
            helpfulCount: 18,
            unhelpfulCount: 2,
            userVote: null,
            tag: "mandir",
            hasPhoto: true,
            photoUrl: product.img,
            sellerReply: {
                author: "Amol Murti Concierge",
                date: "29 Sep 2026",
                text: "Namaste Vikramaditya ji. It brings immense joy to our entire atelier to hear that the Vaastu energy in your Ishanya corner feels elevated. May divine abundance fill your home!"
            }
        },
        {
            id: 4,
            author: "Col. R. K. Sharma (Retd.)",
            avatarColor: "bg-stone-700",
            location: "Delhi NCR",
            rating: 5,
            date: "18 Sep 2026",
            verified: true,
            title: "Gifting 15 pieces for my daughter's wedding guests — outstanding quality",
            content: "We ordered 15 murtis as divine return gifts for close family. Each piece was individually gift-boxed in royal crimson velvet with certificate of Makrana stone authenticity. Every single recipient has called to praise the finish. Amol Marble Murti Bhandar is setting the gold standard in authentic Indian spiritual craftsmanship.",
            helpfulCount: 35,
            unhelpfulCount: 0,
            userVote: null,
            tag: "gifting",
            hasPhoto: false,
            sellerReply: {
                author: "Amol Murti Concierge",
                date: "19 Sep 2026",
                text: "Pranam Colonel Sharma ji! It was our true honour to craft sacred memories for your daughter's auspicious wedding. Wishing the newlyweds lifetime blessings and endless harmony."
            }
        }
    ]);

    // Handle Helpful / Not Helpful click
    const handleVote = (reviewId, type) => {
        setReviews(prev => prev.map(rev => {
            if (rev.id !== reviewId) return rev;
            if (rev.userVote === type) {
                return {
                    ...rev,
                    helpfulCount: type === 'helpful' ? rev.helpfulCount - 1 : rev.helpfulCount,
                    unhelpfulCount: type === 'unhelpful' ? rev.unhelpfulCount - 1 : rev.unhelpfulCount,
                    userVote: null
                };
            }
            const prevWasHelpful = rev.userVote === 'helpful';
            const prevWasUnhelpful = rev.userVote === 'unhelpful';
            return {
                ...rev,
                helpfulCount: type === 'helpful'
                    ? rev.helpfulCount + 1
                    : (prevWasHelpful ? rev.helpfulCount - 1 : rev.helpfulCount),
                unhelpfulCount: type === 'unhelpful'
                    ? rev.unhelpfulCount + 1
                    : (prevWasUnhelpful ? rev.unhelpfulCount - 1 : rev.unhelpfulCount),
                userVote: type
            };
        }));
    };

    // Calculate Price Based on Variations
    const priceNum = typeof product.price === 'string'
        ? parseInt(product.price.replace(/[^\d]/g, ''), 10) || 999
        : product.price;

    const oldPriceNum = product.oldPrice || (typeof product.old === 'string' ? parseInt(product.old.replace(/[^\d]/g, ''), 10) : priceNum + 700);

    const sizePriceAdd = selectedSize.includes('15 cm') ? 600 : selectedSize.includes('24 cm') ? 1500 : 0;
    const finalPrice = priceNum + sizePriceAdd;
    const finalOldPrice = oldPriceNum + sizePriceAdd;
    const savingsAmount = Math.max(0, finalOldPrice - finalPrice);

    // Multi-Angle Thumbnail Gallery Views
    const galleryViews = [
        {
            id: 'front',
            title: 'Front View',
            caption: 'Front View • Sacred Shilpa Shastra Symmetry',
            img: product.img,
            desc: 'Frontal consecrated posture with serene benign expression and blessings mudra.',
            zoomClass: 'scale-100 object-contain'
        },
        {
            id: 'side',
            title: 'Side Angle & Depth',
            caption: 'Side Profile • Chiseled Contours & Sculptural Depth',
            img: product.img,
            desc: 'Three-quarter sculptural angle revealing marble thickness, posture, and stable pedestal.',
            zoomClass: 'scale-105 rotate-1 object-contain'
        },
        {
            id: 'detail',
            title: '24K Gold Detailing',
            caption: 'Macro Close-Up • 24K Gold Foil Embossed Detailing',
            img: product.img,
            desc: 'Intricate zaree border work applied with squirrel-hair brushes and pure gold leaf.',
            zoomClass: 'scale-135 object-cover object-top'
        },
        {
            id: 'altar',
            title: 'Mandir Altar Placement',
            caption: 'Home Mandir Placement • Consecrated for Daily Pooja',
            img: product.img,
            desc: 'Visualized in a serene home mandir setting with brass lamps and marigold garlands.',
            zoomClass: 'scale-100 brightness-105 object-contain'
        },
        {
            id: 'packaging',
            title: 'Velvet Gift Packaging',
            caption: 'Presentation • 7-Layer Impact-Proof Wooden Crate & Velvet Box',
            img: product.img,
            desc: 'Packaged in a royal crimson velvet gift box, protected by high-density foam for zero transit damage.',
            zoomClass: 'scale-95 object-contain'
        }
    ];

    // Check Pincode Delivery
    const handleCheckPincode = (e) => {
        e.preventDefault();
        const pin = pincode.trim();
        if (pin.length !== 6 || !/^\d+$/.test(pin)) {
            setPincodeResult({ valid: false, message: 'Please enter a valid 6-digit Indian pincode.' });
            return;
        }

        const isMetro = ['11', '40', '56', '60', '70', '50', '30'].some(prefix => pin.startsWith(prefix));
        setPincodeResult({
            valid: true,
            isMetro,
            eta: isMetro ? '2 to 3 Business Days' : '3 to 5 Business Days',
            courier: 'BlueDart Express Air (Insured)',
            cod: true
        });
    };

    // Handle Review Submit
    const handleReviewSubmit = (e) => {
        e.preventDefault();
        if (!newReview.name || !newReview.title || !newReview.comment) return;

        const createdReview = {
            id: Date.now(),
            author: newReview.name,
            avatarColor: "bg-amber-600",
            location: newReview.location || "India",
            rating: newReview.rating,
            date: "Just now",
            verified: true,
            title: newReview.title,
            content: newReview.comment,
            helpfulCount: 0,
            unhelpfulCount: 0,
            userVote: null,
            tag: "mandir",
            hasPhoto: false,
            sellerReply: {
                author: "Amol Murti Concierge",
                date: "Just now",
                text: `Dhanyawad ${newReview.name} ji! Your sacred review has been verified and published. May Bhagwan bless your home with peace and divine grace.`
            }
        };

        setReviews(prev => [createdReview, ...prev]);
        setReviewSubmitted(true);
        setTimeout(() => {
            setIsWriteReviewOpen(false);
            setReviewSubmitted(false);
            setNewReview({ name: '', rating: 5, title: '', comment: '', location: '' });
        }, 1500);
    };

    // Filtered Reviews List
    const filteredReviews = reviews.filter(rev => {
        if (reviewFilter === 'all') return true;
        if (reviewFilter === '5') return rev.rating === 5;
        if (reviewFilter === 'with-photos') return rev.hasPhoto;
        if (reviewFilter === 'car-dash') return rev.tag === 'car-dash';
        return true;
    });

    // Related Products (exclude current)
    const relatedProducts = catalog
        .filter(item => item.id !== product.id && (item.deity === product.deity || item.group === product.group))
        .slice(0, 4);

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1E1912] pb-32 lg:pb-24">
            {/* Top Breadcrumb & Back Bar */}
            <div className="bg-[#FAF5E8] border-b border-[#E8DEC8] sticky top-[76px] z-30 shadow-xs">
                <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center gap-1.5 font-bold text-[#161616] hover:text-[#C69722] transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>BACK TO COLLECTION</span>
                        </button>
                        <span className="text-stone-300">/</span>
                        <button onClick={onBack} className="text-stone-500 hover:text-black font-medium">Shop All</button>
                        <span className="text-stone-300">/</span>
                        <span className="text-stone-500 font-medium">{product.deity || 'Murtis'}</span>
                        <span className="text-stone-300">/</span>
                        <span className="text-stone-800 font-semibold truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: product.title,
                                        text: `Explore this sacred hand-carved Makrana marble idol on Amol Marble Murti Bhandar.`,
                                        url: window.location.href
                                    }).catch(() => {});
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }
                            }}
                            className="p-1.5 rounded-lg border border-stone-300 hover:border-black text-stone-700 hover:text-black transition flex items-center gap-1 text-[11px] font-semibold"
                            title="Share Sacred Idol"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Product Showcase Section */}
            <div className="max-w-[1360px] mx-auto px-4 sm:px-8 pt-8 lg:pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">

                    {/* ================= LEFT: THUMBNAIL IMAGE GALLERY ================= */}
                    <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-[140px]">

                        {/* Thumbnail Strip (Vertical beside main image on desktop, horizontal on mobile) */}
                        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar py-1 md:py-0 md:w-28 flex-shrink-0">
                            {galleryViews.map((view, idx) => {
                                const isActive = activeImageIdx === idx;
                                return (
                                    <button
                                        key={view.id}
                                        onClick={() => setActiveImageIdx(idx)}
                                        className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-200 text-left w-20 md:w-full flex-shrink-0 bg-white ${
                                            isActive
                                                ? 'border-[#C69722] ring-3 ring-[#C69722]/30 scale-105 shadow-md'
                                                : 'border-stone-200 hover:border-[#C69722]/60 hover:shadow-sm opacity-85 hover:opacity-100'
                                        }`}
                                        title={view.title}
                                    >
                                        <img
                                            src={view.img}
                                            alt={view.title}
                                            className={`w-full h-full object-contain p-1.5 img-studio-contrast group-hover:scale-105 transition duration-300 ${view.id === 'detail' ? 'scale-125 object-top' : ''}`}
                                        />
                                        {/* Active Indicator Label */}
                                        {isActive && (
                                            <div className="absolute inset-x-0 bottom-0 bg-[#161616]/90 text-[#F7C600] text-[9px] font-bold py-0.5 text-center truncate px-1">
                                                Active
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Main Image Display with Click Switch, Zoom & Trust Badges */}
                        <div className="flex-1 relative rounded-3xl overflow-hidden bg-white border border-[#E6D6B8] shadow-lg group">
                            <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square overflow-hidden bg-[#FBF9F3]">
                                <img
                                    key={activeImageIdx}
                                    src={galleryViews[activeImageIdx].img}
                                    alt={galleryViews[activeImageIdx].title}
                                    className={`w-full h-full object-contain p-4 sm:p-8 img-studio-contrast transition-all duration-500 transform ${galleryViews[activeImageIdx].zoomClass || ''} group-hover:scale-105 animate-in fade-in`}
                                />

                                {/* Deity & Material Floating Badge */}
                                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
                                    <span className="bg-[#161616]/90 backdrop-blur-md text-[#F7C600] text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-[#F7C600]" />
                                        <span>{product.deity || 'Pure Marble'}</span>
                                    </span>
                                    <span className="bg-white/90 backdrop-blur-md text-stone-700 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-xs border border-stone-200">
                                        100% Makrana Marble
                                    </span>
                                </div>

                                {/* Wishlist Heart Button */}
                                <button
                                    onClick={(e) => onToggleWishlist(product.id, e)}
                                    className={`absolute top-4 right-4 z-20 w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg backdrop-blur-md tap-target-48 ${
                                        isWishlisted
                                            ? 'bg-red-50 text-red-500 scale-110'
                                            : 'bg-white/90 text-stone-600 hover:text-red-500 hover:scale-110'
                                    }`}
                                    aria-label={isWishlisted ? "Remove from Sacred Wishlist" : "Save to Sacred Wishlist"}
                                    title={isWishlisted ? "Remove from Sacred Wishlist" : "Save to Sacred Wishlist"}
                                >
                                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={() => setActiveImageIdx(prev => (prev === 0 ? galleryViews.length - 1 : prev - 1))}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-black hover:text-white shadow-md flex items-center justify-center text-stone-700 transition opacity-80 group-hover:opacity-100 tap-target-48"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setActiveImageIdx(prev => (prev === galleryViews.length - 1 ? 0 : prev + 1))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-black hover:text-white shadow-md flex items-center justify-center text-stone-700 transition opacity-80 group-hover:opacity-100 tap-target-48"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {/* Active View Caption Ribbon */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white flex items-end justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-[#F7C600]">{galleryViews[activeImageIdx].caption}</p>
                                        <p className="text-[11px] text-stone-200 mt-0.5 line-clamp-1">{galleryViews[activeImageIdx].desc}</p>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">
                                        {activeImageIdx + 1} / {galleryViews.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================= RIGHT: PRODUCT CONFIGURATION & BUY BOX ================= */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Category & Title */}
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#9E781E] mb-2">
                                <span>───•</span> <span>SACRED SCULPTURE</span> <span>•───</span>
                            </div>
                            <h1 className="font-serif text-3xl sm:text-4xl text-[#161616] font-medium leading-[1.15]">
                                {product.title}
                            </h1>

                            {/* Rating and Social Proof */}
                            <div className="flex items-center gap-3 mt-3.5 pb-4 border-b border-stone-200">
                                <a href="#reviews" className="flex items-center gap-1.5 bg-[#FAF5E8] px-3 py-1 rounded-full border border-[#E6D6B8] hover:bg-[#F3E8CE] transition">
                                    <div className="flex text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-[#161616]">4.9</span>
                                    <span className="text-[11px] text-stone-500">• 142 Verified Reviews</span>
                                </a>

                                <span className="text-[11px] text-green-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Consecration Ready
                                </span>
                            </div>
                        </div>

                        {/* Pricing and Offers */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6D6B8] shadow-xs space-y-2">
                            <div className="flex items-baseline gap-3">
                                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#161616]">
                                    Rs. {finalPrice.toLocaleString('en-IN')}.00
                                </span>
                                <span className="text-sm sm:text-base text-stone-400 line-through">
                                    Rs. {finalOldPrice.toLocaleString('en-IN')}.00
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-800 text-xs font-bold">
                                    Save Rs. {savingsAmount.toLocaleString('en-IN')}
                                </span>
                            </div>

                            <p className="text-xs text-stone-500 leading-relaxed">
                                Tax included. <strong className="text-stone-800">Free Pan-India Insured Shipping</strong>. Cash on Delivery (COD) available with zero additional fee.
                            </p>

                            <div className="pt-2 flex items-center gap-2 text-[11px] text-[#A67B14] font-semibold">
                                <Sparkles className="w-3.5 h-3.5 text-[#F7C600]" />
                                <span>Use code <strong className="text-black bg-[#FAF5E8] px-1.5 py-0.5 rounded border border-[#E6D6B8]">DIVINE15</strong> at checkout for extra 15% OFF!</span>
                            </div>
                        </div>

                        {/* Variation 1: Size Selector */}
                        <div className="space-y-2.5">
                            <label className="flex items-center justify-between text-xs font-bold text-stone-800 uppercase tracking-wider">
                                <span>SELECT IDOL SIZE:</span>
                                <span className="text-[#C69722] text-[11px] font-medium lowercase">
                                    {selectedSize.includes('9 cm') ? 'ideal for car dash & office desk' : 'ideal for grand home mandir'}
                                </span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {[
                                    { label: '9 cm (Car Dashboard)', desc: 'Standard', extra: 0 },
                                    { label: '15 cm (Home Mandir)', desc: '+₹600', extra: 600 },
                                    { label: '24 cm (Grand Temple)', desc: '+₹1,500', extra: 1500 }
                                ].map(size => {
                                    const isSelected = selectedSize.includes(size.label.split(' ')[0]);
                                    return (
                                        <button
                                            key={size.label}
                                            onClick={() => setSelectedSize(size.label)}
                                            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[48px] tap-target-48 ${
                                                isSelected
                                                    ? 'border-[#161616] bg-[#161616] text-white shadow-sm'
                                                    : 'border-stone-200 bg-white text-stone-700 hover:border-black'
                                            }`}
                                        >
                                            <span className="text-xs font-bold">{size.label.split(' ')[0]} {size.label.split(' ')[1]}</span>
                                            <span className={`text-[10px] mt-1 ${isSelected ? 'text-[#F7C600]' : 'text-stone-500'}`}>{size.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Variation 2: Sacred Finish Selector */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                SACRED FINISH:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {[
                                    { name: 'Pure Makrana White', sub: 'Natural Stone' },
                                    { name: '24K Gold Zaree Painted', sub: 'Hand-Embossed' },
                                    { name: 'Antique Polished Brass', sub: 'Vintage Patina' }
                                ].map(finish => {
                                    const isSelected = selectedFinish === finish.name;
                                    return (
                                        <button
                                            key={finish.name}
                                            onClick={() => setSelectedFinish(finish.name)}
                                            className={`p-3 rounded-xl border text-left transition min-h-[48px] tap-target-48 ${
                                                isSelected
                                                    ? 'border-[#C69722] bg-[#FAF5E8] text-[#161616] shadow-xs'
                                                    : 'border-stone-200 bg-white text-stone-700 hover:border-[#C69722]'
                                            }`}
                                        >
                                            <span className="text-xs font-bold block leading-snug">{finish.name}</span>
                                            <span className="text-[10px] text-stone-500 mt-0.5 block">{finish.sub}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quantity Counter & Action Buttons */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border border-stone-300 rounded-xl bg-white p-1">
                                    <button
                                        type="button"
                                        onClick={() => setQty(prev => Math.max(1, prev - 1))}
                                        className="w-11 h-11 rounded-lg hover:bg-stone-100 flex items-center justify-center font-bold text-lg text-stone-700 transition tap-target-48"
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <span className="w-10 text-center font-bold text-base text-[#161616]">{qty}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQty(prev => prev + 1)}
                                        className="w-11 h-11 rounded-lg hover:bg-stone-100 flex items-center justify-center font-bold text-lg text-stone-700 transition tap-target-48"
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        for (let i = 0; i < qty; i++) {
                                            onAddToCart({
                                                ...product,
                                                price: finalPrice,
                                                title: `${product.title} (${selectedSize.split(' ')[0]} - ${selectedFinish})`
                                            }, false);
                                        }
                                    }}
                                    className="flex-1 min-h-[48px] py-3.5 px-6 rounded-xl bg-[#161616] hover:bg-black text-white text-xs font-bold tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 tap-target-48 active:scale-98"
                                >
                                    <ShoppingBag className="w-4 h-4 text-[#F7C600]" />
                                    <span>ADD TO CART</span>
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    const itemToBuy = {
                                        ...product,
                                        price: finalPrice,
                                        title: `${product.title} (${selectedSize.split(' ')[0]} - ${selectedFinish})`
                                    };
                                    if (onBuyNow) {
                                        onBuyNow(itemToBuy);
                                    } else {
                                        onAddToCart(itemToBuy, true);
                                    }
                                }}
                                className="w-full min-h-[50px] py-4 rounded-xl bg-gradient-to-r from-[#F7C600] to-[#E5B500] hover:from-[#E5B500] hover:to-[#D4A300] text-[#161616] text-xs font-extrabold tracking-widest uppercase transition shadow-lg flex items-center justify-center gap-2 active:scale-98 tap-target-48"
                            >
                                <span>BUY NOW WITH CASH ON DELIVERY</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Delivery Pincode Estimator */}
                        <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2.5">
                            <label htmlFor="pincode-input" className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase">
                                <Truck className="w-4 h-4 text-[#C69722]" />
                                <span>ESTIMATE DELIVERY TIMELINE:</span>
                            </label>
                            <form onSubmit={handleCheckPincode} className="flex gap-2">
                                <input
                                    id="pincode-input"
                                    name="pincode"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="postal-code"
                                    maxLength="6"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 6-digit Pincode (e.g. 110001)"
                                    className="flex-1 px-3 py-3 text-base sm:text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-black min-h-[48px]"
                                />
                                <button
                                    type="submit"
                                    className="px-5 py-3 bg-[#161616] text-white text-xs font-semibold rounded-xl hover:bg-[#C69722] transition min-h-[48px] tap-target-48"
                                >
                                    Check
                                </button>
                            </form>
                            {pincodeResult && (
                                <div className={`text-xs p-2.5 rounded-xl ${pincodeResult.valid ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {pincodeResult.valid ? (
                                        <div className="space-y-0.5">
                                            <p className="font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                                Delivery in {pincodeResult.eta}
                                            </p>
                                            <p className="text-[11px] text-green-700">Dispatch from Jaipur Atelier via {pincodeResult.courier} • COD Available</p>
                                        </div>
                                    ) : (
                                        <p>{pincodeResult.message}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sacred Trust Strip */}
                        <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-stone-700">
                            <div className="p-3 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center gap-2.5">
                                <Gem className="w-4 h-4 text-[#C69722] flex-shrink-0" />
                                <span>100% Hand-Carved Makrana Marble</span>
                            </div>
                            <div className="p-3 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center gap-2.5">
                                <Sparkles className="w-4 h-4 text-[#C69722] flex-shrink-0" />
                                <span>Pran Pratishtha Ready</span>
                            </div>
                            <div className="p-3 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center gap-2.5">
                                <PackageCheck className="w-4 h-4 text-[#C69722] flex-shrink-0" />
                                <span>7-Layer Wooden Crate Insured</span>
                            </div>
                            <div className="p-3 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center gap-2.5">
                                <RotateCcw className="w-4 h-4 text-[#C69722] flex-shrink-0" />
                                <span>7-Day Zero-Risk Returns</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ================= MIDDLE: TECHNICAL & SPIRITUAL TABS ================= */}
                <div className="mt-16 bg-white rounded-3xl border border-[#E6D6B8] p-6 sm:p-10 shadow-sm">
                    <div className="flex flex-wrap gap-3 border-b border-stone-200 pb-4">
                        {[
                            { key: 'specs', label: 'Craft Specifications' },
                            { key: 'vaastu', label: 'Vaastu Directions & Placement' },
                            { key: 'care', label: 'Care & Sacred Cleansing' },
                            { key: 'shipping', label: 'Zero-Breakage Packaging' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition ${
                                    activeTab === tab.key
                                        ? 'bg-[#161616] text-white shadow-xs'
                                        : 'bg-stone-50 hover:bg-[#FAF5E8] text-stone-600'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="pt-6">
                        {activeTab === 'specs' && (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-stone-600">
                                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                                    <p className="font-semibold text-stone-400 uppercase text-[10px]">MATERIAL DENSITY</p>
                                    <p className="font-bold text-stone-900 text-sm">Grade-A Makrana Marble</p>
                                    <p className="text-stone-500 text-[11px]">Zero synthetic resin fillers, natural crystalline translucence.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                                    <p className="font-semibold text-stone-400 uppercase text-[10px]">SURFACE EMBELLISHMENT</p>
                                    <p className="font-bold text-stone-900 text-sm">24K Gold Zaree Leaf</p>
                                    <p className="text-stone-500 text-[11px]">Organic protective lacquer coating ensures permanent non-fading shine.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                                    <p className="font-semibold text-stone-400 uppercase text-[10px]">WEIGHT ESTIMATE</p>
                                    <p className="font-bold text-stone-900 text-sm">380g (9cm) • 1.2kg (15cm)</p>
                                    <p className="text-stone-500 text-[11px]">Substantial hand feel preventing vibrations on vehicle dashboards.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                                    <p className="font-semibold text-stone-400 uppercase text-[10px]">ARTISAN PROVENANCE</p>
                                    <p className="font-bold text-stone-900 text-sm">Jaipur Heritage Atelier</p>
                                    <p className="text-stone-500 text-[11px]">Carved following strict Shilpa Shastra proportions by master sculptors.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'vaastu' && (
                            <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
                                <p>
                                    According to ancient Sanatan Vaastu Shastra, placing this consecrated <strong>{product.deity}</strong> idol in your home or vehicle unlocks auspicious vibrations:
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                                    <div className="p-4 rounded-2xl bg-[#FAF5E8] border border-[#E6D6B8] space-y-1.5">
                                        <h4 className="font-bold text-[#161616] text-xs uppercase flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-[#C69722]" /> Home Mandir Direction
                                        </h4>
                                        <p className="text-xs text-stone-600">
                                            Position in the <strong>North-East (Ishanya Kon)</strong> or East corner of your room, facing West. Place at chest level to ensure sacred eyes align with your prayers.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-[#FAF5E8] border border-[#E6D6B8] space-y-1.5">
                                        <h4 className="font-bold text-[#161616] text-xs uppercase flex items-center gap-1.5">
                                            <Truck className="w-3.5 h-3.5 text-[#C69722]" /> Car Dashboard Placement
                                        </h4>
                                        <p className="text-xs text-stone-600">
                                            Position centrally on the dashboard facing inwards towards the cabin or forward with clear sight. The included silicone pad keeps it steady without residue.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'care' && (
                            <div className="space-y-3 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
                                <p>
                                    To protect the sacred energy and radiant finish of your Makrana marble idol:
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-600">
                                    <li>Dust gently using a dry, ultra-soft microfiber cloth or natural camel hair brush.</li>
                                    <li>For ceremonial Abhishekham, use sacred Ganga Jal or rose water. Dry immediately with a clean cotton towel.</li>
                                    <li><strong>Never use</strong> acidic substances like lemon, harsh chemical detergents, or abrasive scrubbers on gold foil detailing.</li>
                                    <li>Re-energize your murti under moonlight during Poornima or during auspicious festivals like Navratri and Diwali.</li>
                                </ul>
                            </div>
                        )}

                        {activeTab === 'shipping' && (
                            <div className="space-y-3 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
                                <p>
                                    Every Amol Marble Murti Bhandar idol is treated as sacred art:
                                </p>
                                <div className="grid sm:grid-cols-3 gap-4 pt-2 text-xs">
                                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                                        <strong className="block text-stone-900 mb-1">1. High-Density Foam</strong>
                                        Custom contour molded to cushion every weapon, crown, and delicate extremity.
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                                        <strong className="block text-stone-900 mb-1">2. Velvet Gift Box</strong>
                                        Royal crimson velvet presentation case suitable for immediate gifting.
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                                        <strong className="block text-stone-900 mb-1">3. Outer Wooden Crate</strong>
                                        Engineered pine wood crating with tamper-evident seal and 100% transit insurance.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ================= REVIEWS SECTION (USER-REQUESTED FEATURE) ================= */}
                <div id="reviews" className="mt-16 pt-10 border-t border-[#E6D6B8] scroll-mt-24">
                    {/* Review Header & Score Breakdown */}
                    <div className="bg-white rounded-3xl border border-[#E6D6B8] p-6 sm:p-10 shadow-sm mb-10">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                            {/* Overall Score */}
                            <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-stone-200 pb-6 md:pb-0 md:pr-8">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <span className="font-serif text-5xl font-extrabold text-[#161616]">4.9</span>
                                    <div>
                                        <div className="flex text-amber-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                            ))}
                                        </div>
                                        <p className="text-xs text-stone-500 mt-0.5">out of 5 stars</p>
                                    </div>
                                </div>
                                <p className="text-xs font-semibold text-stone-700">Based on 142 Verified Temple Buyers</p>
                                <p className="text-[11px] text-green-700 font-medium flex items-center justify-center md:justify-start gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> 98% of reviewers recommend this murti
                                </p>
                            </div>

                            {/* Star Breakdown Bars */}
                            <div className="md:col-span-5 space-y-1.5 text-xs text-stone-600">
                                {[
                                    { star: 5, pct: 88, count: 125 },
                                    { star: 4, pct: 9, count: 13 },
                                    { star: 3, pct: 2, count: 3 },
                                    { star: 2, pct: 1, count: 1 },
                                    { star: 1, pct: 0, count: 0 }
                                ].map(bar => (
                                    <div key={bar.star} className="flex items-center gap-2">
                                        <span className="w-12 text-[11px] font-semibold">{bar.star} stars</span>
                                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-[#C69722] rounded-full"
                                                style={{ width: `${bar.pct}%` }}
                                            ></div>
                                        </div>
                                        <span className="w-8 text-[11px] text-stone-400 text-right">{bar.count}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Write Review CTA */}
                            <div className="md:col-span-3 text-center md:text-right">
                                <button
                                    onClick={() => setIsWriteReviewOpen(true)}
                                    className="px-6 py-3 rounded-full bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold tracking-wider uppercase transition shadow-md w-full sm:w-auto"
                                >
                                    Write a Sacred Review
                                </button>
                                <p className="text-[10px] text-stone-400 mt-2">Only verified buyers can review</p>
                            </div>
                        </div>

                        {/* Interactive Write Review Form Drawer */}
                        {isWriteReviewOpen && (
                            <form onSubmit={handleReviewSubmit} className="mt-8 pt-8 border-t border-stone-200 animate-in fade-in duration-200 space-y-4 bg-[#FAF5E8]/60 p-6 rounded-2xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-serif text-lg font-bold text-[#161616]">Share Your Sacred Experience</h3>
                                    <button onClick={() => setIsWriteReviewOpen(false)} className="text-stone-400 hover:text-black">✕</button>
                                </div>

                                {reviewSubmitted ? (
                                    <div className="p-4 rounded-xl bg-green-100 text-green-800 text-xs font-bold flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Thank you! Your sacred review has been verified and published.</span>
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="review-author" className="text-xs font-bold text-stone-700 block mb-1">YOUR NAME</label>
                                            <input
                                                id="review-author"
                                                name="name"
                                                type="text"
                                                autoComplete="name"
                                                required
                                                value={newReview.name}
                                                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                                                placeholder="e.g. Ramesh Kumar"
                                                className="w-full px-3.5 py-3 text-base sm:text-xs rounded-xl border border-stone-300 bg-white min-h-[48px]"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="review-location" className="text-xs font-bold text-stone-700 block mb-1">CITY, STATE</label>
                                            <input
                                                id="review-location"
                                                name="location"
                                                type="text"
                                                autoComplete="address-level2"
                                                value={newReview.location}
                                                onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                                                placeholder="e.g. Bengaluru, Karnataka"
                                                className="w-full px-3.5 py-3 text-base sm:text-xs rounded-xl border border-stone-300 bg-white min-h-[48px]"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-xs font-bold text-stone-700 block mb-1">STAR RATING</label>
                                            <div className="flex gap-2 text-amber-500">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        type="button"
                                                        key={star}
                                                        onClick={() => setNewReview({ ...newReview, rating: star })}
                                                        className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-stone-100 transition tap-target-48"
                                                        aria-label={`${star} Stars`}
                                                    >
                                                        <Star className={`w-6 h-6 ${star <= newReview.rating ? 'fill-current text-amber-500' : 'text-stone-300'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="review-title" className="text-xs font-bold text-stone-700 block mb-1">REVIEW HEADLINE</label>
                                            <input
                                                id="review-title"
                                                name="title"
                                                type="text"
                                                required
                                                value={newReview.title}
                                                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                                                placeholder="Summarize your experience (e.g. Breathtaking details, arrived safely)"
                                                className="w-full px-3.5 py-3 text-base sm:text-xs rounded-xl border border-stone-300 bg-white min-h-[48px]"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="review-comment" className="text-xs font-bold text-stone-700 block mb-1">DETAILED REVIEW</label>
                                            <textarea
                                                id="review-comment"
                                                name="comment"
                                                rows="3"
                                                required
                                                value={newReview.comment}
                                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                placeholder="Describe the carving, energy, packaging, or placement in your home mandir..."
                                                className="w-full px-3.5 py-3 text-base sm:text-xs rounded-xl border border-stone-300 bg-white"
                                            ></textarea>
                                        </div>
                                        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsWriteReviewOpen(false)}
                                                className="min-h-[48px] px-6 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold hover:border-black transition tap-target-48"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="min-h-[48px] px-7 py-2.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold transition shadow-sm tap-target-48 active:scale-98"
                                            >
                                                Submit Review
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>

                    {/* Review Filters Pill Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-stone-500 font-semibold mr-1">Filter Reviews:</span>
                            {[
                                { key: 'all', label: `All Reviews (${reviews.length})` },
                                { key: '5', label: '5 Stars Only' },
                                { key: 'with-photos', label: 'With Photos' },
                                { key: 'car-dash', label: 'Car Dashboard Reviews' }
                            ].map(flt => (
                                <button
                                    key={flt.key}
                                    onClick={() => setReviewFilter(flt.key)}
                                    className={`px-3 py-1.5 rounded-full text-xs transition ${
                                        reviewFilter === flt.key
                                            ? 'bg-[#161616] text-white font-bold'
                                            : 'bg-white border border-stone-200 text-stone-700 hover:border-black'
                                    }`}
                                >
                                    {flt.label}
                                </button>
                            ))}
                        </div>

                        <span className="text-xs text-stone-400 font-medium">
                            Showing {filteredReviews.length} verified reviews
                        </span>
                    </div>

                    {/* ================= INDIVIDUAL REVIEW CARDS ================= */}
                    <div className="space-y-6">
                        {filteredReviews.map(rev => (
                            <div
                                key={rev.id}
                                className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs hover:shadow-md transition space-y-4"
                            >
                                {/* Reviewer Header */}
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {/* Profile Avatar with Initials */}
                                        <div className={`w-10 h-10 rounded-full ${rev.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-xs`}>
                                            {rev.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-[#161616]">{rev.author}</h4>
                                                {/* Verified Purchase Badge */}
                                                {rev.verified && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-800 text-[10px] font-bold">
                                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                                        Verified Temple Buyer
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                                                <MapPin className="w-3 h-3" />
                                                <span>{rev.location}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Star Rating & Purchase Date */}
                                    <div className="text-right">
                                        <div className="flex text-amber-500 justify-end">
                                            {[...Array(rev.rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1 justify-end">
                                            <Calendar className="w-3 h-3" />
                                            <span>Purchased on {rev.date}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Review Title and Description */}
                                <div className="space-y-2">
                                    <h3 className="font-serif text-lg font-bold text-[#161616] leading-snug">
                                        "{rev.title}"
                                    </h3>
                                    <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed whitespace-pre-line">
                                        {rev.content}
                                    </p>
                                </div>

                                {/* Review Photo Thumbnail (if uploaded) */}
                                {rev.hasPhoto && (
                                    <div className="pt-1">
                                        <div className="inline-flex items-center gap-2 p-1.5 rounded-xl border border-stone-200 bg-stone-50">
                                            <img
                                                src={rev.photoUrl}
                                                alt="Customer verification"
                                                className="w-14 h-14 rounded-lg object-cover bg-white"
                                            />
                                            <span className="text-[10px] font-semibold text-stone-500 pr-2">Customer Altar Photo</span>
                                        </div>
                                    </div>
                                )}

                                {/* Helpful / Not Helpful Buttons */}
                                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[11px]">Was this review helpful?</span>
                                        <button
                                            onClick={() => handleVote(rev.id, 'helpful')}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                                                rev.userVote === 'helpful'
                                                    ? 'bg-green-50 border-green-500 text-green-800'
                                                    : 'border-stone-200 hover:border-black text-stone-700 bg-white'
                                            }`}
                                        >
                                            <ThumbsUp className={`w-3.5 h-3.5 ${rev.userVote === 'helpful' ? 'text-green-600 fill-green-600' : ''}`} />
                                            <span>Helpful ({rev.helpfulCount})</span>
                                        </button>

                                        <button
                                            onClick={() => handleVote(rev.id, 'unhelpful')}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                                                rev.userVote === 'unhelpful'
                                                    ? 'bg-stone-200 border-stone-400 text-stone-800'
                                                    : 'border-stone-200 hover:border-black text-stone-700 bg-white'
                                            }`}
                                        >
                                            <ThumbsDown className="w-3.5 h-3.5" />
                                            <span>Not helpful ({rev.unhelpfulCount})</span>
                                        </button>
                                    </div>

                                    <span className="text-[10px] text-stone-400">Verified Order Authentication</span>
                                </div>

                                {/* Seller Response */}
                                {rev.sellerReply && (
                                    <div className="mt-4 p-4 rounded-2xl bg-[#FAF5E8] border border-[#E6D6B8] space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-[#161616] flex items-center gap-1.5">
                                                <Award className="w-4 h-4 text-[#C69722]" />
                                                <span>{rev.sellerReply.author}</span>
                                            </span>
                                            <span className="text-[10px] text-stone-400">{rev.sellerReply.date}</span>
                                        </div>
                                        <p className="text-xs text-stone-600 leading-relaxed italic">
                                            "{rev.sellerReply.text}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ================= RELATED PRODUCTS / YOU MAY ALSO LIKE ================= */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20 pt-12 border-t border-[#E6D6B8]">
                        <div className="text-center mb-10">
                            <div className="flex items-center justify-center gap-2 text-[10px] tracking-[0.24em] uppercase text-[#9E781E] font-semibold mb-2">
                                <span>───✦</span> <span>COMPLETE YOUR MANDIR</span> <span>✦───</span>
                            </div>
                            <h2 className="font-serif text-3xl sm:text-4xl text-[#161616]">
                                You May Also Like
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                                >
                                    <div>
                                        <div
                                            onClick={() => onSelectProduct(item)}
                                            className="relative rounded-xl overflow-hidden aspect-square mb-3 bg-[#FAF5E8] border border-stone-100 cursor-pointer"
                                        >
                                            <img
                                                src={item.img}
                                                alt={item.title}
                                                className="w-full h-full object-cover img-studio-contrast group-hover:scale-105 transition duration-300"
                                            />
                                            <span className="absolute top-2.5 right-2.5 bg-[#F7C600] text-[#161616] text-[10px] font-extrabold px-2 py-0.5 rounded shadow-xs">
                                                {item.off}
                                            </span>
                                        </div>
                                        <h3
                                            onClick={() => onSelectProduct(item)}
                                            className="text-xs font-semibold text-[#161616] line-clamp-2 leading-snug cursor-pointer hover:text-[#C69722] transition"
                                        >
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="font-serif text-base font-bold text-[#161616]">
                                                Rs. {typeof item.price === 'number' ? item.price.toLocaleString('en-IN') : item.price}
                                            </span>
                                            {item.oldPrice && (
                                                <span className="text-[11px] text-stone-400 line-through">
                                                    Rs. {item.oldPrice.toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button
                                            onClick={() => onSelectProduct(item)}
                                            className="py-2 rounded-lg border border-stone-300 text-stone-700 hover:border-black text-[10px] font-bold uppercase transition"
                                        >
                                            VIEW DETAILS
                                        </button>
                                        <button
                                            onClick={() => onAddToCart(item)}
                                            className="py-2 rounded-lg bg-[#161616] hover:bg-[#C69722] text-white text-[10px] font-bold uppercase transition"
                                        >
                                            ADD TO CART
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Sticky Mobile Bottom Buy Action Bar (Thumb-Zone Priority) */}
            <div
                style={{ backgroundColor: '#FAF5E8' }}
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF5E8] border-t-2 border-[#D8C59D] px-4 py-3 safe-bottom-pad shadow-[0_-8px_32px_rgba(0,0,0,0.18)] flex items-center justify-between gap-3"
            >
                <div className="flex flex-col">
                    <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Sacred Idol</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-lg font-bold text-[#161616]">
                            Rs. {finalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-400 line-through">
                            ₹{finalOldPrice.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-[240px] justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            for (let i = 0; i < qty; i++) {
                                onAddToCart({
                                    ...product,
                                    price: finalPrice,
                                    title: `${product.title} (${selectedSize.split(' ')[0]} - ${selectedFinish})`
                                }, false);
                            }
                        }}
                        className="min-h-[48px] px-3.5 rounded-xl border border-[#161616] text-[#161616] hover:bg-[#161616] hover:text-white text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 tap-target-48 active:scale-95"
                        aria-label="Add to cart"
                    >
                        <ShoppingBag className="w-4 h-4 text-[#C69722]" />
                        <span className="text-[11px]">Add</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const itemToBuy = {
                                ...product,
                                price: finalPrice,
                                title: `${product.title} (${selectedSize.split(' ')[0]} - ${selectedFinish})`
                            };
                            if (onBuyNow) {
                                onBuyNow(itemToBuy);
                            } else {
                                onAddToCart(itemToBuy, true);
                            }
                        }}
                        className="flex-1 min-h-[48px] px-3.5 rounded-xl bg-gradient-to-r from-[#F7C600] to-[#E5B500] text-[#161616] text-xs font-black tracking-wider uppercase transition shadow-md flex items-center justify-center gap-1.5 active:scale-95 tap-target-48"
                    >
                        <span>Buy Now</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
