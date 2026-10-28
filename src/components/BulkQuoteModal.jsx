import React, { useState } from 'react';
import { X, CheckCircle2, Gift, Sparkles, Building2, Phone, Mail } from 'lucide-react';

export default function BulkQuoteModal({ isOpen, onClose, onQuoteSubmitted }) {
    if (!isOpen) return null;

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [form, setForm] = useState({
        company: '',
        contactName: '',
        phone: '',
        email: '',
        quantity: '50-100 pieces',
        occasion: 'Diwali Corporate Gifting',
        customEngraving: true,
        notes: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (onQuoteSubmitted) onQuoteSubmitted(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E6D6B8] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-[#E6D6B8] bg-[#FAF5E8] flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C69722]">✦ CORPORATE & TEMPLE CONCIERGE ✦</span>
                        <h3 className="font-serif text-xl font-bold text-[#161616]">Request Bulk & Corporate Quote</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-11 h-11 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-black transition tap-target-48"
                        aria-label="Close bulk quote modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs safe-bottom-pad">
                        <p className="text-stone-500 leading-relaxed">
                            Custom hand-carved marble idols with personalized brass plaque engraving, festive gift packaging, and direct multi-city shipping.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="bulk-company" className="block font-bold text-[#161616] mb-1">Company / Organization *</label>
                                <input
                                    id="bulk-company"
                                    name="company"
                                    autoComplete="organization"
                                    type="text"
                                    required
                                    value={form.company}
                                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                                    placeholder="e.g. Tata Consultancy Services"
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                />
                            </div>
                            <div>
                                <label htmlFor="bulk-contact-name" className="block font-bold text-[#161616] mb-1">Contact Person Name *</label>
                                <input
                                    id="bulk-contact-name"
                                    name="contactName"
                                    autoComplete="name"
                                    type="text"
                                    required
                                    value={form.contactName}
                                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                                    placeholder="e.g. Anjali Sharma"
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="bulk-phone" className="block font-bold text-[#161616] mb-1">Phone Number (+91) *</label>
                                <input
                                    id="bulk-phone"
                                    name="phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    required
                                    maxLength="10"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                                    placeholder="10-digit mobile"
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                />
                            </div>
                            <div>
                                <label htmlFor="bulk-email" className="block font-bold text-[#161616] mb-1">Corporate Email *</label>
                                <input
                                    id="bulk-email"
                                    name="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="contact@company.com"
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="bulk-quantity" className="block font-bold text-[#161616] mb-1">Estimated Quantity *</label>
                                <select
                                    id="bulk-quantity"
                                    name="quantity"
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs bg-white focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                >
                                    <option value="25-50 pieces">25 - 50 pieces (15% bulk off)</option>
                                    <option value="50-100 pieces">50 - 100 pieces (25% bulk off)</option>
                                    <option value="100-250 pieces">100 - 250 pieces (35% bulk off)</option>
                                    <option value="250-500 pieces">250 - 500 pieces (40% bulk off)</option>
                                    <option value="500+ pieces">500+ pieces (Custom tier)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="bulk-occasion" className="block font-bold text-[#161616] mb-1">Gifting Occasion *</label>
                                <select
                                    id="bulk-occasion"
                                    name="occasion"
                                    value={form.occasion}
                                    onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                                    className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs bg-white focus:border-[#C69722] focus:outline-none min-h-[48px]"
                                >
                                    <option value="Diwali Corporate Gifting">Diwali Corporate Gifting</option>
                                    <option value="New Office Inauguration">New Office Mandir Inauguration</option>
                                    <option value="Annual Employee Recognition">Annual Employee Recognition</option>
                                    <option value="Executive Client Gifting">Executive Client Welcome</option>
                                    <option value="Wedding Return Gifts">Wedding / Religious Function</option>
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1 min-h-[44px]">
                            <input
                                type="checkbox"
                                checked={form.customEngraving}
                                onChange={(e) => setForm({ ...form, customEngraving: e.target.checked })}
                                className="w-5 h-5 rounded text-[#C69722] focus:ring-[#C69722]"
                            />
                            <span className="font-semibold text-stone-700">Include customized company brass logo engraving & premium gift boxes</span>
                        </label>

                        <div>
                            <label htmlFor="bulk-notes" className="block font-bold text-[#161616] mb-1">Additional Requirements / Preferred Idols</label>
                            <textarea
                                id="bulk-notes"
                                name="notes"
                                rows="3"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="e.g. Prefer Bal Ganesha and Ram Darbar idols in 9 cm size with gold finish."
                                className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none"
                            ></textarea>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full min-h-[50px] py-4 rounded-xl bg-[#C69722] hover:bg-[#A67B14] text-white text-xs font-bold tracking-wider uppercase transition shadow-lg tap-target-48 active:scale-98"
                            >
                                SUBMIT QUOTE REQUEST ➔
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-8 text-center space-y-5">
                        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 mx-auto flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h4 className="font-serif text-2xl font-bold text-[#161616]">Quote Request Received!</h4>
                        <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                            Thank you, <strong className="text-black">{form.contactName}</strong> from <strong className="text-black">{form.company}</strong>. Our dedicated bulk gifting concierge will prepare your tiered quotation and contact you at <strong className="text-black">+91 {form.phone}</strong> within 2 business hours.
                        </p>
                        <button
                            onClick={onClose}
                            className="min-h-[48px] px-8 py-3 rounded-xl bg-[#161616] text-white text-xs font-bold uppercase transition hover:bg-stone-800 tap-target-48 active:scale-98"
                        >
                            CLOSE
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
