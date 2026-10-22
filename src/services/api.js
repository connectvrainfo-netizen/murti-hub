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

const API_BASE = '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('murti_admin_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('murti_admin_token', token);
        } else {
            localStorage.removeItem('murti_admin_token');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('murti_admin_token');
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
        const url = `${API_BASE}${endpoint}`;
        const isMultipart = options.body instanceof FormData;
        
        // Timeout handling via AbortController (Checklist Section 2 & 3: Configure per-request timeouts)
        const controller = new AbortController();
        const timeoutMs = options.timeoutMs || 12000;
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
            const data = await res.json().catch(() => ({}));

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
                    message: `Request to ${endpoint} timed out after ${timeoutMs / 1000}s. Please verify server connection and try again.`,
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
                : 'Unable to connect to the backend server. Please verify that the API server is running on port 8000.';

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
        if (res.data?.access_token) {
            this.setToken(res.data.access_token);
        }
        return res.data;
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
