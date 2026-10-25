/**
 * Amol Marble Murti Bhandar - FastAPI & Supabase Client API Service
 * Handles all 7 Admin Operations & Storefront Data Fetching
 */
import { supabase } from '../utils/supabase';

export class ApiError extends Error {
    constructor({ message, status, errorCode, details, data }) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errorCode = errorCode || (status ? `HTTP_${status}` : 'NETWORK_ERROR');
        this.details = details || [];
        this.data = data;
    }

    getFieldError(fieldName) {
        if (!Array.isArray(this.details)) return null;
        const found = this.details.find(d => d.field === fieldName || (Array.isArray(d.loc) && d.loc.includes(fieldName)));
        return found ? (found.message || found.msg) : null;
    }
}

function formatApiErrorMessage(data, status, defaultStatusText) {
    if (data?.message && typeof data.message === 'string' && data.message.trim()) {
        return data.message;
    }
    if (typeof data?.detail === 'string' && data.detail.trim()) {
        return data.detail;
    }
    if (Array.isArray(data?.details) && data.details.length > 0) {
        const msgs = data.details.map(d => `${d.field || 'field'}: ${d.message || 'invalid'}`);
        return `Validation failed: ${msgs.join('; ')}`;
    }
    if (Array.isArray(data?.detail) && data.detail.length > 0) {
        const msgs = data.detail.map(item => {
            if (typeof item === 'string') return item;
            const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : item.field || 'field';
            const msg = item.msg || item.message || 'invalid';
            return `${field}: ${msg}`;
        });
        return `Validation failed: ${msgs.join('; ')}`;
    }
    if (status === 400) return 'Invalid request parameters.';
    if (status === 401) return 'Session expired or invalid credentials. Please log in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'The requested resource was not found.';
    if (status === 413) return 'Uploaded file is too large. Max limit is 15 MB.';
    if (status === 422) return 'Invalid form input. Please verify all required fields.';
    if (status === 429) return data?.message || 'Too many requests. Please wait a moment before trying again.';
    if (status >= 500) return 'Server error occurred. Please try again shortly.';
    return defaultStatusText || `Request failed with status ${status}`;
}

class ApiService {
    constructor() {
        this.token = typeof localStorage !== 'undefined' ? (localStorage.getItem('murti_admin_token') || null) : null;
        this.customBaseUrl = typeof localStorage !== 'undefined' ? (localStorage.getItem('murti_backend_url') || '') : '';
    }

    /**
     * Get the active backend base URL.
     * Order of precedence:
     * 1. localStorage override ('murti_backend_url') - set dynamically from Admin UI
     * 2. VITE_API_URL or VITE_BACKEND_URL (set in Vercel environment variables)
     * 3. Fallback to '' (relative paths for local Vite dev proxy or same-domain proxy)
     */
    getBaseUrl() {
        if (this.customBaseUrl && typeof this.customBaseUrl === 'string' && this.customBaseUrl.trim()) {
            return this.customBaseUrl.trim().replace(/\/+$/, '');
        }
        const envUrl = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_BACKEND_URL;
        if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
            return envUrl.trim().replace(/\/+$/, '');
        }
        // In production / live hosting (e.g. Vercel), default to the live Render backend
        if (typeof window !== 'undefined' && window.location?.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
            return 'https://murti-hub-5.onrender.com';
        }
        return '';
    }

    /**
     * Set or clear the custom backend base URL (saved to localStorage).
     */
    setBaseUrl(url) {
        const clean = (url || '').trim().replace(/\/+$/, '');
        this.customBaseUrl = clean;
        if (typeof localStorage !== 'undefined') {
            if (clean) {
                localStorage.setItem('murti_backend_url', clean);
            } else {
                localStorage.removeItem('murti_backend_url');
            }
        }
    }

    /**
     * Build the full API URL for a given endpoint.
     */
    getApiEndpoint(endpoint) {
        const base = this.getBaseUrl();
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return base ? `${base}/api${cleanEndpoint}` : `/api${cleanEndpoint}`;
    }

    /**
     * Helper to resolve media/image URLs (handles relative /uploads/ from backend).
     */
    getImageUrl(path) {
        if (!path) return '';
        if (typeof path !== 'string') return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) return path;
        const normalized = path.startsWith('/') ? path : `/${path}`;
        if (normalized.startsWith('/uploads/')) {
            const base = this.getBaseUrl();
            return base ? `${base}${normalized}` : normalized;
        }
        return normalized;
    }

    /**
     * Test live connectivity to backend /health endpoint.
     */
    async testBackendHealth(customUrl) {
        const target = (customUrl !== undefined ? customUrl : this.getBaseUrl()).trim().replace(/\/+$/, '');
        const healthUrl = target ? `${target}/health` : '/health';
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);
            const res = await fetch(healthUrl, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            clearTimeout(timeoutId);
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                return {
                    success: false,
                    error: `Received HTML from ${healthUrl}. Point to your Render backend URL (e.g. https://your-backend.onrender.com).`
                };
            }
            if (!res.ok) {
                return { success: false, error: `Server responded with HTTP ${res.status}` };
            }
            const data = await res.json().catch(() => ({}));
            return { success: true, data, url: healthUrl };
        } catch (err) {
            return {
                success: false,
                error: err.name === 'AbortError' ? 'Connection timed out (Render free tier may still be waking up, please retry in 15s)' : (err.message || 'Network error')
            };
        }
    }

    setToken(token) {
        this.token = token;
        if (typeof localStorage !== 'undefined') {
            if (token) {
                localStorage.setItem('murti_admin_token', token);
            } else {
                localStorage.removeItem('murti_admin_token');
            }
        }
    }

    getToken() {
        return this.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('murti_admin_token') : null);
    }

    getCurrentUser() {
        if (typeof localStorage === 'undefined') return null;
        try {
            const raw = localStorage.getItem('murti_admin_session') || localStorage.getItem('murti_user_session');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    setCurrentUser(user) {
        if (typeof localStorage !== 'undefined') {
            if (user) {
                const serialized = JSON.stringify(user);
                localStorage.setItem('murti_admin_session', serialized);
                localStorage.setItem('murti_user_session', serialized);
            } else {
                localStorage.removeItem('murti_admin_session');
                localStorage.removeItem('murti_user_session');
            }
        }
        this.notifyAuthChanged(user);
    }

    notifyAuthChanged(user = null) {
        if (typeof window !== 'undefined') {
            try {
                window.dispatchEvent(new CustomEvent('murti-auth-changed', {
                    detail: {
                        user: user || this.getCurrentUser(),
                        token: this.getToken(),
                        isAuthenticated: Boolean(this.getToken() && (user || this.getCurrentUser()))
                    }
                }));
            } catch {
                // Ignore SSR/non-browser environment errors
            }
        }
    }

    isAuthenticated() {
        return Boolean(this.getToken() && this.getCurrentUser());
    }

    isAdmin() {
        const user = this.getCurrentUser();
        if (!user) return false;
        const role = String(user.role || '').toLowerCase();
        return ['super_admin', 'admin', 'editor', 'staff'].includes(role);
    }

    getHeaders(isMultipart = false) {
        const headers = {};
        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}, isRetry = false, retryCount = 0) {
        const url = this.getApiEndpoint(endpoint);
        const isMultipart = options.body instanceof FormData;
        
        // Timeout handling via AbortController (Checklist Section 2 & 3: Configure per-request timeouts)
        const controller = new AbortController();
        const timeoutMs = options.timeoutMs || 15000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const config = {
            ...options,
            credentials: options.credentials || 'include',
            signal: options.signal || controller.signal,
            headers: {
                ...this.getHeaders(isMultipart),
                ...(options.headers || {})
            }
        };

        try {
            const res = await fetch(url, config);
            clearTimeout(timeoutId);

            // Guard against Vercel/SPA serving index.html for API requests
            const contentType = res.headers.get('content-type') || '';
            let data = {};

            if (contentType.includes('application/json')) {
                data = await res.json().catch(() => ({}));
            } else {
                const text = await res.text().catch(() => '');
                if (text.trim().startsWith('<!DOCTYPE') || text.includes('<html')) {
                    const currentBase = this.getBaseUrl();
                    const liveBackend = 'https://murti-hub-5.onrender.com';
                    if (!currentBase.includes('onrender.com') && !isRetry) {
                        console.warn(`[API Proxy HTML Fallback] Received HTML from local proxy. Automatically routing to cloud backend ${liveBackend}...`);
                        this.setBaseUrl(liveBackend);
                        return this.request(endpoint, options, true, retryCount);
                    }
                    throw new ApiError({
                        message: `Connecting to ${currentBase || 'server'} returned an HTML page instead of JSON. The backend may still be starting up.`,
                        status: res.status,
                        errorCode: 'HTML_RESPONSE_MISMATCH',
                        data: null
                    });
                }
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { message: text };
                }
            }

            if (!res.ok) {
                // If local proxy failed with 5xx (e.g. ECONNREFUSED from Vite dev proxy), fall back to live cloud backend
                const currentBase = this.getBaseUrl();
                const liveBackend = 'https://murti-hub-5.onrender.com';
                if (res.status >= 500 && !currentBase.includes('onrender.com') && !isRetry) {
                    console.warn(`[API Proxy Fallback] Received HTTP ${res.status} from local proxy. Retrying with live backend ${liveBackend}...`);
                    this.setBaseUrl(liveBackend);
                    return this.request(endpoint, options, true, retryCount);
                }

                // If token is invalid or expired, immediately clear active session
                if (res.status === 401 && !endpoint.includes('/auth/login')) {
                    this.setToken(null);
                    this.setCurrentUser(null);
                }

                // Transient 5xx or 429 Rate Limit Retry with Exponential Backoff (excluding auth routes)
                const isTransientError = res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504;
                const isAuthRoute = endpoint.includes('/auth/');
                if (isTransientError && !isAuthRoute && retryCount < 2) {
                    const retryAfterHeader = res.headers?.get ? res.headers.get('Retry-After') : null;
                    const delayMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : Math.pow(2, retryCount) * 800 + Math.random() * 200;
                    console.warn(`[API Retry] ${res.status} on ${endpoint}. Retrying in ${Math.round(delayMs)}ms (attempt ${retryCount + 1}/2)...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    return this.request(endpoint, options, isRetry, retryCount + 1);
                }

                const errorMessage = formatApiErrorMessage(data, res.status, res.statusText);
                const apiError = new ApiError({
                    message: errorMessage,
                    status: res.status,
                    errorCode: data.error_code || `HTTP_${res.status}`,
                    details: data.details || (Array.isArray(data.detail) ? data.detail : []),
                    data: data
                });
                throw apiError;
            }
            return data;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err instanceof ApiError) {
                console.error(`[API Error] ${endpoint} (${err.status}):`, err.message);
                throw err;
            }

            // If network failed on local proxy, retry on live Render cloud backend
            const currentBase = this.getBaseUrl();
            const liveBackend = 'https://murti-hub-5.onrender.com';
            if (!currentBase.includes('onrender.com') && !isRetry) {
                console.warn(`[API Network Fallback] Failed connecting to local proxy. Retrying with live backend ${liveBackend}...`);
                this.setBaseUrl(liveBackend);
                return this.request(endpoint, options, true, retryCount);
            }

            // Handle AbortController Timeout
            if (err.name === 'AbortError') {
                const timeoutError = new ApiError({
                    message: `Request to ${url} timed out after ${timeoutMs / 1000}s. Please verify your Render backend server is awake and try again.`,
                    status: 408,
                    errorCode: 'REQUEST_TIMEOUT'
                });
                console.error(`[API Timeout] ${endpoint}:`, timeoutError.message);
                throw timeoutError;
            }

            // Handle network / offline / connection errors cleanly
            const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
            const netMsg = isOffline
                ? 'You appear to be offline. Please verify your internet connection.'
                : currentBase
                    ? `Unable to connect to backend at ${currentBase}. If on Render free tier, it may be waking up (wait ~30s).`
                    : 'Unable to connect to the backend server. Configure your Render backend URL in Admin settings.';

            const networkError = new ApiError({
                message: netMsg,
                status: 0,
                errorCode: 'NETWORK_ERROR',
                data: null
            });
            console.error(`[API Network Error] ${endpoint}:`, networkError.message);
            throw networkError;
        }
    }

    // =========================================================================
    // 1. AUTHENTICATION & ADMIN SESSION
    // =========================================================================
    async login(email, password, rememberMe = true) {
        const cleanEmail = (email || '').trim().toLowerCase();
        let res;
        try {
            res = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: cleanEmail, password })
            });
        } catch (err) {
            // Prevent user enumeration by masking specific backend errors
            if (err.status === 401 || err.status === 403 || err.status === 404) {
                throw new ApiError({
                    message: 'Invalid email or password. Please verify your credentials.',
                    status: 401,
                    errorCode: 'INVALID_CREDENTIALS'
                });
            }
            throw err;
        }

        const token = res?.data?.access_token || res?.access_token;
        const user = res?.data?.admin || res?.data?.user || res?.admin;
        if (token && user) {
            this.setToken(token);
            this.setCurrentUser(user);
            this.notifyAuthChanged(user);

            // Synchronize with Supabase Auth session if configured
            if (supabase?.auth?.signInWithPassword) {
                try {
                    await supabase.auth.signInWithPassword({ email: cleanEmail, password });
                } catch {
                    // Supabase sync notice
                }
            }

            return res.data || res;
        }
        throw new ApiError({
            message: 'Authentication failed. Please verify your credentials.',
            status: 401,
            errorCode: 'INVALID_AUTH_RESPONSE'
        });
    }

    async register(email, password, fullName = 'Devotee Member', role = 'devotee') {
        const cleanEmail = (email || '').trim().toLowerCase();
        const res = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: cleanEmail, password, full_name: fullName, role })
        });

        const token = res?.data?.access_token || res?.access_token;
        const user = res?.data?.admin || res?.data?.user || res?.admin || { email: cleanEmail, full_name: fullName, role };
        if (token) {
            this.setToken(token);
            this.setCurrentUser(user);
            this.notifyAuthChanged(user);

            if (supabase?.auth?.signUp) {
                try {
                    await supabase.auth.signUp({
                        email: cleanEmail,
                        password,
                        options: { data: { full_name: fullName } }
                    });
                } catch {
                    // Supabase signup sync notice
                }
            }

            return res.data || res;
        }
        return res.data || res;
    }

    async getMe() {
        return this.request('/auth/me');
    }

    async requestPasswordReset(email) {
        const cleanEmail = (email || '').trim().toLowerCase();
        // 1. Attempt Supabase Auth password reset if configured
        if (supabase?.auth?.resetPasswordForEmail) {
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
                    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
                });
                if (!error) {
                    return { success: true, message: 'Password reset link sent to your registered email address.' };
                }
            } catch (err) {
                console.warn('[Supabase Auth reset notice]', err);
            }
        }
        // 2. Authoritative backend password reset endpoint
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email: cleanEmail })
        });
    }

    async resetPasswordWithToken(token, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, new_password: newPassword })
        });
    }

    async updateAdminCredentials({ current_password, new_email, new_password, security_pin }) {
        const payload = { current_password };
        if (new_email) payload.new_email = new_email.trim().toLowerCase();
        if (new_password) payload.new_password = new_password;
        if (security_pin) payload.security_pin = security_pin;

        const res = await this.request('/auth/admin-credentials', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        const token = res?.data?.access_token || res?.access_token;
        const admin = res?.data?.admin || res?.admin;

        if (token) {
            this.setToken(token);
        }
        if (admin) {
            const cur = this.getCurrentUser() || {};
            const merged = { ...cur, ...admin };
            this.setCurrentUser(merged);
        }

        if (supabase && (payload.new_email || payload.new_password)) {
            try {
                const updateAttrs = {};
                if (payload.new_email) updateAttrs.email = payload.new_email;
                if (payload.new_password) updateAttrs.password = payload.new_password;
                await supabase.auth.updateUser(updateAttrs);
            } catch (err) {
                console.warn('[Supabase Auth updateUser notice]', err);
            }
        }

        return res;
    }

    async getSecurityPinStatus() {
        return this.request('/auth/admin/security-pin');
    }

    async setSecurityPin(current_password, security_pin) {
        return this.request('/auth/admin/security-pin', {
            method: 'POST',
            body: JSON.stringify({ current_password, security_pin })
        });
    }

    async getProfile() {
        try {
            const res = await this.request('/auth/profile');
            const profile = res?.data || res;
            if (profile) {
                const cur = this.getCurrentUser() || {};
                const merged = { ...cur, ...profile };
                this.setCurrentUser(merged);
                return merged;
            }
        } catch (err) {
            try {
                const meRes = await this.getMe();
                const me = meRes?.data || meRes?.admin || meRes;
                if (me) {
                    const cur = this.getCurrentUser() || {};
                    const merged = { ...cur, ...me };
                    this.setCurrentUser(merged);
                    return merged;
                }
            } catch {
                // Fall back to local user session
            }
        }
        return this.getCurrentUser();
    }

    async updateProfile(profileData) {
        let updatedUser = { ...(this.getCurrentUser() || {}), ...profileData };
        try {
            const res = await this.request('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            if (res?.data) {
                updatedUser = { ...updatedUser, ...res.data };
            }
        } catch (err) {
            console.warn('[API] updateProfile remote fallback:', err.message);
        }

        // Always persist locally & sync across tabs
        this.setCurrentUser(updatedUser);
        return updatedUser;
    }

    async getMyOrders() {
        let serverOrders = [];
        try {
            const res = await this.request('/orders/my');
            if (Array.isArray(res?.data)) {
                serverOrders = res.data;
            }
        } catch (err) {
            console.warn('[API] getMyOrders server fetch fallback:', err.message);
        }

        // Merge with local placed orders
        const localOrders = this.getUserOrders();
        const mergedMap = new Map();
        
        [...serverOrders, ...localOrders].forEach(ord => {
            const id = ord.order_id || ord.orderId;
            if (id && !mergedMap.has(id)) {
                mergedMap.set(id, ord);
            }
        });

        return Array.from(mergedMap.values());
    }

    saveUserOrder(order) {
        if (!order || typeof localStorage === 'undefined') return;
        try {
            const existing = this.getUserOrders();
            const orderId = order.order_id || order.orderId;
            const filtered = existing.filter(o => (o.order_id || o.orderId) !== orderId);
            filtered.unshift(order);
            localStorage.setItem('murti_recent_orders', JSON.stringify(filtered.slice(0, 20)));
        } catch (err) {
            console.warn('[API] Could not save order to local storage:', err);
        }
    }

    getUserOrders() {
        if (typeof localStorage === 'undefined') return [];
        try {
            const raw = localStorage.getItem('murti_recent_orders');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
        } finally {
            try {
                if (typeof window !== 'undefined' && window.supabaseClient?.auth?.signOut) {
                    await window.supabaseClient.auth.signOut();
                }
            } catch {
                // Ignore supabase cleanup errors
            }
            this.setToken(null);
            this.setCurrentUser(null);
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('murti_admin_session');
                localStorage.removeItem('murti_user_session');
                localStorage.removeItem('murti_admin_token');
                localStorage.removeItem('murti_cart_cache');
                localStorage.removeItem('murti_recent_orders');
            }
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('murti-auth-changed', { detail: { user: null } }));
            }
        }
    }

    // =========================================================================
    // 2. REQ #4: WHATSAPP NUMBER & REQ #5: GLOBAL RATING MODE
    // =========================================================================
    async getSettings() {
        return this.request('/settings');
    }

    async updateSettings(settingsPayload) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsPayload)
        });
    }

    async updateWhatsApp(number, message) {
        const query = new URLSearchParams({
            whatsapp_number: number,
            default_message: message || ''
        });
        return this.request(`/settings/whatsapp?${query.toString()}`, {
            method: 'PATCH'
        });
    }

    async updateRatingMode(mode) {
        return this.request(`/settings/rating-mode?mode=${mode}`, {
            method: 'PATCH'
        });
    }

    // =========================================================================
    // 3. REQ #1: CATEGORIES & BANNER IMAGES SECTION
    // =========================================================================
    async getCategories(includeInactive = false) {
        return this.request(`/categories?include_inactive=${includeInactive}`);
    }

    async createCategory(categoryData) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async updateCategory(categoryId, categoryData) {
        return this.request(`/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    async deleteCategory(categoryId) {
        return this.request(`/categories/${categoryId}`, {
            method: 'DELETE'
        });
    }

    // =========================================================================
    // 4. REQ #2, REQ #3 & REQ #5: PRODUCTS & CATALOG IMAGES
    // =========================================================================
    async getProducts(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.append(k, v);
        });
        return this.request(`/products?${query.toString()}`);
    }

    async getProductsCursor(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.append(k, v);
        });
        return this.request(`/products/cursor?${query.toString()}`);
    }

    async getProduct(productIdOrLegacy) {
        return this.request(`/products/${productIdOrLegacy}`);
    }

    async createProduct(productData) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(productId, productData) {
        return this.request(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(productId) {
        return this.request(`/products/${productId}`, {
            method: 'DELETE'
        });
    }

    // =========================================================================
    // 5. REQ #7: MASTER SIZES & PRODUCT VARIANTS
    // =========================================================================
    async getSizes(includeInactive = false) {
        return this.request(`/sizes?include_inactive=${includeInactive}`);
    }

    async createSize(sizeData) {
        return this.request('/sizes', {
            method: 'POST',
            body: JSON.stringify(sizeData)
        });
    }

    async updateSize(sizeId, sizeData) {
        return this.request(`/sizes/${sizeId}`, {
            method: 'PUT',
            body: JSON.stringify(sizeData)
        });
    }

    async deleteSize(sizeId) {
        return this.request(`/sizes/${sizeId}`, {
            method: 'DELETE'
        });
    }

    async addProductVariant(productId, variantData) {
        return this.request(`/products/${productId}/variants`, {
            method: 'POST',
            body: JSON.stringify(variantData)
        });
    }

    async deleteProductVariant(variantId) {
        return this.request(`/products/variants/${variantId}`, {
            method: 'DELETE'
        });
    }

    // =========================================================================
    // 6. REQ #6: FESTIVAL SECTION MANAGEMENT
    // =========================================================================
    async getActiveFestival() {
        return this.request('/festivals/active');
    }

    async getAllFestivals() {
        return this.request('/festivals');
    }

    async createFestival(festivalData) {
        return this.request('/festivals', {
            method: 'POST',
            body: JSON.stringify(festivalData)
        });
    }

    async updateFestival(festivalId, festivalData) {
        return this.request(`/festivals/${festivalId}`, {
            method: 'PUT',
            body: JSON.stringify(festivalData)
        });
    }

    async deleteFestival(festivalId) {
        return this.request(`/festivals/${festivalId}`, {
            method: 'DELETE'
        });
    }

    async linkFestivalProduct(festivalId, itemData) {
        return this.request(`/festivals/${festivalId}/items`, {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    async unlinkFestivalProduct(festivalId, murtiId) {
        return this.request(`/festivals/${festivalId}/items/${murtiId}`, {
            method: 'DELETE'
        });
    }

    // =========================================================================
    // 7. REQ #5: REVIEWS & SMART RATINGS MODERATION
    // =========================================================================
    async getProductReviews(productId) {
        return this.request(`/reviews/product/${productId}`);
    }

    async submitReview(productId, reviewData) {
        return this.request(`/reviews/product/${productId}`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }

    async getAllReviews() {
        return this.request('/reviews/admin/all');
    }

    async moderateReview(reviewId, modData) {
        return this.request(`/reviews/admin/${reviewId}/moderate`, {
            method: 'PUT',
            body: JSON.stringify(modData)
        });
    }

    async replyToReview(reviewId, replyText, author = "Amol Murti Concierge (Master Sculptor Team)") {
        return this.request(`/reviews/admin/${reviewId}/reply`, {
            method: 'POST',
            body: JSON.stringify({ text: replyText, author })
        });
    }

    async deleteReview(reviewId) {
        return this.request(`/reviews/admin/${reviewId}`, {
            method: 'DELETE'
        });
    }

    // =========================================================================
    // 8. MEDIA UPLOADS & ADMIN DASHBOARD METRICS
    // =========================================================================
    async uploadImage(file, folder = 'catalog') {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        const maxSize = 5 * 1024 * 1024; // 5 MB

        if (!file) {
            throw new ApiError({ message: 'No file provided for upload.', status: 400 });
        }
        if (!allowedTypes.includes(file.type)) {
            throw new ApiError({
                message: `Invalid file type (${file.type}). Only JPEG, PNG, WebP, and AVIF are permitted.`,
                status: 400,
                errorCode: 'INVALID_FILE_TYPE'
            });
        }
        if (file.size > maxSize) {
            throw new ApiError({
                message: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please optimize before uploading.`,
                status: 413,
                errorCode: 'FILE_TOO_LARGE'
            });
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        return this.request('/upload', {
            method: 'POST',
            body: formData
        });
    }

    async getDashboardStats() {
        return this.request('/admin/dashboard');
    }

    async seedDatabase() {
        return this.request('/admin/seed', {
            method: 'POST'
        });
    }

    // =========================================================================
    // 9. AUTHORITATIVE E-COMMERCE ORDERS & DISPATCH (Checklist Section 4)
    // =========================================================================
    async validateOrder(items, couponCode = null, pincode = null) {
        return this.request('/orders/validate', {
            method: 'POST',
            body: JSON.stringify({
                items: items.map(i => ({
                    product_id: String(i.id),
                    qty: i.qty || 1,
                    selected_size: i.selectedSize || i.title || null
                })),
                coupon_code: couponCode,
                shipping_pincode: pincode
            })
        });
    }

    async createOrder(orderPayload) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderPayload)
        });
    }

    async trackOrder(orderId) {
        return this.request(`/orders/${encodeURIComponent(orderId)}`);
    }

    async getAdminOrders() {
        return this.request('/orders/admin/all');
    }

    async updateOrderStatus(orderId, newStatus) {
        return this.request(`/orders/admin/${encodeURIComponent(orderId)}/status?new_status=${encodeURIComponent(newStatus)}`, {
            method: 'PATCH'
        });
    }
}

export const api = new ApiService();
export default api;
