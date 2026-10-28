import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, CreditCard, Banknote, QrCode, Tag, ArrowRight, Sparkles } from 'lucide-react';

export default function CheckoutModal({
    isOpen,
    onClose,
    cart,
    cartTotal,
    onOrderPlaced,
    appliedCoupon,
    onApplyCoupon,
    onRemoveCoupon,
    onOpenTracking
}) {
    if (!isOpen) return null;

    const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Success
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');

    const [shipping, setShipping] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: 'Rajasthan',
        pincode: '',
        notes: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'upi' | 'card'
    const [orderInfo, setOrderInfo] = useState(null);

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
        if (!shipping.fullName || !shipping.phone || !shipping.address || !shipping.pincode) {
            alert('Please fill all required delivery details.');
            return;
        }
        setStep(2);
    };

    const handlePlaceOrder = () => {
        const generatedOrderId = `MH-${Math.floor(100000 + Math.random() * 900000)}`;
        const orderData = {
            orderId: generatedOrderId,
            items: [...cart],
            total: cartTotal,
            shipping,
            paymentMethod,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        };
        setOrderInfo(orderData);
        onOrderPlaced(orderData);
        setStep(3);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E6D6B8] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-[#E6D6B8] bg-[#FAF5E8] flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C69722]">✦ SACRED SANCTUARY CHECKOUT ✦</span>
                        <h3 className="font-serif text-xl font-bold text-[#161616]">
                            {step === 1 && 'Delivery Address & Contact'}
                            {step === 2 && 'Payment & Review Order'}
                            {step === 3 && 'Order Placed Successfully!'}
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

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="min-h-[50px] px-5 py-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold uppercase hover:bg-stone-50 tap-target-48"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handlePlaceOrder}
                                className="flex-1 min-h-[50px] py-3.5 rounded-xl bg-[#F7C600] hover:bg-[#E2B400] text-[#161616] text-xs font-bold tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 tap-target-48 active:scale-98"
                            >
                                <Sparkles className="w-4 h-4" /> CONFIRM & PLACE SACRED ORDER (₹{cartTotal.toLocaleString('en-IN')})
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Success Confirmation Screen */}
                {step === 3 && orderInfo && (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 mx-auto flex items-center justify-center shadow-inner animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#C69722]">✦ JAI SHREE RAM • HAR HAR MAHADEV ✦</span>
                            <h2 className="font-serif text-3xl font-bold text-[#161616]">Order Placed with Blessings!</h2>
                            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                                Thank you, <strong className="text-black">{orderInfo.shipping.fullName}</strong>. Your sacred idol order is confirmed and scheduled for consecration & insulated wooden-crate packaging.
                            </p>
                        </div>

                        <div className="bg-[#FAF5E8] p-5 rounded-2xl border border-[#E6D6B8] max-w-md mx-auto text-left space-y-2 text-xs">
                            <div className="flex justify-between border-b border-[#E6D6B8]/70 pb-2">
                                <span className="text-stone-500">Order ID:</span>
                                <span className="font-mono font-bold text-[#161616]">{orderInfo.orderId}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#E6D6B8]/70 pb-2">
                                <span className="text-stone-500">Estimated Delivery:</span>
                                <span className="font-semibold text-green-800">3-5 Business Days (Express Insured)</span>
                            </div>
                            <div className="flex justify-between border-b border-[#E6D6B8]/70 pb-2">
                                <span className="text-stone-500">Delivery To:</span>
                                <span className="font-semibold text-right max-w-[200px] truncate">{orderInfo.shipping.address}, {orderInfo.shipping.city}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-stone-500">Payment:</span>
                                <span className="font-bold text-[#C69722]">{orderInfo.paymentMethod.toUpperCase()} (₹{orderInfo.total.toLocaleString('en-IN')})</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenTracking(orderInfo.orderId);
                                }}
                                className="min-h-[48px] px-6 py-3.5 rounded-xl bg-[#161616] hover:bg-black text-white text-xs font-bold tracking-wider uppercase transition shadow-md tap-target-48 active:scale-98 flex items-center justify-center"
                            >
                                TRACK THIS ORDER
                            </button>
                            <button
                                onClick={onClose}
                                className="min-h-[48px] px-6 py-3.5 rounded-xl border border-stone-300 hover:border-black text-stone-800 text-xs font-bold tracking-wider uppercase transition tap-target-48 active:scale-98 flex items-center justify-center"
                            >
                                CONTINUE SHOPPING
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
