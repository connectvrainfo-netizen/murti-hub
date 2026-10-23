import React, { useState, useEffect } from 'react';
import {
    X, Shield, Settings as SettingsIcon, Image as ImageIcon,
    Package, Sparkles, Tag, MessageSquare, Phone, Star,
    Plus, Trash2, Edit3, Check, RefreshCw, Eye, EyeOff,
    Upload, AlertCircle, CheckCircle2, Lock, ArrowRight, ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { deityCategories as defaultCategories, catalog as defaultCatalog } from '../data/catalog';
import brandLogo from '../assets/logo.png';

// Guarantee all 20 existing products from the store catalog are immediately available in Admin Portal Modal
const initialProducts = defaultCatalog.map((item) => ({
    id: `legacy-${item.id}`,
    legacy_id: item.id,
    title: item.title,
    slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    price: item.price,
    old_price: item.oldPrice,
    off_text: item.off,
    deity: item.deity,
    group_tag: item.group,
    material: "Pure White Makrana Marble",
    description: `Sanctified ${item.title}. Hand-carved in pure Makrana white marble by master sculptors of Jaipur with 24K gold foil detailing. Consecrated for sacred home mandir.`,
    dimensions: "9 cm x 6 cm x 4 cm",
    weight: "850 grams",
    primary_catalog_image: item.img,
    img: item.img,
    catalog_images: [
        { url: item.img, caption: "Front Sacred View", sort_order: 1 },
        { url: item.img, caption: "Detailed Craftsmanship", sort_order: 2 }
    ],
    rating_mode: "enabled",
    static_rating_value: 5.0,
    static_reviews_count: 24,
    stock_status: "in_stock",
    is_featured: true,
    pran_pratishtha_ready: true,
    gold_leaf_karigari: true,
    is_active: true,
    sort_order: item.id
}));

const initialCategories = defaultCategories.map((c, idx) => ({
    id: `cat-${c.id}`,
    name: c.name,
    slug: c.id,
    route: c.route,
    img: c.img,
    banner_url: c.img,
    sort_order: idx + 1,
    is_active: true
}));

const initialSizes = [
    { id: 'size-1', label: '6 Inches (Pooja Altar)', height_inches: 6.0, description: 'Compact altar and car dashboard size', sort_order: 1, is_active: true },
    { id: 'size-2', label: '9 Inches (Home Mandir)', height_inches: 9.0, description: 'Standard home temple size', sort_order: 2, is_active: true },
    { id: 'size-3', label: '12 Inches (Classic Mandir)', height_inches: 12.0, description: 'Most popular home sanctum idol size', sort_order: 3, is_active: true },
    { id: 'size-4', label: '15 Inches (Grand Mandir)', height_inches: 15.0, description: 'Spacious dedicated pooja room size', sort_order: 4, is_active: true },
    { id: 'size-5', label: '18 Inches (Temple Sanctum)', height_inches: 18.0, description: 'Large sanctified temple & hall idol', sort_order: 5, is_active: true },
    { id: 'size-6', label: '24 Inches (Grand Heritage)', height_inches: 24.0, description: 'Life-presence heritage temple idol', sort_order: 6, is_active: true }
];

export default function AdminPortalModal({ isOpen, onClose, onDataChanged }) {
    if (!isOpen) return null;

    // Active Admin Tab
    // 'dashboard' | 'categories' | 'products' | 'sizes' | 'festival' | 'settings' | 'reviews'
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(Boolean(api.getToken()));
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });

    // Data States - Pre-seeded with existing catalog data
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [stats, setStats] = useState(null);
    const [settings, setSettings] = useState({
        whatsapp_number: '+919876543210',
        whatsapp_default_message: 'Namaste! I want to inquire about a Murti on Murti Hub.',
        global_rating_mode: 'enabled'
    });
    const [categories, setCategories] = useState(initialCategories);
    const [products, setProducts] = useState(initialProducts);
    const [sizes, setSizes] = useState(initialSizes);
    const [festival, setFestival] = useState(null);
    const [reviews, setReviews] = useState([]);

    // Editing Modals / Drawers
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingSize, setEditingSize] = useState(null);
    const [newSizeForm, setNewSizeForm] = useState({ label: '', height_inches: 12.0, description: '', sort_order: 1, is_active: true });
    const [replyReviewId, setReplyReviewId] = useState(null);
    const [replyText, setReplyText] = useState('');

    // Lock body scroll & pause Lenis smooth scrolling when modal is active
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        if (typeof window !== 'undefined' && window.__lenis) {
            window.__lenis.stop();
        }
        return () => {
            document.body.style.overflow = '';
            if (typeof window !== 'undefined' && window.__lenis) {
                window.__lenis.start();
            }
        };
    }, [isOpen]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    // Load initial data
    const refreshAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, settsRes, catsRes, prodsRes, sizesRes, festRes, revsRes] = await Promise.allSettled([
                api.getDashboardStats(),
                api.getSettings(),
                api.getCategories(true),
                api.getProducts({ include_inactive: true }),
                api.getSizes(true),
                api.getActiveFestival(),
                api.getAllReviews()
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value?.data) setStats(statsRes.value.data);
            if (settsRes.status === 'fulfilled' && settsRes.value) setSettings(settsRes.value);
            if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value) && catsRes.value.length > 0) {
                setCategories(catsRes.value);
            }
            if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value?.items) && prodsRes.value.items.length > 0) {
                setProducts(prodsRes.value.items);
            }
            if (sizesRes.status === 'fulfilled' && Array.isArray(sizesRes.value) && sizesRes.value.length > 0) {
                setSizes(sizesRes.value);
            }
            if (festRes.status === 'fulfilled' && festRes.value) setFestival(festRes.value);
            if (revsRes.status === 'fulfilled' && Array.isArray(revsRes.value) && revsRes.value.length > 0) setReviews(revsRes.value);

            if (onDataChanged) onDataChanged();
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = api.getToken();
        if (token) {
            api.getMe()
                .then(() => {
                    setIsAuthenticated(true);
                    refreshAllData();
                })
                .catch(() => {
                    api.logout();
                    setIsAuthenticated(false);
                });
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            refreshAllData();
        }
    }, [isAuthenticated]);

    // Handle Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');

        if (!loginForm.email.trim() || !loginForm.password) {
            setAuthError('Please enter both email and password.');
            setAuthLoading(false);
            return;
        }

        try {
            await api.login(loginForm.email.trim(), loginForm.password);
            setIsAuthenticated(true);
            showToast('Welcome back, Admin!');
            refreshAllData();
        } catch (err) {
            setAuthError(err.message || 'Login failed. Check credentials.');
            setIsAuthenticated(false);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        api.logout();
        setIsAuthenticated(false);
    };

    // =========================================================================
    // REQ #4 & REQ #5: UPDATE SETTINGS (WhatsApp & Global Rating Mode)
    // =========================================================================
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            await api.updateSettings(settings);
            showToast('Settings saved successfully!');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleQuickRatingToggle = async (mode) => {
        try {
            await api.updateRatingMode(mode);
            setSettings(prev => ({ ...prev, global_rating_mode: mode }));
            showToast(`Global rating mode set to "${mode}"`);
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    // =========================================================================
    // REQ #1: CATEGORIES & BANNER IMAGES
    // =========================================================================
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!editingCategory) return;
        try {
            await api.updateCategory(editingCategory.id, editingCategory);
            showToast(`Category "${editingCategory.name}" updated!`);
            setEditingCategory(null);
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    // =========================================================================
    // REQ #7: MASTER SIZES
    // =========================================================================
    const handleCreateSize = async (e) => {
        e.preventDefault();
        try {
            await api.createSize(newSizeForm);
            showToast(`Size "${newSizeForm.label}" created!`);
            setNewSizeForm({ label: '', height_inches: 12.0, description: '', sort_order: 1, is_active: true });
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleDeleteSize = async (sizeId) => {
        if (!confirm('Are you sure you want to delete this size?')) return;
        try {
            await api.deleteSize(sizeId);
            showToast('Size deleted successfully');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    // =========================================================================
    // REQ #6: FESTIVAL SECTION MANAGEMENT
    // =========================================================================
    const handleSaveFestival = async (e) => {
        e.preventDefault();
        if (!festival) return;
        try {
            await api.updateFestival(festival.id, festival);
            showToast('Festival section updated!');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleUnlinkFestivalItem = async (murtiId) => {
        if (!festival) return;
        try {
            await api.unlinkFestivalProduct(festival.id, murtiId);
            showToast('Product unlinked from festival');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    // =========================================================================
    // REQ #2 & REQ #3 & REQ #5: PRODUCT EDITING & CATALOG IMAGES
    // =========================================================================
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;
        try {
            await api.updateProduct(editingProduct.id, editingProduct);
            showToast(`Product "${editingProduct.title}" updated!`);
            setEditingProduct(null);
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleAddCatalogImage = () => {
        if (!editingProduct) return;
        const currentImages = editingProduct.catalog_images || [];
        const newImage = {
            url: editingProduct.primary_catalog_image || '/images/products/ram-darbar.png',
            caption: 'Angle View',
            sort_order: currentImages.length + 1
        };
        setEditingProduct({
            ...editingProduct,
            catalog_images: [...currentImages, newImage]
        });
    };

    const handleRemoveCatalogImage = (idx) => {
        if (!editingProduct) return;
        const updated = (editingProduct.catalog_images || []).filter((_, i) => i !== idx);
        setEditingProduct({ ...editingProduct, catalog_images: updated });
    };

    // =========================================================================
    // REVIEWS MODERATION & SELLER REPLIES
    // =========================================================================
    const handleSendSellerReply = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            await api.replyToReview(reviewId, replyText);
            showToast('Seller response published!');
            setReplyReviewId(null);
            setReplyText('');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleToggleReviewApproval = async (review) => {
        try {
            await api.moderateReview(review.id, { is_approved: !review.is_approved });
            showToast(review.is_approved ? 'Review hidden' : 'Review approved');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleSeedDatabase = async () => {
        if (!confirm('This will seed the database with all catalog data, categories, sizes, and festival items. Proceed?')) return;
        try {
            setLoading(true);
            const res = await api.seedDatabase();
            showToast(res.message || 'Database seeded successfully!');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200" data-lenis-prevent="true">
            <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#FAF8F5] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#DFC48D]" data-lenis-prevent="true">

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#161616] text-[#F7C600] px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 border border-[#F7C600]/40 animate-in slide-in-from-top duration-300">
                        <CheckCircle2 className="w-4 h-4 text-[#F7C600]" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Top Header Bar */}
                <div className="px-5 sm:px-8 py-3.5 bg-gradient-to-r from-[#1E1B18] via-[#2A241E] to-[#1E1B18] text-white flex items-center justify-between border-b border-[#DFC48D]/30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <img
                            src={brandLogo}
                            alt="अमोल मार्बल मूर्ती भंडार"
                            className="h-10 sm:h-12 w-auto object-contain"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-serif text-base sm:text-lg font-bold text-[#F7C600] tracking-wide leading-tight">
                                    Murti Hub Admin Console
                                </h2>
                                <span className="text-[10px] bg-white/10 text-stone-300 px-2 py-0.5 rounded-full font-mono">
                                    FastAPI + Supabase
                                </span>
                            </div>
                            <p className="text-[11px] text-stone-300 hidden sm:block">
                                Manage categories, catalog images, sizes, festival campaigns & ratings
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAuthenticated && (
                            <button
                                onClick={refreshAllData}
                                disabled={loading}
                                className="p-2 text-stone-300 hover:text-white rounded-lg hover:bg-white/10 transition"
                                title="Refresh data from server"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        {isAuthenticated && (
                            <button
                                onClick={handleLogout}
                                className="text-xs text-rose-300 hover:text-rose-100 font-bold px-3 py-1.5 rounded-lg border border-rose-400/30 hover:bg-rose-950/40 transition"
                            >
                                Logout
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                            aria-label="Close Admin Modal"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Login View if not authenticated */}
                {!isAuthenticated ? (
                    <div className="flex-1 p-6 sm:p-12 flex flex-col items-center justify-center text-center overflow-y-auto">
                        <img
                            src={brandLogo}
                            alt="अमोल मार्बल मूर्ती भंडार"
                            className="h-20 sm:h-24 w-auto object-contain mx-auto mb-4 drop-shadow-md"
                        />
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#161616]">
                            Admin Portal Authentication
                        </h3>
                        <p className="text-xs text-stone-500 max-w-sm mt-1 mb-6">
                            Sign in to access all 7 admin operations: category images, sizes, catalog gallery, festival campaigns, WhatsApp concierge and rating modes.
                        </p>

                        {authError && (
                            <div className="w-full max-w-sm mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{authError}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3.5 text-left">
                            <div>
                                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-[#C69722]"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-[#C69722]"
                                />
                            </div>

                            <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-[11px] text-stone-600 space-y-0.5">
                                <div className="text-stone-800 font-bold">Default Credentials:</div>
                                <div>Email: <code className="text-[#C69722] font-semibold">admin@amolmurtibhandar.com</code></div>
                                <div>Password: <code className="text-[#C69722] font-semibold">admin123</code></div>
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full py-3 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 mt-2"
                            >
                                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                <span>SIGN IN TO ADMIN CONSOLE</span>
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Authenticated Admin Dashboard Layout */
                    <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden" data-lenis-prevent="true">
                        
                        {/* Sidebar Navigation - Fixed & Sticky, does not move while scrolling */}
                        <div className="w-full md:w-72 lg:w-80 bg-[#FAF6EE] border-r border-[#E8DFD0] p-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar flex-shrink-0 md:h-full md:sticky md:top-0" data-lenis-prevent="true">
                            {/* Clean Section Header */}
                            <div className="flex items-center justify-between px-2 pt-1 pb-2 hidden md:flex">
                                <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                                    Navigation
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                </span>
                            </div>

                            <nav className="flex md:flex-col gap-1 w-full" aria-label="Admin Navigation">
                                {[
                                    { id: 'dashboard', label: 'Overview Dashboard', icon: Shield },
                                    { id: 'settings', label: 'WhatsApp & Rating', icon: Phone },
                                    { id: 'categories', label: 'Category Images', icon: ImageIcon },
                                    { id: 'products', label: 'Products & Catalog', icon: Package, count: products?.length },
                                    { id: 'sizes', label: 'Master Sizes', icon: Tag, count: sizes?.length },
                                    { id: 'festival', label: 'Festival Area', icon: Sparkles, isFestive: true },
                                    { id: 'reviews', label: 'Customer Reviews', icon: Star, count: reviews?.length },
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    const isCur = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`group relative flex-shrink-0 w-auto md:w-full px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between gap-3.5 select-none ${
                                                isCur
                                                    ? tab.isFestive
                                                        ? 'bg-gradient-to-r from-amber-50 via-white to-white text-stone-900 shadow-xs ring-1 ring-amber-500/20 border-l-4 border-l-amber-500'
                                                        : 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/5 border-l-4 border-l-[#C69722]'
                                                    : 'text-stone-600 hover:bg-white/80 hover:text-stone-900 hover:shadow-2xs'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                                        isCur
                                                            ? tab.isFestive
                                                                ? 'bg-amber-100 text-amber-700 shadow-2xs'
                                                                : 'bg-[#FAF2DE] text-[#8E5B00] border border-[#DFC48D]/50 shadow-2xs'
                                                            : 'bg-stone-200/60 text-stone-500 group-hover:bg-[#FAF2DE] group-hover:text-[#8E5B00]'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4 stroke-[2]" />
                                                </div>
                                                <span className={`text-[13px] whitespace-nowrap tracking-tight ${isCur ? 'font-bold text-stone-900' : 'font-semibold text-stone-700 group-hover:text-stone-900'}`}>
                                                    {tab.label}
                                                </span>
                                            </div>

                                            {/* Count Badge */}
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {tab.count !== undefined && tab.count > 0 && (
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono transition-colors ${
                                                        isCur ? 'bg-[#FAF2DE] text-[#8E5B00]' : 'bg-stone-200/70 text-stone-600 group-hover:bg-stone-300'
                                                    }`}>
                                                        {tab.count}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Main Tab Content Area */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6" data-lenis-prevent="true">

                            {/* ========================================================================= */}
                            {/* TAB 1: OVERVIEW DASHBOARD */}
                            {/* ========================================================================= */}
                            {activeTab === 'dashboard' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-[#161616]">
                                            Admin Operations Dashboard
                                        </h3>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            Real-time overview of Amol Marble Murti Bhandar backend controls
                                        </p>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                                            <span className="text-[10px] uppercase font-bold text-stone-400">Total Products</span>
                                            <div className="text-2xl font-serif font-black text-[#161616] mt-1">{products.length}</div>
                                            <span className="text-[10px] text-emerald-600 font-semibold">Active in Catalog</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                                            <span className="text-[10px] uppercase font-bold text-stone-400">Deity Categories</span>
                                            <div className="text-2xl font-serif font-black text-[#161616] mt-1">{categories.length}</div>
                                            <span className="text-[10px] text-stone-500 font-medium">With Banner Images</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                                            <span className="text-[10px] uppercase font-bold text-stone-400">Master Sizes</span>
                                            <div className="text-2xl font-serif font-black text-[#161616] mt-1">{sizes.length}</div>
                                            <span className="text-[10px] text-[#C69722] font-semibold">Available for Murtis</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                                            <span className="text-[10px] uppercase font-bold text-stone-400">Customer Reviews</span>
                                            <div className="text-2xl font-serif font-black text-[#161616] mt-1">{reviews.length}</div>
                                            <span className="text-[10px] text-emerald-600 font-semibold">Approved Reviews</span>
                                        </div>
                                    </div>

                                    {/* Quick Status Cards */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {/* WhatsApp Concierge Card */}
                                        <div className="bg-[#FAF2DE] border border-[#DFC48D] p-4 rounded-2xl flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-[#8E5B00] mb-1 uppercase">
                                                    <Phone className="w-4 h-4 text-[#C69722]" />
                                                    <span>Live WhatsApp Concierge</span>
                                                </div>
                                                <p className="text-xs text-stone-700">
                                                    Current Number: <strong className="text-stone-900 font-mono">{settings.whatsapp_number}</strong>
                                                </p>
                                                <p className="text-[11px] text-stone-500 mt-1 italic">
                                                    "{settings.whatsapp_default_message}"
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('settings')}
                                                className="mt-4 px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold w-fit transition"
                                            >
                                                Change Number & Message ➔
                                            </button>
                                        </div>

                                        {/* Global Rating Mode Card */}
                                        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-stone-800 mb-1 uppercase">
                                                    <Star className="w-4 h-4 text-amber-500" />
                                                    <span>Global Rating Display Mode</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                                                        settings.global_rating_mode === 'enabled'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : settings.global_rating_mode === 'read_only'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {settings.global_rating_mode}
                                                    </span>
                                                    <span className="text-[11px] text-stone-500">
                                                        {settings.global_rating_mode === 'enabled' && 'Devotees can view & submit reviews'}
                                                        {settings.global_rating_mode === 'read_only' && 'Static mode: View only, no new reviews'}
                                                        {settings.global_rating_mode === 'hidden' && 'Turned off completely on storefront'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4">
                                                <button
                                                    onClick={() => handleQuickRatingToggle('enabled')}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${settings.global_rating_mode === 'enabled' ? 'bg-emerald-700 text-white' : 'hover:bg-stone-100'}`}
                                                >
                                                    Enable
                                                </button>
                                                <button
                                                    onClick={() => handleQuickRatingToggle('read_only')}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${settings.global_rating_mode === 'read_only' ? 'bg-amber-700 text-white' : 'hover:bg-stone-100'}`}
                                                >
                                                    Static (Read-Only)
                                                </button>
                                                <button
                                                    onClick={() => handleQuickRatingToggle('hidden')}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${settings.global_rating_mode === 'hidden' ? 'bg-rose-700 text-white' : 'hover:bg-stone-100'}`}
                                                >
                                                    Off (Hidden)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 2: WHATSAPP & SITE SETTINGS */}
                            {/* ========================================================================= */}
                            {activeTab === 'settings' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-[#161616]">
                                            Site Settings & Global Admin Toggles
                                        </h3>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            Controls live WhatsApp customer routing and rating section visibility
                                        </p>
                                    </div>

                                    <form onSubmit={handleSaveSettings} className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-5">
                                        {/* WhatsApp Number */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                                WhatsApp Concierge Number
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={settings.whatsapp_number}
                                                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                                                placeholder="e.g. +919876543210 or 917020676423"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-xs text-stone-900 font-mono focus:bg-white"
                                            />
                                            <p className="text-[11px] text-stone-500">
                                                All "Buy Now on WhatsApp" buttons and inquiry dialogs redirect to this number.
                                            </p>
                                        </div>

                                        {/* WhatsApp Greeting Message */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                                Default WhatsApp Inquiry Message
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={settings.whatsapp_default_message}
                                                onChange={(e) => setSettings({ ...settings, whatsapp_default_message: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-xs text-stone-900 focus:bg-white"
                                            />
                                        </div>

                                        {/* Global Rating Mode */}
                                        <div className="space-y-2 pt-2 border-t border-stone-100">
                                            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                                Rating Section Mode
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { id: 'enabled', label: 'Enabled (Interactive)', desc: 'Users can see all reviews AND submit new ratings' },
                                                    { id: 'read_only', label: 'Static (Read-Only)', desc: 'Users can ONLY see existing ratings, cannot add new ones' },
                                                    { id: 'hidden', label: 'Turned Off (Hidden)', desc: 'Rating section is completely hidden from storefront' }
                                                ].map(m => {
                                                    const isSelected = settings.global_rating_mode === m.id;
                                                    return (
                                                        <div
                                                            key={m.id}
                                                            onClick={() => setSettings({ ...settings, global_rating_mode: m.id })}
                                                            className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                                                                isSelected
                                                                    ? 'border-[#C69722] bg-[#FAF5E8] shadow-xs'
                                                                    : 'border-stone-200 bg-white hover:border-stone-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-bold text-stone-900">{m.label}</span>
                                                                {isSelected && <Check className="w-4 h-4 text-[#C69722]" />}
                                                            </div>
                                                            <span className="text-[11px] text-stone-500 leading-snug">{m.desc}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Save Global Settings</span>
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 3: CATEGORY IMAGES SECTION */}
                            {/* ========================================================================= */}
                            {activeTab === 'categories' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-serif text-xl font-bold text-[#161616]">
                                                Category Images & Banners
                                            </h3>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                Edit deity icons, hero banner URLs, sort order, and active states
                                            </p>
                                        </div>
                                    </div>

                                    {/* Categories Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                        {categories.map(cat => (
                                            <div
                                                key={cat.id}
                                                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between space-y-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-14 h-14 rounded-full bg-[#FAF5E8] border border-[#DFC48D] overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                                        <img
                                                            src={api.getImageUrl(cat.img) || '/images/categories/ganpati@2x.png'}
                                                            alt={cat.name}
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = '/images/categories/ganpati@2x.png';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-serif font-bold text-stone-900 text-sm truncate">{cat.name}</h4>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                                                                {cat.is_active ? 'Active' : 'Draft'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-stone-400 font-mono mt-0.5">/{cat.slug}</p>
                                                        <p className="text-[11px] text-[#C69722] font-semibold mt-1">Route: {cat.route}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-stone-100 text-[11px] space-y-1">
                                                    <div className="text-stone-500 flex items-center justify-between">
                                                        <span>Banner URL:</span>
                                                        <span className="font-mono text-stone-800 truncate max-w-[150px]">{cat.banner_url || 'None'}</span>
                                                    </div>
                                                    <div className="text-stone-500 flex items-center justify-between">
                                                        <span>Sort Order:</span>
                                                        <span className="font-bold text-stone-800">{cat.sort_order}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setEditingCategory(cat)}
                                                    className="w-full py-2 rounded-xl bg-stone-100 hover:bg-[#161616] hover:text-white text-stone-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    <span>Edit Category Images</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Edit Category Drawer / Dialog */}
                                    {editingCategory && (
                                        <div 
                                            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
                                            data-lenis-prevent="true"
                                            onClick={(e) => { if (e.target === e.currentTarget) setEditingCategory(null); }}
                                        >
                                            <div 
                                                className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
                                                data-lenis-prevent="true"
                                            >
                                                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-[#FAF8F5] flex-shrink-0">
                                                    <h4 className="font-serif text-lg font-bold text-stone-900">Edit Category Images & Details</h4>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setEditingCategory(null)} 
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-black hover:bg-stone-200/60 transition"
                                                        title="Close modal"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                <form 
                                                    id="admin-portal-category-form"
                                                    onSubmit={handleSaveCategory} 
                                                    className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain"
                                                    data-lenis-prevent="true"
                                                >
                                                    <div>
                                                        <label className="text-xs font-bold text-stone-700 block mb-1">CATEGORY NAME</label>
                                                        <input
                                                            type="text"
                                                            value={editingCategory.name}
                                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-xl text-xs"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-stone-700 block mb-1">ICON IMAGE URL (CIRCLE THUMBNAIL)</label>
                                                        <input
                                                            type="text"
                                                            value={editingCategory.img || ''}
                                                            onChange={(e) => setEditingCategory({ ...editingCategory, img: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-stone-700 block mb-1">BANNER URL (HERO BANNER IMAGE)</label>
                                                        <input
                                                            type="text"
                                                            value={editingCategory.banner_url || ''}
                                                            onChange={(e) => setEditingCategory({ ...editingCategory, banner_url: e.target.value })}
                                                            placeholder="e.g. /images/categories/navratri-drop@2x.png"
                                                            className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-bold text-stone-700 block mb-1">SORT ORDER</label>
                                                            <input
                                                                type="number"
                                                                value={editingCategory.sort_order || 0}
                                                                onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value, 10) || 0 })}
                                                                className="w-full px-3 py-2 border rounded-xl text-xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-stone-700 block mb-1">ACTIVE STATUS</label>
                                                            <select
                                                                value={editingCategory.is_active ? 'true' : 'false'}
                                                                onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.value === 'true' })}
                                                                className="w-full px-3 py-2 border rounded-xl text-xs"
                                                            >
                                                                <option value="true">Active on Store</option>
                                                                <option value="false">Hidden / Draft</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </form>

                                                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-stone-200 bg-stone-50/95 flex-shrink-0">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setEditingCategory(null)} 
                                                        className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200/70 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        type="submit" 
                                                        form="admin-portal-category-form"
                                                        className="px-5 py-2 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider hover:bg-black transition shadow-sm active:scale-98"
                                                    >
                                                        Save Category
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 4: PRODUCTS & CATALOG IMAGES */}
                            {/* ========================================================================= */}
                            {activeTab === 'products' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-serif text-xl font-bold text-[#161616]">
                                                Products & Dedicated Catalog Images
                                            </h3>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                Manage listing prices, catalog gallery, rating overrides, and sizes
                                            </p>
                                        </div>
                                    </div>

                                    {/* Products Table */}
                                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs text-stone-700">
                                                <thead className="bg-[#FAF8F5] text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                                                    <tr>
                                                        <th className="p-3">Product</th>
                                                        <th className="p-3">Price</th>
                                                        <th className="p-3">Catalog Images</th>
                                                        <th className="p-3">Rating Mode</th>
                                                        <th className="p-3">Status</th>
                                                        <th className="p-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-stone-100">
                                                    {products.map(p => (
                                                        <tr key={p.id} className="hover:bg-stone-50/60 transition">
                                                            <td className="p-3 flex items-center gap-3">
                                                                <img
                                                                    src={p.primary_catalog_image || p.img}
                                                                    alt={p.title}
                                                                    className="w-10 h-10 object-contain rounded-lg bg-[#FAF5E8] p-1 border flex-shrink-0"
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-stone-900 truncate max-w-xs">{p.title}</div>
                                                                    <div className="text-[10px] text-stone-400">{p.deity} • {p.group_tag}</div>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 font-bold text-stone-900 whitespace-nowrap">
                                                                ₹{p.price?.toLocaleString('en-IN')}
                                                                {p.off_text && <span className="ml-1 text-[10px] text-amber-600 font-normal">({p.off_text})</span>}
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap">
                                                                <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                                    {p.catalog_images?.length || 1} Images in Gallery
                                                                </span>
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                    p.rating_mode === 'enabled' ? 'bg-emerald-100 text-emerald-800' :
                                                                    p.rating_mode === 'read_only' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                                                }`}>
                                                                    {p.rating_mode} ({p.static_rating_value}★)
                                                                </span>
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.is_active ? 'text-emerald-700 bg-emerald-50' : 'text-stone-400 bg-stone-100'}`}>
                                                                    {p.is_active ? 'Active' : 'Draft'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right whitespace-nowrap">
                                                                <button
                                                                    onClick={() => setEditingProduct(p)}
                                                                    className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-[#161616] hover:text-white text-stone-800 text-xs font-bold transition mr-1"
                                                                >
                                                                    Edit
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Edit Product & Catalog Images Modal */}
                                    {editingProduct && (
                                        <div 
                                            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
                                            data-lenis-prevent="true"
                                            onClick={(e) => { if (e.target === e.currentTarget) setEditingProduct(null); }}
                                        >
                                            <div 
                                                className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 relative"
                                                data-lenis-prevent="true"
                                            >
                                                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF8F5] flex-shrink-0">
                                                    <h4 className="font-serif text-lg font-bold text-stone-900">Edit Product & Catalog Image Section</h4>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setEditingProduct(null)} 
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-black hover:bg-stone-200/60 transition"
                                                        title="Close modal"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                <form 
                                                    id="admin-portal-product-form"
                                                    onSubmit={handleSaveProduct} 
                                                    className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain"
                                                    data-lenis-prevent="true"
                                                >

                                                <div>
                                                    <label className="text-xs font-bold text-stone-700 block mb-1">PRODUCT TITLE</label>
                                                    <input
                                                        type="text"
                                                        value={editingProduct.title}
                                                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                                                        className="w-full px-3 py-2 border rounded-xl text-xs"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-xs font-bold text-stone-700 block mb-1">PRICE (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={editingProduct.price}
                                                            onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 border rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-stone-700 block mb-1">OLD PRICE (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={editingProduct.old_price || ''}
                                                            onChange={(e) => setEditingProduct({ ...editingProduct, old_price: parseFloat(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 border rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-stone-700 block mb-1">DISCOUNT TEXT</label>
                                                        <input
                                                            type="text"
                                                            value={editingProduct.off_text || ''}
                                                            onChange={(e) => setEditingProduct({ ...editingProduct, off_text: e.target.value })}
                                                            placeholder="e.g. 42% off"
                                                            className="w-full px-3 py-2 border rounded-xl text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Req #3: Primary Catalog Image */}
                                                <div>
                                                    <label className="text-xs font-bold text-stone-700 block mb-1">PRIMARY CATALOG IMAGE URL</label>
                                                    <input
                                                        type="text"
                                                        value={editingProduct.primary_catalog_image || ''}
                                                        onChange={(e) => setEditingProduct({ ...editingProduct, primary_catalog_image: e.target.value })}
                                                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                                                    />
                                                </div>

                                                {/* Dedicated Catalog Image Section Gallery */}
                                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                                                            Catalog Images Gallery
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={handleAddCatalogImage}
                                                            className="px-2.5 py-1 rounded-lg bg-[#161616] text-[#F7C600] text-[11px] font-bold flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            <span>Add Catalog Angle</span>
                                                        </button>
                                                    </div>

                                                    {(editingProduct.catalog_images || []).map((img, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200">
                                                            <img src={img.url} alt="" className="w-10 h-10 object-contain rounded bg-stone-50 border flex-shrink-0" />
                                                            <input
                                                                type="text"
                                                                value={img.url}
                                                                onChange={(e) => {
                                                                    const updated = [...editingProduct.catalog_images];
                                                                    updated[idx].url = e.target.value;
                                                                    setEditingProduct({ ...editingProduct, catalog_images: updated });
                                                                }}
                                                                placeholder="Image URL"
                                                                className="flex-1 px-2.5 py-1.5 border rounded-lg text-xs font-mono"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={img.caption || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...editingProduct.catalog_images];
                                                                    updated[idx].caption = e.target.value;
                                                                    setEditingProduct({ ...editingProduct, catalog_images: updated });
                                                                }}
                                                                placeholder="Caption (e.g. Front View)"
                                                                className="w-40 px-2.5 py-1.5 border rounded-lg text-xs"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveCatalogImage(idx)}
                                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Per-product Rating Mode & Static Value Override */}
                                                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
                                                    <div>
                                                        <label className="text-xs font-bold text-stone-800 block mb-1">
                                                            PRODUCT RATING MODE
                                                        </label>
                                                        <select
                                                            value={editingProduct.rating_mode}
                                                            onChange={(e) => setEditingProduct({ ...editingProduct, rating_mode: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                                                        >
                                                            <option value="enabled">Enabled (View & Submit)</option>
                                                            <option value="read_only">Static (Read-Only Mode)</option>
                                                            <option value="hidden">Hidden (Turned Off)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-stone-800 block mb-1">
                                                            STATIC RATING VALUE (e.g. 5.00)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.05"
                                                            min="1"
                                                            max="5"
                                                            value={editingProduct.static_rating_value}
                                                            onChange={(e) => setEditingProduct({ ...editingProduct, static_rating_value: parseFloat(e.target.value) || 5.0 })}
                                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                </form>

                                                {/* Pinned Sticky Footer */}
                                                <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-stone-200 bg-stone-50/95 backdrop-blur-xs flex-shrink-0">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setEditingProduct(null)} 
                                                        className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200/70 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        type="submit" 
                                                        form="admin-portal-product-form"
                                                        className="px-5 py-2 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider hover:bg-black transition shadow-sm active:scale-98"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 5: MASTER SIZES MANAGEMENT (Req #7) */}
                            {/* ========================================================================= */}
                            {activeTab === 'sizes' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-[#161616]">
                                            Master Sizes Management
                                        </h3>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            Create and manage reusable size tags (e.g. "9 cm Compact", "15 cm Mandir", "1.5 Feet", "Mandal 5 Feet")
                                        </p>
                                    </div>

                                    {/* Add New Size Form */}
                                    <form onSubmit={handleCreateSize} className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                                        <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Add New Master Size Tag</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Label (e.g. 1.5 Feet (18 Inches))"
                                                    value={newSizeForm.label}
                                                    onChange={(e) => setNewSizeForm({ ...newSizeForm, label: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-xl text-xs"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="Height Inches"
                                                    value={newSizeForm.height_inches}
                                                    onChange={(e) => setNewSizeForm({ ...newSizeForm, height_inches: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 border rounded-xl text-xs"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="number"
                                                    placeholder="Sort Order"
                                                    value={newSizeForm.sort_order}
                                                    onChange={(e) => setNewSizeForm({ ...newSizeForm, sort_order: parseInt(e.target.value, 10) || 1 })}
                                                    className="w-full px-3 py-2 border rounded-xl text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <input
                                                type="text"
                                                placeholder="Guidance text (e.g. Ideal for large home mandirs)"
                                                value={newSizeForm.description}
                                                onChange={(e) => setNewSizeForm({ ...newSizeForm, description: e.target.value })}
                                                className="w-2/3 px-3 py-2 border rounded-xl text-xs"
                                            />
                                            <button
                                                type="submit"
                                                className="px-5 py-2 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Add Size</span>
                                            </button>
                                        </div>
                                    </form>

                                    {/* Existing Sizes List */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {sizes.map(size => (
                                            <div key={size.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-stone-900 text-xs">{size.label}</div>
                                                    <div className="text-[11px] text-stone-500 mt-0.5">
                                                        {size.height_inches}" height • Order: {size.sort_order}
                                                    </div>
                                                    {size.description && (
                                                        <div className="text-[10px] text-[#C69722] italic mt-1">{size.description}</div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSize(size.id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                    title="Delete master size"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 6: FESTIVAL SECTION MANAGEMENT (Req #6) */}
                            {/* ========================================================================= */}
                            {activeTab === 'festival' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-[#161616]">
                                            Festival Section Management
                                        </h3>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            Change festival title, subtitle, banner, badge, linked products and festival override prices
                                        </p>
                                    </div>

                                    {festival ? (
                                        <form onSubmit={handleSaveFestival} className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b">
                                                <span className="text-xs font-bold text-stone-800 uppercase">FESTIVAL CAMPAIGN CONTROLS</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-stone-600 font-medium">Section Active:</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={festival.is_active}
                                                        onChange={(e) => setFestival({ ...festival, is_active: e.target.checked })}
                                                        className="w-4 h-4 accent-[#161616] rounded"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-bold text-stone-700 block mb-1">FESTIVAL TITLE</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={festival.title}
                                                        onChange={(e) => setFestival({ ...festival, title: e.target.value })}
                                                        className="w-full px-3 py-2 border rounded-xl text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-stone-700 block mb-1">BADGE PILL TEXT</label>
                                                    <input
                                                        type="text"
                                                        value={festival.badge_text || ''}
                                                        onChange={(e) => setFestival({ ...festival, badge_text: e.target.value })}
                                                        placeholder="e.g. Navratri 2026 Special"
                                                        className="w-full px-3 py-2 border rounded-xl text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-stone-700 block mb-1">SUBTITLE / ANNOUNCEMENT DESCRIPTION</label>
                                                <textarea
                                                    rows={2}
                                                    value={festival.subtitle || ''}
                                                    onChange={(e) => setFestival({ ...festival, subtitle: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-xl text-xs"
                                                />
                                            </div>

                                            {/* Linked Products with Override Festival Pricing */}
                                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
                                                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                                    Linked Products & Special Festival Prices
                                                </label>
                                                <div className="space-y-2">
                                                    {(festival.items || []).map(item => (
                                                        <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200">
                                                            <div className="flex items-center gap-3">
                                                                <img src={item.murti_image || '/images/products/ram-darbar.png'} alt="" className="w-8 h-8 object-contain rounded bg-stone-50 border" />
                                                                <div>
                                                                    <div className="font-bold text-stone-900 text-xs">{item.murti_title}</div>
                                                                    <div className="text-[10px] text-stone-400">Tag: {item.custom_tag}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                                    Festive: ₹{item.festival_price?.toLocaleString('en-IN')}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUnlinkFestivalItem(item.murti_id)}
                                                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                                                    title="Unlink product"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                className="px-6 py-2.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white font-bold text-xs uppercase tracking-wider transition shadow-md"
                                            >
                                                Save Festival Section
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="bg-white p-6 rounded-2xl text-center text-xs text-stone-500">
                                            No festival section found. Click "Sync / Seed Data" to populate default Navratri festival.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 7: REVIEWS & MODERATION (Standard Admin) */}
                            {/* ========================================================================= */}
                            {activeTab === 'reviews' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-[#161616]">
                                            Customer Reviews & Seller Replies
                                        </h3>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            Moderate customer reviews and post official responses from Amol Murti Concierge
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {reviews.map(rev => (
                                            <div key={rev.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-stone-900 text-xs">{rev.author}</span>
                                                        <span className="text-[10px] text-stone-400">• {rev.location}</span>
                                                        <div className="flex text-amber-500 text-[10px]">
                                                            {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleToggleReviewApproval(rev)}
                                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                                                                rev.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                            }`}
                                                        >
                                                            {rev.is_approved ? 'Approved' : 'Hidden'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <h5 className="font-bold text-stone-800 text-xs">"{rev.title}"</h5>
                                                <p className="text-xs text-stone-600 leading-relaxed">{rev.content}</p>

                                                {/* Seller Reply Box */}
                                                {rev.seller_reply ? (
                                                    <div className="p-3 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] text-[11px] space-y-1">
                                                        <div className="font-bold text-[#8E5B00] flex items-center justify-between">
                                                            <span>Official Seller Reply ({rev.seller_reply.author})</span>
                                                            <span className="text-[9px] text-stone-400">{rev.seller_reply.date}</span>
                                                        </div>
                                                        <p className="text-stone-700 italic">{rev.seller_reply.text}</p>
                                                    </div>
                                                ) : (
                                                    replyReviewId === rev.id ? (
                                                        <div className="space-y-2 pt-2">
                                                            <textarea
                                                                rows={2}
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                placeholder="Type official response (e.g. Pranam! Thank you for placing your faith in our Jaipur artisans...)"
                                                                className="w-full px-3 py-2 border rounded-xl text-xs"
                                                            />
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => setReplyReviewId(null)} className="text-xs text-stone-500 font-bold px-3 py-1">Cancel</button>
                                                                <button onClick={() => handleSendSellerReply(rev.id)} className="px-4 py-1.5 rounded-lg bg-[#161616] text-[#F7C600] text-xs font-bold">Post Response</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setReplyReviewId(rev.id); setReplyText(''); }}
                                                            className="text-xs text-[#C69722] hover:underline font-bold flex items-center gap-1"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            <span>Add Seller Response</span>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
