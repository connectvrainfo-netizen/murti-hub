import React, { useState } from 'react';
import { X, MessageCircle, MapPin, Info } from 'lucide-react';

export default function InquiryModal({ product, onClose, onSubmit }) {
    if (!product) return null;

    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        pincode: ''
    });

    const priceNum = typeof product.price === 'string'
        ? parseInt(product.price.replace(/[^\d]/g, ''), 10) || 999
        : product.price;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E6D6B8] my-auto">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[#E6D6B8] bg-[#FAF5E8] rounded-t-3xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-stone-200 flex-shrink-0">
                            <img src={product.img} alt={product.title} className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#C69722]">WHATSAPP INQUIRY</span>
                            <h3 className="font-serif text-sm font-bold text-[#161616] truncate">{product.title}</h3>
                            <p className="text-xs font-semibold text-[#8E5B00]">₹{priceNum.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-black transition tap-target-48 flex-shrink-0"
                        aria-label="Close inquiry form"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-4 sm:p-5 space-y-3 text-xs">
                        <p className="text-stone-500 leading-relaxed text-[11px]">
                            Share your details and we'll send this idol's info & delivery availability on WhatsApp.
                        </p>

                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] text-[10.5px] text-stone-600 leading-relaxed">
                            <Info className="w-3.5 h-3.5 text-[#C69722] flex-shrink-0 mt-0.5" />
                            <span>
                                <strong className="text-[#161616]">Note:</strong> each idol is hand-carved & hand-painted, so the piece you receive may have minor natural variations — or it may match the image closely. This is normal for handmade sacred art.
                            </span>
                        </div>

                        <div>
                            <label htmlFor="inquiry-name" className="block font-bold text-[#161616] mb-1">Full Name *</label>
                            <input
                                id="inquiry-name" name="name" type="text" autoComplete="name" required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Enter Your Full Name"
                                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-[#C69722] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="inquiry-phone" className="block font-bold text-[#161616] mb-1">Phone Number (+91) *</label>
                            <input
                                id="inquiry-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength="10"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                                placeholder="10-digit mobile number"
                                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-[#C69722] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="inquiry-address" className="block font-bold text-[#161616] mb-1">Delivery Address *</label>
                            <textarea
                                id="inquiry-address" name="address" rows="2" autoComplete="street-address" required
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                placeholder="House no., street, locality, city, state"
                                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-[#C69722] focus:outline-none"
                            ></textarea>
                        </div>

                        <div>
                            <label htmlFor="inquiry-pincode" className="block font-bold text-[#161616] mb-1">Pincode *</label>
                            <input
                                id="inquiry-pincode" name="pincode" type="text" inputMode="numeric" autoComplete="postal-code" required maxLength="6"
                                value={form.pincode}
                                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                                placeholder="6-digit pincode"
                                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-[#C69722] focus:outline-none"
                            />
                            <p className="flex items-center gap-1 text-[10px] text-stone-400 mt-1">
                                <MapPin className="w-3 h-3" /> For delivery timeline estimates.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-3 border-t border-[#E6D6B8] bg-[#FAF5E8] rounded-b-3xl">
                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold tracking-wider uppercase transition shadow-lg tap-target-48 active:scale-98 flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            SEND INQUIRY ON WHATSAPP
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
