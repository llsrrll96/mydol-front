import { useCallback, useEffect, useRef, useState } from 'react';
import { adminService, getErrorMessage, type CrawlStatus, type IdolCrawlProgress } from '@/services/admin';

/**
 * 크롤링 작업 상태를 다룬다.
 * - 화면을 열 때 서버의 현재 상태(진행 중 여부, 마지막 결과)를 가져온다.
 * - 진행 중에는 3초마다 상태를 확인하고, 끝나면 onFinished 를 한 번 호출한다.
 * - 그룹 크롤링과 아이돌 크롤링은 서버에서 하나의 잠금을 공유하므로 둘이 동시에 돌지 않는다.
 */
export function useCrawlJob(onFinished?: () => void | Promise<void>) {
  const [status, setStatus] = useState<CrawlStatus | null>(null);
  const [message, setMessage] = useState('');
  const [idolProgress, setIdolProgress] = useState<IdolCrawlProgress | null>(null);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await adminService.crawlStatus();
      setStatus(data);
      return data;
    } catch {
      return null; // 일시적인 오류는 다음 주기에 다시 확인한다.
    }
  }, []);

  // 아이돌 크롤링 현황(어디까지 했는지·오늘 처리량). 컬럼 미생성 등으로 실패하면 표시만 생략한다.
  const refreshProgress = useCallback(async () => {
    try {
      const { data } = await adminService.idolCrawlProgress();
      setIdolProgress(data);
    } catch {
      setIdolProgress(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshProgress();
  }, [refresh, refreshProgress]);

  const running = status?.running ?? false;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(async () => {
      const data = await refresh();
      if (data && !data.running) {
        await refreshProgress();
        await onFinishedRef.current?.();
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [running, refresh, refreshProgress]);

  const start = useCallback(
    async (request: () => Promise<unknown>, startedMessage: string) => {
      setMessage('');
      try {
        await request();
        setMessage(startedMessage);
      } catch (err) {
        // 409: 이미 실행 중 — 서버 메시지를 보여주고 진행 상황을 이어서 표시한다.
        setMessage(getErrorMessage(err, '크롤링 요청에 실패했습니다. 로그인이 만료되었을 수 있습니다.'));
      }
      await refresh();
      await refreshProgress();
    },
    [refresh, refreshProgress],
  );

  return {
    status,
    running,
    message,
    idolProgress,
    startGroups: () => start(() => adminService.crawlGroups(), '그룹 크롤링을 시작했습니다.'),
    startIdols: (groupId?: number) =>
      start(() => adminService.crawlIdols(groupId), '아이돌 크롤링을 시작했습니다.'),
  };
}
