import { Layers, LogOut, UserRound, UserRoundPlus, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ADMIN_TOKEN_KEY } from '@/services/admin';
import { cn } from '@/lib/utils';

const navigation = [
  { to: '/admin', label: '아이돌 그룹 관리', icon: Users, end: true },
  { to: '/admin/tier-lists', label: '티어표 관리', icon: Layers },
  { to: '/admin/my-groups', label: '나만의 그룹 관리', icon: UserRoundPlus },
  { to: '/admin/users', label: '유저 관리', icon: UserRound },
];

export const AdminLayout = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 md:py-8 md:flex md:items-start md:gap-8">
      <aside className="md:sticky md:top-24 md:w-64 md:shrink-0 rounded-2xl border border-white/10 bg-card p-3 md:p-4 mb-6 md:mb-0">
        <div className="px-3 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-pink-300/70">MYDOL ADMIN</p>
          <h1 className="mt-1 text-lg font-bold">관리자 메뉴</h1>
        </div>
        <nav aria-label="관리자 메뉴" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-pink-500/15 text-pink-200 ring-1 ring-inset ring-pink-400/20'
                    : 'text-white/55 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-3 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            로그아웃
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
};
