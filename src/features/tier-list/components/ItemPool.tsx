import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { POOL_ID } from '../hooks/useTierList';
import { TierItem } from '../types';
import { SortableItemCard } from './SortableItemCard';

interface ItemPoolProps {
  items: TierItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

/** The unranked idol pool — source area for drag, also a drop target. */
export const ItemPool = ({ items, loading, error, onRetry }: ItemPoolProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white/60">아이돌 그룹</h3>
        <span className="text-xs text-white/30">
          {loading ? '불러오는 중…' : `${items.length}팀 · 드래그해서 배치하세요`}
        </span>
      </div>

      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-wrap gap-3 min-h-[120px] items-center content-center rounded-xl p-4 border-2 border-dashed transition-colors',
            isOver ? 'border-pink-400/60 bg-pink-500/10' : 'border-white/10'
          )}
        >
          {loading && (
            <div className="flex flex-wrap gap-3 w-full justify-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="w-full text-center space-y-3 py-4">
              <p className="text-sm text-white/40">
                아이돌 목록을 불러오지 못했습니다. 백엔드(/api/idol-groups) 연결을 확인해주세요.
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  다시 시도
                </button>
              )}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="text-white/20 text-sm w-full text-center select-none">
              모든 그룹을 배치했어요 🎉
            </p>
          )}

          {!loading &&
            !error &&
            items.map((item) => (
              <SortableItemCard key={item.id} item={item} containerId={POOL_ID} />
            ))}
        </div>
      </SortableContext>
    </div>
  );
};
