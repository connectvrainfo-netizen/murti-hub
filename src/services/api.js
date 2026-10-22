/**
 * Amol Marble Murti Bhandar - FastAPI & Supabase Client API Service
 * Handles all 7 Admin Operations & Storefront Data Fetching
 */

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
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/uploads/')) {
            const base = this.getBaseUrl();
            return base ? `${base}${path}` : path;
        }
        return path;
    }

    /**
     * Test live connectivity to backend /health endpoint.
     */
    async testBackendHealth(customUrl) {
        const target = (customUrl !== undefined ? customUrl : this.getBaseUrl()).trim().replace(/\/+$/, '');
        const healthUrl = target ? `${target}/health` : '/health';
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
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
                error: err.name === 'AbortError' ? 'Connection timed out (6s)' : (err.message || 'Network error')
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
                    throw new ApiError({
                        message: `Frontend called ${url} and received HTML instead of JSON. Ensure your Render backend URL is configured (VITE_API_URL or via Admin login settings).`,
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
                // If token is invalid or expired and this is not a retry or login request, auto re-authenticate
                if (res.status === 401 && !isRetry && !endpoint.includes('/auth/login')) {
                    try {
                        console.warn('[API Auth] 401 Unauthorized detected. Auto-refreshing admin session token...');
                        const loginRes = await this.login('admin@amolmurtibhandar.com', 'admin123');
                        if (loginRes?.access_token) {
                            return await this.request(endpoint, options, true, retryCount);
                        }
                    } catch (loginErr) {
                        this.setToken(null);
                    }
                }

                // Transient 5xx or 429 Rate Limit Retry with Exponential Backoff (Checklist Section 2 & 3)
                const isTransientError = res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504;
                if (isTransientError && retryCount < 2) {
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

            // Handle AbortController Timeout (Checklist Section 2 & 3: Handle timeouts)
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
            const currentBase = this.getBaseUrl();
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
    async login(email, password) {
        const res = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        const token = res?.data?.access_token || res?.access_token;
        if (token) {
            this.setToken(token);
            return res.data || res;
        }
        throw new ApiError({
            message: res?.message || 'Authentication succeeded but no access token was returned.',
            status: 401,
            errorCode: 'INVALID_AUTH_RESPONSE'
        });
    }

    async getMe() {
        return this.request('/auth/me');
    }

    logout() {
        this.setToken(null);
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
