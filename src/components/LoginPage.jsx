import React, { useState, useEffect } from 'react';
import {
    ShieldCheck, Lock, Mail, User, Eye, EyeOff,
    ArrowLeft, CheckCircle2, AlertCircle, RefreshCw,
    Sparkles, KeyRound, LogOut, ExternalLink, HelpCircle,
    Check, ShoppingBag, ShieldAlert, Award, ChevronRight, X,
    Phone, Crown
} from 'lucide-react';
import api from '../services/api';
import brandLogo from '../assets/logo.png';
import { loginSchema, registerSchema } from '../lib/validation';

export default function LoginPage({
    onReturnToStore,
    onLoginSuccess,
    onNavigateToProfile,
    onNavigateToAdmin
}) {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: '',
        rememberMe: true
    });
    const [registerForm, setRegisterForm] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [activeUser, setActiveUser] = useState(() => api.getCurrentUser());
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStatus, setForgotStatus] = useState('idle');
    const [forgotMessage, setForgotMessage] = useState('');

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        const clean = forgotEmail.trim().toLowerCase();
        if (!clean || !clean.includes('@') || !clean.includes('.')) {
            setForgotStatus('error');
            setForgotMessage('Please enter a valid email address.');
            return;
        }
        setForgotStatus('loading');
        setForgotMessage('');
        try {
            const res = await api.requestPasswordReset(clean);
            setForgotStatus('success');
            setForgotMessage(res?.message || 'If an account is associated with this email address, password reset instructions have been dispatched.');
        } catch (err) {
            setForgotStatus('error');
            setForgotMessage(err?.message || 'Unable to request password reset. Please try again shortly or contact concierge.');
        }
    };

    // Sync active session on mount - if active user is an admin, redirect straight to admin panel
    useEffect(() => {
        const cached = api.getCurrentUser();
        if (cached) {
            setActiveUser(cached);
            const role = String(cached?.role || '').toLowerCase();
            if (['admin', 'super_admin', 'editor', 'staff'].includes(role)) {
                if (onNavigateToAdmin) {
                    onNavigateToAdmin();
                    return;
                }
            }
        }

        const token = api.getToken();
        if (token) {
            api.getMe()
                .then(res => {
                    const userData = res?.data || res?.admin || res?.user;
                    if (userData) {
                        setActiveUser(userData);
                        api.setCurrentUser(userData);
                        const role = String(userData?.role || '').toLowerCase();
                        if (['admin', 'super_admin', 'editor', 'staff'].includes(role)) {
                            if (onNavigateToAdmin) onNavigateToAdmin();
                        }
                    }
                })
                .catch(err => {
                    if (err?.status === 401) {
                        api.setToken(null);
                        api.setCurrentUser(null);
                        setActiveUser(null);
                    }
                });
        }
    }, [onNavigateToAdmin]);

    // Guarantee document and body scrolling are always unblocked on login page
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('lenis-stopped');
            document.body.classList.remove('lenis-stopped');
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
        if (typeof window !== 'undefined' && window.__lenis) {
            window.__lenis.start();
        }
    }, []);


    // Password strength evaluator
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { label: 'Empty', score: 0, color: 'bg-stone-200' };
        let score = 0;
        if (pwd.length >= 6) score += 1;
        if (pwd.length >= 10) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

        if (score <= 2) return { label: 'Basic', score: 1, color: 'bg-rose-500', text: 'text-rose-600' };
        if (score <= 3) return { label: 'Good', score: 2, color: 'bg-amber-500', text: 'text-amber-600' };
        return { label: 'Strong & Consecrated', score: 3, color: 'bg-emerald-600', text: 'text-emerald-700' };
    };

    // Handle Login Submit
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const cleanEmail = loginForm.email.trim();
        const cleanPassword = loginForm.password;

        if (!cleanEmail || !cleanPassword) {
            setErrorMessage('Please provide both email address and password.');
            return;
        }

        const result = loginSchema.safeParse({ email: cleanEmail, password: cleanPassword });
        if (!result.success) {
            const firstError = result.error.errors[0]?.message || 'Invalid login details.';
            setErrorMessage(firstError);
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.login(cleanEmail, cleanPassword, loginForm.rememberMe);
            const userProfile = data?.admin || data?.user || api.getCurrentUser() || {
                email: cleanEmail,
                full_name: 'Devotee Member',
                role: 'devotee'
            };

            const role = String(userProfile?.role || '').toLowerCase();
            const isAdminRole = ['admin', 'super_admin', 'editor', 'staff'].includes(role);

            setActiveUser(userProfile);
            setSuccessMessage(
                isAdminRole
                    ? `Admin credentials verified. Opening Admin Console... 🛡️`
                    : `Welcome back, ${userProfile.full_name || 'Devotee'}! Signing you in... 🙏`
            );

            setTimeout(() => {
                if (onLoginSuccess) {
                    onLoginSuccess(userProfile);
                } else if (isAdminRole) {
                    if (onNavigateToAdmin) onNavigateToAdmin();
                    else window.location.href = '/admin';
                } else {
                    if (onNavigateToProfile) onNavigateToProfile();
                    else if (onReturnToStore) onReturnToStore();
                }
            }, 500);
        } catch (err) {
            console.error('[Login Error]', err);
            const msg = err.message || 'Invalid email or password. Please verify your credentials.';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Registration Submit
    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const result = registerSchema.safeParse({
            fullName: registerForm.fullName.trim(),
            email: registerForm.email.trim(),
            password: registerForm.password
        });

        if (!result.success) {
            const firstError = result.error.errors[0]?.message || 'Invalid registration details.';
            setErrorMessage(firstError);
            return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
            setErrorMessage('Passwords do not match. Please re-enter identical passwords.');
            return;
        }

        const { fullName, email, password } = result.data;
        setIsLoading(true);
        try {
            const data = await api.register(email, password, fullName, 'devotee');
            const userProfile = data?.admin || data?.user || api.getCurrentUser() || {
                email,
                full_name: fullName,
                role: 'devotee'
            };

            setActiveUser(userProfile);
            setSuccessMessage(`Account created successfully! Welcome to Amol Marble Murti Bhandar, ${fullName}. 🙏`);

            setTimeout(() => {
                if (onLoginSuccess) {
                    onLoginSuccess(userProfile);
                } else if (onNavigateToProfile) {
                    onNavigateToProfile();
                }
            }, 700);
        } catch (err) {
            console.error('[Registration Error]', err);
            const msg = err.message || 'Registration failed. An account with this email may already exist.';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Logout
    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await api.logout();
            setActiveUser(null);
            setSuccessMessage('You have been signed out of your account.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const isEmailValid = (val) => val && val.includes('@') && val.includes('.');
    const isPassMatch = registerForm.password && registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword;
    const strength = getPasswordStrength(registerForm.password);
    const isAdmin = activeUser && ['super_admin', 'admin', 'editor', 'staff'].includes(String(activeUser.role || '').toLowerCase());

    return (
        <div 
            className="fixed inset-0 z-40 w-full h-full bg-[#FAF5E8] flex flex-col justify-between text-[#161616] selection:bg-[#C69722] selection:text-white overflow-y-auto overflow-x-hidden"
            data-lenis-prevent="true"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            {/* Top Navigation Bar */}
            <header className="border-b border-[#E6D6B8] bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs shrink-0">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onReturnToStore}
                        className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-[#C69722] transition active:scale-95 py-2 px-3.5 rounded-xl hover:bg-[#FAF5E8] border border-stone-200/60 cursor-pointer"
                        aria-label="Return to store"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return to Storefront</span>
                    </button>

                    <div className="flex items-center gap-2 cursor-pointer" onClick={onReturnToStore}>
                        <img
                            src={brandLogo}
                            alt="Amol Marble Murti Bhandar"
                            className="h-10 sm:h-11 w-auto object-contain drop-shadow-xs"
                            width="140"
                            height="44"
                        />
                    </div>

                    <div className="w-24 sm:w-36 hidden sm:block pointer-events-none" />
                </div>
            </header>

            {/* Main Auth Section */}
            <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6 py-4 sm:py-6 w-full">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E6D6B8] overflow-hidden my-auto shrink-0 transition-all duration-300">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-br from-[#161616] via-[#221F1C] to-[#121212] text-white p-5 sm:p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-[#C69722]/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-[#F7C600]/10 rounded-full blur-xl pointer-events-none" />

                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C69722] via-[#E5B500] to-[#F7C600] flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-[#C69722]/30 ring-4 ring-[#C69722]/20">
                            <KeyRound className="w-6 h-6 text-[#161616]" />
                        </div>
                        <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-[#FDFBF7]">
                            {activeUser
                                ? 'Sacred Devotee Portal'
                                : mode === 'login'
                                    ? 'Devotee Sign In'
                                    : 'Create Sacred Account'}
                        </h1>
                        <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto leading-relaxed">
                            {activeUser
                                ? 'Manage your personal profile, delivery addresses, and track consecrated orders.'
                                : 'Access saved temple idols, delivery tracking, and fast consecrated checkout.'}
                        </p>
                    </div>

                    {/* Active User Session Card */}
                    {activeUser ? (
                        <div className="p-5 sm:p-7 space-y-5">
                            <div className="p-4.5 rounded-2xl bg-gradient-to-br from-[#FAF5E8] to-[#F5ECE0] border border-[#E6D6B8] shadow-sm">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-13 h-13 rounded-2xl bg-[#161616] text-[#F7C600] font-serif font-black text-xl flex items-center justify-center shrink-0 shadow-md border-2 border-[#C69722]">
                                        {(activeUser.full_name || activeUser.email || 'D')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-bold text-[#161616] truncate">
                                                {activeUser.full_name || 'Devotee Member'}
                                            </h2>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active Session" />
                                        </div>
                                        <p className="text-xs text-stone-600 truncate font-mono mt-0.5">{activeUser.email}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                                isAdmin
                                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                            }`}>
                                                {isAdmin ? <Award className="w-3 h-3 text-[#C69722]" /> : <User className="w-3 h-3 text-emerald-700" />}
                                                <span>Role: {activeUser.role || 'Devotee'}</span>
                                            </span>
                                            <span className="text-[10px] font-semibold text-stone-500">Verified Member</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {successMessage && (
                                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-2xs">
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Quick Navigation Action Grid */}
                            <div className="space-y-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onNavigateToProfile) {
                                            onNavigateToProfile();
                                        } else {
                                            window.location.href = '/profile';
                                        }
                                    }}
                                    className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-[#161616] hover:bg-[#2A2A2A] text-white text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-between group active:scale-98 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <User className="w-4 h-4 text-[#F7C600]" />
                                        <span>Open My Sacred Profile & Orders</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-[#F7C600] group-hover:translate-x-1 transition-transform" />
                                </button>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onNavigateToAdmin) {
                                                onNavigateToAdmin();
                                            } else {
                                                window.location.href = '/admin';
                                            }
                                        }}
                                        className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] hover:from-[#C69722] hover:to-[#B3810E] text-[#161616] text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-between group active:scale-98 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Lock className="w-4 h-4 text-[#161616]" />
                                            <span>Open Store Admin Console</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={onReturnToStore}
                                    className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider transition shadow-2xs flex items-center justify-between group active:scale-98 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBag className="w-4 h-4 text-[#C69722]" />
                                        <span>Continue Shopping Murtis</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoading}
                                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-stone-300 hover:border-red-400 text-stone-700 hover:text-red-700 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                                >
                                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                    <span>Sign Out of Account</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-5 sm:p-7">
                            {/* Mode Toggle Tabs (Sign In vs Create Account) */}
                            <div className="flex border-b border-stone-200 mb-4">
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
                                    className={`flex-1 pb-2.5 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                        mode === 'login'
                                            ? 'border-[#C69722] text-[#161616]'
                                            : 'border-transparent text-stone-400 hover:text-stone-700'
                                    }`}
                                >
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Sign In</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
                                    className={`flex-1 pb-2.5 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                        mode === 'register'
                                            ? 'border-[#C69722] text-[#161616]'
                                            : 'border-transparent text-stone-400 hover:text-stone-700'
                                    }`}
                                >
                                    <User className="w-3.5 h-3.5" />
                                    <span>Create Account</span>
                                </button>
                            </div>


                            {/* Error Banner */}
                            {errorMessage && (
                                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200 shadow-2xs">
                                    <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed flex-1">{errorMessage}</span>
                                    <button
                                        type="button"
                                        onClick={() => setErrorMessage('')}
                                        className="text-stone-400 hover:text-stone-700"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Success Banner */}
                            {successMessage && (
                                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 shadow-2xs">
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Sign In Form */}
                            {mode === 'login' && (
                                <form onSubmit={handleLogin} className="space-y-4 text-left">
                                    <div>
                                        <label htmlFor="login-email-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="login-email-input"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={loginForm.email}
                                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                                placeholder="devotee@example.com"
                                                className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs transition"
                                            />
                                            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            {isEmailValid(loginForm.email) && (
                                                <Check className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label htmlFor="login-password-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setIsForgotModalOpen(true)}
                                                className="text-[11px] font-semibold text-[#8E5B00] hover:text-[#C69722] hover:underline cursor-pointer"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                id="login-password-input"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="current-password"
                                                required
                                                value={loginForm.password}
                                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                                placeholder="Enter your account password"
                                                className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs transition"
                                            />
                                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={loginForm.rememberMe}
                                                onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                                                className="rounded w-4 h-4 text-[#C69722] focus:ring-[#C69722]"
                                            />
                                            <span>Remember this device</span>
                                        </label>
                                        <span className="text-[11px] text-stone-400 font-mono">256-bit SSL</span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-extrabold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60 cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin text-[#F7C600]" />
                                                <span>Authenticating Account...</span>
                                            </>
                                        ) : (
                                            <span>Sign In to Sacred Account</span>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Create Account Form */}
                            {mode === 'register' && (
                                <form onSubmit={handleRegister} className="space-y-4 text-left">
                                    <div>
                                        <label htmlFor="register-name-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="register-name-input"
                                                name="fullName"
                                                type="text"
                                                autoComplete="name"
                                                required
                                                value={registerForm.fullName}
                                                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                                                placeholder="e.g. Rameshwar Sharma"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs"
                                            />
                                            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="register-email-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="register-email-input"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={registerForm.email}
                                                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                                placeholder="e.g. devotee@example.com"
                                                className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs"
                                            />
                                            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            {isEmailValid(registerForm.email) && (
                                                <Check className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="register-password-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                            Password (min 6 characters)
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="register-password-input"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                required
                                                minLength={6}
                                                value={registerForm.password}
                                                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                                placeholder="Create a strong password"
                                                className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs"
                                            />
                                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {registerForm.password && (
                                            <div className="mt-2 space-y-1 animate-in fade-in">
                                                <div className="flex items-center justify-between text-[10.5px]">
                                                    <span className="text-stone-500 font-semibold">Security Strength:</span>
                                                    <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden flex gap-1">
                                                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                                                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                                                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="register-confirm-password-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="register-confirm-password-input"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                required
                                                minLength={6}
                                                value={registerForm.confirmPassword}
                                                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                                placeholder="Re-enter your password"
                                                className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/15 bg-white shadow-2xs"
                                            />
                                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {registerForm.confirmPassword && (
                                            <div className="mt-1 text-[11px] font-semibold flex items-center gap-1">
                                                {isPassMatch ? (
                                                    <span className="text-emerald-700 flex items-center gap-1">
                                                        <Check className="w-3.5 h-3.5" /> Passwords match
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-600 flex items-center gap-1">
                                                        <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] hover:from-[#C69722] hover:to-[#B3810E] text-[#161616] font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60 cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin text-[#161616]" />
                                                <span>Creating Sacred Account...</span>
                                            </>
                                        ) : (
                                            <span>Create Free Sacred Account</span>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Protected by bcrypt cryptographic hashing and automated IP security.</span>
                    </div>
                </div>
            </main>

            {/* Forgot Password Recovery Modal */}
            {isForgotModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsForgotModalOpen(false); }}
                >
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E6D6B8] space-y-4 relative">
                        <button
                            type="button"
                            onClick={() => setIsForgotModalOpen(false)}
                            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition cursor-pointer"
                            aria-label="Close recovery dialog"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                            <HelpCircle className="w-6 h-6" />
                        </div>

                        <div>
                            <h3 className="font-serif text-lg font-bold text-[#161616]">
                                Sacred Account Access & Password Reset
                            </h3>
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                                Enter your registered email address to receive secure cryptographic password reset instructions.
                            </p>
                        </div>

                        {/* Direct Self-Service Password Reset Form */}
                        <form onSubmit={handleForgotSubmit} className="space-y-3 pt-1">
                            <div className="relative">
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Account Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder="devotee@example.com"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C69722] text-xs font-medium text-[#161616]"
                                    />
                                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            {forgotMessage && (
                                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${forgotStatus === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                    {forgotStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
                                    <span>{forgotMessage}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={forgotStatus === 'loading'}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] hover:from-[#C69722] hover:to-[#B3810E] text-[#161616] font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {forgotStatus === 'loading' ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin text-[#161616]" />
                                        <span>Dispatching Reset Link...</span>
                                    </>
                                ) : (
                                    <span>Send Secure Reset Link</span>
                                )}
                            </button>
                        </form>

                        <div className="relative flex items-center justify-center my-2">
                            <div className="border-t border-stone-200 w-full"></div>
                            <span className="bg-white px-2 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                                Or Concierge Assistance
                            </span>
                        </div>

                        <div className="space-y-2.5 pt-1">
                            <a
                                href="https://wa.me/919876543210?text=Namaste!%20I%20need%20assistance%20recovering%20my%20account%20password%20on%20Amol%20Marble%20Murti%20Bhandar."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                            >
                                <span>Recover via WhatsApp Concierge (+91 98765 43210)</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <a
                                href="mailto:support@amolmurtibhandar.com?subject=Account%20Password%20Reset%20Request"
                                className="w-full py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition"
                            >
                                <Mail className="w-4 h-4 text-stone-500" />
                                <span>Email Support (support@amolmurtibhandar.com)</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Copyright */}
            <footer className="py-4 text-center text-xs text-stone-500 border-t border-[#E6D6B8] bg-white/50 shrink-0">
                © 2026 अमोल मार्बल मूर्ती भंडार (Amol Marble Murti Bhandar). All rights reserved.
            </footer>
        </div>
    );
}
