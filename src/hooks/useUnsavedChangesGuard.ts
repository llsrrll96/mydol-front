import { useEffect } from 'react';

/**
 * Warns the user before leaving while there are unsaved changes.
 * Covers two cases:
 *  - tab close / refresh  -> native beforeunload dialog
 *  - browser back button  -> confirm() prompt (a sentinel history entry is
 *    pushed so the popstate can be intercepted and cancelled).
 */
export const useUnsavedChangesGuard = (
  enabled: boolean,
  message = '작성 중인 티어표가 저장되지 않았습니다. 정말 나가시겠어요?'
) => {
  useEffect(() => {
    if (!enabled) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const onPopState = () => {
      if (window.confirm(message)) {
        window.removeEventListener('popstate', onPopState);
        window.history.back(); // leave for real
      } else {
        window.history.pushState(null, '', window.location.href); // stay
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, [enabled, message]);
};
