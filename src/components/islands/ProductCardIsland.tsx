import React from 'react';
import AddToCartIsland from './AddToCartIsland';
import PrefetchableLink from '../PrefetchableLink';

export interface ProductCardData {
  id: string;
  title: string;
  slug: string;
  deity: string;
  price: number;
  old_price?: number;
  off_text?: string;
  primary_catalog_image: string;
  material?: string;
  static_rating_value?: number;
}

interface ProductCardIslandProps {
  product: ProductCardData;
  onSelect?: (product: ProductCardData) => void;
}

/**
 * Server Component / Static Shell Pattern: ProductCard
 * Non-interactive elements (image, badges, prices, typography) are 100% static HTML.
 * The interactive "Add to Cart" button is isolated in its own hydrated island.
 */
export const ProductCardIsland: React.FC<ProductCardIslandProps> = ({
  product,
  onSelect,
}) => {
  return (
    <div className="group relative flex flex-col bg-mh-cream rounded-2xl border border-mh-border/70 p-3.5 shadow-sm hover:shadow-md transition-all duration-300">
      {/* 1. Static Media Shell with link wrapper */}
      <PrefetchableLink
        href={`/product/${product.slug || product.id}`}
        onClick={(e) => {
          if (onSelect) {
            e.preventDefault();
            onSelect(product);
          }
        }}
        className="block relative aspect-square w-full rounded-xl overflow-hidden bg-white/70"
      >
        <img
          src={product.primary_catalog_image}
          alt={product.title}
          loading="lazy"
          decoding="async"
          width={320}
          height={320}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 will-change-transform"
        />

        {product.off_text && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white rounded-full shadow-sm">
            {product.off_text}
          </span>
        )}

        {product.deity && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-medium bg-mh-dark/80 text-mh-goldLight backdrop-blur-sm rounded-md">
            {product.deity}
          </span>
        )}
      </PrefetchableLink>

      {/* 2. Static Typography & Price Layout */}
      <div className="flex flex-col flex-1 mt-3">
        <h3 className="font-serif text-sm font-semibold text-mh-dark line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.title}
        </h3>

        {product.material && (
          <p className="text-[11px] text-mh-goldOlive mt-0.5 font-medium line-clamp-1">
            {product.material}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-mh-dark">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.old_price && (
            <span className="text-xs text-stone-400 line-through">
              ₹{product.old_price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* 3. Hydrated Interactive Island: Only this sub-tree mounts React event listeners */}
        <div className="mt-auto pt-2">
          <AddToCartIsland
            productId={product.id}
            title={product.title}
            price={product.price}
            primaryImage={product.primary_catalog_image}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCardIsland;
