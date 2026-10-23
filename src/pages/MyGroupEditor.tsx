import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ArrowLeft, Camera, ImagePlus, Save, Share2, Trash2, Users, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ItemCard } from '@/features/tier-list/components/ItemCard';
import { SortableItemCard } from '@/features/tier-list/components/SortableItemCard';
import { idolService } from '@/features/tier-list/services';
import { IdolResponse, TierItem } from '@/features/tier-list/types';
import { MyGroup, myGroupService } from '@/features/my-group/services';
import { cn } from '@/lib/utils';

const AVAILABLE_ID = 'available-members';
const GROUP_ID = 'group-members';

interface SharedGroup {
  name: string;
  imageUrl: string | null;
  memberIds: string[];
}

const getSharedGroup = (): SharedGroup | null => {
  const match = window.location.hash.match(/^#data=(.+)$/);
  if (!match) return null;
  try {
    const data: unknown = JSON.parse(decodeURIComponent(match[1]));
    if (
      typeof data === 'object' &&
      data !== null &&
      'name' in data &&
      typeof data.name === 'string' &&
      'memberIds' in data &&
      Array.isArray(data.memberIds) &&
      data.memberIds.every((id) => typeof id === 'string') &&
      'imageUrl' in data &&
      (typeof data.imageUrl === 'string' || data.imageUrl === null)
    ) {
      return {
        name: data.name,
        imageUrl: data.imageUrl,
        memberIds: data.memberIds,
      };
    }
  } catch {
    throw new Error('공유 링크의 그룹 정보가 올바르지 않습니다.');
  }
  throw new Error('공유 링크의 그룹 정보가 올바르지 않습니다.');
};

const imageFileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 업로드할 수 있습니다.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error('이미지 파일을 열지 못했습니다.'));
      image.onload = () => {
        const maxSize = 640;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('이미지를 처리할 수 없습니다.'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

const toTierItem = (idol: IdolResponse): TierItem => ({
  id: String(idol.id),
  name: idol.name,
  imageUrl:
    idol.image_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(idol.name)}`,
});

const DropZone = ({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && 'border-pink-400/60 bg-pink-500/10')}
    >
      {children}
    </div>
  );
};

export const MyGroupEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const backPath = window.location.pathname.startsWith('/admin/') ? '/admin/my-groups' : '/my-groups';
  const captureRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [allMembers, setAllMembers] = useState<TierItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState('나만의 아이돌 그룹');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeItem, setActiveItem] = useState<TierItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const membersById = useMemo(() => new Map(allMembers.map((member) => [member.id, member])), [allMembers]);
  const selectedMembers = useMemo(
    () => selectedIds.map((memberId) => membersById.get(memberId)).filter((member): member is TierItem => !!member),
    [membersById, selectedIds]
  );
  const availableMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return allMembers.filter(
      (member) =>
        !selectedIds.includes(member.id) &&
        (!normalizedQuery || member.name.toLocaleLowerCase().includes(normalizedQuery))
    );
  }, [allMembers, query, selectedIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const pageSize = 500;
      const firstPage = await idolService.getMembers(1, pageSize);
      const records = [...(firstPage.data.items ?? [])];
      const pageCount = Math.ceil(firstPage.data.total / pageSize);
      for (let page = 2; page <= pageCount; page += 1) {
        const result = await idolService.getMembers(page, pageSize);
        records.push(...(result.data.items ?? []));
      }
      setAllMembers(records.map(toTierItem));

      const knownMemberIds = new Set(records.map((member) => String(member.id)));
      const shared = getSharedGroup();
      if (shared) {
        setName(shared.name);
        setImageUrl(shared.imageUrl);
        setSelectedIds(shared.memberIds.filter((memberId) => knownMemberIds.has(memberId)));
      } else if (id) {
        const saved = myGroupService.getById(id);
        if (!saved) {
          setError('저장된 그룹을 찾을 수 없습니다. 브라우저 저장 공간에 저장된 그룹만 수정할 수 있습니다.');
        } else {
          setName(saved.name);
          setImageUrl(saved.imageUrl);
          setSelectedIds(saved.memberIds.filter((memberId) => knownMemberIds.has(memberId)));
        }
      }
    } catch (err) {
      console.error('아이돌 멤버를 불러오지 못했습니다.', err);
      setError(
        err instanceof Error && err.message.startsWith('공유 링크')
          ? err.message
          : '멤버 목록을 불러오지 못했습니다. 서버 연결을 확인한 뒤 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;

    const sourceContainer = String(event.active.data.current?.containerId ?? '');
    const targetContainer = String(event.over?.data.current?.containerId ?? overId);
    const targetIndex = selectedIds.indexOf(overId);

    if (sourceContainer === AVAILABLE_ID && (targetContainer === GROUP_ID || targetIndex >= 0)) {
      setSelectedIds((current) => {
        if (current.includes(activeId)) return current;
        const insertAt = current.indexOf(overId);
        const next = [...current];
        next.splice(insertAt >= 0 ? insertAt : next.length, 0, activeId);
        return next;
      });
      return;
    }

    if (sourceContainer === GROUP_ID && targetContainer === AVAILABLE_ID) {
      setSelectedIds((current) => current.filter((memberId) => memberId !== activeId));
      return;
    }

    if (sourceContainer === GROUP_ID && targetContainer === GROUP_ID && targetIndex >= 0) {
      setSelectedIds((current) => arrayMove(current, current.indexOf(activeId), current.indexOf(overId)));
    }
  };

  const addMember = (memberId: string) => {
    setSelectedIds((current) => (current.includes(memberId) ? current : [...current, memberId]));
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setImageUrl(await imageFileToDataUrl(file));
      setMessage('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '이미지를 설정하지 못했습니다.');
    }
  };

  const handleSave = () => {
    if (loading || error) return;
    try {
      const group: MyGroup = {
        id: id ?? uuidv4(),
        name: name.trim() || '이름 없는 그룹',
        imageUrl,
        memberIds: selectedIds,
        updatedAt: new Date().toISOString(),
      };
      myGroupService.save(group);
      setMessage('그룹을 이 브라우저에 저장했습니다.');
      if (!id) navigate(`/my-groups/${group.id}`, { replace: true });
    } catch (err) {
      console.error('그룹 저장에 실패했습니다.', err);
      setMessage('저장하지 못했습니다. 이미지 크기를 줄이거나 브라우저 저장 공간을 확인해주세요.');
    }
  };

  const handleDelete = () => {
    if (!id || !window.confirm('이 그룹을 삭제할까요?')) return;
    try {
      myGroupService.delete(id);
      navigate('/my-groups');
    } catch (err) {
      console.error('그룹 삭제에 실패했습니다.', err);
      setMessage('그룹을 삭제하지 못했습니다.');
    }
  };

  const handleCapture = async () => {
    if (!captureRef.current) return;
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${name.trim() || 'my-idol-group'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('그룹 캡처에 실패했습니다.', err);
      setMessage('캡처에 실패했습니다. 이미지 로딩을 확인하고 다시 시도해주세요.');
    }
  };

  const handleShare = async () => {
    const payload = encodeURIComponent(
      JSON.stringify({ name, imageUrl, memberIds: selectedIds } satisfies SharedGroup)
    );
    const url = `${window.location.origin}/my-groups/new#data=${payload}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: '내가 만든 아이돌 그룹을 확인해보세요!', url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage('공유 링크를 클립보드에 복사했습니다.');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        setMessage('공유 링크를 클립보드에 복사했습니다.');
      } catch (copyError) {
        console.error('공유 링크 복사에 실패했습니다.', copyError);
        setMessage('공유 링크를 복사하지 못했습니다. 브라우저 권한을 확인해주세요.');
      }
    }
  };

  const removeMember = (memberId: string) => {
    setSelectedIds((current) => current.filter((id) => id !== memberId));
  };

  return (
    <div className="max-w-5xl mx-auto py-8 pb-20 space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={backPath} className="p-2 rounded-lg bg-white/5 hover:bg-white/10" aria-label="나만의 그룹 목록">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">나만의 그룹 만들기</h1>
            <p className="text-sm text-white/40">멤버를 골라 드래그하고, 나만의 유닛을 완성해보세요.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCapture} className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
            <Camera size={17} /> 캡처
          </button>
          <button
            onClick={handleShare}
            disabled={loading || !!error}
            className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Share2 size={17} /> 공유
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !!error}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={17} /> {id ? '수정 저장' : '저장'}
          </button>
          {id && (
            <button onClick={handleDelete} className="p-2.5 text-red-300 bg-red-400/10 rounded-xl hover:bg-red-400/20" aria-label="그룹 삭제">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {message && <p role="status" className="text-sm text-pink-200">{message}</p>}
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-200 space-y-3">
          <p>{error}</p>
          <button onClick={loadMembers} className="px-3 py-2 bg-white/10 rounded-lg">다시 시도</button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveItem(membersById.get(String(event.active.id)) ?? null)}
        onDragCancel={() => setActiveItem(null)}
        onDragEnd={handleDragEnd}
      >
        <section ref={captureRef} className="rounded-3xl bg-card border border-white/10 overflow-hidden shadow-2xl">
          <div className="relative bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-transparent p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                className="group relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/30"
                aria-label="그룹 이미지 업로드"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="그룹 이미지" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-white/40">
                    <ImagePlus size={30} />
                    <span className="text-xs">그룹 이미지 추가</span>
                  </div>
                )}
                {imageUrl && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImagePlus size={24} />
                  </span>
                )}
              </button>
              <div className="flex-1 w-full text-center sm:text-left space-y-2">
                <label htmlFor="custom-group-name" className="block text-xs font-semibold uppercase tracking-widest text-pink-200/70">
                  My Idol Unit
                </label>
                <input
                  id="custom-group-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={40}
                  className="w-full bg-transparent text-3xl md:text-4xl font-black outline-none border-b border-white/15 focus:border-pink-300/60 pb-2"
                  placeholder="그룹 이름을 입력하세요"
                />
                <p className="text-sm text-white/45">{selectedMembers.length}명의 멤버</p>
                {imageUrl && (
                  <button type="button" onClick={() => setImageUrl(null)} className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white">
                    <X size={13} /> 이미지 삭제
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 font-bold text-white/80">
                <Users size={18} className="text-pink-300" /> 우리 그룹 멤버
              </h2>
              <span className="text-xs text-white/40">카드를 눌러 제외하거나 드래그해 순서를 바꿔보세요</span>
            </div>
            <DropZone id={GROUP_ID} className="flex min-h-36 flex-wrap content-start items-start gap-3 rounded-2xl border-2 border-dashed border-white/10 p-4 transition-colors">
              <SortableContext items={selectedIds} strategy={rectSortingStrategy}>
                {selectedMembers.map((member) => (
                  <div key={member.id} className="relative">
                    <SortableItemCard
                      item={member}
                      containerId={GROUP_ID}
                      alwaysShowName
                      onClick={() => removeMember(member.id)}
                    />
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="absolute -right-2 -top-2 z-10 rounded-full bg-black/80 p-1 text-white/70 hover:bg-red-500 hover:text-white"
                      aria-label={`${member.name} 제외`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </SortableContext>
              {selectedMembers.length === 0 && (
                <p className="w-full self-center py-8 text-center text-sm text-white/30">
                  아래 멤버를 끌어와 그룹을 만들어보세요.
                </p>
              )}
            </DropZone>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-white/10 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-white/80">아이돌 멤버</h2>
              <p className="text-xs text-white/40 mt-1">
                {loading
                  ? '멤버를 불러오는 중…'
                  : `${availableMembers.length}명 · 클릭하거나 위로 드래그해 추가하세요`}
              </p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="멤버 이름 검색"
              className="w-full sm:w-56 px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none focus:border-pink-400/50 text-sm"
              disabled={loading || !!error}
            />
          </div>
          <DropZone id={AVAILABLE_ID} className="flex min-h-32 flex-wrap content-start items-start gap-3 rounded-xl border-2 border-dashed border-white/10 p-4 transition-colors">
            <SortableContext items={availableMembers.map((member) => member.id)} strategy={rectSortingStrategy}>
              {availableMembers.map((member) => (
                <SortableItemCard
                  key={member.id}
                  item={member}
                  containerId={AVAILABLE_ID}
                  alwaysShowName
                  onClick={() => addMember(member.id)}
                />
              ))}
            </SortableContext>
            {!loading && !error && availableMembers.length === 0 && (
              <p className="w-full self-center py-5 text-center text-sm text-white/30">
                {allMembers.length === 0 ? '선택할 수 있는 멤버가 없습니다.' : '검색 결과가 없습니다.'}
              </p>
            )}
            {loading && <p className="w-full py-5 text-center text-sm text-white/30">멤버 목록을 불러오고 있습니다.</p>}
          </DropZone>
        </section>

        <DragOverlay>{activeItem ? <ItemCard item={activeItem} isOverlay alwaysShowName /> : null}</DragOverlay>
      </DndContext>

      <input ref={uploadRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
      <p className="text-center text-xs text-white/30">
        프로토타입: 만든 그룹은 현재 브라우저에 저장됩니다. 공유 링크에는 그룹 정보가 포함됩니다.
      </p>
    </div>
  );
};
