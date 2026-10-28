import React from 'react';
import { X, ShieldCheck, Truck, RotateCcw, Phone, Mail, MapPin, Award } from 'lucide-react';

export default function InfoModal({ contentKey, onClose }) {
    if (!contentKey) return null;

    const modalData = {
        'shipping': {
            title: 'Pan-India Insured Shipping Policy',
            icon: Truck,
            tag: 'FREE EXPRESS DELIVERY ON ALL ORDERS',
            body: (
                <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    <p>
                        Every Amol Marble Murti Bhandar idol is treated as sacred art and packaged in our signature <strong>7-Layer Cushioned Wooden Crate</strong>. This engineered shockproof casing ensures that your consecrated marble idol arrives in pristine condition with <strong>Zero-Breakage Guarantee</strong>.
                    </p>
                    <div className="p-4 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] space-y-2">
                        <h4 className="font-bold text-[#161616]">Delivery Timelines:</h4>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Metro Cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad): <strong>2 to 4 Business Days</strong></li>
                            <li>Tier 2 & 3 Cities across India: <strong>3 to 5 Business Days</strong></li>
                            <li>Remote & Hill Stations: <strong>5 to 7 Business Days</strong></li>
                        </ul>
                    </div>
                    <p>
                        Shipping is 100% complimentary across all 19,000+ Indian PIN codes. You will receive an SMS and WhatsApp message with live tracking as soon as your wooden crate departs our Jaipur atelier.
                    </p>
                </div>
            )
        },
        'returns': {
            title: '7-Day Sacred Return & Exchange Policy',
            icon: RotateCcw,
            tag: 'HASSLE-FREE VERIFICATION',
            body: (
                <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    <p>
                        We stand behind the spiritual authenticity and structural perfection of every idol. If your idol arrives damaged or does not align with your altar expectations, you can request an exchange or 100% refund within <strong>7 days of delivery</strong>.
                    </p>
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                        <h4 className="font-bold text-[#161616]">Easy Exchange Process:</h4>
                        <ol className="list-decimal pl-4 space-y-1">
                            <li>Message our concierge on WhatsApp (+91 98765 43210) or email support@amolmurtibhandar.com with a photo of the idol and packaging.</li>
                            <li>Our team will arrange complimentary reverse pickup from your doorstep within 24 hours.</li>
                            <li>A brand new consecrated replacement or instant refund to your original payment method will be issued upon pickup.</li>
                        </ol>
                    </div>
                </div>
            )
        },
        'contact': {
            title: 'Contact Amol Murti Concierge',
            icon: Phone,
            tag: 'JAIPUR SHOWROOM & SUPPORT',
            body: (
                <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    <p>
                        Our temple art curators and customer support advisors are available 7 days a week (9:00 AM – 9:00 PM IST) to assist with idol selections, custom temple carvings, and order inquiries.
                    </p>
                    <div className="space-y-3 pt-2">
                        <div className="p-3.5 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center gap-3">
                            <Phone className="w-5 h-5 text-[#C69722]" />
                            <div>
                                <span className="text-[11px] text-stone-500 block">Phone Support</span>
                                <strong className="text-black">+91 98765 43210 / +91 141 2893450</strong>
                            </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center gap-3">
                            <Mail className="w-5 h-5 text-[#C69722]" />
                            <div>
                                <span className="text-[11px] text-stone-500 block">Email Support</span>
                                <strong className="text-black">care@amolmurtibhandar.com / concierge@amolmurtibhandar.com</strong>
                            </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#FAF5E8] border border-[#E6D6B8] flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-[#C69722]" />
                            <div>
                                <span className="text-[11px] text-stone-500 block">Flagship Atelier & Showroom</span>
                                <strong className="text-black">Amol Marble Murti Bhandar Heritage Studio, MI Road, Opp. Temple Gate, Jaipur, Rajasthan 302001</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        'terms': {
            title: 'Terms of Service',
            icon: ShieldCheck,
            tag: 'AUTHENTICITY & TRADITION',
            body: (
                <div className="space-y-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    <p>
                        All sacred idols sold by Amol Marble Murti Bhandar are handcrafted by hereditary sculptors utilizing genuine white marble from Makrana quarries, high-grade brass, and sacred cultured stone.
                    </p>
                    <p>
                        Due to the artisanal hand-chiseled nature of each statue, slight variations in natural stone veining, gemstone accents, and subtle painting details are hallmarks of individual handmade devotion and authenticity.
                    </p>
                    <p>
                        Prices, specifications, and special festival offers are subject to seasonal calendar adjustments in accordance with Hindu festival dates and auspicious muhurats.
                    </p>
                </div>
            )
        },
        'privacy': {
            title: 'Privacy & Sacred Data Policy',
            icon: ShieldCheck,
            tag: '256-BIT ENCRYPTION',
            body: (
                <div className="space-y-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    <p>
                        At Amol Marble Murti Bhandar, we safeguard your personal data with enterprise-grade 256-bit SSL encryption. We never sell, lease, or distribute your name, delivery address, or contact details to third-party telemarketers.
                    </p>
                    <p>
                        Your contact information is strictly utilized to send dispatch notifications, transit tracking links, and sacred festival blessings or discount updates.
                    </p>
                </div>
            )
        }
    };

    const data = modalData[contentKey] || modalData['shipping'];
    const IconComponent = data.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E6D6B8] animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-[#E6D6B8] bg-[#FAF5E8] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E6D6B8] flex items-center justify-center text-[#C69722]">
                            <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C69722]">✦ {data.tag} ✦</span>
                            <h3 className="font-serif text-xl font-bold text-[#161616]">{data.title}</h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-black transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 max-h-[75vh] overflow-y-auto">
                    {data.body}

                    <div className="mt-6 pt-4 border-t border-stone-200 text-right">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold uppercase transition"
                        >
                            Understood
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
