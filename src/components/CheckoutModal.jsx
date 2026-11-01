import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, CreditCard, Banknote, QrCode, Tag, ArrowRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { checkoutSchema } from '../lib/validation';
import { formatWhatsAppNumberForLink, DEFAULT_WHATSAPP_NUMBER } from '../utils/whatsapp';

export const getWhatsAppOrderUrl = (order, phone) => {
    const cleanNumber = formatWhatsAppNumberForLink(phone || DEFAULT_WHATSAPP_NUMBER);

    const itemsSummary = (order?.items || [])
        .map((item, idx) => {
            const name = item.title || item.name || 'Sacred Murti';
            const size = item.selectedSize || item.size || 'Standard Size';
            const qty = item.qty || 1;
            const price = ((item.price || 0) * qty).toLocaleString('en-IN');
            return `  ${idx + 1}. *${name}* (${size})\n     Qty: ${qty} | ₹${price}`;
        })
        .join('\n\n');

    const addressParts = [
        order?.shipping?.address,
        order?.shipping?.city,
        order?.shipping?.state,
        order?.shipping?.pincode ? `PIN: ${order.shipping.pincode}` : ''
    ].filter(Boolean).join(', ');

    const message = 
`🙏 *NEW SACRED ORDER PLACED* 🙏
*Amol Marble Murti Bhandar, Jaipur*
━━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* ${order?.orderId}
📅 *Date:* ${order?.date || new Date().toLocaleDateString('en-IN')}
💳 *Payment Mode:* ${String(order?.paymentMethod || 'COD').toUpperCase()}
💰 *Total Amount:* ₹${Number(order?.total || 0).toLocaleString('en-IN')}.00
━━━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER DETAILS:*
• *Name:* ${order?.shipping?.fullName || 'Customer'}
• *Mobile:* ${order?.shipping?.phone || 'N/A'}
${order?.shipping?.email ? `• *Email:* ${order.shipping.email}\n` : ''}• *Delivery Address:* ${addressParts}
${order?.shipping?.notes ? `• *Mandir / Consecration Notes:* ${order.shipping.notes}\n` : ''}━━━━━━━━━━━━━━━━━━━━━
🛍️ *ORDERED ITEMS:*
${itemsSummary || '  1. Sacred Mandir Idols'}
━━━━━━━━━━━━━━━━━━━━━
_Namaste! I have placed this order on your website. Please verify my order details, begin the Vedic sanctification prayer, and send me live packing & BlueDart tracking updates on WhatsApp._ 🙏`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
};

export default function CheckoutModal({
    isOpen,
    onClose,
    cart,
    cartTotal,
    onOrderPlaced,
    appliedCoupon,
    onApplyCoupon,
    onRemoveCoupon,
    whatsappNumber = DEFAULT_WHATSAPP_NUMBER
}) {
    if (!isOpen) return null;

    const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Success
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [orderErrorMessage, setOrderErrorMessage] = useState('');
    const [addressError, setAddressError] = useState('');

    const activeUser = api.getCurrentUser();
    const [shipping, setShipping] = useState({
        fullName: activeUser?.full_name || '',
        phone: activeUser?.phone || '',
        email: activeUser?.email || '',
        address: activeUser?.address || '',
        city: activeUser?.city || 'Jaipur',
        state: activeUser?.state || 'Rajasthan',
        pincode: activeUser?.pincode || '',
        notes: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'upi' | 'card'
    const [orderInfo, setOrderInfo] = useState(null);

    // Direct and instant redirect to WhatsApp when order is confirmed
    useEffect(() => {
        if (step === 3 && orderInfo) {
            const waUrl = getWhatsAppOrderUrl(orderInfo, whatsappNumber);
            const timer = setTimeout(() => {
                try {
                    window.location.href = waUrl;
                } catch (e) {
                    console.warn('[WhatsApp auto-redirect timer]', e);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [step, orderInfo, whatsappNumber]);

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        const code = couponInput.trim().toUpperCase();
        if (code === 'DIVINE15' || code === 'FESTIVE10') {
            onApplyCoupon(code);
            setCouponError('');
            setCouponInput('');
        } else {
            setCouponError('Invalid code. Try DIVINE15 for 15% off');
        }
    };

    const handleAddressSubmit = (e) => {
        e.preventDefault();
        setAddressError('');
        const validation = checkoutSchema.safeParse({
            fullName: shipping.fullName,
            phone: shipping.phone,
            email: shipping.email,
            addressLine1: shipping.address,
            city: shipping.city || 'Jaipur',
            state: shipping.state || 'Rajasthan',
            pincode: shipping.pincode,
            notes: shipping.notes
        });

        if (!validation.success) {
            const firstErr = validation.error.errors[0]?.message || 'Please fill all required delivery details properly.';
            setAddressError(firstErr);
            return;
        }

        setStep(2);
    };

    const handlePlaceOrder = async () => {
        setIsSubmittingOrder(true);
        setOrderErrorMessage('');

        try {
            // Checklist Section 4: Authoritatively validate and place order
            const orderPayload = {
                items: cart.map(item => ({
                    product_id: String(item.id),
                    qty: item.qty || 1,
                    selected_size: item.selectedSize || item.title || null
                })),
                shipping: {
                    full_name: shipping.fullName,
                    phone: shipping.phone,
                    email: shipping.email || null,
                    address: shipping.address,
                    city: shipping.city || 'Jaipur',
                    state: shipping.state || 'Rajasthan',
                    pincode: shipping.pincode,
                    notes: shipping.notes || null
                },
                payment_method: paymentMethod,
                coupon_code: appliedCoupon?.code || null,
                idempotency_key: `IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            };

            const response = await api.createOrder(orderPayload);
            const serverOrder = response.data || response;

            // Only report success after authoritative system confirms (Critical Rule)
            const confirmedOrderData = {
                orderId: serverOrder.order_id,
                items: serverOrder.items || [...cart],
                total: serverOrder.total || cartTotal,
                shipping: serverOrder.shipping || shipping,
                paymentMethod: serverOrder.payment_method || paymentMethod,
                trackingNumber: serverOrder.tracking_number,
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            };

            setOrderInfo(confirmedOrderData);
            api.saveUserOrder(confirmedOrderData);
            onOrderPlaced(confirmedOrderData);
            setStep(3);

            // Automatically and directly redirect to WhatsApp concierge immediately
            const waUrl = getWhatsAppOrderUrl(confirmedOrderData, whatsappNumber);
            try {
                window.location.href = waUrl;
            } catch (redirectErr) {
                console.warn('[WhatsApp redirect fallback]', redirectErr);
                window.open(waUrl, '_blank');
            }

            // Close checkout modal after dispatching navigation
            setTimeout(() => {
                if (onClose) onClose();
            }, 500);
        } catch (err) {
            console.error('[Checkout Error]', err);
            setOrderErrorMessage(err.message || 'Failed to confirm order with the store server. Please try again.');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <div className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90dvh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-[#E6D6B8] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-[#E6D6B8] bg-[#FAF5E8] flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C69722]">✦ SACRED SANCTUARY CHECKOUT ✦</span>
                        <h3 className="font-serif text-xl font-bold text-[#161616]">
                            {step === 1 && 'Delivery Address & Contact'}
                            {step === 2 && 'Payment & Review Order'}
                            {step === 3 && 'Redirecting to WhatsApp...'}
                        </h3>
                    </div>
                    {step !== 3 && (
                        <button
                            onClick={onClose}
                            className="w-11 h-11 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-black transition tap-target-48"
                            aria-label="Close checkout modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Step Indicator */}
                {step !== 3 && (
                    <div className="px-6 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-500">
                        <span className={step >= 1 ? 'text-[#C69722] font-bold' : ''}>1. Delivery Address</span>
                        <span>➔</span>
                        <span className={step >= 2 ? 'text-[#C69722] font-bold' : ''}>2. Payment & Coupon</span>
                        <span>➔</span>
                        <span>3. Confirmation</span>
                    </div>
                )}

                {/* Step 1: Address Form */}
                {step === 1 && (
                    <form onSubmit={handleAddressSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto safe-bottom-pad">
                        {addressError && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>{addressError}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="checkout-fullname" className="block text-xs font-bold text-[#161616] mb-1">Full Name *</label>
                                <input
                                    id="checkout-fullname"
                                    name="name"
                                    autoComplete="name"
                                    type="text"
                                    required
                                    value={shipping.fullName}
                                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                                    placeholder="e.g. Ramesh Sharma"
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                />
                            </div>
                            <div>
                                <label htmlFor="checkout-phone" className="block text-xs font-bold text-[#161616] mb-1">Mobile Number (+91) *</label>
                                <input
                                    id="checkout-phone"
                                    name="phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    required
                                    maxLength="10"
                                    value={shipping.phone}
                                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value.replace(/\D/g, '') })}
                                    placeholder="10-digit phone number"
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="checkout-email" className="block text-xs font-bold text-[#161616] mb-1">Email (for Order Tracking) *</label>
                            <input
                                id="checkout-email"
                                name="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                required
                                value={shipping.email}
                                onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                                placeholder="name@domain.com"
                                className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                            />
                        </div>

                        <div>
                            <label htmlFor="checkout-address" className="block text-xs font-bold text-[#161616] mb-1">Flat / House No. & Street Address *</label>
                            <input
                                id="checkout-address"
                                name="address"
                                type="text"
                                autoComplete="street-address"
                                required
                                value={shipping.address}
                                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                                placeholder="House No, Apartment, Street, Landmark"
                                className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label htmlFor="checkout-city" className="block text-xs font-bold text-[#161616] mb-1">City *</label>
                                <input
                                    id="checkout-city"
                                    name="city"
                                    type="text"
                                    autoComplete="address-level2"
                                    required
                                    value={shipping.city}
                                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                    placeholder="City"
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                />
                            </div>
                            <div>
                                <label htmlFor="checkout-state" className="block text-xs font-bold text-[#161616] mb-1">State *</label>
                                <select
                                    id="checkout-state"
                                    name="state"
                                    autoComplete="address-level1"
                                    value={shipping.state}
                                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs bg-white focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                >
                                    {['Rajasthan', 'Delhi', 'Maharashtra', 'Uttar Pradesh', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Punjab', 'Madhya Pradesh', 'Telangana'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="checkout-pincode" className="block text-xs font-bold text-[#161616] mb-1">PIN Code *</label>
                                <input
                                    id="checkout-pincode"
                                    name="pincode"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="postal-code"
                                    required
                                    maxLength="6"
                                    value={shipping.pincode}
                                    onChange={(e) => setShipping({ ...shipping, pincode: e.target.value.replace(/\D/g, '') })}
                                    placeholder="6 Digits"
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="checkout-notes" className="block text-xs font-bold text-[#161616] mb-1">Mandir Dedication / Delivery Notes (Optional)</label>
                            <input
                                id="checkout-notes"
                                name="notes"
                                type="text"
                                value={shipping.notes}
                                onChange={(e) => setShipping({ ...shipping, notes: e.target.value })}
                                placeholder="e.g. Consecration for Griha Pravesh on Friday"
                                className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                            />
                        </div>

                        <div className="pt-3">
                            <button
                                type="submit"
                                className="w-full min-h-[50px] py-4 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold tracking-wider uppercase transition shadow-lg tap-target-48 active:scale-98"
                            >
                                CONTINUE TO PAYMENT ➔
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 2: Payment & Review */}
                {step === 2 && (
                    <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                        {/* Order Summary Preview */}
                        <div className="bg-[#FAF5E8]/60 p-4 rounded-2xl border border-[#E6D6B8] space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-[#161616] border-b border-[#E6D6B8] pb-2">
                                <span>Items in Order ({cart.length})</span>
                                <span>Total: ₹{cartTotal.toLocaleString('en-IN')}.00</span>
                            </div>
                            <div className="max-h-36 overflow-y-auto space-y-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-xs text-stone-700">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-md bg-white border border-stone-200 text-center text-[10px] font-bold leading-5">{item.qty}x</span>
                                            <span className="line-clamp-1 max-w-xs">{item.title}</span>
                                        </div>
                                        <span className="font-semibold">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Coupon Code Section */}
                        <div className="border border-stone-200 p-3.5 rounded-2xl bg-white space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-[#161616]">
                                <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#C69722]" /> Have a Coupon Code?</span>
                                {appliedCoupon && (
                                    <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded text-[11px]">
                                        {appliedCoupon.code} ({appliedCoupon.discountPercent}% OFF) Active!
                                    </span>
                                )}
                            </div>
                            {appliedCoupon ? (
                                <div className="flex items-center justify-between text-xs bg-green-50 text-green-800 p-3 rounded-xl border border-green-200">
                                    <span>Discount Applied: 15% OFF on total!</span>
                                    <button type="button" onClick={onRemoveCoupon} className="min-h-[44px] px-3 text-red-600 font-bold hover:underline tap-target-48">Remove</button>
                                </div>
                            ) : (
                                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                    <input
                                        id="checkout-coupon-input"
                                        name="coupon"
                                        type="text"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value)}
                                        placeholder="Enter DIVINE15"
                                        className="flex-1 px-3.5 py-3 text-base sm:text-xs border border-stone-300 rounded-xl focus:outline-none uppercase min-h-[48px]"
                                    />
                                    <button
                                        type="submit"
                                        className="min-h-[48px] px-5 bg-[#161616] text-[#F7C600] text-xs font-bold rounded-xl hover:bg-black transition tap-target-48"
                                    >
                                        Apply
                                    </button>
                                </form>
                            )}
                            {couponError && <p className="text-[11px] text-red-600 font-medium">{couponError}</p>}
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-[#161616] tracking-wider uppercase block">
                                Select Payment Method:
                            </label>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cod')}
                                className={`w-full p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition min-h-[56px] text-left tap-target-48 ${paymentMethod === 'cod' ? 'border-[#C69722] bg-[#FAF5E8]' : 'border-stone-200 hover:border-stone-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-green-700">
                                        <Banknote className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-[#161616]">Cash on Delivery (COD)</h4>
                                        <p className="text-[11px] text-stone-500">Pay when your sanctified idol arrives at doorstep</p>
                                    </div>
                                </div>
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#C69722] bg-[#C69722]' : 'border-stone-300'}`}>
                                    {paymentMethod === 'cod' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('upi')}
                                className={`w-full p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition min-h-[56px] text-left tap-target-48 ${paymentMethod === 'upi' ? 'border-[#C69722] bg-[#FAF5E8]' : 'border-stone-200 hover:border-stone-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-[#C69722]">
                                        <QrCode className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-[#161616]">Instant UPI (Google Pay / PhonePe / Paytm)</h4>
                                        <p className="text-[11px] text-stone-500">Scan QR or enter UPI ID for instantaneous confirmation</p>
                                    </div>
                                </div>
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'upi' ? 'border-[#C69722] bg-[#C69722]' : 'border-stone-300'}`}>
                                    {paymentMethod === 'upi' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('card')}
                                className={`w-full p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition min-h-[56px] text-left tap-target-48 ${paymentMethod === 'card' ? 'border-[#C69722] bg-[#FAF5E8]' : 'border-stone-200 hover:border-stone-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-blue-700">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-[#161616]">Credit / Debit Card & NetBanking</h4>
                                        <p className="text-[11px] text-stone-500">Visa, MasterCard, RuPay & All Major Indian Banks</p>
                                    </div>
                                </div>
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-[#C69722] bg-[#C69722]' : 'border-stone-300'}`}>
                                    {paymentMethod === 'card' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </span>
                            </button>
                        </div>

                        {/* Error Feedback if Server Rejection occurs */}
                        {orderErrorMessage && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span>{orderErrorMessage}</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isSubmittingOrder}
                                onClick={() => setStep(1)}
                                className="min-h-[50px] px-5 py-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold uppercase hover:bg-stone-50 tap-target-48 disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                disabled={isSubmittingOrder}
                                onClick={handlePlaceOrder}
                                className="flex-1 min-h-[50px] py-3.5 rounded-xl bg-[#F7C600] hover:bg-[#E2B400] text-[#161616] text-xs font-bold tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 tap-target-48 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmittingOrder ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-[#161616]" />
                                        <span>AUTHORITATIVELY VERIFYING & PLACING...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>CONFIRM & PLACE SACRED ORDER (₹{cartTotal.toLocaleString('en-IN')})</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Direct WhatsApp Redirection Indicator */}
                {step === 3 && (
                    <div className="p-8 sm:p-12 text-center space-y-5">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-pulse shadow-md">
                            <svg className="w-8 h-8 fill-current text-[#25D366]" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C69722]">Order Confirmed</span>
                            <h3 className="font-serif text-xl font-bold text-stone-900">Redirecting to WhatsApp...</h3>
                            <p className="text-xs text-stone-600 max-w-sm mx-auto">
                                Connecting you directly to the priest concierge at Amol Marble Murti Bhandar with your order details.
                            </p>
                        </div>
                        {orderInfo && (
                            <a
                                href={getWhatsAppOrderUrl(orderInfo, whatsappNumber)}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider shadow-md transition active:scale-98 tap-target-48 mx-auto"
                            >
                                <span>CLICK IF NOT REDIRECTED</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
