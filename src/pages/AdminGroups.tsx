import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService, getErrorMessage } from '@/services/admin';
import { idolService } from '@/features/tier-list/services';
import type { IdolGroupResponse } from '@/features/tier-list/types';
import { useCrawlJob } from '@/hooks/useCrawlJob';
import { CrawlStatusPanel } from '@/components/CrawlStatusPanel';

/** 관리자: 아이돌 그룹 목록 관리 (검색, 이미지 교체, 삭제, 크롤링) */
export function AdminGroups() {
  const [groups, setGroups] = useState<IdolGroupResponse[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data } = await idolService.getAll();
    setGroups(data);
  }, []);

  useEffect(() => {
    load().catch(() => setMessage('목록을 불러오지 못했습니다.'));
  }, [load]);

  // 크롤링이 끝나면 목록을 새로고침한다.
  const crawl = useCrawlJob(load);

  // 입력할 때마다 즉시 필터링 (대소문자 무시, 앞뒤 공백 무시)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

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

  const replaceImage = async (group: IdolGroupResponse, file: File | undefined) => {
    if (!file) return;
    setBusyId(group.id);
    await run(
      () => adminService.updateGroup(group.id, { image: file }),
      `'${group.name}' 이미지를 교체했습니다.`,
    );
    setBusyId(null);
  };

  const startIdolCrawl = () => {
    if (
      window.confirm(
        `아직 수집하지 않은 그룹을 하루 상한(${crawl.idolProgress?.daily_limit ?? '서버 설정'}개 그룹)까지 크롤링합니다.\n사이트 부담을 줄이려고 요청 사이에 무작위로 쉬기 때문에 시간이 걸립니다(창을 닫아도 서버에서 계속됩니다). 계속할까요?`,
      )
    ) {
      crawl.startIdols();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-black md:text-3xl">아이돌 그룹 관리</h2>
          <p className="mt-1 text-sm text-white/40">아이돌 그룹 정보, 멤버, 이미지를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"
            disabled={crawl.running}
            onClick={() => crawl.startGroups()}
          >
            그룹 크롤링
          </button>
          <button
            className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"
            disabled={crawl.running}
            onClick={startIdolCrawl}
          >
            아이돌 크롤링(오늘 분량)
          </button>
        </div>
      </div>

      {(message || crawl.message) && <p className="text-sm text-white/70">{crawl.message || message}</p>}
      <CrawlStatusPanel status={crawl.status} idolProgress={crawl.idolProgress} />

      <form
        className="flex gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          run(() => adminService.createGroup(name.trim(), image), '그룹을 추가했습니다.').then((ok) => {
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
          {query.trim() ? `${filtered.length} / ${groups.length}개` : `전체 ${groups.length}개`}
        </p>
      </div>

      <ul className="divide-y divide-white/10">
        {filtered.map((group) => (
          <li key={group.id} className="flex items-center gap-3 py-2">
            {group.image_url ? (
              <img src={group.image_url} alt={group.name} className="w-14 h-14 rounded object-cover" />
            ) : (
              <div className="w-14 h-14 rounded bg-white/10 flex items-center justify-center text-[10px] text-white/40">
                이미지 없음
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate">{group.name}</p>
              {!group.source_url ? (
                <p className="text-xs text-white/40">원본 주소 없음</p>
              ) : (
                <p className="text-xs text-white/40">
                  {group.members_crawled_at
                    ? `멤버 수집: ${new Date(group.members_crawled_at).toLocaleDateString()}`
                    : '멤버 미수집'}
                </p>
              )}
            </div>

            <Link
              to={`/admin/groups/${group.id}`}
              className="text-sm px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              멤버 관리
            </Link>

            <label
              className={`text-sm px-2 py-1 rounded bg-white/10 cursor-pointer ${
                busyId === group.id ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {busyId === group.id ? '업로드 중...' : group.image_url ? '이미지 수정' : '이미지 추가'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  replaceImage(group, e.target.files?.[0]);
                  e.target.value = ''; // 같은 파일을 다시 골라도 동작하도록 초기화
                }}
              />
            </label>

            <button
              className="text-sm px-2 py-1 rounded bg-red-500/80"
              onClick={() => {
                if (window.confirm(`'${group.name}' 그룹을 삭제할까요?\n이 그룹의 아이돌도 함께 삭제됩니다.`)) {
                  run(() => adminService.deleteGroup(group.id), '삭제했습니다.');
                }
              }}
            >
              삭제
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-6 text-center text-sm text-white/50">
            {groups.length === 0 ? '등록된 그룹이 없습니다.' : '검색 결과가 없습니다.'}
          </li>
        )}
      </ul>
    </div>
  );
}
