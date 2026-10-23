import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_TOKEN_KEY, adminService } from '@/services/admin';
import { idolService } from '@/features/tier-list/services';
import type { IdolGroupResponse } from '@/features/tier-list/types';

export function AdminIdols() {
  const [idols, setIdols] = useState<IdolGroupResponse[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const { data } = await idolService.getAll();
    setIdols(data);
  }, []);

  useEffect(() => {
    load().catch(() => setMessage('목록을 불러오지 못했습니다.'));
  }, [load]);

  // 입력할 때마다 즉시 필터링 (대소문자 무시, 앞뒤 공백 무시)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return idols;
    return idols.filter((idol) => idol.name.toLowerCase().includes(q));
  }, [idols, query]);

  const run = async (fn: () => Promise<unknown>, okMessage: string) => {
    try {
      await fn();
      setMessage(okMessage);
      await load();
      return true;
    } catch {
      setMessage('요청에 실패했습니다. 로그인이 만료되었을 수 있습니다.');
      return false;
    }
  };

  const replaceImage = async (idol: IdolGroupResponse, file: File | undefined) => {
    if (!file) return;
    setBusyId(idol.id);
    await run(
      () => adminService.updateIdol(idol.id, { image: file }),
      `'${idol.name}' 이미지를 교체했습니다.`,
    );
    setBusyId(null);
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">아이돌 그룹 관리</h1>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-white/10"
            onClick={() => run(() => adminService.crawl(), '크롤링을 시작했습니다. 잠시 후 새로고침하세요.')}
          >
            크롤링 실행
          </button>
          <button className="px-3 py-1 rounded bg-white/10" onClick={logout}>
            로그아웃
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-white/70">{message}</p>}

      <form
        className="flex gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          run(() => adminService.createIdol(name.trim(), image), '그룹을 추가했습니다.').then((ok) => {
            if (ok) {
              setName('');
              setImage(null);
            }
          });
        }}
      >
        <input
          className="flex-1 p-2 rounded bg-white/10"
          placeholder="새 그룹 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        <button className="px-3 py-2 rounded bg-pink-500">추가</button>
      </form>

      <div className="space-y-2">
        <input
          className="w-full p-2 rounded bg-white/10"
          placeholder="그룹 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="text-xs text-white/50">
          {query.trim() ? `${filtered.length} / ${idols.length}개` : `전체 ${idols.length}개`}
        </p>
      </div>

      <ul className="divide-y divide-white/10">
        {filtered.map((idol) => (
          <li key={idol.id} className="flex items-center gap-3 py-2">
            {idol.image_url ? (
              <img src={idol.image_url} alt={idol.name} className="w-14 h-14 rounded object-cover" />
            ) : (
              <div className="w-14 h-14 rounded bg-white/10 flex items-center justify-center text-[10px] text-white/40">
                이미지 없음
              </div>
            )}
            <span className="flex-1">{idol.name}</span>

            <label
              className={`text-sm px-2 py-1 rounded bg-white/10 cursor-pointer ${
                busyId === idol.id ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {busyId === idol.id ? '업로드 중...' : idol.image_url ? '이미지 수정' : '이미지 추가'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  replaceImage(idol, e.target.files?.[0]);
                  e.target.value = ''; // 같은 파일을 다시 골라도 동작하도록 초기화
                }}
              />
            </label>

            <button
              className="text-sm px-2 py-1 rounded bg-white/10"
              onClick={() => {
                const next = window.prompt('새 이름', idol.name);
                if (next && next.trim() && next.trim() !== idol.name) {
                  run(() => adminService.updateIdol(idol.id, { name: next.trim() }), '이름을 수정했습니다.');
                }
              }}
            >
              이름 수정
            </button>
            <button
              className="text-sm px-2 py-1 rounded bg-red-500/80"
              onClick={() => {
                if (window.confirm(`'${idol.name}' 그룹을 삭제할까요?`)) {
                  run(() => adminService.deleteIdol(idol.id), '삭제했습니다.');
                }
              }}
            >
              삭제
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-6 text-center text-sm text-white/50">
            {idols.length === 0 ? '등록된 그룹이 없습니다.' : '검색 결과가 없습니다.'}
          </li>
        )}
      </ul>
    </div>
  );
}
