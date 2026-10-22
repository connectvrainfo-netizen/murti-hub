import React, { useEffect } from 'react';
import useNetworkAware from '../hooks/useNetworkAware';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width: number;
  height: number;
  avifSrc?: string;
  webpSrc?: string;
  lowResSrc?: string;
  isLCP?: boolean; // If true, applies high priority preload and eager loading
  aspectRatio?: string; // e.g. "1/1", "16/9"
  className?: string;
}

/**
 * Enterprise Media Pipeline Component
 * - Enforces AVIF/WebP formats with fallback
 * - Dynamically downgrades resolution on slow network (3G/Save-Data)
 * - Guarantees CLS = 0 through explicit aspect ratio sizing
 * - Preloads LCP hero image with fetchpriority="high"
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  avifSrc,
  webpSrc,
  lowResSrc,
  isLCP = false,
  aspectRatio,
  className = '',
  ...rest
}) => {
  const { isSlowConnection, recommendedImageQuality } = useNetworkAware();

  // If slow network or Save-Data is active, use low-res fallback if available
  const resolvedSrc = isSlowConnection && lowResSrc ? lowResSrc : src;

  // LCP Hero Preload Injection
  useEffect(() => {
    if (!isLCP || typeof document === 'undefined') return;

    // Check if link already exists
    const existing = document.querySelector(`link[rel="preload"][href="${src}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = avifSrc || webpSrc || src;
    link.setAttribute('fetchpriority', 'high');

    if (avifSrc) {
      link.type = 'image/avif';
    } else if (webpSrc) {
      link.type = 'image/webp';
    }

    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [isLCP, src, avifSrc, webpSrc]);

  return (
    <div
      className="relative overflow-hidden inline-block w-full"
      style={{
        aspectRatio: aspectRatio || `${width} / ${height}`,
        backgroundColor: '#F9F1DF', // Low-contrast placeholder color matching brand
      }}
    >
      <picture>
        {/* AVIF next-gen format for highest compression efficiency */}
        {avifSrc && recommendedImageQuality !== 'low' && (
          <source srcSet={avifSrc} type="image/avif" />
        )}

        {/* WebP modern standard format */}
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}

        {/* Fallback image with explicit dimensions and priority */}
        <img
          src={resolvedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={isLCP ? 'eager' : 'lazy'}
          decoding={isLCP ? 'sync' : 'async'}
          // @ts-expect-error fetchpriority is standard in modern HTML
          fetchpriority={isLCP ? 'high' : 'auto'}
          className={`w-full h-full object-cover transition-opacity duration-300 ${className}`}
          {...rest}
        />
      </picture>
    </div>
  );
};

export default OptimizedImage;
