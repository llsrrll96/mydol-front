import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Layers, Plus } from 'lucide-react';
import { tierListService } from '@/features/tier-list/services';
import { TierListResponse } from '@/features/tier-list/types';
import { tierListLikesService, TierListLikes } from '@/features/tier-list/services/likes';
import { useCreatorId } from '@/hooks/useCreatorId';

/** Count ranked idols across a list's tiers (for the card meta line). */
const countItems = (list: TierListResponse) =>
  (list.tiers ?? []).reduce((sum, t) => sum + (t.idol_group_ids?.length ?? 0), 0);

export const TierListsPage = () => {
  const creatorId = useCreatorId();
  const [lists, setLists] = useState<TierListResponse[]>([]);
  const [likes, setLikes] = useState<TierListLikes>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [likesError, setLikesError] = useState('');
  const [sortByLikes, setSortByLikes] = useState(true);
  const [savingLikeId, setSavingLikeId] = useState<number | null>(null);
  const likeRequestInProgress = useRef(false);

  useEffect(() => {
    tierListService
      .getAll()
      .then((res) => setLists(res.data?.items ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      setLikes(tierListLikesService.getAll());
      setLikesError('');
    } catch (err) {
      console.error('좋아요 정보를 불러오지 못했습니다.', err);
      setLikesError('좋아요 정보를 불러오지 못했습니다. 브라우저 저장 데이터를 확인해주세요.');
    }
  }, []);

  const displayedLists = useMemo(() => {
    if (!sortByLikes) return lists;
    return [...lists].sort(
      (a, b) =>
        (likes[String(b.id)]?.count ?? 0) - (likes[String(a.id)]?.count ?? 0)
    );
  }, [likes, lists, sortByLikes]);

  const toggleLike = async (list: TierListResponse) => {
    if (!creatorId || likeRequestInProgress.current) return;
    likeRequestInProgress.current = true;
    setSavingLikeId(list.id);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      const updated = tierListLikesService.toggle(list.id, creatorId);
      setLikes((current) => ({ ...current, [String(list.id)]: updated }));
      setLikesError('');
    } catch (err) {
      console.error('좋아요 저장에 실패했습니다.', err);
      setLikesError('좋아요를 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.');
    } finally {
      likeRequestInProgress.current = false;
      setSavingLikeId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">티어표 둘러보기</h2>
          <p className="text-white/40 text-sm mt-1">팬들이 만든 아이돌 티어표를 구경해보세요.</p>
        </div>
        <Link
          to="/tier-lists/new"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-500/20 shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">새 티어표 만들기</span>
          <span className="sm:hidden">만들기</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/35">
          좋아요는 이 브라우저에 저장되며, 다른 사용자와 수는 공유되지 않습니다.
        </p>
        <button
          type="button"
          onClick={() => setSortByLikes((current) => !current)}
          aria-pressed={sortByLikes}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          {sortByLikes ? '좋아요순' : '최신순'}
        </button>
      </div>
      {likesError && <p role="alert" className="text-sm text-red-300">{likesError}</p>}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20 text-white/40">
          목록을 불러오지 못했습니다. 백엔드 서버가 실행 중인지 확인해주세요.
        </div>
      )}

      {!loading && !error && lists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Layers className="text-white/20" size={48} />
          <p className="text-white/40">아직 만들어진 티어표가 없어요. 첫 번째 티어표를 만들어보세요!</p>
          <Link
            to="/tier-lists/new"
            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
          >
            지금 만들기
          </Link>
        </div>
      )}

      {!loading && !error && lists.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedLists.map((list) => {
            const listLikes = likes[String(list.id)];
            const liked = !!creatorId && !!listLikes?.voterIds.includes(creatorId);

            return (
              <article
                key={list.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-card transition-all hover:-translate-y-1 hover:border-pink-400/40"
              >
                <Link to={`/tier-lists/${list.id}`} className="block">
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-transparent">
                    <Layers className="text-white/30 transition-colors group-hover:text-pink-300/60" size={40} />
                  </div>
                  <div className="p-3 pb-1">
                    <h3 className="truncate font-bold transition-colors group-hover:text-pink-300">
                      {list.title || '제목 없음'}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/40">{countItems(list)}팀 랭크됨</p>
                  </div>
                </Link>
                <div className="flex items-center justify-between px-3 pb-3 pt-2">
                  <span className="text-xs text-white/35">
                    {list.created_at ? new Date(list.created_at).toLocaleDateString('ko-KR') : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggleLike(list)}
                    disabled={!creatorId || !!likesError || savingLikeId !== null}
                    aria-label={liked ? `${list.title} 좋아요 취소` : `${list.title} 좋아요`}
                    aria-pressed={liked}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      liked
                        ? 'bg-pink-500/15 text-pink-300'
                        : 'bg-white/5 text-white/50 hover:bg-pink-500/10 hover:text-pink-300'
                    }`}
                  >
                    {savingLikeId === list.id ? (
                      <span className="text-xs">저장 중…</span>
                    ) : (
                      <>
                        <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                        <span>{listLikes?.count ?? 0}</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
