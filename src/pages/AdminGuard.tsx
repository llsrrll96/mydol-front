import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ADMIN_TOKEN_KEY, adminService } from '@/services/admin';

/**
 * /admin 하위 라우트 보호. 화면 접근 편의용이며,
 * 실제 권한 검사는 백엔드(require_admin)가 한다.
 */
export function AdminGuard() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
      setOk(false);
      return;
    }
    adminService
      .me()
      .then(({ data }) => setOk(data.role === 'ADMIN'))
      .catch(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setOk(false);
      });
  }, []);

  if (ok === null) return null;
  return ok ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
