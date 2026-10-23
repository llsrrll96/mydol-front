import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { adminService, getErrorMessage } from '@/services/admin';
import type { IdolGroupResponse, IdolResponse } from '@/features/tier-list/types';
import { useCrawlJob } from '@/hooks/useCrawlJob';
import { CrawlStatusPanel } from '@/components/CrawlStatusPanel';

const metaString = (meta: IdolResponse['meta'], key: string): string | null => {
  const value = meta?.[key];
  return typeof value === 'string' && value ? value : null;
};

/** 관리자: 한 그룹에 속한 아이돌 관리 (검색, 이미지 교체, 삭제, 이 그룹 크롤링) */
export function AdminIdols() {
  const { groupId } = useParams();
  const gid = Number(groupId);
  const valid = Number.isInteger(gid) && gid > 0;

  const [group, setGroup] = useState<IdolGroupResponse | null>(null);
  const [idols, setIdols] = useState<IdolResponse[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [g, list] = await Promise.all([
      adminService.getGroup(gid),
      adminService.listIdols({ group_id: gid, page_size: 500 }),
    ]);
    setGroup(g.data);
    setIdols(list.data.items);
  }, [gid]);

  useEffect(() => {
    if (!valid) return;
    load().catch((err) => setMessage(getErrorMessage(err, '정보를 불러오지 못했습니다.')));
  }, [valid, load]);

  // 크롤링이 끝나면 목록을 새로고침한다.
  const crawl = useCrawlJob(load);

  // 입력할 때마다 즉시 필터링 (대소문자 무시, 앞뒤 공백 무시)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return idols;
    return idols.filter((i) => i.name.toLowerCase().includes(q));
  }, [idols, query]);

  if (!valid) return <Navigate to="/admin" replace />;

  const run = async (fn: () => Promise<unknown>, okMessage: string) => {
    try {
      await fn();
      setMessage(okMessage);
      await load();
      return true;
    } catch (err) {
      setMessage(getErrorMessage(err, '요청에 실패했습니다. 로그인이 만료되었을 수 있습니다.'));
      return false;
    }
  };

  const replaceImage = async (idol: IdolResponse, file: File | undefined) => {
    if (!file) return;
    setBusyId(idol.id);
    await run(() => adminService.updateIdol(idol.id, { image: file }), `'${idol.name}' 이미지를 교체했습니다.`);
    setBusyId(null);
  };

  const canCrawl = !!group?.source_url;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/admin" className="text-sm text-white/60 hover:text-white">
        ← 그룹 목록
      </Link>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {group?.image_url && (
            <img src={group.image_url} alt={group.name} className="w-12 h-12 rounded object-cover" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{group ? group.name : '그룹'} 아이돌 관리</h1>
            <p className="text-xs text-white/50">전체 {idols.length}명</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"
            disabled={crawl.running || !canCrawl}
            onClick={() => crawl.startIdols(gid)}
          >
            {crawl.running ? '크롤링 중...' : '이 그룹 아이돌 크롤링'}
          </button>
          {group && !canCrawl && (
            <p className="text-xs text-white/40">원본 주소가 없어 크롤링할 수 없습니다 (그룹 크롤링으로 채워집니다)</p>
          )}
        </div>
      </div>

      {(message || crawl.message) && <p className="text-sm text-white/70">{crawl.message || message}</p>}
      <CrawlStatusPanel status={crawl.status} idolProgress={crawl.idolProgress} />

      <form
        className="flex gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          run(() => adminService.createIdol(gid, name.trim(), image), '아이돌을 추가했습니다.').then((ok) => {
            if (ok) {
              setName('');
              setImage(null);
            }
          });
        }}
      >
        <input
          className="flex-1 p-2 rounded bg-white/10"
          placeholder="새 아이돌 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        <button className="px-3 py-2 rounded bg-pink-500">추가</button>
      </form>

      <div className="space-y-2">
        <input
          className="w-full p-2 rounded bg-white/10"
          placeholder="아이돌 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="text-xs text-white/50">
          {query.trim() ? `${filtered.length} / ${idols.length}명` : `전체 ${idols.length}명`}
        </p>
      </div>

      <ul className="divide-y divide-white/10">
        {filtered.map((idol) => {
          const color = metaString(idol.meta, 'color');
          const mark = metaString(idol.meta, 'mark');
          return (
            <li key={idol.id} className="flex items-center gap-3 py-2">
              {idol.image_url ? (
                <img src={idol.image_url} alt={idol.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/40">
                  이미지 없음
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate">{idol.name}</p>
                {(color || mark) && (
                  <p className="text-xs text-white/50">{[color, mark].filter(Boolean).join(' · ')}</p>
                )}
              </div>

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
                className="text-sm px-2 py-1 rounded bg-red-500/80"
                onClick={() => {
                  if (window.confirm(`'${idol.name}'을(를) 삭제할까요?`)) {
                    run(() => adminService.deleteIdol(idol.id), '삭제했습니다.');
                  }
                }}
              >
                삭제
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="py-6 text-center text-sm text-white/50">
            {idols.length === 0 ? '등록된 아이돌이 없습니다.' : '검색 결과가 없습니다.'}
          </li>
        )}
      </ul>
    </div>
  );
}
