import React, { useState, useEffect } from 'react';

const DEFAULT_FALLBACK = '/images/products/ram-darbar.png';

/**
 * SafeImage
 * Resilient image component that gracefully handles broken URLs, missing uploads,
 * server 404/500 errors, and prevents layout shift (CLS).
 * Maintains fallback in React state so re-renders won't re-trigger broken images.
 */
export default function SafeImage({
    src,
    alt = 'Amol Marble Murti Bhandar Sacred Marble Idol',
    fallbackSrc = DEFAULT_FALLBACK,
    className = '',
    width,
    height,
    loading = 'lazy',
    fetchpriority,
    style,
    onClick,
    ...props
}) {
    // Determine clean initial src
    const cleanSrc = (raw) => {
        if (!raw || typeof raw !== 'string') return fallbackSrc;
        const trimmed = raw.trim();
        if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return fallbackSrc;
        // Known test or broken placeholders
        if (trimmed.includes('ram-lalla-test') || trimmed.includes('test-banner')) {
            return fallbackSrc;
        }
        return trimmed;
    };

    const [currentSrc, setCurrentSrc] = useState(() => cleanSrc(src));
    const [hasFailed, setHasFailed] = useState(false);

    useEffect(() => {
        const next = cleanSrc(src);
        setCurrentSrc(next);
        setHasFailed(false);
    }, [src, fallbackSrc]);

    const handleError = () => {
        if (!hasFailed) {
            setHasFailed(true);
            setCurrentSrc(fallbackSrc);
        }
    };

    return (
        <img
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            fetchpriority={fetchpriority}
            className={className}
            style={style}
            onClick={onClick}
            onError={handleError}
            {...props}
        />
    );
}
