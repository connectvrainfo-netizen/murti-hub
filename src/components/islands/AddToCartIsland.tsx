'use client';
import React, { useState, useTransition } from 'react';
import { ShoppingBag, Check, Loader2 } from 'lucide-react';

interface AddToCartIslandProps {
  productId: string;
  title: string;
  price: number;
  primaryImage: string;
  initialQuantity?: number;
  onAdded?: (quantity: number) => void;
}

/**
 * Client Island: AddToCart
 * Highly optimized, isolated interactive micro-bundle.
 * Hydrates only when the user scrolls near or hovers, keeping the parent static tree 100% lightweight.
 */
export const AddToCartIsland: React.FC<AddToCartIslandProps> = ({
  productId,
  title,
  price,
  primaryImage,
  initialQuantity = 1,
  onAdded,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      // Dynamic import of indexedDBStorage or cart store to keep initial bundle tiny
      const { indexedDBCache } = await import('../../utils/indexedDBStorage');

      await indexedDBCache.upsertCartItem({
        id: `cart_${productId}`,
        murtiId: productId,
        title,
        price,
        quantity,
        primaryImage,
        updatedAt: Date.now(),
      });

      setIsSuccess(true);
      onAdded?.(quantity);

      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    });
  };

  return (
    <div className="flex items-center gap-2 mt-3 w-full">
      <div className="flex items-center border border-mh-border/80 rounded-lg bg-mh-cream/60 overflow-hidden text-xs">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setQuantity((q) => Math.max(1, q - 1));
          }}
          className="px-2 py-1.5 hover:bg-mh-gold/10 transition-colors text-mh-dark active:scale-95"
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className="px-2.5 font-semibold text-mh-dark min-w-[20px] text-center">
          {quantity}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setQuantity((q) => q + 1);
          }}
          className="px-2 py-1.5 hover:bg-mh-gold/10 transition-colors text-mh-dark active:scale-95"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={handleAddToCart}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 shadow-sm ${
          isSuccess
            ? 'bg-emerald-600 text-white'
            : 'bg-mh-dark text-mh-goldLight hover:bg-mh-gold hover:text-mh-dark active:scale-[0.98]'
        }`}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isSuccess ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Added</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </>
        )}
      </button>
    </div>
  );
};

export default AddToCartIsland;
