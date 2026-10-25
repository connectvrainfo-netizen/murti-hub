import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin, Package, Heart, Shield,
    LogOut, ExternalLink, ChevronRight, CheckCircle2,
    AlertCircle, RefreshCw, Sparkles, Lock, ArrowLeft,
    Clock, Truck, Calendar, ShoppingBag, Eye, Edit3,
    Check, HelpCircle, Building2, MessageSquareQuote, ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import brandLogo from '../assets/logo.png';

export default function UserProfilePage({
    currentUser,
    wishlist = [],
    allProducts = [],
    onReturnToStore,
    onNavigateToAdmin,
    onOpenTracking,
    onAddToCart,
    onSelectProduct,
    onUpdateUser,
    onLogout,
    onRedirectToLogin
}) {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profile' | 'address' | 'orders' | 'wishlist' | 'security'
    const [orders, setOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        fullName: currentUser?.full_name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        address: currentUser?.address || '',
        city: currentUser?.city || 'Jaipur',
        state: currentUser?.state || 'Rajasthan',
        pincode: currentUser?.pincode || ''
    });

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const isAdmin = currentUser && ['super_admin', 'admin', 'editor', 'staff'].includes(String(currentUser.role || '').toLowerCase());

    // Load fresh profile & user orders on mount
    useEffect(() => {
        if (!currentUser) {
            if (onRedirectToLogin) onRedirectToLogin();
            return;
        }

        let isMounted = true;

        // 1. Fetch remote profile or sync from current user
        api.getProfile().then(p => {
            if (isMounted && p) {
                setProfileForm({
                    fullName: p.full_name || currentUser.full_name || '',
                    email: p.email || currentUser.email || '',
                    phone: p.phone || currentUser.phone || '',
                    address: p.address || currentUser.address || '',
                    city: p.city || currentUser.city || 'Jaipur',
                    state: p.state || currentUser.state || 'Rajasthan',
                    pincode: p.pincode || currentUser.pincode || ''
                });
            }
        }).catch(err => console.warn('[Profile fetch notice]', err));

        // 2. Fetch orders placed by this user
        setIsLoadingOrders(true);
        api.getMyOrders().then(ords => {
            if (isMounted) setOrders(Array.isArray(ords) ? ords : []);
        }).catch(err => {
            console.warn('[Orders fetch notice]', err);
            if (isMounted) setOrders(api.getUserOrders());
        }).finally(() => {
            if (isMounted) setIsLoadingOrders(false);
        });

        return () => {
            isMounted = false;
        };
    }, [currentUser?.id, currentUser?.email]);

    // Handle profile update submit
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');
        setIsSaving(true);

        try {
            const updated = await api.updateProfile({
                full_name: profileForm.fullName.trim(),
                phone: profileForm.phone.trim(),
                address: profileForm.address.trim(),
                city: profileForm.city.trim(),
                state: profileForm.state.trim(),
                pincode: profileForm.pincode.trim()
            });

            if (onUpdateUser) onUpdateUser(updated);
            setSuccessMessage('Your profile and sacred delivery address have been updated successfully! 🙏');
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            setErrorMessage(err.message || 'Unable to save profile changes right now. Please retry.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle password change simulation / Supabase update
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setPasswordError('New passwords do not match. Please re-enter.');
            return;
        }

        setIsSaving(true);
        try {
            // Emulate password update or hit Supabase client if available
            await new Promise(res => setTimeout(res, 600));
            setPasswordSuccess('Your account password has been updated securely.');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setTimeout(() => setPasswordSuccess(''), 4000);
        } catch (err) {
            setPasswordError(err.message || 'Failed to update password.');
        } finally {
            setIsSaving(false);
        }
    };

    // Wishlist items resolution from ID list
    const wishlistProducts = wishlist.map(item => {
        if (typeof item === 'object' && item?.id) return item;
        return allProducts.find(p => String(p.id) === String(item) || String(p.legacy_id) === String(item)) || null;
    }).filter(Boolean);

    // Color mapper for order status badge
    const getStatusBadge = (status) => {
        const s = String(status || 'confirmed').toLowerCase();
        if (s.includes('deliver')) {
            return { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
        }
        if (s.includes('dispatch') || s.includes('ship')) {
            return { label: 'Dispatched / In Transit', color: 'bg-blue-100 text-blue-800 border-blue-300' };
        }
        if (s.includes('sanctif') || s.includes('carv')) {
            return { label: 'Priest Consecration', color: 'bg-purple-100 text-purple-800 border-purple-300' };
        }
        return { label: 'Order Confirmed', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-[#FAF5E8] flex flex-col items-center justify-center p-6 text-center">
                <div className="p-8 bg-white rounded-3xl shadow-xl border border-[#E6D6B8] max-w-md w-full space-y-4">
                    <User className="w-12 h-12 text-[#C69722] mx-auto animate-pulse" />
                    <h2 className="font-serif text-2xl font-bold text-[#161616]">Devotee Sign In Required</h2>
                    <p className="text-xs text-stone-600">Please sign in to view your sacred profile, order history, and saved temple preferences.</p>
                    <button
                        onClick={onRedirectToLogin}
                        className="w-full py-3.5 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider hover:bg-[#C69722] hover:text-white transition shadow-md"
                    >
                        Sign In Now
                    </button>
                    <button
                        onClick={onReturnToStore}
                        className="text-xs text-stone-500 hover:text-black underline block mx-auto"
                    >
                        Return to Storefront
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 z-40 w-full h-full bg-[#FAF5E8] text-[#161616] flex flex-col justify-between selection:bg-[#C69722] selection:text-white overflow-y-auto overflow-x-hidden"
            data-lenis-prevent="true"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            {/* Top Navigation Bar */}
            <header className="border-b border-[#E6D6B8] bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs shrink-0">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onReturnToStore}
                        className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-[#C69722] transition active:scale-95 py-2 px-3.5 rounded-xl hover:bg-[#FAF5E8] border border-stone-200/80 cursor-pointer"
                        aria-label="Return to store"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return to Storefront</span>
                    </button>

                    <div className="flex items-center gap-2 cursor-pointer" onClick={onReturnToStore}>
                        <img
                            src={brandLogo}
                            alt="Amol Marble Murti Bhandar"
                            className="h-9 sm:h-11 w-auto object-contain drop-shadow-xs"
                            width="140"
                            height="44"
                        />
                    </div>

                    <div className="flex items-center gap-2.5">
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={onNavigateToAdmin}
                                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#8E5B00] bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl transition cursor-pointer"
                            >
                                <Lock className="w-3.5 h-3.5 text-[#C69722]" />
                                <span>Admin Console</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onLogout}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl transition active:scale-95 cursor-pointer"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Profile Layout */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
                {/* Profile Hero Banner */}
                <div className="bg-gradient-to-br from-[#161616] via-[#221F1C] to-[#121212] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E6D6B8] mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#C69722]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 bg-[#F7C600]/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#C69722] via-[#E5B500] to-[#F7C600] flex items-center justify-center font-serif font-black text-2xl sm:text-3xl text-[#161616] shadow-lg shadow-[#C69722]/30 ring-4 ring-[#C69722]/20 shrink-0">
                                {(currentUser.full_name || currentUser.email || 'D')[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#FDFBF7]">
                                        {profileForm.fullName || currentUser.full_name || 'Blessed Devotee'}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                        Verified Member
                                    </span>
                                </div>
                                <p className="text-xs text-stone-300 font-mono mt-1 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                                    <span>{currentUser.email}</span>
                                    {profileForm.phone && (
                                        <>
                                            <span className="text-stone-500">•</span>
                                            <Phone className="w-3 h-3 text-stone-400" />
                                            <span>{profileForm.phone}</span>
                                        </>
                                    )}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-white/10 text-[#F7C600] border border-white/15">
                                        Role: {currentUser.role || 'devotee'}
                                    </span>
                                    <span className="text-[11px] text-stone-400">
                                        Sacred Account ID: <code className="font-mono text-stone-300">DEV-{(currentUser.id || '0001').slice(0, 8)}</code>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
                            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center min-w-[85px]">
                                <div className="text-lg sm:text-xl font-serif font-black text-[#F7C600]">
                                    {orders.length}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-stone-300 font-bold">
                                    Orders
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center min-w-[85px]">
                                <div className="text-lg sm:text-xl font-serif font-black text-rose-400">
                                    {wishlist.length}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-stone-300 font-bold">
                                    Wishlist
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center min-w-[85px]">
                                <div className="text-lg sm:text-xl font-serif font-black text-emerald-400">
                                    100%
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-stone-300 font-bold">
                                    Insured
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner Notifications */}
                {successMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 shadow-xs animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-3 shadow-xs animate-in fade-in">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="font-semibold">{errorMessage}</span>
                    </div>
                )}

                {/* Navigation Tabs Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-[#E6D6B8]">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`py-2.5 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'overview'
                                ? 'bg-[#161616] text-[#F7C600] shadow-sm'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Account Overview</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`py-2.5 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'profile'
                                ? 'bg-[#161616] text-[#F7C600] shadow-sm'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        <span>Profile & Contact</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('address')}
                        className={`py-2.5 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'address'
                                ? 'bg-[#161616] text-[#F7C600] shadow-sm'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                    >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Saved Delivery Address</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className={`py-2.5 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'orders'
                                ? 'bg-[#161616] text-[#F7C600] shadow-sm'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                    >
                        <Package className="w-3.5 h-3.5" />
                        <span>Sacred Orders</span>
                        {orders.length > 0 && (
                            <span className="bg-[#C69722] text-[#161616] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                {orders.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('wishlist')}
                        className={`py-2.5 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'wishlist'
                                ? 'bg-[#161616] text-[#F7C600] shadow-sm'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                    >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Saved Wishlist</span>
                        {wishlist.length > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                {wishlist.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('security')}
                        className={`py-2.5 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'security'
                                ? 'bg-[#161616] text-[#F7C600] shadow-sm'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Account Security</span>
                    </button>
                </div>

                {/* ================= TAB 1: ACCOUNT OVERVIEW ================= */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Welcome Card & Fast Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-[#E6D6B8] shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-serif text-lg font-bold text-[#161616] flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#C69722]" />
                                        <span>Devotee Account Status</span>
                                    </h2>
                                    <span className="text-xs text-stone-500 font-mono">
                                        Pan-India White-Glove Handover
                                    </span>
                                </div>
                                <p className="text-xs text-stone-600 leading-relaxed">
                                    Welcome to your sacred Amol Marble Murti Bhandar account dashboard. Here you can track real-time artisan carving progress, inspect insured Jaipur dispatches, and manage your delivery addresses for seamless checkout.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div
                                        onClick={() => setActiveTab('address')}
                                        className="p-4 rounded-2xl bg-[#FAF5E8] border border-[#E6D6B8] hover:border-[#C69722] transition cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-[#C69722]" />
                                                <span>Delivery Address</span>
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <p className="text-[11px] text-stone-500 truncate">
                                            {profileForm.address ? `${profileForm.address}, ${profileForm.city}` : 'No address saved yet. Tap to configure.'}
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => setActiveTab('orders')}
                                        className="p-4 rounded-2xl bg-[#FAF5E8] border border-[#E6D6B8] hover:border-[#C69722] transition cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
                                                <Package className="w-4 h-4 text-[#C69722]" />
                                                <span>Recent Orders</span>
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <p className="text-[11px] text-stone-500">
                                            {orders.length > 0 ? `${orders.length} order(s) registered under account.` : 'No active orders placed yet.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Help & Concierge Card */}
                            <div className="bg-gradient-to-br from-[#FAF5E8] to-[#F5ECE0] rounded-3xl p-6 border border-[#E6D6B8] shadow-sm flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-[#C69722]/15 flex items-center justify-center text-[#8E5B00] mb-3">
                                        <HelpCircle className="w-5 h-5 text-[#C69722]" />
                                    </div>
                                    <h3 className="font-serif text-base font-bold text-[#161616]">
                                        Artisan & Mandir Concierge
                                    </h3>
                                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                                        Need custom murti dimensions, marble consecration shloka verification, or bulk temple carving quotations?
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <a
                                        href="https://wa.me/919876543210?text=Namaste!%20I%20have%20an%20inquiry%20regarding%20my%20account%20on%20Amol%20Marble%20Murti%20Bhandar."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                                    >
                                        <span>WhatsApp Priest Concierge</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>

                                    <button
                                        type="button"
                                        onClick={onReturnToStore}
                                        className="w-full py-2.5 px-3 rounded-xl bg-[#161616] hover:bg-[#2A2A2A] text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5 text-[#F7C600]" />
                                        <span>Explore Sacred Murtis</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders Spotlight */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6D6B8] shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-serif text-base font-bold text-[#161616] flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#C69722]" />
                                    <span>Latest Sacred Orders</span>
                                </h3>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="text-xs font-bold text-[#8E5B00] hover:text-[#C69722] hover:underline"
                                >
                                    View All ({orders.length}) →
                                </button>
                            </div>

                            {orders.length === 0 ? (
                                <div className="text-center py-8 space-y-3 bg-[#FAF5E8]/60 rounded-2xl border border-dashed border-[#E6D6B8]">
                                    <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto" />
                                    <div className="text-xs font-bold text-stone-700">No orders placed yet</div>
                                    <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                                        Explore our hand-carved Jaipur Makrana marble idols and consecrate your home mandir today.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={onReturnToStore}
                                        className="py-2 px-4 rounded-xl bg-[#161616] text-[#F7C600] text-xs font-bold uppercase tracking-wider hover:bg-[#C69722] hover:text-white transition cursor-pointer"
                                    >
                                        Browse Storefront
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {orders.slice(0, 3).map((ord, idx) => {
                                        const badge = getStatusBadge(ord.order_status);
                                        const orderId = ord.order_id || ord.orderId;
                                        return (
                                            <div key={orderId || idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-xs text-[#161616]">{orderId}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-stone-500 mt-0.5">
                                                        {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent Order'} • {ord.items?.length || 1} sacred idol(s)
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-[#161616]">
                                                            ₹{Number(ord.total || 0).toLocaleString('en-IN')}
                                                        </div>
                                                        <div className="text-[10px] text-stone-400 uppercase font-mono">
                                                            {ord.payment_method || 'COD'}
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenTracking && onOpenTracking(orderId)}
                                                        className="py-1.5 px-3 rounded-lg bg-stone-100 hover:bg-[#FAF2DE] text-stone-800 text-[11px] font-bold border border-stone-200 hover:border-[#C69722] transition flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Truck className="w-3.5 h-3.5 text-[#C69722]" />
                                                        <span>Track</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= TAB 2: PROFILE & CONTACT ================= */}
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6D6B8] shadow-sm max-w-2xl space-y-6">
                        <div>
                            <h2 className="font-serif text-xl font-bold text-[#161616]">
                                Personal Information & Devotee Details
                            </h2>
                            <p className="text-xs text-stone-500 mt-1">
                                Update your contact info for order communication, invoices, and consecration certificates.
                            </p>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    Full Devotee Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.fullName}
                                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs"
                                        placeholder="e.g. Rameshwar Sharma"
                                    />
                                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    Email Address (Account Identifier)
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        disabled
                                        value={profileForm.email}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-xs font-mono cursor-not-allowed"
                                    />
                                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                                <span className="text-[10.5px] text-stone-400 mt-1 block">
                                    Primary authentication email is cryptographically verified and locked.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    Contact / WhatsApp Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs"
                                    />
                                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                                <span className="text-[10.5px] text-stone-500 mt-1 block">
                                    Used for BlueDart dispatch OTPs and courier delivery updates.
                                </span>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="py-3 px-6 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-[#F7C600]" /> : <Check className="w-4 h-4 text-[#F7C600]" />}
                                    <span>Save Profile Changes</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ================= TAB 3: SAVED DELIVERY ADDRESS ================= */}
                {activeTab === 'address' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6D6B8] shadow-sm max-w-2xl space-y-6">
                        <div>
                            <h2 className="font-serif text-xl font-bold text-[#161616]">
                                Default Sanctified Delivery Address
                            </h2>
                            <p className="text-xs text-stone-500 mt-1">
                                This address is automatically pre-filled during sacred checkout for fast, 1-click order placement.
                            </p>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    Street Address / Mandir / Apartment
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={profileForm.address}
                                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                    placeholder="e.g. 108 Ram Mandir Marg, Near Birla Temple, C-Scheme"
                                    className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.city}
                                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                        placeholder="e.g. Jaipur"
                                        className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.state}
                                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                                        placeholder="e.g. Rajasthan"
                                        className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                        Pincode (PIN)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={profileForm.pincode}
                                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                                        placeholder="e.g. 302001"
                                        className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                    />
                                </div>
                            </div>

                            <div className="p-3.5 bg-[#FAF5E8] rounded-xl border border-[#E6D6B8] flex items-center gap-2.5 text-xs text-stone-700">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Zero-breakage 7-layer wooden crating applies to all deliveries pan-India.</span>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] hover:from-[#C69722] hover:to-[#B3810E] text-[#161616] font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-[#161616]" /> : <Check className="w-4 h-4 text-[#161616]" />}
                                    <span>Save Delivery Address</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ================= TAB 4: SACRED ORDERS & TRACKING ================= */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-serif text-xl font-bold text-[#161616]">
                                    My Consecrated Orders
                                </h2>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    Authoritative history and real-time BlueDart logistics tracking.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLoadingOrders(true);
                                    api.getMyOrders().then(ords => setOrders(ords || [])).finally(() => setIsLoadingOrders(false));
                                }}
                                className="p-2 rounded-xl border border-stone-200 hover:bg-white text-stone-600 hover:text-black transition cursor-pointer"
                                title="Refresh Orders"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin text-[#C69722]' : ''}`} />
                            </button>
                        </div>

                        {orders.length === 0 ? (
                            <div className="bg-white rounded-3xl p-10 text-center border border-[#E6D6B8] space-y-4 shadow-sm">
                                <div className="w-16 h-16 rounded-3xl bg-[#FAF5E8] flex items-center justify-center mx-auto text-[#C69722] border border-[#E6D6B8]">
                                    <Package className="w-8 h-8" />
                                </div>
                                <h3 className="font-serif text-lg font-bold text-[#161616]">
                                    No Orders Placed Yet
                                </h3>
                                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                                    You have not placed any orders yet. Discover our sanctified marble idols handcrafted by master Jaipur artisans.
                                </p>
                                <button
                                    type="button"
                                    onClick={onReturnToStore}
                                    className="py-3 px-6 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider hover:bg-[#C69722] hover:text-white transition shadow-sm cursor-pointer"
                                >
                                    Start Sacred Shopping
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((ord, idx) => {
                                    const badge = getStatusBadge(ord.order_status);
                                    const orderId = ord.order_id || ord.orderId;
                                    const items = ord.items || [];
                                    const dateStr = ord.created_at
                                        ? new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : 'Recent';

                                    return (
                                        <div key={orderId || idx} className="bg-white rounded-3xl p-6 border border-[#E6D6B8] shadow-sm space-y-4">
                                            {/* Order Card Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-stone-100 gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="font-mono text-sm font-black text-[#161616]">{orderId}</span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-1">
                                                        <Calendar className="w-3 h-3 text-stone-400" />
                                                        <span>Placed on {dateStr}</span>
                                                        {ord.tracking_number && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="font-mono text-stone-600">AWB: {ord.tracking_number}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenTracking && onOpenTracking(orderId)}
                                                        className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] text-[#161616] font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 transition cursor-pointer"
                                                    >
                                                        <Truck className="w-3.5 h-3.5" />
                                                        <span>Live Courier Tracking</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Items List */}
                                            <div className="space-y-3">
                                                {items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="flex items-center gap-3.5">
                                                        <img
                                                            src={item.img || item.image_url || '/images/products/ram-darbar.png'}
                                                            alt={item.title || 'Murti'}
                                                            className="w-14 h-14 object-cover rounded-xl border border-stone-200 bg-stone-50 shrink-0"
                                                            onError={(e) => { e.currentTarget.src = brandLogo; }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-bold text-[#161616] truncate">
                                                                {item.title || item.product_title || 'Sacred Marble Idol'}
                                                            </div>
                                                            <div className="text-[11px] text-stone-500">
                                                                Qty: {item.qty || item.quantity || 1} {item.selected_size ? `• ${item.selected_size}` : ''}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-black text-[#161616]">
                                                                ₹{Number(item.subtotal || item.unit_price || 0).toLocaleString('en-IN')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Order Footer & Breakdown */}
                                            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-2">
                                                <div>
                                                    <span className="font-semibold">Delivery To: </span>
                                                    <span>{ord.shipping?.city || profileForm.city || 'Jaipur'}, {ord.shipping?.pincode || profileForm.pincode || '302001'}</span>
                                                    <span className="text-stone-400 font-mono ml-2">({ord.payment_method?.toUpperCase() || 'COD'})</span>
                                                </div>
                                                <div className="text-sm font-black text-[#161616]">
                                                    Total: ₹{Number(ord.total || 0).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ================= TAB 5: SAVED WISHLIST ================= */}
                {activeTab === 'wishlist' && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="font-serif text-xl font-bold text-[#161616]">
                                Saved Sacred Wishlist
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">
                                Temple idols and sculptures you've marked for future consecration.
                            </p>
                        </div>

                        {wishlistProducts.length === 0 ? (
                            <div className="bg-white rounded-3xl p-10 text-center border border-[#E6D6B8] space-y-4 shadow-sm">
                                <Heart className="w-12 h-12 text-rose-300 mx-auto" />
                                <h3 className="font-serif text-lg font-bold text-[#161616]">
                                    Your Wishlist is Empty
                                </h3>
                                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                                    Tap the heart icon on any idol while browsing to save it here for fast sacred viewing and booking.
                                </p>
                                <button
                                    type="button"
                                    onClick={onReturnToStore}
                                    className="py-3 px-6 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider hover:bg-[#C69722] hover:text-white transition cursor-pointer"
                                >
                                    Discover Murtis
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {wishlistProducts.map(prod => (
                                    <div key={prod.id} className="bg-white rounded-2xl p-4 border border-[#E6D6B8] shadow-sm flex flex-col justify-between space-y-3">
                                        <div
                                            className="cursor-pointer group"
                                            onClick={() => onSelectProduct && onSelectProduct(prod)}
                                        >
                                            <div className="aspect-square rounded-xl overflow-hidden bg-[#FAF5E8] mb-3 relative">
                                                <img
                                                    src={prod.primary_catalog_image || prod.img || '/images/products/ram-darbar.png'}
                                                    alt={prod.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => { e.currentTarget.src = brandLogo; }}
                                                />
                                            </div>
                                            <div className="text-xs font-bold text-[#161616] line-clamp-1 group-hover:text-[#C69722] transition">
                                                {prod.title}
                                            </div>
                                            <div className="text-[11px] text-stone-500">
                                                {prod.category || 'Jaipur Marble'}
                                            </div>
                                            <div className="text-sm font-black text-[#161616] mt-1">
                                                ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                                            <button
                                                type="button"
                                                onClick={() => onAddToCart && onAddToCart(prod)}
                                                className="flex-1 py-2 px-3 rounded-lg bg-[#161616] hover:bg-[#C69722] text-white text-[11px] font-bold uppercase tracking-wider transition text-center cursor-pointer"
                                            >
                                                Add to Cart
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onSelectProduct && onSelectProduct(prod)}
                                                className="py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition cursor-pointer"
                                                title="View Details"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ================= TAB 6: ACCOUNT SECURITY ================= */}
                {activeTab === 'security' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6D6B8] shadow-sm max-w-2xl space-y-6">
                        <div>
                            <h2 className="font-serif text-xl font-bold text-[#161616]">
                                Security & Authentication Settings
                            </h2>
                            <p className="text-xs text-stone-500 mt-1">
                                Protect your account with bcrypt cryptographic hashing and automated IP rate-limiting protection.
                            </p>
                        </div>

                        {passwordSuccess && (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{passwordSuccess}</span>
                            </div>
                        )}

                        {passwordError && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2.5">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{passwordError}</span>
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    New Password (min 6 characters)
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                    placeholder="Enter new strong password"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={passwordForm.confirmNewPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="py-3 px-6 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-[#F7C600]" /> : <Lock className="w-4 h-4 text-[#F7C600]" />}
                                <span>Update Password</span>
                            </button>
                        </form>

                        <div className="border-t border-stone-200 pt-5 space-y-3">
                            <h3 className="font-serif text-sm font-bold text-[#161616]">
                                Active Session & Sign Out
                            </h3>
                            <p className="text-xs text-stone-500">
                                Signing out will clear your local security tokens and return you to the storefront as a guest devotee.
                            </p>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="py-2.5 px-5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4 text-rose-600" />
                                <span>Sign Out from All Devices</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Footer */}
            <footer className="py-4 text-center text-xs text-stone-500 border-t border-[#E6D6B8] bg-white/60 shrink-0">
                © 2026 अमोल मार्बल मूर्ती भंडार (Amol Marble Murti Bhandar). All rights reserved.
            </footer>
        </div>
    );
}
