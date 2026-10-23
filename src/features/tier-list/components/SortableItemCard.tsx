import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ItemCard } from './ItemCard';
import { TierItem } from '../types';

interface SortableItemCardProps {
  item: TierItem;
  /** Container id this card lives in (used as sortable data). */
  containerId: string;
  alwaysShowName?: boolean;
  onClick?: () => void;
}

/** A single draggable + sortable idol card inside a tier or the pool. */
export const SortableItemCard = ({
  item,
  containerId,
  alwaysShowName,
  onClick,
}: SortableItemCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { containerId } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ItemCard
      ref={setNodeRef}
      style={style}
      item={item}
      isDragging={isDragging}
      alwaysShowName={alwaysShowName}
      onClick={onClick}
      {...attributes}
      {...listeners}
    />
  );
};
