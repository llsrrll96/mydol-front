import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Camera, Share2, Save, Trash2, Pencil, X } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { PasswordModal } from '@/components/PasswordModal';
import { useCreatorId } from '@/hooks/useCreatorId';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { TierRow } from '@/features/tier-list/components/TierRow';
import { ItemPool } from '@/features/tier-list/components/ItemPool';
import { ItemCard } from '@/features/tier-list/components/ItemCard';
import {
  useTierList,
  TIER_ORDER,
  TIER_TITLES,
  TIER_COLORS,
  POOL_ID,
  type ContainerId,
} from '@/features/tier-list/hooks/useTierList';
import { tierListService, idolService } from '@/features/tier-list/services';
import { IdolGroupResponse, TierItem } from '@/features/tier-list/types';
import { cn } from '@/lib/utils';

const normalizeIdol = (g: IdolGroupResponse): TierItem => ({
  id: String(g.id),
  name: g.name,
  imageUrl: g.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${g.id}`,
});

type LoadStatus = 'loading' | 'ready' | 'error';

export const TierListEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const creatorId = useCreatorId();
  const captureRef = useRef<HTMLDivElement>(null);

  const { containers, setContainers, setPool, hydrate, toApiTiers, placedCount } = useTierList();

  const [title, setTitle] = useState('나의 아이돌 티어표');
  const [activeItem, setActiveItem] = useState<TierItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'update' | 'delete'>('create');
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<LoadStatus>('loading');
  // New lists open straight into editing; existing lists open read-only.
  const [editing, setEditing] = useState(!id);

  // Warn on back / refresh only while editing with unsaved placements.
  useUnsavedChangesGuard(editing && placedCount > 0 && !saved);

  const lastOverId = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /**
   * Pointer-first collision detection. Plain `closestCorners` biases drops
   * toward the vertically-centered row; following the cursor (pointerWithin)
   * lets every tier — including empty ones — accept a drop reliably.
   */
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointer = pointerWithin(args);
      const intersections = pointer.length > 0 ? pointer : rectIntersection(args);
      const overId = getFirstCollision(intersections, 'id');

      if (overId == null) {
        return lastOverId.current ? [{ id: lastOverId.current }] : [];
      }

      let resolved = overId;
      // If hovering the row/zone itself, snap to the nearest card inside it.
      if (typeof overId === 'string' && overId in containers) {
        const inside = containers[overId as ContainerId];
        if (inside.length > 0) {
          const closest = closestCorners({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (c) => c.id !== overId && inside.some((i) => i.id === c.id)
            ),
          })[0];
          if (closest) resolved = closest.id;
        }
      }

      lastOverId.current = String(resolved);
      return [{ id: resolved }];
    },
    [containers]
  );

  const findContainerOf = (
    source: typeof containers,
    itemOrContainerId: string
  ): ContainerId | undefined => {
    if (itemOrContainerId in source) return itemOrContainerId as ContainerId;
    return (Object.keys(source) as ContainerId[]).find((key) =>
      source[key].some((i) => i.id === itemOrContainerId)
    );
  };

  const load = async () => {
    setStatus('loading');
    try {
      // 1) Always fetch the real idol catalog from /api/idols.
      const idolsRes = await idolService.getAll();
      const idols = (idolsRes.data ?? []).map(normalizeIdol);

      if (!id) {
        setPool(idols);
      } else {
        // 2) Editing: load the saved list and resolve its idol ids.
        const res = await tierListService.getById(id);
        setTitle(res.data.title);
        hydrate(res.data.tiers ?? [], idols);
      }
      setStatus('ready');
    } catch (err) {
      console.error('데이터를 불러오지 못했습니다.', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    setEditing(!id); // reset to read-only when viewing an existing list
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const findItem = (itemId: string): TierItem | undefined => {
    for (const key of Object.keys(containers) as ContainerId[]) {
      const found = containers[key].find((i) => i.id === itemId);
      if (found) return found;
    }
    return undefined;
  };

  const handleDragStart = (e: DragStartEvent) => {
    lastOverId.current = null;
    setActiveItem(findItem(String(e.active.id)) ?? null);
  };

  /** Move an item between containers live, as it is dragged over a new zone. */
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // All resolution happens against `prev` so rapid events stay consistent.
    setContainers((prev) => {
      const from = findContainerOf(prev, activeId);
      const to = findContainerOf(prev, overId);
      if (!from || !to || from === to) return prev;

      const fromItems = prev[from];
      const movingIndex = fromItems.findIndex((i) => i.id === activeId);
      if (movingIndex < 0) return prev;
      const moving = fromItems[movingIndex];

      const toItems = prev[to];
      const overIndex = toItems.findIndex((i) => i.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toItems.length;

      return {
        ...prev,
        [from]: fromItems.filter((i) => i.id !== activeId),
        [to]: [...toItems.slice(0, insertAt), moving, ...toItems.slice(insertAt)],
      };
    });
  };

  /** Reorder within the destination container on drop. */
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveItem(null);
    lastOverId.current = null;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    setContainers((prev) => {
      const container = findContainerOf(prev, overId);
      const from = findContainerOf(prev, activeId);
      if (!container || from !== container) return prev;

      const items = prev[container];
      const oldIndex = items.findIndex((i) => i.id === activeId);
      const newIndex = items.findIndex((i) => i.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;
      return { ...prev, [container]: arrayMove(items, oldIndex, newIndex) };
    });
  };

  const handleCapture = async () => {
    if (!captureRef.current) return;
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true, // fetch cross-origin idol images with CORS so the canvas isn't tainted
        imageTimeout: 15000,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${title || 'tier-list'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('캡처에 실패했습니다.', err);
      alert('이미지 캡처에 실패했습니다. 이미지 로딩을 기다린 뒤 다시 시도해주세요.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: '나의 아이돌 티어표를 확인해보세요!', url });
        return;
      } catch {
        /* user cancelled -> fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(url);
    alert('공유 링크가 클립보드에 복사되었습니다.');
  };

  const handleSave = async (password: string) => {
    try {
      const tiers = toApiTiers();
      if (!id) {
        const res = await tierListService.create({ title, tiers, password, creator_id: creatorId });
        setSaved(true); // disengage the unsaved-changes guard before navigating
        alert('저장되었습니다!');
        navigate(`/tier-lists/${res.data.id}`);
      } else {
        await tierListService.update(id, { title, tiers, password });
        setSaved(true);
        setEditing(false); // back to read-only after saving edits
        alert('수정되었습니다!');
      }
      setIsModalOpen(false);
    } catch {
      /* 401 handled by interceptor */
    }
  };

  const handleDelete = async (password: string) => {
    if (!id) return;
    try {
      await tierListService.delete(id, password);
      alert('삭제되었습니다.');
      navigate('/tier-lists');
    } catch {
      /* 401 handled by interceptor */
    }
  };

  const openModal = (type: 'create' | 'update' | 'delete') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 space-y-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            readOnly={!editing}
            className={cn(
              'bg-transparent text-3xl md:text-4xl font-black border-b-2 border-transparent outline-none w-full transition-colors tracking-tight',
              editing ? 'focus:border-pink-400/40' : 'cursor-default'
            )}
            placeholder="제목을 입력하세요"
          />
          <p className="text-white/40 text-sm">
            {editing
              ? `아이돌 카드를 끌어다 등급에 배치하세요 · ${placedCount}팀 배치됨`
              : `조회 모드 · ${placedCount}팀 랭크됨`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCapture}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <Camera size={18} />
            <span className="hidden sm:inline font-medium">캡처</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline font-medium">공유</span>
          </button>

          {editing && (
            <>
              <div className="w-px h-10 bg-white/10 mx-1" />
              <button
                onClick={() => openModal(id ? 'update' : 'create')}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-500/20"
              >
                <Save size={18} />
                <span>{id ? '수정 저장' : '저장'}</span>
              </button>
              {id && (
                <button
                  onClick={() => openModal('delete')}
                  className="flex items-center justify-center p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {editing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Tier board (captured area) */}
          <div
            ref={captureRef}
            className="bg-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          >
            {TIER_ORDER.map((tierId) => (
              <TierRow
                key={tierId}
                tier={{ id: tierId, title: TIER_TITLES[tierId], items: containers[tierId] }}
                color={TIER_COLORS[tierId]}
              />
            ))}
          </div>

          {/* Cancel back to read-only (existing lists only) */}
          {id && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
              >
                <X size={16} />
                편집 취소
              </button>
            </div>
          )}

          <div className="h-8" />

          {/* Idol pool */}
          <ItemPool
            items={containers[POOL_ID]}
            loading={status === 'loading'}
            error={status === 'error'}
            onRetry={load}
          />

          {/* Premium floating drag preview */}
          <DragOverlay>
            {activeItem ? <ItemCard item={activeItem} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <>
          {/* Read-only board */}
          <div
            ref={captureRef}
            className="bg-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          >
            {TIER_ORDER.map((tierId) => (
              <div
                key={tierId}
                className="flex min-h-[96px] border-b border-white/5 last:border-b-0"
              >
                <div
                  className={cn(
                    'w-20 md:w-28 flex items-center justify-center text-black font-black text-2xl md:text-3xl shrink-0',
                    TIER_COLORS[tierId]
                  )}
                >
                  {tierId}
                </div>
                <div className="flex-1 p-3 flex flex-wrap gap-2.5 items-center content-center min-h-[96px] bg-black/20">
                  {containers[tierId].length === 0 ? (
                    <span className="text-white/15 text-xs italic select-none">비어 있음</span>
                  ) : (
                    containers[tierId].map((item) => (
                      <ItemCard key={item.id} item={item} className="cursor-default" />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Enter edit mode */}
          <div className="flex justify-center pt-6">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-500/25"
            >
              <Pencil size={18} />
              티어 매기기
            </button>
          </div>
        </>
      )}

      <PasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalType === 'delete' ? handleDelete : handleSave}
        title={modalType === 'delete' ? '삭제 확인' : '티어표 저장'}
      />
    </div>
  );
};
