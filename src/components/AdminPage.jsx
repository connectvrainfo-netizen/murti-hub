import React, { useState, useEffect, useRef } from 'react';
import {
    Shield, Phone, Image as ImageIcon, Package, Tag,
    Sparkles, Star, Plus, Trash2, Edit3, Check, RefreshCw,
    ExternalLink, ArrowLeft, CheckCircle2, AlertCircle, Lock,
    LogOut, Database, Layers, MessageSquare, CheckSquare, Search,
    Upload, Loader2, Eye, EyeOff, Filter, Send, Link as LinkIcon,
    AlertTriangle, X, CheckCheck, ChevronRight, ChevronDown, Sliders,
    User, Info, ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import SafeImage from './SafeImage';
import { deityCategories as defaultCategories, catalog as defaultCatalog } from '../data/catalog';
import brandLogo from '../assets/logo.png';

// Guarantee all 20 existing products from the store catalog are immediately available on Admin page
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
    { id: 'size-1', label: '6 Inches (Pooja Altar)', height_inches: 6.0, unit: 'in', size_value: 6.0, description: 'Compact altar and car dashboard size', sort_order: 1, is_active: true },
    { id: 'size-2', label: '9 Inches (Home Mandir)', height_inches: 9.0, unit: 'in', size_value: 9.0, description: 'Standard home temple size', sort_order: 2, is_active: true },
    { id: 'size-3', label: '12 Inches (Classic Mandir)', height_inches: 12.0, unit: 'in', size_value: 12.0, description: 'Most popular home sanctum idol size', sort_order: 3, is_active: true },
    { id: 'size-4', label: '15 Inches (Grand Mandir)', height_inches: 15.0, unit: 'in', size_value: 15.0, description: 'Spacious dedicated pooja room size', sort_order: 4, is_active: true },
    { id: 'size-5', label: '18 Inches (Temple Sanctum)', height_inches: 18.0, unit: 'in', size_value: 18.0, description: 'Large sanctified temple & hall idol', sort_order: 5, is_active: true },
    { id: 'size-6', label: '24 Inches (Grand Heritage)', height_inches: 24.0, unit: 'in', size_value: 24.0, description: 'Life-presence heritage temple idol', sort_order: 6, is_active: true }
];

// Searchable Product Select with Thumbnails (Req 3.2 & 2.2)
function ProductSelect({ products = [], value, onChange, placeholder = "-- Choose Product --" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    const selectedProduct = products.find(p => p.id === value || String(p.id) === String(value));

    const filtered = products.filter(p => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (p.title || '').toLowerCase().includes(q) || (p.deity || '').toLowerCase().includes(q);
    });

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs bg-white flex items-center justify-between gap-2 hover:border-[#C69722] focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/20 transition text-left shadow-2xs"
            >
                {selectedProduct ? (
                    <div className="flex items-center gap-2.5 truncate">
                        <SafeImage
                            src={api.getImageUrl(selectedProduct.primary_catalog_image || selectedProduct.img)}
                            alt=""
                            className="w-7 h-7 object-contain rounded-lg bg-[#FAF5E8] border border-stone-200 flex-shrink-0 p-0.5"
                        />
                        <span className="font-semibold text-stone-900 truncate">{selectedProduct.title}</span>
                        <span className="text-[10px] text-[#8E5B00] font-mono font-bold bg-[#FAF2DE] px-1.5 py-0.5 rounded flex-shrink-0">₹{selectedProduct.price?.toLocaleString('en-IN')}</span>
                    </div>
                ) : (
                    <span className="text-stone-400 font-medium">{placeholder}</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isOpen ? 'rotate-180 text-[#C69722]' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-stone-100 bg-stone-50/80">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by idol title or deity..."
                                autoFocus
                                className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#C69722] focus:ring-1 focus:ring-[#C69722]"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto p-1 max-h-52 divide-y divide-stone-50">
                        {filtered.length === 0 ? (
                            <div className="p-4 text-center text-xs text-stone-400">No matching idols found</div>
                        ) : (
                            filtered.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(p.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full p-2 flex items-center gap-2.5 text-left rounded-xl transition hover:bg-[#FAF5E8] ${selectedProduct?.id === p.id ? 'bg-[#FAF5E8] font-bold' : ''}`}
                                >
                                    <SafeImage
                                        src={api.getImageUrl(p.primary_catalog_image || p.img)}
                                        alt=""
                                        className="w-8 h-8 object-contain rounded-lg bg-stone-50 border border-stone-200 flex-shrink-0 p-0.5"
                                    />
                                    <div className="flex-1 truncate">
                                        <div className="text-xs text-stone-900 truncate font-semibold">{p.title}</div>
                                        <div className="text-[10px] text-stone-400">{p.deity || 'Idol'} • ₹{p.price?.toLocaleString('en-IN')}</div>
                                    </div>
                                    {selectedProduct?.id === p.id && (
                                        <Check className="w-4 h-4 text-[#C69722] flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Drag-and-Drop Image Uploader (Req 1.6)
function ImageDropzone({ onUpload, label = "Upload Image", sublabel = "PNG, JPG, WEBP up to 15MB", isUploading = false, multiple = false }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length > 0) {
            if (multiple) {
                for (const file of files) {
                    await onUpload(file);
                }
            } else {
                await onUpload(files[0]);
            }
        }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            if (multiple) {
                for (const file of files) {
                    await onUpload(file);
                }
            } else {
                await onUpload(files[0]);
            }
            e.target.value = '';
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                isDragging
                    ? 'border-[#C69722] bg-[#FAF5E8] scale-[1.01]'
                    : 'border-stone-300 bg-stone-50/70 hover:bg-[#FAF8F5] hover:border-[#DFC48D]'
            }`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={multiple}
                disabled={isUploading}
                className="hidden"
                onChange={handleFileChange}
            />
            {isUploading ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8E5B00]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading photo...</span>
                </div>
            ) : (
                <>
                    <div className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-[#8E5B00]">
                        <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-stone-800">{label}</div>
                    <div className="text-[11px] text-stone-500">
                        Drag and drop file here, or <span className="text-[#8E5B00] font-semibold underline">browse</span>
                    </div>
                    {sublabel && <div className="text-[10px] text-stone-400">{sublabel}</div>}
                </>
            )}
        </div>
    );
}

export default function AdminPage({ onReturnToStore, onDataChanged }) {
    // Navigation Tabs: 'dashboard' | 'products' | 'categories' | 'festival' | 'sizes' | 'reviews' | 'settings'
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        if (typeof window === 'undefined') return false;
        return Boolean(api.getToken());
    });
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [backendUrlInput, setBackendUrlInput] = useState(api.getBaseUrl() || '');
    const [isConfiguringServer, setIsConfiguringServer] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [serverStatus, setServerStatus] = useState(null);

    // Core Data States - Pre-seeded with existing catalog data
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [stats, setStats] = useState(null);
    const [settings, setSettings] = useState({
        whatsapp_number: '+919876543210',
        whatsapp_default_message: 'Namaste! I want to inquire about a Murti on Murti Hub.',
        global_rating_mode: 'enabled',
        collection_badge: 'HASTASHILP HERITAGE 2026',
        collection_title: 'SANCTIFIED SACRED COLLECTION 2026',
        collection_subtitle: 'DIVINE BLESSINGS FOR YOUR SACRED SANCTUM',
        collection_description: 'Hand-sculpted in Makrana white marble by fourth-generation Jaipur sthapatis. Adorned with pure 24K gold foil (swarna varakh), suitable for consecrated home mandir installation.',
        collection_price_from: '1,499',
        collection_old_price: '2,499',
        collection_discount_text: '40% OFF',
        collection_tag: 'CONSECRATED',
        collection_image_url: '/images/products/ram-darbar.png'
    });
    const [categories, setCategories] = useState(initialCategories);
    const [products, setProducts] = useState(initialProducts);
    const [sizes, setSizes] = useState(initialSizes);
    const [festival, setFestival] = useState(null);
    const [reviews, setReviews] = useState([]);

    // Product Filter States
    const [productSearch, setProductSearch] = useState('');
    const [selectedDeityFilter, setSelectedDeityFilter] = useState('All');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

    // Review Filter State ('all' | 'pending' | 'approved' | 'needs_reply')
    const [reviewFilter, setReviewFilter] = useState('all');

    // Editing Modals / Drawers
    const [editingProduct, setEditingProduct] = useState(null);
    const [isCustomDeity, setIsCustomDeity] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingSize, setEditingSize] = useState(null);
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [newSizeForm, setNewSizeForm] = useState({ label: '', height_inches: 12.0, unit: 'in', size_value: 12.0, description: '', sort_order: 1, is_active: true });
    
    // Festival Linking State
    const [linkingMurtiId, setLinkingMurtiId] = useState('');
    const [linkingPrice, setLinkingPrice] = useState('');
    const [linkingCustomTag, setLinkingCustomTag] = useState('Navratri Special');

    // Review Seller Reply State
    const [replyReviewId, setReplyReviewId] = useState(null);
    const [replyText, setReplyText] = useState('');

    // File Upload Progress Flags
    const [uploadingPrimary, setUploadingPrimary] = useState(false);
    const [uploadingCatalogAngle, setUploadingCatalogAngle] = useState(false);
    const [uploadingCatIcon, setUploadingCatIcon] = useState(false);
    const [uploadingCatBanner, setUploadingCatBanner] = useState(false);
    const [uploadingFestBanner, setUploadingFestBanner] = useState(false);
    const [uploadingCollectionBanner, setUploadingCollectionBanner] = useState(false);

    // Lock body scroll & pause Lenis smooth scrolling when any modal is open
    useEffect(() => {
        const isAnyModalOpen = Boolean(editingProduct || editingCategory || editingSize);
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
            if (typeof window !== 'undefined' && window.__lenis) {
                window.__lenis.stop();
            }
        } else {
            document.body.style.overflow = '';
            if (typeof window !== 'undefined' && window.__lenis) {
                window.__lenis.start();
            }
        }
        return () => {
            document.body.style.overflow = '';
            if (typeof window !== 'undefined' && window.__lenis) {
                window.__lenis.start();
            }
        };
    }, [editingProduct, editingCategory, editingSize]);

    // Reusable file upload handler to backend /api/upload
    const handleFileUpload = async (file, folder = 'catalog') => {
        if (!file) return null;
        try {
            const res = await api.uploadImage(file, folder);
            showToast('Image uploaded successfully!');
            return res?.data?.url || res?.url;
        } catch (err) {
            showToast(`Upload failed: ${err.message}`);
            return null;
        }
    };

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
            if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
                setCategories(catsRes.value);
            }
            if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value?.items)) {
                setProducts(prodsRes.value.items);
            }
            if (sizesRes.status === 'fulfilled' && Array.isArray(sizesRes.value)) {
                setSizes(sizesRes.value);
            }
            if (festRes.status === 'fulfilled' && festRes.value) setFestival(festRes.value);
            if (revsRes.status === 'fulfilled' && Array.isArray(revsRes.value)) setReviews(revsRes.value);

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
                    setIsOfflineMode(false);
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
        if (e) e.preventDefault();
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
            setIsOfflineMode(false);
            showToast('Welcome back, Admin!');
            refreshAllData();
        } catch (err) {
            setAuthError(err.message || 'Login failed. Please verify credentials or connection.');
            setIsAuthenticated(false);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        await api.logout();
        setIsAuthenticated(false);
        setIsOfflineMode(false);
        showToast('Logged out of Admin Portal');
    };

    const handleTestAndSaveBackend = async (e) => {
        if (e) e.preventDefault();
        setTestingConnection(true);
        setServerStatus({ type: 'info', message: 'Testing backend connection to /health (wait ~20-30s if Render is waking up)...' });
        const res = await api.testBackendHealth(backendUrlInput);
        setTestingConnection(false);
        if (res.success) {
            api.setBaseUrl(backendUrlInput);
            setIsOfflineMode(false);
            setServerStatus({
                type: 'success',
                message: `Connected successfully! (Backend v${res.data?.version || '2.0.0'}, status: ${res.data?.status || 'healthy'})`
            });
            showToast('Render backend connected successfully!');
            setAuthError('');
            // Attempt auto-login with connected backend
            try {
                await api.login(loginForm.email, loginForm.password);
                setIsAuthenticated(true);
                if (typeof localStorage !== 'undefined') localStorage.setItem('murti_admin_session', 'active');
                refreshAllData();
            } catch (err) {
                console.log('Login ready for manual sign-in:', err.message);
            }
        } else {
            setServerStatus({
                type: 'error',
                message: `Connection failed: ${res.error}. If using Render free tier, wait ~30s and click Connect again.`
            });
        }
    };

    // =========================================================================
    // 1. SETTINGS & WHATSAPP
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
            showToast(`Rating mode updated to "${mode}"`);
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleTestWhatsApp = () => {
        const cleanNumber = (settings.whatsapp_number || '').replace(/[^0-9]/g, '');
        const encoded = encodeURIComponent(settings.whatsapp_default_message || 'Namaste!');
        window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank');
    };

    // =========================================================================
    // 2. CATEGORIES MANAGEMENT (Add, Edit, Delete)
    // =========================================================================
    const handleOpenAddCategory = () => {
        setEditingCategory({
            name: '',
            slug: '',
            route: '',
            img: '/images/categories/ram.png',
            banner_url: '',
            sort_order: categories.length + 1,
            is_active: true
        });
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!editingCategory) return;
        try {
            // Auto generate slug/route if missing
            const categoryData = {
                ...editingCategory,
                slug: editingCategory.slug || editingCategory.name.toLowerCase().replace(/\s+/g, '-'),
                route: editingCategory.route || `/${editingCategory.name.toLowerCase().replace(/\s+/g, '-')}`
            };

            if (editingCategory.id) {
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...categoryData } : c));
                await api.updateCategory(editingCategory.id, categoryData);
                showToast(`Category "${categoryData.name}" updated!`);
            } else {
                const tempId = 'cat-' + Date.now();
                const optimisticCat = { ...categoryData, id: tempId };
                setCategories(prev => [...prev, optimisticCat]);
                const res = await api.createCategory(categoryData);
                if (res?.data) {
                    setCategories(prev => prev.map(c => c.id === tempId ? res.data : c));
                }
                showToast(`Category "${categoryData.name}" created successfully!`);
            }
            setEditingCategory(null);
            refreshAllData();
        } catch (err) {
            showToast(`Note: ${err.message}`);
            setEditingCategory(null);
            refreshAllData();
        }
    };

    const handleDeleteCategory = async (catId, catName) => {
        if (!confirm(`Are you sure you want to delete category "${catName}"? Products in this category will remain in the catalog.`)) return;
        setCategories(prev => prev.filter(c => c.id !== catId && String(c.id) !== String(catId)));
        showToast('Category deleted successfully');
        try {
            await api.deleteCategory(catId);
            refreshAllData();
        } catch (err) {
            console.warn('Category delete warning:', err);
            refreshAllData();
        }
    };

    // =========================================================================
    // 3. PRODUCTS MANAGEMENT (Add, Edit, 1-Click Status, Delete)
    // =========================================================================
    const handleOpenAddProduct = () => {
        setActiveTab('products');
        setEditingProduct({
            title: '',
            price: 1499,
            old_price: 2499,
            off_text: '40% off',
            deity: selectedDeityFilter !== 'All' ? selectedDeityFilter : 'Ram',
            group_tag: 'most-loved',
            material: 'Pure White Makrana Marble',
            description: 'Exquisitely handcrafted Makrana white marble idol sculpted by heritage artisans of Jaipur with pure 24K gold foil (swarna varakh) detailing.',
            measurement_unit: 'in',
            available_sizes: ['12 Inches (Classic Mandir)'],
            size_id: sizes[0]?.id || '',
            dimensions: '12 Inches (H) x 8 Inches (W) x 4 Inches (D)',
            weight: '1.8 kg',
            primary_catalog_image: '',
            catalog_images: [],
            variants: [],
            rating_mode: 'enabled',
            static_rating_value: 5.0,
            stock_status: 'in_stock',
            is_featured: false,
            pran_pratishtha_ready: true,
            gold_leaf_karigari: true,
            is_active: true
        });
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;
        try {
            if (editingProduct.id) {
                // Optimistically update existing product
                setProducts(prev => prev.map(p => (p.id === editingProduct.id || p.legacy_id === editingProduct.id) ? { ...p, ...editingProduct } : p));
                await api.updateProduct(editingProduct.id, editingProduct);
                showToast(`Product "${editingProduct.title}" updated!`);
            } else {
                // Optimistically prepend newly created product at top
                const tempId = 'prod-' + Date.now();
                const optimisticProd = {
                    ...editingProduct,
                    id: tempId,
                    created_at: new Date().toISOString()
                };
                setProducts(prev => [optimisticProd, ...prev]);

                const res = await api.createProduct(editingProduct);
                if (res?.data) {
                    setProducts(prev => prev.map(p => p.id === tempId ? res.data : p));
                }
                showToast(`Product "${editingProduct.title}" created successfully!`);
            }
            setEditingProduct(null);
            refreshAllData();
        } catch (err) {
            showToast(`Note: ${err.message}`);
            setEditingProduct(null);
            refreshAllData();
        }
    };

    const handleToggleProductStatus = async (product) => {
        try {
            const nextStatus = !product.is_active;
            // Optimistic update
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: nextStatus } : p));
            await api.updateProduct(product.id, { is_active: nextStatus });
            showToast(`Product marked as ${nextStatus ? 'Active' : 'Draft'}`);
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleDeleteProduct = async (productId, title) => {
        if (!confirm(`Are you sure you want to delete "${title || 'this product'}"?`)) return;
        
        // Optimistically remove from state immediately
        setProducts(prev => prev.filter(p => p.id !== productId && p.legacy_id !== productId && String(p.id) !== String(productId)));
        showToast('Product deleted from catalog');

        try {
            await api.deleteProduct(productId);
            refreshAllData();
        } catch (err) {
            console.warn('[Admin] Delete warning:', err);
            refreshAllData();
        }
    };

    const handleAddCatalogImage = () => {
        if (!editingProduct) return;
        const currentImages = editingProduct.catalog_images || [];
        const newImage = {
            url: editingProduct.primary_catalog_image || '/images/products/ram-darbar.png',
            caption: `Angle ${currentImages.length + 1} - Sacred Detail`,
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
    // 4. MASTER SIZES MANAGEMENT (Create, Edit in-place, Delete)
    // =========================================================================
    const handleCreateSize = async (e) => {
        e.preventDefault();
        const tempId = 'size-' + Date.now();
        const optimisticSize = { ...newSizeForm, id: tempId };
        setSizes(prev => [...prev, optimisticSize]);
        showToast(`Size "${newSizeForm.label}" created!`);
        setNewSizeForm({ label: '', height_inches: 12.0, unit: 'in', size_value: 12.0, description: '', sort_order: sizes.length + 1, is_active: true });

        try {
            const res = await api.createSize(newSizeForm);
            if (res?.data) {
                setSizes(prev => prev.map(s => s.id === tempId ? res.data : s));
            }
            refreshAllData();
        } catch (err) {
            console.warn('Size creation warning:', err);
            refreshAllData();
        }
    };

    const handleSaveEditSize = async (e) => {
        e.preventDefault();
        if (!editingSize) return;
        setSizes(prev => prev.map(s => s.id === editingSize.id ? { ...s, ...editingSize } : s));
        showToast(`Size "${editingSize.label}" updated!`);
        setEditingSize(null);

        try {
            await api.updateSize(editingSize.id, editingSize);
            refreshAllData();
        } catch (err) {
            console.warn('Size update warning:', err);
            refreshAllData();
        }
    };

    const handleDeleteSize = async (sizeId) => {
        if (!confirm('Are you sure you want to delete this master size?')) return;
        setSizes(prev => prev.filter(s => s.id !== sizeId && String(s.id) !== String(sizeId)));
        showToast('Master size deleted successfully');

        try {
            await api.deleteSize(sizeId);
            refreshAllData();
        } catch (err) {
            console.warn('Size delete warning:', err);
            refreshAllData();
        }
    };

    // =========================================================================
    // 5. FESTIVAL SECTION MANAGEMENT (Upload Banner, Link Products, Unlink)
    // =========================================================================
    const handleSaveFestival = async (e) => {
        e.preventDefault();
        if (!festival) return;
        try {
            if (festival.id) {
                await api.updateFestival(festival.id, festival);
                showToast('Festival campaign updated!');
            } else {
                await api.createFestival(festival);
                showToast('Festival campaign created successfully!');
            }
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleLinkFestivalItem = async (e) => {
        e.preventDefault();
        if (!festival?.id) {
            showToast('No active festival campaign found');
            return;
        }
        if (!linkingMurtiId) {
            showToast('Please select a product to link');
            return;
        }
        try {
            const product = products.find(p => p.id === linkingMurtiId);
            const festPrice = parseFloat(linkingPrice) || (product ? product.price * 0.9 : 1299);
            await api.linkFestivalProduct(festival.id, {
                murti_id: linkingMurtiId,
                festival_price: festPrice,
                custom_tag: linkingCustomTag || 'Navratri Special',
                sort_order: (festival.items?.length || 0) + 1
            });
            showToast(`Product linked to festival with price ₹${festPrice.toLocaleString('en-IN')}!`);
            setLinkingMurtiId('');
            setLinkingPrice('');
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
    // 6. REVIEWS MODERATION & SELLER REPLIES
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
            showToast(review.is_approved ? 'Review hidden from store' : 'Review approved & live');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!confirm('Are you sure you want to permanently delete this customer review?')) return;
        try {
            await api.deleteReview(reviewId);
            showToast('Review permanently deleted');
            refreshAllData();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    };

    // =========================================================================
    // 7. SEED DATABASE (With Safeguard)
    // =========================================================================
    const handleSeedDatabase = async () => {
        const answer = prompt('WARNING: This will re-seed default catalog items, categories, and master sizes into the database.\n\nType "SEED" to proceed:');
        if (answer !== 'SEED') return;

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

    // Extract unique deity list for filter pills
    const uniqueDeities = ['All', ...new Set(products.map(p => p.deity).filter(Boolean))];

    // Consolidated Category & Deity options for product management dropdown
    const categoryDropdownOptions = React.useMemo(() => {
        const list = [];
        const seen = new Set();

        // 1. From live categories state (configured in Categories tab)
        (categories || []).forEach(c => {
            const name = (c.name || '').trim();
            const deity = (c.deity || name).trim();
            const key = (deity || name).toLowerCase();
            if (key && !seen.has(key)) {
                seen.add(key);
                list.push({
                    value: deity || name,
                    label: name && deity && name.toLowerCase() !== deity.toLowerCase() ? `${name} (${deity})` : (name || deity),
                    category_id: c.id
                });
            }
        });

        // 2. Standard revered Sanatan Dharma deities & sacred themes
        const standardDeities = [
            { value: 'Ganesha', label: 'Ganesha / Ganpati' },
            { value: 'Ram', label: 'Lord Ram / Ram Darbar' },
            { value: 'Shiva', label: 'Lord Shiva / Mahadev' },
            { value: 'Durga', label: 'Maa Durga & Shakti' },
            { value: 'Krishna', label: 'Radha Krishna / Kanha' },
            { value: 'Hanuman', label: 'Veer Hanuman Ji' },
            { value: 'Gajanan Maharaj', label: 'Shri Gajanan Maharaj' },
            { value: 'Sai Baba', label: 'Shirdi Sai Baba' },
            { value: 'Dattatreya', label: 'Bhagwan Dattatreya' },
            { value: 'Murugan', label: 'Lord Murugan / Kartikeya' },
            { value: 'Saraswati', label: 'Maa Saraswati' },
            { value: 'Lakshmi', label: 'Maa Lakshmi' },
            { value: 'Vishnu', label: 'Lord Vishnu / Narayana' },
            { value: 'Kalash / Brass', label: 'Temple Shikhar Kalash & Brass' }
        ];

        standardDeities.forEach(d => {
            const key = d.value.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                list.push({ value: d.value, label: d.label });
            }
        });

        // 3. Any additional unique deity present on existing products in catalog
        (products || []).forEach(p => {
            const d = (p.deity || '').trim();
            if (d && !seen.has(d.toLowerCase())) {
                seen.add(d.toLowerCase());
                list.push({ value: d, label: d });
            }
        });

        // 4. Ensure current product's deity is included if already set
        if (editingProduct?.deity) {
            const cur = editingProduct.deity.trim();
            if (cur && !seen.has(cur.toLowerCase())) {
                list.push({ value: cur, label: cur });
            }
        }

        return list;
    }, [categories, products, editingProduct?.deity]);

    // Filtered Products
    const filteredProducts = products.filter(p => {
        if (selectedDeityFilter !== 'All' && p.deity !== selectedDeityFilter) return false;
        if (selectedStatusFilter === 'active' && !p.is_active) return false;
        if (selectedStatusFilter === 'draft' && p.is_active) return false;
        if (!productSearch) return true;
        const s = productSearch.toLowerCase();
        return (
            p.title?.toLowerCase().includes(s) ||
            p.deity?.toLowerCase().includes(s) ||
            p.material?.toLowerCase().includes(s)
        );
    });

    // Filtered Reviews
    const filteredReviews = reviews.filter(rev => {
        if (reviewFilter === 'pending') return !rev.is_approved;
        if (reviewFilter === 'approved') return rev.is_approved;
        if (reviewFilter === 'needs_reply') return !rev.seller_reply;
        return true;
    });

    // =========================================================================
    // STANDALONE LOGIN SCREEN (If not authenticated)
    // =========================================================================
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen w-full bg-[#141210] flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-[#F7C600] selection:text-[#161616] relative overflow-hidden">
                {/* Decorative gold ambient glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C69722]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#C69722]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-md mx-auto w-full flex items-center justify-between text-xs text-stone-400 pt-4 relative z-10">
                    <button
                        onClick={onReturnToStore}
                        className="flex items-center gap-2 hover:text-[#F7C600] transition font-bold group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Return to Storefront</span>
                    </button>
                    <span className="font-mono text-[11px] text-[#C69722] bg-[#2E2822] border border-[#DFC48D]/30 px-2.5 py-1 rounded-full">
                        Admin Console v2.4
                    </span>
                </div>

                <div className="max-w-md mx-auto w-full bg-[#201C18]/95 backdrop-blur-md rounded-3xl p-7 sm:p-9 border border-[#DFC48D]/30 shadow-2xl space-y-6 relative z-10">
                    <div className="text-center space-y-3">
                        <div className="inline-block p-2 rounded-2xl bg-[#2A241E] border border-[#DFC48D]/25 shadow-inner">
                            <img
                                src={brandLogo}
                                alt="अमोल मार्बल मूर्ती भंडार"
                                className="h-20 sm:h-22 w-auto object-contain mx-auto drop-shadow-md"
                            />
                        </div>
                        <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
                            Admin Portal
                        </h1>
                        <p className="text-xs text-stone-400">
                            Amol Marble Murti Bhandar Management Console
                        </p>
                    </div>

                    {authError && (
                        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in shake">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                            <span>{authError}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4 text-left">
                        <div>
                            <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block mb-1.5">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                required
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-stone-700 bg-stone-900/90 text-white text-xs focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/20 focus:outline-none transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-stone-700 bg-stone-900/90 text-white text-xs focus:border-[#F7C600] focus:ring-2 focus:ring-[#F7C600]/20 focus:outline-none transition-all font-mono"
                            />
                        </div>

                        <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 text-[11px] text-stone-400 space-y-1">
                            <div className="text-stone-300 font-bold flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-[#F7C600]" />
                                <span>Default Credentials:</span>
                            </div>
                            <div>Email: <code className="text-[#F7C600] font-mono bg-black/40 px-1.5 py-0.5 rounded">admin@amolmurtibhandar.com</code></div>
                            <div>Password: <code className="text-[#F7C600] font-mono bg-black/40 px-1.5 py-0.5 rounded">admin123</code></div>
                        </div>

                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F7C600] to-[#E5B500] hover:from-[#E5B500] hover:to-[#D4A300] text-[#161616] font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-[#F7C600]/20 flex items-center justify-center gap-2 mt-2 active:scale-98 disabled:opacity-60 cursor-pointer"
                        >
                            {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            <span>{authLoading ? 'AUTHENTICATING...' : 'SIGN IN TO ADMIN PORTAL'}</span>
                        </button>

                        {/* Server Status & Configuration Link */}
                        <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400">
                            <span className="flex items-center gap-1.5 truncate max-w-[210px]" title={api.getBaseUrl() || 'Direct API'}>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${api.getBaseUrl() ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                                <span className="truncate font-mono text-[10px] text-stone-400">
                                    {api.getBaseUrl() || 'Default Server'}
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsConfiguringServer(true)}
                                className="text-[11px] text-[#F7C600] hover:underline font-semibold"
                            >
                                Configure Server
                            </button>
                        </div>
                    </form>
                </div>

                <div className="text-center text-[11px] text-stone-500 pb-4 relative z-10">
                    Amol Marble Murti Bhandar • Jaipur Karigari E-Commerce Console
                </div>
            </div>
        );
    }

    // =========================================================================
    // DEDICATED FULL-SCREEN ADMIN PAGE (AUTHENTICATED)
    // =========================================================================
    return (
        <div className="h-screen w-full bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-[#F7C600] selection:text-[#161616] overflow-hidden">

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] bg-[#161616] text-[#F7C600] px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 border border-[#F7C600]/40 animate-in slide-in-from-top duration-300">
                    <CheckCircle2 className="w-4 h-4 text-[#F7C600]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Dedicated Admin Page Top Navbar */}
            <header className="flex-shrink-0 z-40 bg-[#171512] text-white border-b border-[#DFC48D]/25 px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onReturnToStore}
                        className="flex items-center gap-3 focus:outline-none hover:opacity-90 transition group text-left"
                        title="Return to Storefront"
                    >
                        <img
                            src={brandLogo}
                            alt="अमोल मार्बल मूर्ती भंडार"
                            className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow"
                        />
                        <div className="hidden sm:block">
                            <div className="flex items-center gap-2">
                                <h1 className="font-serif text-base sm:text-lg font-bold text-[#F7C600] tracking-wide leading-tight">
                                    Amol Murti Bhandar
                                </h1>
                                <span className="text-[10px] bg-[#2E2822] text-[#F7C600] border border-[#DFC48D]/40 px-2 py-0.5 rounded-md font-mono font-bold">
                                    Control Console
                                </span>
                            </div>
                            <p className="text-[11px] text-stone-400">
                                E-Commerce Management Platform • Jaipur Heritage
                            </p>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Primary Add Product Quick Action in Header */}
                    <button
                        onClick={handleOpenAddProduct}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F7C600] to-[#E5B500] hover:from-[#E5B500] hover:to-[#D4A300] text-[#161616] text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-[#F7C600]/25 active:scale-95 cursor-pointer"
                        title="Add New Idol to Catalog"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>+ Add Product</span>
                    </button>

                    {/* Live Storefront Link */}
                    <button
                        onClick={onReturnToStore}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/10 hover:border-white/20 active:scale-95 cursor-pointer"
                        title="View Customer Storefront"
                    >
                        <span>Live Store</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#F7C600]" />
                    </button>

                    {/* Refresh Data */}
                    <button
                        onClick={refreshAllData}
                        disabled={loading}
                        className="p-2 text-stone-300 hover:text-white rounded-xl hover:bg-white/10 transition border border-transparent hover:border-white/10 cursor-pointer"
                        title="Refresh data from server"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

                    {/* Admin Sign Out */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-100 font-bold px-3 py-2 rounded-xl border border-rose-500/30 hover:bg-rose-950/40 hover:border-rose-500/50 transition active:scale-95 cursor-pointer"
                        title="Log out of Admin Console"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* Standalone Admin Layout: Sidebar + Main Workspace */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">

                {/* Left Sidebar Menu - Sticky, scrollable, organized by domain */}
                <aside className="w-full md:w-72 lg:w-80 bg-[#FAF6EE] border-r border-[#E8DFD0] p-3 sm:p-4 flex md:flex-col justify-between overflow-x-auto md:overflow-y-auto no-scrollbar flex-shrink-0 md:h-full md:sticky md:top-0">
                    <div className="w-full space-y-4">
                        {/* Status Strip on Desktop */}
                        <div className="hidden md:flex items-center justify-between px-2 pt-1 pb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                                Administration Console
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {api.getBaseUrl() ? 'Cloud Live' : 'Pre-Seeded'}
                            </span>
                        </div>

                        {/* Grouped Navigation */}
                        <nav className="flex md:flex-col gap-3.5 w-full" aria-label="Admin Navigation">
                            {/* Group 1: Overview */}
                            <div className="space-y-1">
                                <div className="hidden md:block px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                                    Overview
                                </div>
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`group relative flex-shrink-0 w-auto md:w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between gap-3 select-none ${
                                        activeTab === 'dashboard'
                                            ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/5 border-l-4 border-l-[#C69722] font-bold'
                                            : 'text-stone-600 hover:bg-white/80 hover:text-stone-900 hover:shadow-2xs'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                            activeTab === 'dashboard'
                                                ? 'bg-[#FAF2DE] text-[#8E5B00] border border-[#DFC48D]/50 shadow-2xs'
                                                : 'bg-stone-200/60 text-stone-500 group-hover:bg-[#FAF2DE] group-hover:text-[#8E5B00]'
                                        }`}>
                                            <Shield className="w-4 h-4 stroke-[2]" />
                                        </div>
                                        <span className={`text-[13px] whitespace-nowrap tracking-tight ${activeTab === 'dashboard' ? 'font-bold text-stone-900' : 'font-semibold text-stone-700 group-hover:text-stone-900'}`}>
                                            Overview Cockpit
                                        </span>
                                    </div>
                                    <ChevronRight className={`w-3.5 h-3.5 text-stone-400 hidden md:block transition-transform ${activeTab === 'dashboard' ? 'text-[#C69722] translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            </div>

                            {/* Group 2: Catalog & Inventory */}
                            <div className="space-y-1">
                                <div className="hidden md:block px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                                    Catalog & Inventory
                                </div>
                                {[
                                    { id: 'products', label: 'Products & Catalog', icon: Package, count: products?.length },
                                    { id: 'categories', label: 'Deity Categories', icon: ImageIcon, count: categories?.length },
                                    { id: 'sizes', label: 'Master Sizes', icon: Tag, count: sizes?.length }
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    const isCur = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`group relative flex-shrink-0 w-auto md:w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between gap-3 select-none ${
                                                isCur
                                                    ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/5 border-l-4 border-l-[#C69722] font-bold'
                                                    : 'text-stone-600 hover:bg-white/80 hover:text-stone-900 hover:shadow-2xs'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    isCur
                                                        ? 'bg-[#FAF2DE] text-[#8E5B00] border border-[#DFC48D]/50 shadow-2xs'
                                                        : 'bg-stone-200/60 text-stone-500 group-hover:bg-[#FAF2DE] group-hover:text-[#8E5B00]'
                                                }`}>
                                                    <Icon className="w-4 h-4 stroke-[2]" />
                                                </div>
                                                <span className={`text-[13px] whitespace-nowrap tracking-tight ${isCur ? 'font-bold text-stone-900' : 'font-semibold text-stone-700 group-hover:text-stone-900'}`}>
                                                    {tab.label}
                                                </span>
                                            </div>
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
                            </div>

                            {/* Group 3: Marketing & Customer Channels */}
                            <div className="space-y-1">
                                <div className="hidden md:block px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                                    Marketing & Channels
                                </div>
                                {[
                                    { id: 'festival', label: 'Festival Area', icon: Sparkles, isFestive: true },
                                    { id: 'settings', label: 'WhatsApp & Settings', icon: Phone }
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    const isCur = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`group relative flex-shrink-0 w-auto md:w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between gap-3 select-none ${
                                                isCur
                                                    ? tab.isFestive
                                                        ? 'bg-gradient-to-r from-amber-50 via-white to-white text-stone-900 shadow-xs ring-1 ring-amber-500/20 border-l-4 border-l-amber-500 font-bold'
                                                        : 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/5 border-l-4 border-l-[#C69722] font-bold'
                                                    : 'text-stone-600 hover:bg-white/80 hover:text-stone-900 hover:shadow-2xs'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    isCur
                                                        ? tab.isFestive
                                                            ? 'bg-amber-100 text-amber-700 shadow-2xs'
                                                            : 'bg-[#FAF2DE] text-[#8E5B00] border border-[#DFC48D]/50 shadow-2xs'
                                                        : 'bg-stone-200/60 text-stone-500 group-hover:bg-[#FAF2DE] group-hover:text-[#8E5B00]'
                                                }`}>
                                                    <Icon className="w-4 h-4 stroke-[2]" />
                                                </div>
                                                <span className={`text-[13px] whitespace-nowrap tracking-tight ${isCur ? 'font-bold text-stone-900' : 'font-semibold text-stone-700 group-hover:text-stone-900'}`}>
                                                    {tab.label}
                                                </span>
                                            </div>
                                            {tab.isFestive && (
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded-md hidden md:inline">
                                                    Special
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Group 4: Devotees & Engagement */}
                            <div className="space-y-1">
                                <div className="hidden md:block px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                                    Community
                                </div>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`group relative flex-shrink-0 w-auto md:w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between gap-3 select-none ${
                                        activeTab === 'reviews'
                                            ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/5 border-l-4 border-l-[#C69722] font-bold'
                                            : 'text-stone-600 hover:bg-white/80 hover:text-stone-900 hover:shadow-2xs'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                            activeTab === 'reviews'
                                                ? 'bg-[#FAF2DE] text-[#8E5B00] border border-[#DFC48D]/50 shadow-2xs'
                                                : 'bg-stone-200/60 text-stone-500 group-hover:bg-[#FAF2DE] group-hover:text-[#8E5B00]'
                                        }`}>
                                            <Star className="w-4 h-4 stroke-[2]" />
                                        </div>
                                        <span className={`text-[13px] whitespace-nowrap tracking-tight ${activeTab === 'reviews' ? 'font-bold text-stone-900' : 'font-semibold text-stone-700 group-hover:text-stone-900'}`}>
                                            Customer Reviews
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {reviews?.length > 0 && (
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono transition-colors ${
                                                activeTab === 'reviews' ? 'bg-[#FAF2DE] text-[#8E5B00]' : 'bg-stone-200/70 text-stone-600 group-hover:bg-stone-300'
                                            }`}>
                                                {reviews.length}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </nav>
                    </div>

                    {/* Sidebar Footer User Card */}
                    <div className="hidden md:block pt-3 border-t border-[#E8DFD0]/70 mt-4">
                        <div className="p-3 bg-white/70 rounded-2xl border border-stone-200/70 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#171512] text-[#F7C600] flex items-center justify-center font-bold text-xs shadow-xs">
                                    AM
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-stone-900 truncate">Amol Admin</div>
                                    <div className="text-[10px] text-stone-500 truncate">Jaipur Karigari Console</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsConfiguringServer(true)}
                                className="p-1.5 text-stone-400 hover:text-[#C69722] hover:bg-[#FAF2DE] rounded-lg transition"
                                title="Configure Server URL"
                            >
                                <Database className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Workspace */}
                <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-7xl">

                    {/* Render Cloud Sync Status Banner */}
                    {(!api.getBaseUrl() || isOfflineMode) && (
                        <div className="p-4 rounded-2xl bg-[#FAF5E8] border border-[#E5CD96] text-[#7A4F01] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5">
                                <AlertTriangle className="w-5 h-5 text-[#C69722] flex-shrink-0" />
                                <div>
                                    <span className="font-bold block text-stone-900">
                                        Admin Console Active (Standalone / Pre-Seeded Catalog)
                                    </span>
                                    <span className="text-[11px] text-stone-600">
                                        All Makrana marble products and master sizes are available. Connect your Render URL to sync live database updates.
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsConfiguringServer(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider whitespace-nowrap hover:bg-black transition shadow-2xs cursor-pointer"
                            >
                                Connect Render Backend
                            </button>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 1: EXECUTIVE DASHBOARD */}
                    {/* ========================================================================= */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#161616]">
                                            Operations Cockpit
                                        </h2>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-1">
                                        Real-time catalog telemetry, customer concierge routing, and temple campaigns
                                    </p>
                                </div>
                                <div className="text-[11px] font-mono text-stone-400 bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs self-start sm:self-auto">
                                    Last Synced: Just now
                                </div>
                            </div>

                            {/* Stat Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div 
                                    onClick={() => setActiveTab('products')}
                                    className="bg-white p-5 rounded-2xl border border-stone-200 border-t-4 border-t-[#C69722] shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Products</span>
                                            <div className="w-8 h-8 rounded-xl bg-[#FAF2DE] text-[#8E5B00] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Package className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="text-3xl font-serif font-black text-[#161616] mt-2">{products.length}</div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                                        <span className="text-emerald-700 font-semibold">{products.filter(p => p.is_active).length} Active on Store</span>
                                        <span className="text-stone-400 group-hover:text-[#C69722] font-bold group-hover:translate-x-0.5 transition-all">➔</span>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setActiveTab('categories')}
                                    className="bg-white p-5 rounded-2xl border border-stone-200 border-t-4 border-t-amber-500 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Deity Categories</span>
                                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <ImageIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="text-3xl font-serif font-black text-[#161616] mt-2">{categories.length}</div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                                        <span className="text-stone-600 font-medium">Banners Configured</span>
                                        <span className="text-stone-400 group-hover:text-amber-600 font-bold group-hover:translate-x-0.5 transition-all">➔</span>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setActiveTab('sizes')}
                                    className="bg-white p-5 rounded-2xl border border-stone-200 border-t-4 border-t-stone-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Master Sizes</span>
                                            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="text-3xl font-serif font-black text-[#161616] mt-2">{sizes.length}</div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                                        <span className="text-[#C69722] font-semibold">Standard Heights</span>
                                        <span className="text-stone-400 group-hover:text-stone-800 font-bold group-hover:translate-x-0.5 transition-all">➔</span>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setActiveTab('reviews')}
                                    className="bg-white p-5 rounded-2xl border border-stone-200 border-t-4 border-t-emerald-600 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Customer Reviews</span>
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Star className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="text-3xl font-serif font-black text-[#161616] mt-2">{reviews.length}</div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                                        <span className="text-emerald-700 font-semibold">{reviews.filter(r => r.is_approved).length} Approved & Live</span>
                                        <span className="text-stone-400 group-hover:text-emerald-600 font-bold group-hover:translate-x-0.5 transition-all">➔</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Action Command Center */}
                            <div className="bg-gradient-to-r from-[#171512] via-[#241F1A] to-[#171512] rounded-3xl p-6 text-white flex flex-col lg:flex-row items-center justify-between gap-5 border border-[#DFC48D]/30 shadow-lg relative overflow-hidden">
                                <div className="space-y-1.5 text-center lg:text-left z-10">
                                    <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold text-[#F7C600] uppercase tracking-wider">
                                        <Sparkles className="w-4 h-4" />
                                        <span>Quick Action Command Center</span>
                                    </div>
                                    <h3 className="font-serif text-lg sm:text-xl font-bold tracking-wide">Fast-Track Catalog Management</h3>
                                    <p className="text-xs text-stone-400 max-w-xl">
                                        Directly publish new sanctified murtis, configure circle deity banners, update festive discounts, or preview WhatsApp customer inquiries.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5 flex-wrap justify-center z-10">
                                    <button
                                        onClick={handleOpenAddProduct}
                                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F7C600] to-[#E5B500] hover:from-[#E5B500] hover:to-[#D4A300] text-[#161616] text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-[#F7C600]/25 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 stroke-[2.5]" />
                                        <span>+ Add Product</span>
                                    </button>
                                    <button
                                        onClick={handleOpenAddCategory}
                                        className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span>+ Add Category</span>
                                    </button>
                                    <button
                                        onClick={handleTestWhatsApp}
                                        className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                                        title="Verify live customer message format"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Test WhatsApp</span>
                                    </button>
                                </div>
                            </div>

                            {/* Overview Cards: WhatsApp Concierge & Rating Mode */}
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="bg-[#FAF2DE] border border-[#DFC48D] p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[#8E5B00] uppercase tracking-wider">
                                                <Phone className="w-4 h-4 text-[#C69722]" />
                                                <span>WhatsApp Live Concierge</span>
                                            </div>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                                Active & Routing
                                            </span>
                                        </div>
                                        <div className="text-xl font-mono font-bold text-stone-900 mt-2">
                                            {settings.whatsapp_number}
                                        </div>
                                        <div className="mt-3 p-3 bg-white/70 rounded-xl border border-[#DFC48D]/40 text-xs text-stone-700 italic">
                                            "{settings.whatsapp_default_message}"
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-5">
                                        <button
                                            onClick={() => setActiveTab('settings')}
                                            className="px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                                        >
                                            Configure Settings ➔
                                        </button>
                                        <button
                                            onClick={handleTestWhatsApp}
                                            className="px-3 py-2 rounded-xl bg-white text-stone-800 hover:bg-stone-100 border border-stone-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <Send className="w-3 h-3 text-emerald-600" />
                                            <span>Test Live Preview</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
                                                <Star className="w-4 h-4 text-amber-500" />
                                                <span>Global Rating Display Mode</span>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                settings.global_rating_mode === 'enabled'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : settings.global_rating_mode === 'read_only'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {settings.global_rating_mode}
                                            </span>
                                        </div>
                                        <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                                            {settings.global_rating_mode === 'enabled' && 'Devotees can view all ratings AND submit new verified reviews with photos.'}
                                            {settings.global_rating_mode === 'read_only' && 'Static mode enabled: Devotees can view approved reviews, but review submission forms are turned off.'}
                                            {settings.global_rating_mode === 'hidden' && 'Rating section is completely hidden from customer storefront.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-stone-100">
                                        <span className="text-[11px] text-stone-400">Enforced by FastAPI backend</span>
                                        <button
                                            onClick={() => setActiveTab('settings')}
                                            className="text-xs font-bold text-[#8E5B00] hover:underline cursor-pointer"
                                        >
                                            Change Mode ➔
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Products Quick Table */}
                            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                                            Recently Added & Updated Murtis
                                        </h3>
                                        <p className="text-xs text-stone-500">Quick status check on active catalog inventory</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className="text-xs font-bold text-[#8E5B00] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>View All {products.length} Products</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="divide-y divide-stone-100">
                                    {products.slice(0, 5).map(p => (
                                        <div key={p.id} className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 rounded-xl px-2 transition">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <SafeImage
                                                    src={api.getImageUrl(p.primary_catalog_image || p.img)}
                                                    alt={p.title}
                                                    className="w-11 h-11 object-contain rounded-xl bg-[#FAF5E8] p-1 border border-stone-200 flex-shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="font-bold text-stone-900 text-xs truncate max-w-xs">{p.title}</div>
                                                    <div className="text-[10px] text-stone-400">{p.deity} • ₹{p.price?.toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleProductStatus(p)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                                                        p.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                                    }`}
                                                    title="Click to toggle status"
                                                >
                                                    {p.is_active ? 'Active' : 'Draft'}
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('products'); setEditingProduct({ ...p, variants: p.variants || [], catalog_images: p.catalog_images || [], available_sizes: p.available_sizes || [], measurement_unit: p.measurement_unit || 'in' }); }}
                                                    className="p-1.5 text-stone-500 hover:text-black rounded-lg hover:bg-stone-100 transition cursor-pointer"
                                                    title="Edit product"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 2: PRODUCTS & CATALOG (Filter pills, 1-Click Status, Stock Status) */}
                    {/* ========================================================================= */}
                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#161616]">
                                            Products & Catalog Management
                                        </h2>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF2DE] text-[#8E5B00] border border-[#DFC48D]/40 font-mono">
                                            {products.length} Idols
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-1">
                                        Manage listing prices, catalog photo gallery, size specifications, and stock availability
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={handleOpenAddProduct}
                                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F7C600] to-[#E5B500] hover:from-[#E5B500] hover:to-[#D4A300] text-[#161616] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-[#F7C600]/25 flex-shrink-0 active:scale-95 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 stroke-[2.5]" />
                                        <span>+ Add New Product</span>
                                    </button>
                                </div>
                            </div>

                            {/* Search & Deity / Status Filters Bar */}
                            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3.5">
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="relative flex-1 w-full">
                                        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search by title, deity, marble material..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs focus:bg-white focus:outline-none focus:border-[#C69722] focus:ring-2 focus:ring-[#C69722]/20 transition-all font-medium"
                                        />
                                        {productSearch && (
                                            <button
                                                onClick={() => setProductSearch('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 flex items-center justify-center text-xs transition"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {/* Status Filter Segment */}
                                    <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar p-1 bg-stone-100 rounded-xl border border-stone-200/80">
                                        {[
                                            { id: 'All', label: 'All Status', count: products.length },
                                            { id: 'active', label: 'Active', count: products.filter(p => p.is_active).length },
                                            { id: 'draft', label: 'Draft', count: products.filter(p => !p.is_active).length }
                                        ].map(st => (
                                            <button
                                                key={st.id}
                                                onClick={() => setSelectedStatusFilter(st.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                                    selectedStatusFilter === st.id
                                                        ? 'bg-white text-stone-900 shadow-xs font-black'
                                                        : 'text-stone-600 hover:text-stone-900'
                                                }`}
                                            >
                                                <span>{st.label}</span>
                                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedStatusFilter === st.id ? 'bg-[#FAF2DE] text-[#8E5B00]' : 'bg-stone-200/70 text-stone-500'}`}>
                                                    {st.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Deity Filter Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-stone-100">
                                    <span className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1 mr-1 flex-shrink-0">
                                        <Filter className="w-3 h-3 text-[#C69722]" />
                                        Deity:
                                    </span>
                                    {uniqueDeities.map(deity => (
                                        <button
                                            key={deity}
                                            onClick={() => setSelectedDeityFilter(deity)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                                selectedDeityFilter === deity
                                                    ? 'bg-[#C69722] text-white font-bold shadow-xs'
                                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                                            }`}
                                        >
                                            {deity}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Counter Bar */}
                            <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                                <div>
                                    Showing <strong className="text-stone-900">{filteredProducts.length}</strong> of {products.length} products
                                    {selectedDeityFilter !== 'All' && <span> • Filtered by deity: <span className="font-semibold text-stone-800">"{selectedDeityFilter}"</span></span>}
                                    {selectedStatusFilter !== 'All' && <span> • Status: <span className="font-semibold text-stone-800">"{selectedStatusFilter}"</span></span>}
                                </div>
                                {(productSearch || selectedDeityFilter !== 'All' || selectedStatusFilter !== 'All') && (
                                    <button
                                        onClick={() => {
                                            setProductSearch('');
                                            setSelectedDeityFilter('All');
                                            setSelectedStatusFilter('All');
                                        }}
                                        className="text-[#8E5B00] hover:underline font-bold text-xs"
                                    >
                                        Reset All Filters
                                    </button>
                                )}
                            </div>

                            {/* Products Table */}
                            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-stone-700">
                                        <thead className="bg-[#FAF8F5] text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                                            <tr>
                                                <th className="p-4">Product</th>
                                                <th className="p-4">Price</th>
                                                <th className="p-4">Catalog Gallery</th>
                                                <th className="p-4">Stock Status</th>
                                                <th className="p-4">Rating Mode</th>
                                                <th className="p-4">Status (1-Click)</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {filteredProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-12 text-center text-stone-400 text-xs">
                                                        <div className="max-w-xs mx-auto space-y-2">
                                                            <Package className="w-8 h-8 text-stone-300 mx-auto" />
                                                            <div className="font-bold text-stone-700">No products found</div>
                                                            <p className="text-[11px] text-stone-400">Try adjusting your search terms or clearing the deity filters above.</p>
                                                            <button
                                                                onClick={() => {
                                                                    setProductSearch('');
                                                                    setSelectedDeityFilter('All');
                                                                    setSelectedStatusFilter('All');
                                                                }}
                                                                className="mt-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition"
                                                            >
                                                                Reset Filters
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredProducts.map(p => (
                                                    <tr key={p.id} className="hover:bg-[#FAF9F6] transition-colors group">
                                                        <td className="p-4 flex items-center gap-3.5">
                                                            <SafeImage
                                                                src={api.getImageUrl(p.primary_catalog_image || p.img)}
                                                                alt={p.title}
                                                                className="w-12 h-12 object-contain rounded-xl bg-[#FAF5E8] p-1 border border-stone-200 flex-shrink-0 group-hover:scale-105 transition-transform"
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-stone-900 truncate max-w-xs sm:max-w-sm">{p.title}</div>
                                                                <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                                                                    <span className="font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded text-[10px]">{p.deity}</span>
                                                                    <span>•</span>
                                                                    <span>{p.group_tag}</span>
                                                                    {p.material && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span className="truncate max-w-[120px]">{p.material}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 font-bold text-stone-900 whitespace-nowrap">
                                                            <div className="text-sm font-serif">₹{p.price?.toLocaleString('en-IN')}</div>
                                                            {p.off_text && <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200/60 inline-block mt-0.5">{p.off_text}</span>}
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap">
                                                            <span className="bg-stone-100 text-stone-800 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border border-stone-200">
                                                                <ImageIcon className="w-3 h-3 text-[#C69722]" />
                                                                <span>{p.catalog_images?.length || 1} Angles</span>
                                                            </span>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                                                p.stock_status === 'in_stock' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                                p.stock_status === 'made_to_order' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                                'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                                    p.stock_status === 'in_stock' ? 'bg-emerald-500' :
                                                                    p.stock_status === 'made_to_order' ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`} />
                                                                <span>{p.stock_status === 'in_stock' ? 'In Stock' :
                                                                 p.stock_status === 'made_to_order' ? 'Made To Order' : 'Out of Stock'}</span>
                                                            </span>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                                p.rating_mode === 'enabled' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                                                p.rating_mode === 'read_only' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                                            }`}>
                                                                <Star className="w-3 h-3 fill-current text-amber-500" />
                                                                <span>{p.rating_mode} ({p.static_rating_value ?? 5.0}★)</span>
                                                            </span>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleToggleProductStatus(p)}
                                                                className={`px-3 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                                                    p.is_active ? 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200' : 'text-stone-500 bg-stone-100 hover:bg-stone-200'
                                                                }`}
                                                                title="Click to toggle Active / Draft"
                                                            >
                                                                {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                                <span>{p.is_active ? 'Active' : 'Draft'}</span>
                                                            </button>
                                                        </td>
                                                        <td className="p-4 text-right whitespace-nowrap">
                                                            <button
                                                                onClick={() => setEditingProduct({ ...p, variants: p.variants || [], catalog_images: p.catalog_images || [], available_sizes: p.available_sizes || [], measurement_unit: p.measurement_unit || 'in' })}
                                                                className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-[#161616] hover:text-white text-stone-800 text-xs font-bold transition mr-1.5 cursor-pointer inline-flex items-center gap-1"
                                                            >
                                                                <Edit3 className="w-3 h-3" />
                                                                <span>Edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(p.id, p.title)}
                                                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 text-xs transition cursor-pointer"
                                                                title="Delete Product"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 inline" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 3: DEITY CATEGORIES & BANNERS (Add Category, Edit, Direct Upload) */}
                    {/* ========================================================================= */}
                    {activeTab === 'categories' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-serif text-2xl font-bold text-[#161616]">
                                        Deity Categories & Hero Banners
                                    </h2>
                                    <p className="text-xs text-stone-500 mt-1">
                                        Configure circle deity icons, hero landing banners, route slugs, and active display order
                                    </p>
                                </div>
                                <button
                                    onClick={handleOpenAddCategory}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F7C600] to-[#E5B500] hover:from-[#E5B500] hover:to-[#D4A300] text-[#161616] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition flex-shrink-0 shadow-sm active:scale-95"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>+ Add New Category</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between space-y-4"
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
                                                    <h3 className="font-serif font-bold text-stone-900 text-sm truncate">{cat.name}</h3>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                                                        {cat.is_active ? 'Active' : 'Draft'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-stone-400 font-mono mt-0.5">/{cat.slug}</p>
                                                <p className="text-[11px] text-[#C69722] font-semibold mt-1">Route: {cat.route}</p>
                                            </div>
                                        </div>

                                        {cat.banner_url ? (
                                            <div className="relative h-20 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                                                <img
                                                    src={api.getImageUrl(cat.banner_url)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = api.getImageUrl(cat.img) || '/images/categories/navratri-drop@2x.png';
                                                    }}
                                                />
                                                <span className="absolute bottom-1 right-2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                                                    Hero Banner
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="h-12 rounded-xl border border-dashed border-stone-200 bg-stone-50/60 flex items-center justify-center text-stone-400 text-[10px] font-mono">
                                                No Hero Banner Configured
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                                            <span className="text-[11px] text-stone-400">Order: <strong>{cat.sort_order}</strong></span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setEditingCategory(cat)}
                                                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#161616] hover:text-white text-stone-800 font-bold text-xs transition flex items-center gap-1"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 4: FESTIVAL CAMPAIGN (Banner Upload & Link Products with Discount) */}
                    {/* ========================================================================= */}
                    {activeTab === 'festival' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-[#161616]">
                                    Festival Campaign Management
                                </h2>
                                <p className="text-xs text-stone-500 mt-1">
                                    Configure festive banner announcements, badge pills, and link catalog murtis with special festival discounts
                                </p>
                            </div>

                            {festival ? (
                                <div className="space-y-6">
                                    {/* Campaign Settings Form */}
                                    <form onSubmit={handleSaveFestival} className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-2xs space-y-5">
                                        <div className="flex items-center justify-between pb-3 border-b">
                                            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                                                FESTIVAL CAMPAIGN CONTROLS
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-stone-600 font-medium">Campaign Active:</span>
                                                <input
                                                    type="checkbox"
                                                    checked={festival.is_active}
                                                    onChange={(e) => setFestival({ ...festival, is_active: e.target.checked })}
                                                    className="w-4 h-4 accent-[#161616] rounded"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-stone-700 block mb-1">FESTIVAL TITLE *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={festival.title}
                                                    onChange={(e) => setFestival({ ...festival, title: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:border-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-stone-700 block mb-1">BADGE PILL TEXT</label>
                                                <input
                                                    type="text"
                                                    value={festival.badge_text || ''}
                                                    onChange={(e) => setFestival({ ...festival, badge_text: e.target.value })}
                                                    placeholder="e.g. Navratri 2026 Special"
                                                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:border-black"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-stone-700 block mb-1">SUBTITLE / ANNOUNCEMENT DESCRIPTION</label>
                                            <textarea
                                                rows={2}
                                                value={festival.subtitle || ''}
                                                onChange={(e) => setFestival({ ...festival, subtitle: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:border-black"
                                            />
                                        </div>

                                        {/* Festival Hero Banner with Direct Upload */}
                                        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                                                    FESTIVAL HERO BANNER IMAGE
                                                </label>
                                                <label className="cursor-pointer text-xs font-bold text-[#8E5B00] hover:text-black flex items-center gap-1">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span>{uploadingFestBanner ? 'Uploading...' : 'Upload Banner File'}</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={uploadingFestBanner}
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setUploadingFestBanner(true);
                                                                const url = await handleFileUpload(file, 'banners');
                                                                if (url) setFestival({ ...festival, banner_image: url });
                                                                setUploadingFestBanner(false);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={festival.banner_image || ''}
                                                    onChange={(e) => setFestival({ ...festival, banner_image: e.target.value })}
                                                    placeholder="Banner URL or click Upload Banner File"
                                                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono bg-white"
                                                />
                                            </div>
                                            {festival.banner_image && (
                                                <div className="h-24 rounded-lg overflow-hidden border bg-white mt-1">
                                                    <img src={festival.banner_image} alt="Festival Banner" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Save Festival Campaign</span>
                                        </button>
                                    </form>

                                    {/* Link New Product to Festival Form */}
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                                                <LinkIcon className="w-4 h-4 text-[#C69722]" />
                                                <span>Link Product with Festival Discount</span>
                                            </h3>
                                            <span className="text-[11px] text-stone-500">
                                                {(festival.items || []).length} products featured
                                            </span>
                                        </div>

                                        <form onSubmit={handleLinkFestivalItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#FAF8F5] p-4 rounded-xl border border-stone-200">
                                            <div className="sm:col-span-2">
                                                <label className="text-[11px] font-bold text-stone-600 block mb-1">SELECT IDOL FROM CATALOG</label>
                                                <ProductSelect
                                                    products={products}
                                                    value={linkingMurtiId}
                                                    onChange={(mId) => {
                                                        setLinkingMurtiId(mId);
                                                        const p = products.find(prod => prod.id === mId || String(prod.id) === String(mId));
                                                        if (p && !linkingPrice) {
                                                            setLinkingPrice(Math.round(p.price * 0.85).toString());
                                                        }
                                                    }}
                                                    placeholder="-- Choose Product with Thumbnail --"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-bold text-stone-600 block mb-1">FESTIVAL PRICE (₹)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={linkingPrice}
                                                    onChange={(e) => setLinkingPrice(e.target.value)}
                                                    placeholder="e.g. 1199"
                                                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-bold text-emerald-700"
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <button
                                                    type="submit"
                                                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#F7C600] to-[#E5B500] hover:from-[#E5B500] hover:to-[#D4A300] text-[#161616] font-bold text-xs uppercase tracking-wider transition shadow-sm"
                                                >
                                                    + Link Product
                                                </button>
                                            </div>
                                        </form>

                                        {/* Currently Linked Products List */}
                                        <div className="space-y-2.5 pt-2">
                                            {(festival.items || []).length === 0 ? (
                                                <div className="text-center py-6 text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed">
                                                    No products currently linked to this festival campaign. Select a product above to add it.
                                                </div>
                                            ) : (
                                                (festival.items || []).map(item => (
                                                    <div key={item.id} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-stone-200 hover:border-stone-300 transition">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={api.getImageUrl(item.murti_image || '/images/products/ram-darbar.png')}
                                                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/products/ram-darbar.png'; }}
                                                                alt=""
                                                                className="w-10 h-10 object-contain rounded-lg bg-stone-50 border p-1 flex-shrink-0"
                                                            />
                                                            <div>
                                                                <div className="font-bold text-stone-900 text-xs">{item.murti_title}</div>
                                                                <div className="text-[10px] text-stone-400">Regular: ₹{item.original_price?.toLocaleString('en-IN')}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                                Festive: ₹{item.festival_price?.toLocaleString('en-IN')}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUnlinkFestivalItem(item.murti_id)}
                                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                                title="Unlink product"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-2xl text-center text-xs text-stone-500 space-y-4 border border-stone-200">
                                    <p className="text-sm font-semibold text-stone-700">No festival campaign active in the database.</p>
                                    <p className="text-stone-400 max-w-md mx-auto">
                                        Launch a festive promotion (such as Navratri, Diwali, or Janmashtami) to showcase special banner drops and discounted murtis on the storefront.
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setFestival({
                                                title: 'Navratri Festive Drop - Love, Joy & Celebration',
                                                subtitle: 'Celebrate love, joy and togetherness with Amol Marble Murti Bhandar Limited Edition Navratri Festive Drop.',
                                                badge_text: 'Navratri 2026 Special',
                                                banner_image_url: '/images/categories/navratri-drop@2x.png',
                                                is_active: true,
                                                items: []
                                            })}
                                            className="px-5 py-2.5 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs hover:bg-black transition shadow-sm"
                                        >
                                            + Create New Festival Campaign
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSeedDatabase}
                                            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition"
                                        >
                                            Seed Default Navratri Campaign
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 5: MASTER SIZES MANAGEMENT (Create, Edit in-place, Delete) */}
                    {/* ========================================================================= */}
                    {activeTab === 'sizes' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-[#161616]">
                                    Master Sizes & Dimensions Management
                                </h2>
                                <p className="text-xs text-stone-500 mt-1">
                                    Create standard idol heights (e.g. 9 cm, 15 cm, 1.5 Feet, 3 Feet) and link them across the murti catalog
                                </p>
                            </div>

                            {/* Add New Size Form */}
                            <form onSubmit={handleCreateSize} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                                    + Add New Master Size
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="text-[11px] font-bold text-stone-600 block mb-1">SIZE LABEL *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 1.5 Feet (18 Inches Mandir)"
                                            value={newSizeForm.label}
                                            onChange={(e) => setNewSizeForm({ ...newSizeForm, label: e.target.value })}
                                            className="w-full px-3.5 py-2.5 border rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-stone-600 block mb-1">UNIT *</label>
                                        <select
                                            value={newSizeForm.unit || 'in'}
                                            onChange={(e) => setNewSizeForm({ ...newSizeForm, unit: e.target.value })}
                                            className="w-full px-3 py-2.5 border rounded-xl text-xs bg-white font-semibold"
                                        >
                                            <option value="in">Inches (in)</option>
                                            <option value="ft">Feet (ft)</option>
                                            <option value="m">Meters (m)</option>
                                            <option value="cm">Centimeters (cm)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-stone-600 block mb-1">NUMERIC VALUE *</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            required
                                            placeholder="Value"
                                            value={newSizeForm.size_value ?? newSizeForm.height_inches ?? 12.0}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setNewSizeForm({
                                                    ...newSizeForm,
                                                    size_value: val,
                                                    height_inches: newSizeForm.unit === 'ft' ? val * 12 : newSizeForm.unit === 'cm' ? val / 2.54 : newSizeForm.unit === 'm' ? val * 39.37 : val
                                                });
                                            }}
                                            className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-stone-600 block mb-1">SORT ORDER</label>
                                        <input
                                            type="number"
                                            placeholder="Sort Order"
                                            value={newSizeForm.sort_order}
                                            onChange={(e) => setNewSizeForm({ ...newSizeForm, sort_order: parseInt(e.target.value, 10) || 1 })}
                                            className="w-full px-3.5 py-2.5 border rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                    <input
                                        type="text"
                                        placeholder="Guidance text (e.g. Ideal for consecrated home mandir & sacred altar)"
                                        value={newSizeForm.description}
                                        onChange={(e) => setNewSizeForm({ ...newSizeForm, description: e.target.value })}
                                        className="w-full sm:w-2/3 px-3.5 py-2.5 border rounded-xl text-xs"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition hover:bg-black"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add Master Size</span>
                                    </button>
                                </div>
                            </form>

                            {/* Existing Sizes Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sizes.map(size => (
                                    <div key={size.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between hover:border-stone-300 transition">
                                        <div className="min-w-0 pr-3">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-stone-900 text-sm truncate">{size.label}</div>
                                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-[#8E5B00] text-[10px] font-bold uppercase">{size.unit || 'in'}</span>
                                            </div>
                                            <div className="text-xs text-stone-500 mt-1 font-mono">
                                                {size.height_inches}" height ({size.size_value ? `${size.size_value} ${size.unit || 'in'}` : `${size.height_inches} in`}) • Order: {size.sort_order}
                                            </div>
                                            {size.description && (
                                                <div className="text-xs text-[#C69722] italic mt-1 line-clamp-1">{size.description}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => setEditingSize({ ...size, unit: size.unit || 'in', size_value: size.size_value ?? size.height_inches ?? 12.0 })}
                                                className="p-2 text-stone-500 hover:text-black hover:bg-stone-100 rounded-xl transition"
                                                title="Edit size"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSize(size.id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                                                title="Delete master size"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 6: CUSTOMER REVIEWS & OFFICIAL SELLER REPLIES */}
                    {/* ========================================================================= */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-serif text-2xl font-bold text-[#161616]">
                                        Customer Reviews & Seller Responses
                                    </h2>
                                    <p className="text-xs text-stone-500 mt-1">
                                        Moderate customer reviews, publish official Jaipur karigar responses, and maintain authentic devotee ratings
                                    </p>
                                </div>

                                {/* Review Filter Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'all', label: 'All Reviews' },
                                        { id: 'pending', label: 'Needs Approval' },
                                        { id: 'approved', label: 'Approved' },
                                        { id: 'needs_reply', label: 'Needs Reply' },
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setReviewFilter(f.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                                                reviewFilter === f.id
                                                    ? 'bg-[#161616] text-[#F7C600]'
                                                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {filteredReviews.length === 0 ? (
                                    <div className="bg-white p-8 rounded-2xl text-center text-xs text-stone-400 border border-stone-200">
                                        No reviews found matching the selected filter.
                                    </div>
                                ) : (
                                    filteredReviews.map(rev => (
                                        <div key={rev.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-stone-900 text-xs">{rev.author}</span>
                                                    <span className="text-[10px] text-stone-400">• {rev.location}</span>
                                                    <div className="flex text-amber-500 text-[10px]">
                                                        {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleReviewApproval(rev)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                                                            rev.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                    >
                                                        {rev.is_approved ? <Check className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                        <span>{rev.is_approved ? 'Approved' : 'Hidden'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReview(rev.id)}
                                                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                                                        title="Delete Review"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-stone-800 text-xs">"{rev.title}"</h4>
                                            <p className="text-xs text-stone-600 leading-relaxed">{rev.content}</p>

                                            {/* Seller Reply Box */}
                                            {rev.seller_reply ? (
                                                <div className="p-3.5 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] text-xs space-y-1">
                                                    <div className="font-bold text-[#8E5B00] flex items-center justify-between">
                                                        <span>Official Seller Reply ({rev.seller_reply.author})</span>
                                                        <span className="text-[10px] text-stone-400">{rev.seller_reply.date}</span>
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
                                                            className="w-full px-3.5 py-2 border rounded-xl text-xs"
                                                        />
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => setReplyReviewId(null)} className="text-xs text-stone-500 font-bold px-3 py-1">Cancel</button>
                                                            <button onClick={() => handleSendSellerReply(rev.id)} className="px-4 py-1.5 rounded-lg bg-[#161616] text-[#F7C600] text-xs font-bold">Post Response</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => { setReplyReviewId(rev.id); setReplyText(''); }}
                                                        className="text-xs text-[#C69722] hover:underline font-bold flex items-center gap-1.5"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                        <span>Add Official Seller Reply</span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 7: WHATSAPP CONCIERGE & SITE SETTINGS (With Test WhatsApp Link) */}
                    {/* ========================================================================= */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-[#161616]">
                                    WhatsApp & Site Settings
                                </h2>
                                <p className="text-xs text-stone-500 mt-1">
                                    Configure live customer WhatsApp concierge routing and global rating display modes
                                </p>
                            </div>

                            <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-2xs space-y-6">
                                {/* WhatsApp Number with Live Test Button */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                            WhatsApp Concierge Phone Number
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleTestWhatsApp}
                                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                                            title="Click to open WhatsApp link preview in new tab"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Test Live WhatsApp Link</span>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={settings.whatsapp_number}
                                        onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                                        placeholder="e.g. +919876543210 or 917020676423"
                                        className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-xs text-stone-900 font-mono focus:bg-white"
                                    />
                                    <p className="text-[11px] text-stone-500">
                                        All "Buy on WhatsApp" and custom inquiry buttons across the storefront route directly to this phone number.
                                    </p>
                                </div>

                                {/* Default Message */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                        Default WhatsApp Inquiry Greeting
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={settings.whatsapp_default_message}
                                        onChange={(e) => setSettings({ ...settings, whatsapp_default_message: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-xs text-stone-900 focus:bg-white"
                                    />
                                </div>

                                {/* Global Rating Mode */}
                                <div className="space-y-3 pt-3 border-t border-stone-100">
                                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                        Global Rating Display Mode
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'enabled', label: 'Enabled (Interactive)', desc: 'Users can see all reviews AND submit new ratings' },
                                            { id: 'read_only', label: 'Static (Read-Only Mode)', desc: 'Users can ONLY see existing ratings, cannot add new ones' },
                                            { id: 'hidden', label: 'Turned Off (Hidden)', desc: 'Rating section is completely hidden from storefront' }
                                        ].map(m => {
                                            const isSelected = settings.global_rating_mode === m.id;
                                            return (
                                                <div
                                                    key={m.id}
                                                    onClick={() => setSettings({ ...settings, global_rating_mode: m.id })}
                                                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'border-[#C69722] bg-[#FAF5E8] shadow-xs'
                                                            : 'border-stone-200 bg-white hover:border-stone-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-bold text-stone-900">{m.label}</span>
                                                        {isSelected && <Check className="w-4 h-4 text-[#C69722]" />}
                                                    </div>
                                                    <span className="text-[11px] text-stone-500 leading-snug">{m.desc}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Featured Sacred Collection Settings (Req #2.1: Editable Collection Content) */}
                                <div className="space-y-4 pt-4 border-t border-stone-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-[#C69722]" />
                                                <span>Featured Sacred Collection (Storefront Hero Showcase)</span>
                                            </label>
                                            <span className="text-[11px] text-stone-500">
                                                Manage the dynamic headline, copy, and visual for "SANCTIFIED SACRED COLLECTION 2026"
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-[#DFC48D]/60">
                                        <div className="sm:col-span-2">
                                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                                                HERO COLLECTION TITLE *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={settings.collection_title || ''}
                                                onChange={(e) => setSettings({ ...settings, collection_title: e.target.value })}
                                                placeholder="e.g. SANCTIFIED SACRED COLLECTION 2026"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:outline-none focus:border-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                                                TOP BADGE TEXT
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.collection_badge || ''}
                                                onChange={(e) => setSettings({ ...settings, collection_badge: e.target.value })}
                                                placeholder="e.g. HASTASHILP HERITAGE 2026"
                                                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold focus:outline-none focus:border-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                                                SUBTITLE / HOOK
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.collection_subtitle || ''}
                                                onChange={(e) => setSettings({ ...settings, collection_subtitle: e.target.value })}
                                                placeholder="e.g. DIVINE BLESSINGS FOR YOUR SACRED SANCTUM"
                                                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold focus:outline-none focus:border-black"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                                                COLLECTION STORY & DESCRIPTION
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={settings.collection_description || ''}
                                                onChange={(e) => setSettings({ ...settings, collection_description: e.target.value })}
                                                placeholder="Hand-sculpted in Makrana white marble by fourth-generation Jaipur sthapatis..."
                                                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs leading-relaxed focus:outline-none focus:border-black"
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-stone-600 block mb-0.5">PRICE FROM (₹)</label>
                                                <input
                                                    type="text"
                                                    value={settings.collection_price_from || ''}
                                                    onChange={(e) => setSettings({ ...settings, collection_price_from: e.target.value })}
                                                    placeholder="1,499"
                                                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white font-bold text-stone-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-stone-600 block mb-0.5">OLD PRICE (₹)</label>
                                                <input
                                                    type="text"
                                                    value={settings.collection_old_price || ''}
                                                    onChange={(e) => setSettings({ ...settings, collection_old_price: e.target.value })}
                                                    placeholder="2,499"
                                                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white text-stone-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-stone-600 block mb-0.5">DISCOUNT BADGE</label>
                                                <input
                                                    type="text"
                                                    value={settings.collection_discount_text || ''}
                                                    onChange={(e) => setSettings({ ...settings, collection_discount_text: e.target.value })}
                                                    placeholder="40% OFF"
                                                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white font-bold text-emerald-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2 space-y-2 pt-1">
                                            <label className="text-[11px] font-bold text-stone-700 block">
                                                HERO SHOWCASE IMAGE
                                            </label>
                                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                                {settings.collection_image_url ? (
                                                    <div className="w-24 h-24 rounded-xl border border-stone-300 bg-white p-1 flex-shrink-0 flex items-center justify-center">
                                                        <img
                                                            src={api.getImageUrl(settings.collection_image_url)}
                                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/products/ram-darbar.png'; }}
                                                            alt="Hero Preview"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                ) : null}
                                                <div className="flex-1 w-full">
                                                    <ImageDropzone
                                                        label="Upload Hero Collection Showcase Image"
                                                        sublabel="Drag & drop new banner image or click to browse"
                                                        isUploading={uploadingCollectionBanner}
                                                        onUpload={async (file) => {
                                                            setUploadingCollectionBanner(true);
                                                            const url = await handleFileUpload(file, 'banners');
                                                            if (url) {
                                                                setSettings(prev => ({ ...prev, collection_image_url: url }));
                                                            }
                                                            setUploadingCollectionBanner(false);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Save Global Settings</span>
                                </button>
                            </form>
                        </div>
                    )}

                </main>
            </div>

            
            {/* ========================================================================= */}
            {/* GLOBAL HOISTED MODALS: PRODUCT, CATEGORY, MASTER SIZE                     */}
            {/* ========================================================================= */}

            {/* Comprehensive Edit / Add Product Modal (Req #1.2, #1.3, #1.5, #1.6, #3.4, #3.6) */}
            {editingProduct && (
                <div 
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
                    data-lenis-prevent="true"
                    onClick={(e) => { if (e.target === e.currentTarget) setEditingProduct(null); }}
                >
                    <div 
                        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 relative"
                        data-lenis-prevent="true"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF8F5] flex-shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-serif text-lg font-bold text-[#161616]">
                                        {editingProduct.id ? 'Edit Product & Catalog Images' : 'Add New Product to Catalog'}
                                    </h3>
                                    {editingProduct.id && (
                                        <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-mono font-bold">
                                            {String(editingProduct.id).startsWith('prod-') ? 'CUSTOM IDOL' : 'CATALOG'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-stone-500 mt-0.5">
                                    Organized 6-section product editor with live drag & drop, dimension units, and available sizes
                                </p>
                            </div>
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
                            id="admin-product-edit-form"
                            onSubmit={handleSaveProduct} 
                            className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 overscroll-contain"
                            data-lenis-prevent="true"
                        >
                            {/* SECTION 1: BASIC PRODUCT INFORMATION */}
                            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                                <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                                    <Package className="w-4 h-4 text-[#C69722]" />
                                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                        1. Basic Product Information
                                    </h4>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-stone-700 block mb-1">
                                        PRODUCT NAME / TITLE *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editingProduct.title || ''}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                                        placeholder="e.g. Ram Darbar - Divine Blessings | Ram, Sita, Laxman & Hanuman"
                                        className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:border-black"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-stone-700 block mb-1">
                                        PRODUCT DESCRIPTION *
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={editingProduct.description || ''}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                        placeholder="Exquisitely hand-sculpted in Makrana white marble by heritage artisans of Jaipur. Finished with pure 24K gold foil (swarna varakh), suitable for consecrated home mandir and sacred altars..."
                                        className="w-full px-3.5 py-2.5 border rounded-xl text-xs leading-relaxed focus:outline-none focus:border-black"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                            MATERIAL SPECIFICATION
                                        </label>
                                        <input
                                            type="text"
                                            value={editingProduct.material || 'Pure White Makrana Marble'}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                                            placeholder="e.g. Pure White Makrana Marble"
                                            className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                            WEIGHT ESTIMATE
                                        </label>
                                        <input
                                            type="text"
                                            value={editingProduct.weight || ''}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                                            placeholder="e.g. 1.8 kg / 850 grams"
                                            className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: CATEGORY & CATALOG DETAILS */}
                            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                                <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                                    <Layers className="w-4 h-4 text-[#C69722]" />
                                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                        2. Category & Catalog Details
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-stone-700 block mb-1">DEITY / CATEGORY *</label>
                                        <select
                                            id="product-deity-category-select"
                                            required
                                            value={isCustomDeity ? '__custom__' : (editingProduct.deity || '')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '__custom__') {
                                                    setIsCustomDeity(true);
                                                    setEditingProduct({ ...editingProduct, deity: '' });
                                                } else {
                                                    setIsCustomDeity(false);
                                                    const matchedCat = (categories || []).find(c =>
                                                        (c.name || '').toLowerCase() === val.toLowerCase() ||
                                                        (c.deity || '').toLowerCase() === val.toLowerCase() ||
                                                        (c.slug || '').toLowerCase() === val.toLowerCase()
                                                    );
                                                    setEditingProduct({
                                                        ...editingProduct,
                                                        deity: val,
                                                        category_id: matchedCat?.id || editingProduct.category_id || ''
                                                    });
                                                }
                                            }}
                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:border-black font-semibold cursor-pointer shadow-2xs"
                                        >
                                            <option value="" disabled>-- Select Deity / Category --</option>
                                            {categoryDropdownOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                            <option value="__custom__">+ Enter Custom Category...</option>
                                        </select>

                                        {isCustomDeity && (
                                            <div className="mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                                <input
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    value={editingProduct.deity || ''}
                                                    onChange={(e) => setEditingProduct({ ...editingProduct, deity: e.target.value })}
                                                    placeholder="Type custom deity/category name..."
                                                    className="flex-1 px-3 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-black font-semibold"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCustomDeity(false);
                                                        if (!editingProduct.deity) {
                                                            setEditingProduct({ ...editingProduct, deity: categoryDropdownOptions[0]?.value || 'Ganesha' });
                                                        }
                                                    }}
                                                    className="px-2.5 py-1.5 text-[11px] font-bold text-stone-500 hover:text-black rounded-lg hover:bg-stone-100 transition"
                                                    title="Back to dropdown"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-700 block mb-1">STOREFRONT SECTION</label>
                                        <select
                                            value={editingProduct.group_tag || 'most-loved'}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, group_tag: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                                        >
                                            <option value="most-loved">Most Loved Idols</option>
                                            <option value="navratri">Navratri Drop</option>
                                            <option value="sacred">Sacred Idols</option>
                                            <option value="baal-roop">Baal Roop Collection</option>
                                            <option value="similar">General Catalog</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-700 block mb-1">STOCK STATUS</label>
                                        <select
                                            value={editingProduct.stock_status || 'in_stock'}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, stock_status: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:border-black font-semibold"
                                        >
                                            <option value="in_stock">In Stock (Ready to Dispatch)</option>
                                            <option value="made_to_order">Made to Order (7-10 Days Karigari)</option>
                                            <option value="out_of_stock">Out of Stock</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(editingProduct.is_active)}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                                            className="w-4 h-4 accent-[#161616] rounded"
                                        />
                                        <span>Active on Store</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(editingProduct.pran_pratishtha_ready)}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, pran_pratishtha_ready: e.target.checked })}
                                            className="w-4 h-4 accent-[#161616] rounded"
                                        />
                                        <span>Pran Pratishtha Ready</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(editingProduct.gold_leaf_karigari)}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, gold_leaf_karigari: e.target.checked })}
                                            className="w-4 h-4 accent-[#161616] rounded"
                                        />
                                        <span>24K Gold Karigari</span>
                                    </label>
                                </div>
                            </div>

                            {/* SECTION 3: SIZES & MEASUREMENTS (Req #1.2, #1.3, #1.5) */}
                            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-[#C69722]" />
                                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                            3. Sizes & Measurements
                                        </h4>
                                    </div>
                                    <span className="text-[10px] text-stone-400">Req 1.2, 1.3 & 1.5</span>
                                </div>

                                {/* Measurement Units & Master Sizes Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                                            MEASUREMENT UNIT * (Req 1.5)
                                        </label>
                                        <select
                                            value={editingProduct.measurement_unit || 'in'}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, measurement_unit: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-bold text-[#8E5B00] focus:outline-none focus:border-black"
                                        >
                                            <option value="in">Inches (in)</option>
                                            <option value="ft">Feet (ft)</option>
                                            <option value="m">Meters (m)</option>
                                            <option value="cm">Centimeters (cm)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                            LINKED MASTER SIZE TAG (Req 1.2)
                                        </label>
                                        <select
                                            value={editingProduct.size_id || ''}
                                            onChange={(e) => {
                                                const selectedSize = sizes.find(s => s.id === e.target.value);
                                                setEditingProduct({
                                                    ...editingProduct,
                                                    size_id: e.target.value,
                                                    dimensions: selectedSize ? `${selectedSize.height_inches} ${editingProduct.measurement_unit || selectedSize.unit || 'in'} Height • ${selectedSize.label}` : editingProduct.dimensions
                                                });
                                            }}
                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                                        >
                                            <option value="">-- Choose Master Size --</option>
                                            {sizes.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.label} ({s.height_inches} {editingProduct.measurement_unit || s.unit || 'in'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                                            PHYSICAL MEASUREMENTS (TEXT)
                                        </label>
                                        <input
                                            type="text"
                                            value={editingProduct.dimensions || ''}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, dimensions: e.target.value })}
                                            placeholder="e.g. 12 in x 8 in x 4 in"
                                            className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                {/* Available Sizes Dropdown & Chips (Req 1.3) */}
                                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-stone-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                            Available Sizes for Customers (Storefront Selector)
                                        </label>
                                        <span className="text-[10px] text-stone-500">
                                            {(editingProduct.available_sizes || []).length} Sizes Selected
                                        </span>
                                    </div>

                                    {/* Chips */}
                                    <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                                        {(editingProduct.available_sizes || []).length === 0 ? (
                                            <span className="text-xs text-stone-400 italic">No available sizes selected yet. Pick from the dropdown below or type custom.</span>
                                        ) : (
                                            (editingProduct.available_sizes || []).map((sz, szIdx) => (
                                                <span
                                                    key={szIdx}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-xs font-semibold text-stone-900 shadow-2xs"
                                                >
                                                    <span>{sz}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = (editingProduct.available_sizes || []).filter((_, i) => i !== szIdx);
                                                            setEditingProduct({ ...editingProduct, available_sizes: updated });
                                                        }}
                                                        className="text-stone-400 hover:text-rose-600 transition font-bold"
                                                        title="Remove size option"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))
                                        )}
                                    </div>

                                    {/* Dropdown Selector */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                        <select
                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-black"
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                const current = editingProduct.available_sizes || [];
                                                if (!current.includes(e.target.value)) {
                                                    setEditingProduct({
                                                        ...editingProduct,
                                                        available_sizes: [...current, e.target.value]
                                                    });
                                                }
                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">+ Select from Master Sizes...</option>
                                            {sizes.map(s => (
                                                <option key={s.id} value={`${s.height_inches} ${editingProduct.measurement_unit || s.unit || 'in'} (${s.label})`}>
                                                    {s.label} ({s.height_inches} {editingProduct.measurement_unit || s.unit || 'in'})
                                                </option>
                                            ))}
                                        </select>

                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                value={customSizeInput}
                                                onChange={(e) => setCustomSizeInput(e.target.value)}
                                                placeholder="Or type custom size (e.g. 15 cm Home Mandir)"
                                                className="flex-1 px-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (customSizeInput.trim()) {
                                                            const current = editingProduct.available_sizes || [];
                                                            if (!current.includes(customSizeInput.trim())) {
                                                                setEditingProduct({
                                                                    ...editingProduct,
                                                                    available_sizes: [...current, customSizeInput.trim()]
                                                                });
                                                            }
                                                            setCustomSizeInput('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (customSizeInput.trim()) {
                                                        const current = editingProduct.available_sizes || [];
                                                        if (!current.includes(customSizeInput.trim())) {
                                                            setEditingProduct({
                                                                ...editingProduct,
                                                                available_sizes: [...current, customSizeInput.trim()]
                                                            });
                                                        }
                                                        setCustomSizeInput('');
                                                    }
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-[#161616] text-[#F7C600] hover:bg-black text-xs font-bold transition shrink-0"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Size Variants & Dynamic Pricing */}
                                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                                Size Variants with Custom Pricing (Optional)
                                            </label>
                                            <span className="text-[10px] text-stone-500">
                                                Assign distinct prices per idol size variant
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentVariants = Array.isArray(editingProduct.variants) ? [...editingProduct.variants] : [];
                                                const defaultLabel = sizes[0] ? `${sizes[0].height_inches}" (${sizes[0].label})` : '15 cm (Home Mandir)';
                                                setEditingProduct({
                                                    ...editingProduct,
                                                    variants: [
                                                        ...currentVariants,
                                                        {
                                                            variant_name: defaultLabel,
                                                            size_id: sizes[0]?.id || '',
                                                            price: (editingProduct.price || 1499) + 600,
                                                            discount_price: (editingProduct.old_price || 2499) + 600,
                                                            is_available: true
                                                        }
                                                    ]
                                                });
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-[#161616] text-[#F7C600] hover:bg-black text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span>Add Variant</span>
                                        </button>
                                    </div>

                                    {Array.isArray(editingProduct.variants) && editingProduct.variants.length > 0 ? (
                                        <div className="space-y-2">
                                            {editingProduct.variants.map((variant, vIdx) => (
                                                <div key={vIdx} className="p-2.5 bg-white rounded-lg border border-stone-200 flex flex-col sm:flex-row items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={variant.variant_name || ''}
                                                        onChange={(e) => {
                                                            const updated = [...editingProduct.variants];
                                                            updated[vIdx] = { ...updated[vIdx], variant_name: e.target.value };
                                                            setEditingProduct({ ...editingProduct, variants: updated });
                                                        }}
                                                        placeholder="Variant name"
                                                        className="flex-1 w-full sm:w-auto px-2.5 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none focus:border-black"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={variant.price || ''}
                                                        onChange={(e) => {
                                                            const updated = [...editingProduct.variants];
                                                            updated[vIdx] = { ...updated[vIdx], price: parseFloat(e.target.value) || 0 };
                                                            setEditingProduct({ ...editingProduct, variants: updated });
                                                        }}
                                                        placeholder="Price (₹)"
                                                        className="w-full sm:w-24 px-2 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none focus:border-black"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={variant.discount_price || ''}
                                                        onChange={(e) => {
                                                            const updated = [...editingProduct.variants];
                                                            updated[vIdx] = { ...updated[vIdx], discount_price: parseFloat(e.target.value) || 0 };
                                                            setEditingProduct({ ...editingProduct, variants: updated });
                                                        }}
                                                        placeholder="Old Price (₹)"
                                                        className="w-full sm:w-24 px-2 py-1.5 border rounded-lg text-xs text-stone-500 focus:outline-none focus:border-black"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = editingProduct.variants.filter((_, idx) => idx !== vIdx);
                                                            setEditingProduct({ ...editingProduct, variants: updated });
                                                        }}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                        title="Remove variant"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* SECTION 4: PRICING & DISCOUNTS */}
                            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                                <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                                    <Tag className="w-4 h-4 text-[#C69722]" />
                                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                        4. Pricing & Discounts
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-stone-700 block mb-1">PRICE (₹) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={editingProduct.price}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-700 block mb-1">OLD PRICE (₹)</label>
                                        <input
                                            type="number"
                                            value={editingProduct.old_price || ''}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, old_price: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-xl text-xs text-stone-500 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-700 block mb-1">DISCOUNT TEXT</label>
                                        <input
                                            type="text"
                                            value={editingProduct.off_text || ''}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, off_text: e.target.value })}
                                            placeholder="e.g. 40% off"
                                            className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 5: PRODUCT IMAGES & ALTERNATE ANGLES (Req #1.4, #1.6, #3.4) */}
                            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-[#C69722]" />
                                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                            5. Product Images & Alternate Angles
                                        </h4>
                                    </div>
                                    <span className="text-[10px] text-stone-400">Drag & Drop Ready (Req 1.6)</span>
                                </div>

                                {/* Primary Image Uploader */}
                                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-stone-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                            PRIMARY HERO / THUMBNAIL IMAGE
                                        </label>
                                        <span className="text-[10px] text-stone-500">Main Storefront Card Image</span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        {editingProduct.primary_catalog_image ? (
                                            <div className="relative group w-20 h-20 rounded-xl overflow-hidden border border-stone-300 bg-white flex-shrink-0 flex items-center justify-center p-1 shadow-2xs">
                                                <img
                                                    src={api.getImageUrl(editingProduct.primary_catalog_image)}
                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/products/ram-darbar.png'; }}
                                                    alt="Primary"
                                                    className="w-full h-full object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingProduct({ ...editingProduct, primary_catalog_image: '' })}
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow"
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-300 bg-white/70 flex flex-col items-center justify-center text-stone-400 text-[10px] flex-shrink-0">
                                                <ImageIcon className="w-6 h-6 stroke-1 mb-0.5 text-stone-400" />
                                                <span>No Image</span>
                                            </div>
                                        )}

                                        <div className="flex-1 w-full">
                                            <ImageDropzone
                                                label="Upload Primary Photo"
                                                sublabel="Drag & drop file here or click to browse"
                                                isUploading={uploadingPrimary}
                                                onUpload={async (file) => {
                                                    setUploadingPrimary(true);
                                                    const url = await handleFileUpload(file, 'catalog');
                                                    if (url) {
                                                        setEditingProduct(prev => ({
                                                            ...prev,
                                                            primary_catalog_image: url,
                                                            img: url
                                                        }));
                                                    }
                                                    setUploadingPrimary(false);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-Angle Gallery */}
                                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-stone-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                                                Multi-Angle Gallery (Alternate Perspectives)
                                            </label>
                                            <span className="text-[10.5px] text-stone-500">
                                                Uploaded angles will be displayed on the customer product detail page
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-[#8E5B00]">
                                            {(editingProduct.catalog_images || []).length} Angles
                                        </span>
                                    </div>

                                    <ImageDropzone
                                        multiple={true}
                                        label="+ Drop Angle Photos Here (Multiple Files Supported)"
                                        sublabel="Drag multiple alternate angles or browse files"
                                        isUploading={uploadingCatalogAngle}
                                        onUpload={async (file) => {
                                            setUploadingCatalogAngle(true);
                                            const url = await handleFileUpload(file, 'catalog');
                                            if (url) {
                                                setEditingProduct(prev => {
                                                    const currentImages = prev.catalog_images || [];
                                                    return {
                                                        ...prev,
                                                        catalog_images: [
                                                            ...currentImages,
                                                            {
                                                                url: url,
                                                                caption: `Angle ${currentImages.length + 1} - Sacred Detail`,
                                                                sort_order: currentImages.length + 1
                                                            }
                                                        ]
                                                    };
                                                });
                                            }
                                            setUploadingCatalogAngle(false);
                                        }}
                                    />

                                    {(!editingProduct.catalog_images || editingProduct.catalog_images.length === 0) ? (
                                        <div className="text-center py-4 text-xs text-stone-400 bg-white rounded-xl border border-dashed border-stone-200">
                                            No additional angles added yet. Drop photos above!
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1" data-lenis-prevent="true">
                                            {editingProduct.catalog_images.map((img, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                                                    <img
                                                        src={api.getImageUrl(img.url)}
                                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = editingProduct.primary_catalog_image || '/images/products/ram-darbar.png'; }}
                                                        alt=""
                                                        className="w-12 h-12 object-contain rounded-lg bg-stone-50 border p-0.5 flex-shrink-0"
                                                    />
                                                    <div className="flex-1 w-full space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={img.caption || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...editingProduct.catalog_images];
                                                                    updated[idx] = { ...updated[idx], caption: e.target.value };
                                                                    setEditingProduct({ ...editingProduct, catalog_images: updated });
                                                                }}
                                                                placeholder="Caption (e.g. Front Sacred View, 24K Gold Detailing)"
                                                                className="flex-1 px-2.5 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none focus:border-black"
                                                            />
                                                            <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold flex items-center gap-1 transition flex-shrink-0">
                                                                <Upload className="w-3 h-3 text-stone-600" />
                                                                <span>Replace</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            const url = await handleFileUpload(file, 'catalog');
                                                                            if (url) {
                                                                                const updated = [...editingProduct.catalog_images];
                                                                                updated[idx] = { ...updated[idx], url };
                                                                                setEditingProduct({ ...editingProduct, catalog_images: updated });
                                                                            }
                                                                            e.target.value = '';
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCatalogImage(idx)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                        title="Delete this catalog angle"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 6: RATINGS & REVIEW SETTINGS */}
                            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                                <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                                    <Star className="w-4 h-4 text-[#C69722]" />
                                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                        6. Ratings & Review Settings
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-stone-700 block mb-1">
                                            PRODUCT RATING MODE
                                        </label>
                                        <select
                                            value={editingProduct.rating_mode || 'enabled'}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, rating_mode: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                                        >
                                            <option value="enabled">Enabled (View & Submit)</option>
                                            <option value="read_only">Static (Read-Only Mode)</option>
                                            <option value="hidden">Hidden (Turned Off)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-700 block mb-1">
                                            STATIC RATING VALUE (1.0 - 5.0)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.05"
                                            min="1"
                                            max="5"
                                            value={editingProduct.static_rating_value ?? 5.0}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, static_rating_value: parseFloat(e.target.value) || 5.0 })}
                                            className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:border-black font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Sticky Footer */}
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
                                form="admin-product-edit-form"
                                className="px-6 py-2.5 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider hover:bg-black transition shadow-sm active:scale-98"
                            >
                                {editingProduct.id ? 'Save Changes' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hoisted Deity Category Modal (Req #1.1: Add Category Works from Everywhere) */}
            {editingCategory && (
                <div 
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
                    data-lenis-prevent="true"
                    onClick={(e) => { if (e.target === e.currentTarget) setEditingCategory(null); }}
                >
                    <div 
                        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
                        data-lenis-prevent="true"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-[#FAF8F5] flex-shrink-0">
                            <h3 className="font-serif text-lg font-bold text-stone-900">
                                {editingCategory.id ? 'Edit Category Images & Details' : 'Add New Deity Category'}
                            </h3>
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
                            id="admin-category-edit-form"
                            onSubmit={handleSaveCategory} 
                            className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain"
                            data-lenis-prevent="true"
                        >
                            <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">DEITY / CATEGORY NAME *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingCategory.name || ''}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    placeholder="e.g. Ram Darbar, Radha Krishna, Lord Shiva"
                                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-black"
                                />
                            </div>

                            {/* Circle Icon Thumbnail with Drag & Drop */}
                            <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                    CIRCLE ICON THUMBNAIL
                                </label>
                                <div className="flex items-center gap-3">
                                    {editingCategory.img ? (
                                        <div className="w-14 h-14 rounded-full border border-stone-300 bg-stone-50 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={api.getImageUrl(editingCategory.img)}
                                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/categories/ram.png'; }}
                                                alt=""
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    ) : null}
                                    <div className="flex-1">
                                        <ImageDropzone
                                            label="Upload Category Icon"
                                            sublabel="Square or round icon for category scroller"
                                            isUploading={uploadingCatIcon}
                                            onUpload={async (file) => {
                                                setUploadingCatIcon(true);
                                                const url = await handleFileUpload(file, 'categories');
                                                if (url) setEditingCategory(prev => ({ ...prev, img: url }));
                                                setUploadingCatIcon(false);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hero Landing Banner Image with Drag & Drop */}
                            <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">
                                    HERO LANDING BANNER IMAGE
                                </label>
                                <div className="space-y-2">
                                    {editingCategory.banner_url ? (
                                        <div className="h-20 rounded-xl border border-stone-300 overflow-hidden bg-stone-50 flex items-center justify-center">
                                            <img
                                                src={api.getImageUrl(editingCategory.banner_url)}
                                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/categories/navratri-drop@2x.png'; }}
                                                alt="Banner"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : null}
                                    <ImageDropzone
                                        label="Upload Category Hero Banner"
                                        sublabel="Wide landscape banner image"
                                        isUploading={uploadingCatBanner}
                                        onUpload={async (file) => {
                                            setUploadingCatBanner(true);
                                            const url = await handleFileUpload(file, 'banners');
                                            if (url) setEditingCategory(prev => ({ ...prev, banner_url: url }));
                                            setUploadingCatBanner(false);
                                        }}
                                    />
                                </div>
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
                                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
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
                                form="admin-category-edit-form"
                                className="px-5 py-2 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase tracking-wider hover:bg-black transition shadow-sm active:scale-98"
                            >
                                {editingCategory.id ? 'Save Category' : 'Create Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hoisted Master Size Modal (Req #1.2 & #1.5) */}
            {editingSize && (
                <div 
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
                    data-lenis-prevent="true"
                    onClick={(e) => { if (e.target === e.currentTarget) setEditingSize(null); }}
                >
                    <div 
                        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
                        data-lenis-prevent="true"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-[#FAF8F5]">
                            <h3 className="font-serif text-lg font-bold text-stone-900">Edit Master Size</h3>
                            <button 
                                type="button" 
                                onClick={() => setEditingSize(null)} 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-black hover:bg-stone-200/60 transition"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveEditSize} className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">SIZE LABEL *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingSize.label}
                                    onChange={(e) => setEditingSize({ ...editingSize, label: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-stone-700 block mb-1">UNIT * (Req 1.5)</label>
                                    <select
                                        value={editingSize.unit || 'in'}
                                        onChange={(e) => setEditingSize({ ...editingSize, unit: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-bold text-[#8E5B00]"
                                    >
                                        <option value="in">Inches (in)</option>
                                        <option value="ft">Feet (ft)</option>
                                        <option value="m">Meters (m)</option>
                                        <option value="cm">Centimeters (cm)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-700 block mb-1">NUMERIC VALUE *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={editingSize.size_value ?? editingSize.height_inches ?? 12.0}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setEditingSize({
                                                ...editingSize,
                                                size_value: val,
                                                height_inches: editingSize.unit === 'ft' ? val * 12 : editingSize.unit === 'cm' ? val / 2.54 : editingSize.unit === 'm' ? val * 39.37 : val
                                            });
                                        }}
                                        className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-stone-700 block mb-1">HEIGHT (INCHES)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={editingSize.height_inches}
                                        onChange={(e) => setEditingSize({ ...editingSize, height_inches: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border rounded-xl text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-700 block mb-1">SORT ORDER</label>
                                    <input
                                        type="number"
                                        value={editingSize.sort_order}
                                        onChange={(e) => setEditingSize({ ...editingSize, sort_order: parseInt(e.target.value, 10) || 1 })}
                                        className="w-full px-3 py-2 border rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-stone-700 block mb-1">DESCRIPTION</label>
                                <input
                                    type="text"
                                    value={editingSize.description || ''}
                                    onChange={(e) => setEditingSize({ ...editingSize, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-xl text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setEditingSize(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-[#161616] text-[#F7C600] font-bold text-xs uppercase"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

{/* Modal: Render Backend Server Connection (Accessible anytime from top navbar) */}
            {isConfiguringServer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                    <div className="bg-[#24201C] border border-[#DFC48D]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#F7C600] text-[#161616] flex items-center justify-center font-bold">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg font-bold text-white">
                                        Render Backend Connection
                                    </h3>
                                    <p className="text-[11px] text-stone-400">
                                        Connect your FastAPI server deployed on Render
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsConfiguringServer(false)}
                                className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-left">
                            <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                                Render Web Service URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="https://your-service.onrender.com"
                                    value={backendUrlInput}
                                    onChange={(e) => setBackendUrlInput(e.target.value)}
                                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-stone-700 bg-stone-950 text-white font-mono focus:border-[#F7C600] focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleTestAndSaveBackend}
                                    disabled={testingConnection || !backendUrlInput.trim()}
                                    className="px-4 py-2.5 bg-gradient-to-r from-[#F7C600] to-[#E5B500] hover:from-[#E5B500] hover:to-[#D4A300] text-[#161616] rounded-xl font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                                >
                                    {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                                    <span>{testingConnection ? 'Testing...' : 'Connect'}</span>
                                </button>
                            </div>

                            {serverStatus && (
                                <div className={`p-3 rounded-xl text-xs leading-relaxed ${serverStatus.type === 'success' ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' : serverStatus.type === 'error' ? 'bg-rose-950/70 border border-rose-500/40 text-rose-300' : 'bg-stone-800 text-stone-300'}`}>
                                    {serverStatus.message}
                                </div>
                            )}

                            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] text-stone-400 space-y-1.5">
                                <div className="text-stone-300 font-bold">ℹ️ Render Free Tier Deployment Notes:</div>
                                <div>• Render web services automatically sleep after 15 minutes of inactivity.</div>
                                <div>• The first wake-up request may take 30 to 50 seconds to complete.</div>
                                <div>• Ensure your Render URL starts with <code className="text-[#F7C600]">https://</code> (e.g. <code className="text-[#F7C600]">https://murti-hub.onrender.com</code>).</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                            <button
                                type="button"
                                onClick={() => setIsConfiguringServer(false)}
                                className="px-5 py-2 text-xs font-bold text-stone-300 hover:text-white rounded-xl bg-stone-800/80 hover:bg-stone-800"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
