import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../services/api';

/**
 * AdminRouteGuard
 * Enforces cryptographic server-side role verification before rendering any admin UI.
 * Prevents client-side privilege escalation and zero DOM leaks while verifying.
 */
export default function AdminRouteGuard({ children, onReturnToStore, onRedirectToLogin }) {
    const [authState, setAuthState] = useState({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
        error: null
    });

    useEffect(() => {
        // Enforce noindex, nofollow on all administrative route renderings
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
            const currentMeta = document.querySelector('meta[name="robots"]');
            if (currentMeta) {
                currentMeta.setAttribute('content', prevContent || 'index, follow');
            }
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const verifyAdminRole = async () => {
            const token = api.getToken();
            if (!token) {
                if (isMounted) {
                    setAuthState({
                        isLoading: false,
                        isAuthenticated: false,
                        isAdmin: false,
                        error: 'Unauthenticated. Please log in to access the Admin Console.'
                    });
                }
                return;
            }

            try {
                const me = await api.getMe();
                const user = me?.data || me?.admin || me;
                const role = String(user?.role || '').toLowerCase();
                const hasAdminPrivilege = role === 'admin' || role === 'super_admin';

                if (isMounted) {
                    if (hasAdminPrivilege) {
                        setAuthState({
                            isLoading: false,
                            isAuthenticated: true,
                            isAdmin: true,
                            error: null
                        });
                    } else {
                        setAuthState({
                            isLoading: false,
                            isAuthenticated: true,
                            isAdmin: false,
                            error: 'Access Denied: Administrative privileges are required for this area.'
                        });
                    }
                }
            } catch (err) {
                console.error('[AdminRouteGuard] Verification failed:', err);
                await api.logout();
                if (isMounted) {
                    setAuthState({
                        isLoading: false,
                        isAuthenticated: false,
                        isAdmin: false,
                        error: 'Your session has expired or is invalid. Please sign in again.'
                    });
                }
            }
        };

        verifyAdminRole();

        return () => {
            isMounted = false;
        };
    }, []);

    // 1. Loading State: Render neutral loader, zero sensitive admin DOM nodes
    if (authState.isLoading) {
        return (
            <div className="min-h-screen w-full bg-[#141210] flex flex-col items-center justify-center p-6 text-stone-300 font-sans">
                <div className="p-8 rounded-3xl bg-[#201C18] border border-[#DFC48D]/30 shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center">
                    <RefreshCw className="w-8 h-8 text-[#F7C600] animate-spin" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                        Verifying Admin Authorization
                    </h2>
                    <p className="text-xs text-stone-400">
                        Cryptographically validating administrative permissions with the server...
                    </p>
                </div>
            </div>
        );
    }

    // 2. Unauthenticated: Redirect to login
    if (!authState.isAuthenticated) {
        return (
            <div className="min-h-screen w-full bg-[#141210] flex flex-col items-center justify-center p-6 text-stone-300 font-sans">
                <div className="p-8 rounded-3xl bg-[#201C18] border border-rose-500/30 shadow-2xl flex flex-col items-center gap-4 max-w-md text-center">
                    <ShieldAlert className="w-10 h-10 text-rose-400" />
                    <h2 className="text-base font-bold text-white">
                        Authentication Required
                    </h2>
                    <p className="text-xs text-stone-400">
                        {authState.error || 'You must be signed in with an administrative account to view this portal.'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 w-full">
                        <button
                            type="button"
                            onClick={onReturnToStore}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-700 hover:border-stone-500 text-stone-300 text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Storefront</span>
                        </button>
                        <button
                            type="button"
                            onClick={onRedirectToLogin}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7C600] hover:bg-[#E5B500] text-[#161616] text-xs font-extrabold transition shadow-md"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Authenticated but not an admin: Access Denied
    if (!authState.isAdmin) {
        return (
            <div className="min-h-screen w-full bg-[#141210] flex flex-col items-center justify-center p-6 text-stone-300 font-sans">
                <div className="p-8 rounded-3xl bg-[#201C18] border border-amber-500/30 shadow-2xl flex flex-col items-center gap-4 max-w-md text-center">
                    <ShieldAlert className="w-10 h-10 text-amber-400" />
                    <h2 className="text-base font-bold text-white">
                        Access Restricted
                    </h2>
                    <p className="text-xs text-stone-400">
                        {authState.error}
                    </p>
                    <button
                        type="button"
                        onClick={onReturnToStore}
                        className="py-2.5 px-6 rounded-xl bg-[#F7C600] hover:bg-[#E5B500] text-[#161616] text-xs font-extrabold transition shadow-md flex items-center gap-2 mt-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return to Storefront</span>
                    </button>
                </div>
            </div>
        );
    }

    // 4. Authorized Admin: render children safely
    return <>{children}</>;
}
