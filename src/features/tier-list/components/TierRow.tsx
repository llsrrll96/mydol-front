import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { Tier } from '../types';
import { SortableItemCard } from './SortableItemCard';

interface TierRowProps {
  tier: Tier;
  /** Tailwind bg token for the label cell. */
  color: string;
}

/** One tier row that accepts dropped idol cards and keeps them sortable. */
export const TierRow = ({ tier, color }: TierRowProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id });

  return (
    <div ref={setNodeRef} className="flex min-h-[96px] border-b border-white/5 last:border-b-0">
      <div
        className={cn(
          'w-20 md:w-28 flex items-center justify-center text-black font-black text-2xl md:text-3xl shrink-0',
          color
        )}
      >
        {tier.id}
      </div>
      <SortableContext items={tier.items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
        <div
          className={cn(
            'flex-1 p-3 flex flex-wrap gap-2.5 items-center content-center min-h-[96px] transition-colors',
            isOver ? 'bg-pink-500/10 ring-2 ring-inset ring-pink-400/50' : 'bg-black/20'
          )}
        >
          {tier.items.length === 0 && (
            <span className="text-white/15 text-xs italic select-none">여기로 드래그</span>
          )}
          {tier.items.map((item) => (
            <SortableItemCard key={item.id} item={item} containerId={tier.id} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};
