import type { CrawlStatus, IdolCrawlProgress } from '@/services/admin';

const JOB_LABEL = { groups: '그룹', idols: '아이돌' } as const;

/** 아이돌 수집 현황: 전체 중 어디까지 했는지, 오늘 처리량, 앞으로 걸릴 일수. */
function IdolProgressCard({ p }: { p: IdolCrawlProgress }) {
  const percent = p.total > 0 ? (p.done / p.total) * 100 : 0;
  return (
    <div className="rounded bg-white/5 p-3 text-sm space-y-2">
      <p>
        아이돌 수집 현황 — 그룹 {p.done}/{p.total} 완료
        <span className="text-white/60">
          {' '}
          · 오늘 {p.today_done}/{p.daily_limit}
          {p.pending > 0 ? ` · 남은 ${p.pending}개 (약 ${p.days_left}일)` : ' · 모두 완료'}
        </span>
      </p>
      <div className="h-1.5 rounded bg-white/10 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
      {p.next_groups.length > 0 && (
        <p className="text-xs text-white/50">다음 순서: {p.next_groups.join(', ')}{p.pending > p.next_groups.length ? ' …' : ''}</p>
      )}
    </div>
  );
}

/** 크롤링 진행률과 마지막 결과(추가/보완/기존/실패)를 보여준다. */
export function CrawlStatusPanel({
  status,
  idolProgress,
}: {
  status: CrawlStatus | null;
  idolProgress?: IdolCrawlProgress | null;
}) {
  const progressCard = idolProgress ? <IdolProgressCard p={idolProgress} /> : null;
  const result = renderStatus(status);
  if (!result && !progressCard) return null;
  return (
    <div className="space-y-2">
      {progressCard}
      {result}
    </div>
  );
}

function renderStatus(status: CrawlStatus | null) {
  if (!status) return null;

  if (status.running) {
    const label = status.job ? JOB_LABEL[status.job] : '';
    const p = status.progress;
    return (
      <div className="rounded bg-white/5 p-3 text-sm space-y-2">
        <p>
          {label} 크롤링 진행 중…
          {p && p.total > 0 && (
            <span className="text-white/60">
              {' '}
              {p.done}/{p.total} {p.current && `· ${p.current}`}
            </span>
          )}
        </p>
        {p && p.total > 0 && (
          <div className="h-1.5 rounded bg-white/10 overflow-hidden">
            <div className="h-full bg-pink-500" style={{ width: `${(p.done / p.total) * 100}%` }} />
          </div>
        )}
      </div>
    );
  }

  const r = status.last_result;
  if (!r) return null;
  return <ResultCard r={r} />;
}

const WORDS = {
  groups: { added: '새로 추가', updated: '원본 주소 보완', skipped: '변경 없음' },
  idols: { added: '새 멤버 추가', updated: '기존 멤버 보완', skipped: '변경 없음' },
} as const;

const HELP = {
  groups:
    '새로 추가 = DB에 없던 그룹을 저장함 · 원본 주소 보완 = 이미 있던 그룹의 비어 있던 원본 주소(source_url)를 채움 · 변경 없음 = 이미 있고 채울 값도 없음',
  idols:
    '새 멤버 추가 = 그룹에 없던 멤버를 저장함 · 기존 멤버 보완 = 이미 있던 멤버의 비어 있던 값(이미지·주소·컬러/마크)을 채움 · 변경 없음 = 이미 있고 채울 값도 없음',
} as const;

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="rounded bg-white/5 px-3 py-2 min-w-[5.5rem]">
      <p className="text-[11px] text-white/50">{label}</p>
      <p className={`text-lg font-semibold ${tone === 'bad' ? 'text-red-300' : tone === 'ok' ? 'text-emerald-300' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function Items({ title, items, open }: { title: string; items?: string[]; open?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <details open={open} className="rounded bg-white/5 px-3 py-2">
      <summary className="cursor-pointer select-none">
        {title} <span className="text-white/50">({items.length})</span>
      </summary>
      <ul className="mt-2 list-disc pl-5 max-h-60 overflow-auto text-white/80 space-y-0.5">
        {items.map((it, i) => (
          <li key={`${it}-${i}`}>{it}</li>
        ))}
      </ul>
    </details>
  );
}

function ResultCard({ r }: { r: NonNullable<CrawlStatus['last_result']> }) {
  const label = JOB_LABEL[r.job];
  const words = WORDS[r.job];
  const failedItems = r.failed.map((f) => `${f.name} — ${f.reason}`);

  return (
    <div className="rounded bg-white/5 p-3 text-sm space-y-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="font-medium">
          {label} 크롤링 {r.error ? '중단 (중단 시점까지의 결과)' : '완료'}
        </p>
        <p className="text-xs text-white/40">{new Date(r.finished_at).toLocaleString()}</p>
      </div>

      {r.error && <p className="text-red-400">원인: {r.error}</p>}
      {r.notice && <p className="text-amber-300">{r.notice}</p>}

      <div className="flex gap-2 flex-wrap">
        {r.job === 'groups' && r.crawled_total !== undefined && (
          <Stat label="사이트에서 읽은 그룹" value={r.crawled_total} />
        )}
        {r.job === 'idols' && r.groups_total !== undefined && (
          <Stat label="이번 대상 그룹" value={`${r.groups_done ?? 0}/${r.groups_total}`} />
        )}
        <Stat label={words.added} value={r.added} tone={r.added ? 'ok' : undefined} />
        <Stat label={words.updated} value={r.updated ?? 0} tone={r.updated ? 'ok' : undefined} />
        <Stat label={words.skipped} value={r.skipped} />
        <Stat label="실패" value={r.failed.length} tone={r.failed.length ? 'bad' : undefined} />
        {r.job === 'idols' && !!r.groups_without_members && (
          <Stat label="멤버 없는 그룹" value={r.groups_without_members} />
        )}
      </div>

      <p className="text-xs text-white/40">{HELP[r.job]}</p>

      <div className="space-y-2">
        <Items title="실패 (원인 포함)" items={failedItems} open />
        <Items title={words.added} items={r.added_items} />
        <Items title={words.updated} items={r.updated_items} />
        <Items title={words.skipped} items={r.skipped_items} />
      </div>
    </div>
  );
}
