import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { POOL_ID } from '../hooks/useTierList';
import { TierItem } from '../types';
import { SortableItemCard } from './SortableItemCard';

const KOREAN_INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const getKoreanInitial = (name: string) => {
  const firstCharacter = name.trim().charAt(0);
  const code = firstCharacter.charCodeAt(0);
  if (!firstCharacter || code < 0xac00 || code > 0xd7a3) return null;
  return KOREAN_INITIALS[Math.floor((code - 0xac00) / 588)];
};

interface ItemPoolProps {
  items: TierItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

/** The unranked idol pool — source area for drag, also a drop target. */
export const ItemPool = ({ items, loading, error, onRetry }: ItemPoolProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const visibleItems = selectedInitial
    ? items.filter((item) => getKoreanInitial(item.name) === selectedInitial)
    : items;

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white/60">아이돌 그룹</h3>
        <span className="text-xs text-white/30">
          {loading
            ? '불러오는 중…'
            : selectedInitial
              ? `${visibleItems.length}/${items.length}팀 · 드래그해서 배치하세요`
              : `${items.length}팀 · 드래그해서 배치하세요`}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="그룹 이름 초성 필터">
        <button
          type="button"
          onClick={() => setSelectedInitial(null)}
          disabled={loading || error}
          aria-pressed={selectedInitial === null}
          className={cn(
            'px-2.5 py-1 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
            selectedInitial === null
              ? 'bg-pink-500 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
          )}
        >
          전체
        </button>
        {KOREAN_INITIALS.map((initial) => (
          <button
            key={initial}
            type="button"
            onClick={() => setSelectedInitial(initial)}
            disabled={loading || error}
            aria-pressed={selectedInitial === initial}
            className={cn(
              'min-w-8 px-2 py-1 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
              selectedInitial === initial
                ? 'bg-pink-500 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            )}
          >
            {initial}
          </button>
        ))}
      </div>

      <SortableContext items={visibleItems.map((i) => i.id)} strategy={rectSortingStrategy}>
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
            items.length > 0 &&
            visibleItems.length === 0 && (
              <p className="text-white/30 text-sm w-full text-center select-none">
                선택한 초성으로 시작하는 그룹이 없습니다.
              </p>
            )}

          {!loading &&
            !error &&
            visibleItems.map((item) => (
              <SortableItemCard
                key={item.id}
                item={item}
                containerId={POOL_ID}
                alwaysShowName
              />
            ))}
        </div>
      </SortableContext>
    </div>
  );
};
