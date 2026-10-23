import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { PasswordModal } from '@/components/PasswordModal';
import { tierListService } from '@/features/tier-list/services';
import type { TierListResponse } from '@/features/tier-list/types';

const PAGE_SIZE = 50;

const countMembers = (list: TierListResponse) =>
  (list.tiers ?? []).reduce((sum, tier) => sum + (tier.idol_group_ids?.length ?? 0), 0);

export const AdminTierLists = () => {
  const [lists, setLists] = useState<TierListResponse[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedList, setSelectedList] = useState<TierListResponse | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await tierListService.getAll(page, PAGE_SIZE);
      setLists(response.data.items ?? []);
      setTotal(response.data.total);
    } catch (err) {
      console.error('티어표 목록을 불러오지 못했습니다.', err);
      setError('티어표 목록을 불러오지 못했습니다. 서버 연결과 관리자 권한을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (password: string) => {
    if (!selectedList) return;
    try {
      await tierListService.delete(String(selectedList.id), password);
      setMessage(`'${selectedList.title}' 티어표를 삭제했습니다.`);
      setSelectedList(null);
      if (lists.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
    } catch (err) {
      console.error('티어표 삭제에 실패했습니다.', err);
      setMessage('삭제하지 못했습니다. 비밀번호를 확인하거나 잠시 후 다시 시도해주세요.');
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black md:text-3xl">티어표 관리</h2>
          <p className="mt-1 text-sm text-white/40">공개된 티어표를 확인하고 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {message && <p role="status" className="text-sm text-white/70">{message}</p>}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
          <p>{error}</p>
          <button type="button" onClick={load} className="mt-3 rounded-lg bg-white/10 px-3 py-2">
            다시 시도
          </button>
        </div>
      )}

      {!error && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-white/50">
            <span>전체 {total}개</span>
            <span>{loading ? '불러오는 중…' : `${page} / ${pageCount} 페이지`}</span>
          </div>
          <ul className="divide-y divide-white/10">
            {!loading && lists.length === 0 && (
              <li className="py-12 text-center text-sm text-white/40">등록된 티어표가 없습니다.</li>
            )}
            {lists.map((list) => (
              <li key={list.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{list.title || '제목 없음'}</h3>
                  <p className="mt-1 text-xs text-white/40">
                    {countMembers(list)}팀 · {list.created_at ? new Date(list.created_at).toLocaleDateString('ko-KR') : '날짜 정보 없음'}
                  </p>
                </div>
                <Link
                  to={`/tier-lists/${list.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                >
                  <ExternalLink size={15} />
                  보기
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedList(list)}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 size={15} />
                  삭제
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm disabled:opacity-30"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount || loading}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm disabled:opacity-30"
            >
              다음
            </button>
          </div>
        </div>
      )}

      <PasswordModal
        isOpen={!!selectedList}
        onClose={() => setSelectedList(null)}
        onSubmit={handleDelete}
        title="티어표 삭제"
      />
    </section>
  );
};
