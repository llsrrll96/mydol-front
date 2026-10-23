import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import { tierListService } from '@/features/tier-list/services';
import { TierListResponse } from '@/features/tier-list/types';

/** Count ranked idols across a list's tiers (for the card meta line). */
const countItems = (list: TierListResponse) =>
  (list.tiers ?? []).reduce((sum, t) => sum + (t.idol_group_ids?.length ?? 0), 0);

export const TierListsPage = () => {
  const [lists, setLists] = useState<TierListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    tierListService
      .getAll()
      .then((res) => setLists(res.data?.items ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

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
          {lists.map((list) => (
            <Link
              key={list.id}
              to={`/tier-lists/${list.id}`}
              className="group rounded-2xl overflow-hidden bg-card border border-white/10 hover:border-pink-400/40 hover:-translate-y-1 transition-all"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-transparent flex items-center justify-center overflow-hidden">
                <Layers className="text-white/30 group-hover:text-pink-300/60 transition-colors" size={40} />
              </div>
              <div className="p-3">
                <h3 className="font-bold truncate group-hover:text-pink-300 transition-colors">
                  {list.title || '제목 없음'}
                </h3>
                <p className="text-xs text-white/40 mt-0.5">{countItems(list)}팀 랭크됨</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
