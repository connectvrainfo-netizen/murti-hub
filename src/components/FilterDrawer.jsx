import React from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';

export default function FilterDrawer({
    isOpen,
    onClose,
    activeDeity,
    onSelectDeity,
    priceRange,
    onSelectPriceRange,
    placement,
    onSelectPlacement,
    availability = 'all',
    onSelectAvailability,
    onResetAll,
    itemsCount
}) {
    if (!isOpen) return null;

    const deities = ['All Deities', 'Hanuman', 'Shiva', 'Krishna', 'Ganesha', 'Ram', 'Durga', 'Gajanan Maharaj', 'Murugan'];
    const priceOptions = [
        { label: 'All Prices', val: 'all' },
        { label: 'Under ₹1,000 (Small & Gifting Idols)', val: 'under-1000' },
        { label: '₹1,000 - ₹2,000 (Home Mandir Sanctum)', val: '1000-2000' },
        { label: 'Above ₹2,000 (Grand Heritage Altars)', val: 'above-2000' }
    ];
    const placements = [
        { label: 'All Placements', val: 'all' },
        { label: 'Home Mandir & Altar', val: 'home-mandir' },
        { label: 'Office Desk & Study Table', val: 'office-desk' }
    ];
    const availabilityOptions = [
        { label: 'All Sanctified Idols', val: 'all' },
        { label: 'In Stock & Ready for Dispatch', val: 'in_stock' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-5 border-b border-[#E6D6B8] bg-[#FAF5E8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#C69722]" />
                        <h3 className="font-serif text-lg font-bold text-[#161616]">Refine Sacred Collection</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-11 h-11 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-black transition tap-target-48"
                        aria-label="Close filters"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters Content */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
                    {/* Filter by Deity */}
                    <div className="space-y-2.5">
                        <label className="font-bold text-[#161616] uppercase tracking-wider block">
                            Deity / Divine Avatar:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {deities.map(d => {
                                const isSelected = (d === 'All Deities' && !activeDeity) || (activeDeity === d);
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => onSelectDeity(d === 'All Deities' ? null : d)}
                                        className={`min-h-[44px] px-4 py-2 rounded-xl border transition tap-target-48 ${isSelected ? 'border-[#C69722] bg-[#161616] text-[#F7C600] font-bold shadow-xs' : 'border-stone-200 text-stone-700 hover:border-stone-400 bg-white'}`}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filter by Price */}
                    <div className="space-y-2.5">
                        <label className="font-bold text-[#161616] uppercase tracking-wider block">
                            Price Range:
                        </label>
                        <div className="space-y-2">
                            {priceOptions.map(opt => (
                                <label
                                    key={opt.val}
                                    onClick={() => onSelectPriceRange(opt.val)}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition min-h-[48px] tap-target-48 ${priceRange === opt.val ? 'border-[#C69722] bg-[#FAF5E8] font-bold text-[#161616]' : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-white'}`}
                                >
                                    <span>{opt.label}</span>
                                    <input
                                        type="radio"
                                        name="priceRange"
                                        checked={priceRange === opt.val}
                                        onChange={() => { }}
                                        className="w-4 h-4 text-[#C69722] focus:ring-[#C69722]"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Filter by Placement */}
                    <div className="space-y-2.5">
                        <label className="font-bold text-[#161616] uppercase tracking-wider block">
                            Placement & Purpose:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {placements.map(pl => {
                                const isSelected = placement === pl.val;
                                return (
                                    <button
                                        key={pl.val}
                                        type="button"
                                        onClick={() => onSelectPlacement(pl.val)}
                                        className={`min-h-[44px] px-4 py-2 rounded-xl border transition tap-target-48 ${isSelected ? 'border-[#C69722] bg-[#161616] text-[#F7C600] font-bold shadow-xs' : 'border-stone-200 text-stone-700 hover:border-stone-400 bg-white'}`}
                                    >
                                        {pl.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filter by Availability */}
                    {onSelectAvailability && (
                        <div className="space-y-2.5">
                            <label className="font-bold text-[#161616] uppercase tracking-wider block">
                                Availability:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availabilityOptions.map(opt => {
                                    const isSelected = availability === opt.val;
                                    return (
                                        <button
                                            key={opt.val}
                                            type="button"
                                            onClick={() => onSelectAvailability(opt.val)}
                                            className={`min-h-[44px] px-4 py-2 rounded-xl border transition tap-target-48 ${isSelected ? 'border-[#C69722] bg-[#161616] text-[#F7C600] font-bold shadow-xs' : 'border-stone-200 text-stone-700 hover:border-stone-400 bg-white'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-stone-200 bg-[#FAF5E8] flex items-center justify-between gap-3 safe-bottom-pad">
                    <button
                        type="button"
                        onClick={onResetAll}
                        className="min-h-[48px] flex items-center gap-1.5 px-4 py-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold uppercase hover:bg-white transition tap-target-48 active:scale-95"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 min-h-[48px] py-3 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold tracking-wider uppercase transition shadow-md tap-target-48 active:scale-98"
                    >
                        Apply Filters ({itemsCount} Idols)
                    </button>
                </div>
            </div>
        </div>
    );
}
