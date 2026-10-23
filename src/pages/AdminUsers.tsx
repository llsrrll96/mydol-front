import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, UserRound } from 'lucide-react';
import { adminService } from '@/services/admin';

interface CurrentUser {
  id: string;
  username: string;
  role: string;
}

export const AdminUsers = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.me();
      setUser(response.data);
    } catch (err) {
      console.error('로그인 계정 정보를 불러오지 못했습니다.', err);
      setError('로그인 계정 정보를 불러오지 못했습니다. 관리자 권한과 서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black md:text-3xl">유저 관리</h2>
          <p className="mt-1 text-sm text-white/40">현재 로그인한 계정 정보를 조회합니다.</p>
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

      <div className="rounded-2xl border border-white/10 bg-card p-5 md:p-7">
        {loading && <p className="py-8 text-center text-sm text-white/40">계정 정보를 불러오는 중…</p>}

        {!loading && error && (
          <div className="py-6 text-center">
            <p className="text-sm text-red-200">{error}</p>
            <button type="button" onClick={load} className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm">
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && user && (
          <>
            <div className="flex items-center gap-4 border-b border-white/10 pb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-200">
                <UserRound size={26} />
              </div>
              <div>
                <p className="text-xs text-white/40">로그인 계정</p>
                <h3 className="mt-1 text-lg font-bold">{user.username}</h3>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.03] p-4">
                <dt className="text-xs text-white/40">사용자 ID</dt>
                <dd className="mt-1 break-all text-sm font-medium">{user.id}</dd>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-4">
                <dt className="text-xs text-white/40">권한</dt>
                <dd className="mt-1 text-sm font-medium">{user.role}</dd>
              </div>
            </dl>
          </>
        )}
      </div>

      <div className="rounded-xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-sm leading-6 text-amber-100/70">
        현재 백엔드는 로그인한 계정 정보만 조회할 수 있습니다. 전체 회원 목록을 보려면 관리자용 유저 목록 API가 추가로 필요합니다.
      </div>
    </section>
  );
};
