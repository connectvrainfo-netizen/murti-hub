import React, { useState } from 'react';
import { X, Search, CheckCircle2, Clock, Truck, Package, ShieldCheck, MapPin } from 'lucide-react';

export default function OrderTrackingModal({ isOpen, onClose, initialOrderId = '' }) {
    if (!isOpen) return null;

    const [searchInput, setSearchInput] = useState(initialOrderId || '');
    const [trackingData, setTrackingData] = useState(
        initialOrderId
            ? {
                orderId: initialOrderId,
                status: 'Dispatched via Insured Express',
                expectedDate: '3-4 Business Days',
                courier: 'BlueDart Express Air (AWB: BD9482104IN)',
                steps: [
                    { title: 'Order Confirmed & Sanctification Prayer', desc: 'Vedic mantras chanted by temple priests', done: true, time: 'Oct 14, 10:30 AM' },
                    { title: 'Master Artisan Quality Verification', desc: 'Inspection of pure Makrana marble density & gold detailing', done: true, time: 'Oct 14, 03:45 PM' },
                    { title: '7-Layer Cushioned Wooden Crate Packed', desc: 'Zero-breakage shock-absorbing insulation applied', done: true, time: 'Oct 15, 09:15 AM' },
                    { title: 'In Transit — Express Air Cargo', desc: 'Package cleared sorting hub in Jaipur', done: true, time: 'Oct 15, 12:20 PM' },
                    { title: 'Out for Sacred Doorstep Delivery', desc: 'Expected in 48-72 hours with OTP verification', done: false, time: 'Estimated Oct 18' }
                ]
            }
            : null
    );

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = searchInput.trim().toUpperCase();
        if (!trimmed) return;

        setTrackingData({
            orderId: trimmed.startsWith('MH-') ? trimmed : `MH-${trimmed}`,
            status: 'In Transit — Safe & Insured Delivery',
            expectedDate: '3-5 Business Days',
            courier: 'Delhivery Express Insured (AWB: DEL8392184IN)',
            steps: [
                { title: 'Order Confirmed & Sanctification Prayer', desc: 'Consecration conducted for peaceful mandir vibration', done: true, time: 'Recent' },
                { title: 'Hand-Carved Stone Verification', desc: 'Certified pure Makrana white marble authentic seal', done: true, time: 'Recent' },
                { title: 'Shockproof Wooden Crate Packaging', desc: 'Insulated with 7-layer cushioning against transit impacts', done: true, time: 'In Progress' },
                { title: 'Dispatched via Air Courier Hub', desc: 'Handed over to express logistics partner', done: false, time: 'Expected Tomorrow' },
                { title: 'Doorstep Delivery with Sacred Care', desc: 'Delivered directly to your residence', done: false, time: 'Expected 3-5 days' }
            ]
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E6D6B8] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-[#E6D6B8] bg-[#FAF5E8] flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C69722]">✦ LIVE SACRED DISPATCH ✦</span>
                        <h3 className="font-serif text-xl font-bold text-[#161616]">Track Your Sacred Order</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-11 h-11 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-black transition tap-target-48"
                        aria-label="Close tracking modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto safe-bottom-pad">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                id="tracking-search-input"
                                name="orderId"
                                type="text"
                                inputMode="text"
                                enterKeyHint="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Enter Order ID (e.g. MH-20261)"
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 text-base sm:text-xs focus:border-[#C69722] focus:outline-none min-h-[48px]"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold uppercase transition min-h-[48px] tap-target-48 active:scale-98"
                        >
                            Track
                        </button>
                    </form>

                    {/* Tracking Results */}
                    {trackingData && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div className="bg-[#FAF5E8] p-4 rounded-2xl border border-[#E6D6B8] space-y-1.5 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-500 font-medium">Tracking Order:</span>
                                    <span className="font-mono font-bold text-[#161616]">{trackingData.orderId}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-500 font-medium">Status:</span>
                                    <span className="font-bold text-green-800">{trackingData.status}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-500 font-medium">Courier Partner:</span>
                                    <span className="font-semibold text-stone-800">{trackingData.courier}</span>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                                {trackingData.steps.map((st, i) => (
                                    <div key={i} className="relative flex items-start gap-4 text-xs">
                                        <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center ${st.done ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                                            {st.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className={`font-bold ${st.done ? 'text-[#161616]' : 'text-stone-500'}`}>{st.title}</h4>
                                                <span className="text-[10px] text-stone-400">{st.time}</span>
                                            </div>
                                            <p className="text-[11px] text-stone-500 mt-0.5">{st.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                                <span>Need immediate assistance?</span>
                                <a
                                    href="https://wa.me/919876543210?text=Hello%20Amol%20Marble%20Murti%20Bhandar,%20I%20need%20help%20tracking%20my%20order"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-[#C69722] hover:underline min-h-[44px] inline-flex items-center"
                                >
                                    WhatsApp Support ➔
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
