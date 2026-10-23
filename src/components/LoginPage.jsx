import React, { useState, useEffect } from 'react';
import {
    ShieldCheck, Lock, Mail, User, Eye, EyeOff,
    ArrowLeft, CheckCircle2, AlertCircle, RefreshCw,
    Sparkles, KeyRound, LogOut, ExternalLink
} from 'lucide-react';
import api from '../services/api';

export default function LoginPage({ onReturnToStore, onLoginSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
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
    const [activeUser, setActiveUser] = useState(null);

    // Check for an already active session on mount
    useEffect(() => {
        const token = api.getToken();
        if (token) {
            api.getMe()
                .then(res => {
                    if (res?.data) {
                        setActiveUser(res.data);
                    }
                })
                .catch(() => {
                    // Session might be expired
                    api.setToken(null);
                    setActiveUser(null);
                });
        }
    }, []);

    // Handle Login Form Submission
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const email = loginForm.email.trim();
        const password = loginForm.password;

        if (!email || !password) {
            setErrorMessage('Please enter both your email address and password.');
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            setErrorMessage('Please provide a valid email address.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.login(email, password);
            const userProfile = data?.admin || { email, full_name: 'Devotee Member' };
            setActiveUser(userProfile);
            setSuccessMessage('Welcome back! You are now securely signed in.');
            
            if (onLoginSuccess) {
                setTimeout(() => onLoginSuccess(userProfile), 700);
            }
        } catch (err) {
            const msg = err.message || 'Login failed. Please check your credentials or network connection.';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Registration Form Submission
    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const fullName = registerForm.fullName.trim();
        const email = registerForm.email.trim().toLowerCase();
        const password = registerForm.password;
        const confirmPassword = registerForm.confirmPassword;

        if (!fullName) {
            setErrorMessage('Please enter your full name.');
            return;
        }

        if (!email || !email.includes('@') || !email.includes('.')) {
            setErrorMessage('Please provide a valid email address.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match. Please re-enter identical passwords.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.register(email, password, fullName);
            const userProfile = data?.admin || { email, full_name: fullName };
            setActiveUser(userProfile);
            setSuccessMessage('Account created successfully! Welcome to Amol Marble Murti Bhandar.');
            
            if (onLoginSuccess) {
                setTimeout(() => onLoginSuccess(userProfile), 700);
            }
        } catch (err) {
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
            setSuccessMessage('You have been signed out successfully.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF5E8] flex flex-col justify-between text-[#161616] selection:bg-[#C69722] selection:text-white">
            {/* Top Navigation Bar */}
            <header className="border-b border-[#E6D6B8] bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onReturnToStore}
                        className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-[#C69722] transition active:scale-95 py-2 px-3 rounded-lg hover:bg-[#FAF5E8]"
                        aria-label="Return to store"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return to Store</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <img
                            src="/images/logo.png"
                            alt="Amol Marble Murti Bhandar"
                            className="h-10 sm:h-12 w-auto object-contain"
                            width="140"
                            height="48"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">256-bit Encrypted</span>
                    </div>
                </div>
            </header>

            {/* Main Auth Section */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E6D6B8] overflow-hidden my-6">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-br from-[#161616] via-[#242424] to-[#121212] text-white p-6 sm:p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-[#C69722]/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C69722] to-[#F7C600] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#C69722]/30">
                            <KeyRound className="w-6 h-6 text-[#161616]" />
                        </div>
                        <h1 className="font-serif text-2xl font-bold tracking-wide">
                            {activeUser ? 'Account Portal' : mode === 'login' ? 'Devotee & Staff Login' : 'Create New Account'}
                        </h1>
                        <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto">
                            {activeUser
                                ? 'Your authenticated temple account session'
                                : 'Access saved orders, track shipments, and staff catalog controls.'}
                        </p>
                    </div>

                    {/* Active User Session Card */}
                    {activeUser ? (
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="p-4 rounded-2xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-full bg-[#161616] text-[#F7C600] font-bold text-lg flex items-center justify-center shrink-0">
                                    {(activeUser.full_name || activeUser.email || 'U')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-sm font-bold text-[#161616] truncate">{activeUser.full_name || 'Devotee Member'}</h2>
                                    <p className="text-xs text-stone-600 truncate">{activeUser.email}</p>
                                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#161616] text-[#F7C600]">
                                        Role: {activeUser.role || 'Member'}
                                    </span>
                                </div>
                            </div>

                            {successMessage && (
                                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onReturnToStore}
                                    className="w-full min-h-[48px] py-3 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 active:scale-98"
                                >
                                    <span>Continue Shopping</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoading}
                                    className="w-full min-h-[48px] py-3 rounded-xl border border-stone-300 hover:border-red-400 text-stone-700 hover:text-red-700 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 active:scale-98"
                                >
                                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                    <span>Sign Out of Account</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 sm:p-8">
                            {/* Mode Toggle Tabs */}
                            <div className="flex rounded-xl bg-stone-100 p-1 mb-6">
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
                                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${mode === 'login' ? 'bg-white text-[#161616] shadow-xs' : 'text-stone-500 hover:text-black'}`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
                                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${mode === 'register' ? 'bg-white text-[#161616] shadow-xs' : 'text-stone-500 hover:text-black'}`}
                                >
                                    Create Account
                                </button>
                            </div>

                            {/* Error Banner */}
                            {errorMessage && (
                                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            {/* Success Banner */}
                            {successMessage && (
                                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Sign In Form */}
                            {mode === 'login' && (
                                <form onSubmit={handleLogin} className="space-y-4">
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
                                                placeholder="e.g. name@example.com"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                            />
                                            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label htmlFor="login-password-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                                                Password
                                            </label>
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
                                                className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                            />
                                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                                        <div className="font-bold flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5 text-[#C69722]" /> Staff Admin Credentials:
                                        </div>
                                        <div className="font-mono text-[10.5px]">admin@amolmurtibhandar.com / admin123</div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Authenticating...</span>
                                            </>
                                        ) : (
                                            <span>Sign In to Account</span>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Create Account Form */}
                            {mode === 'register' && (
                                <form onSubmit={handleRegister} className="space-y-4">
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
                                                placeholder="e.g. Rameshwar Joshi"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                            />
                                            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                            />
                                            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                                                className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                            />
                                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
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
                                                className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C69722] bg-white shadow-2xs"
                                            />
                                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C69722] hover:from-[#C69722] hover:to-[#B3810E] text-[#161616] font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Creating Account...</span>
                                            </>
                                        ) : (
                                            <span>Create Free Account</span>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-[11px] text-stone-500">
                        Protected by rate-limiting & bcrypt hashing. Passwords are never stored in plaintext.
                    </div>
                </div>
            </main>

            {/* Bottom Copyright */}
            <footer className="py-4 text-center text-xs text-stone-500 border-t border-[#E6D6B8]">
                © 2026 अमोल मार्बल मूर्ती भंडार (Amol Marble Murti Bhandar). All rights reserved.
            </footer>
        </div>
    );
}
