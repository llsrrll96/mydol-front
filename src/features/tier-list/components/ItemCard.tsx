import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { TierItem } from '../types';

interface ItemCardProps extends React.HTMLAttributes<HTMLDivElement> {
  item: TierItem;
  /** Visual state while being dragged. */
  isDragging?: boolean;
  /** Rendered inside the floating DragOverlay (adds depth + tilt). */
  isOverlay?: boolean;
  /** Keep the idol name visible without requiring hover. */
  alwaysShowName?: boolean;
}

/**
 * Presentational idol card. Stateless so it can be reused by the sortable
 * wrapper and by the floating <DragOverlay/> during a drag.
 */
export const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(
  ({ item, isDragging, isOverlay, alwaysShowName, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          'group relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0',
          'bg-white/5 ring-1 ring-white/10 select-none touch-none cursor-grab active:cursor-grabbing',
          'transition-shadow',
          isDragging && 'opacity-40',
          isOverlay &&
            'cursor-grabbing rotate-3 scale-110 shadow-[0_20px_45px_-12px_rgba(236,72,153,0.7)] ring-2 ring-pink-400/70',
          className
        )}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          draggable={false}
          crossOrigin="anonymous"
          className="w-full h-full object-cover pointer-events-none"
        />
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1 pt-3 pb-1 transition-opacity',
            alwaysShowName ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <span className="block text-[10px] leading-tight font-bold text-white truncate">
            {item.name}
          </span>
        </div>
      </div>
    );
  }
);

ItemCard.displayName = 'ItemCard';
