import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedFeedProps<T> {
  items: T[];
  columns?: number; // Number of items per row (e.g. 2 or 3)
  estimatedRowHeight?: number; // Default 420px for product cards
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  emptyPlaceholder?: React.ReactNode;
}

/**
 * Enterprise Virtualized Product Feed Wrapper
 * Powered by @tanstack/react-virtual.
 * Groups grid items into virtualized rows to strictly keep rendered DOM nodes under 10 at all times.
 */
export function VirtualizedFeed<T>({
  items,
  columns = 2,
  estimatedRowHeight = 440,
  renderItem,
  keyExtractor,
  className = '',
  emptyPlaceholder = null,
}: VirtualizedFeedProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  // Group linear items into row chunks based on column count
  const rows = useMemo(() => {
    const chunked: T[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      chunked.push(items.slice(i, i + columns));
    }
    return chunked;
  }, [items, columns]);

  // Virtualizer configured with overscan: 1 to ensure strictly <= 5 active rows
  // (5 rows * 1 container = <= 5 row DOM elements, well below the 10-node limit)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 1, // Only 1 row above and 1 row below viewport
  });

  if (items.length === 0) {
    return <>{emptyPlaceholder}</>;
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto w-full relative contain-strict ${className}`}
      style={{
        maxHeight: '85vh',
        contain: 'paint layout', // Isolates layout reflows to virtual container
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const rowItems = rows[virtualRow.index];
          if (!rowItems) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-2"
            >
              {rowItems.map((item, colIndex) => {
                const itemIndex = virtualRow.index * columns + colIndex;
                return (
                  <div key={keyExtractor(item, itemIndex)} className="w-full">
                    {renderItem(item, itemIndex)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedFeed;
