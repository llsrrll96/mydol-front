import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { TierListsPage } from '@/pages/TierListsPage';
import { TierListEditor } from '@/pages/TierListEditor';
import { AdminLogin } from '@/pages/AdminLogin';
import { AdminGuard } from '@/pages/AdminGuard';
import { AdminGroups } from '@/pages/AdminGroups';
import { AdminIdols } from '@/pages/AdminIdols';
import { AdminLayout } from '@/pages/AdminLayout';
import { AdminTierLists } from '@/pages/AdminTierLists';
import { AdminMyGroups } from '@/pages/AdminMyGroups';
import { AdminUsers } from '@/pages/AdminUsers';
import { MyGroupsPage } from '@/pages/MyGroupsPage';
import { MyGroupEditor } from '@/pages/MyGroupEditor';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/50 backdrop-blur-md">
          <div className="container mx-auto h-16 flex items-center justify-between px-4">
            <Link to="/" className="text-xl font-bold tracking-tight">
              MY<span className="text-pink-400">DOL</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link to="/tier-lists" className="px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                둘러보기
              </Link>
              <Link to="/tier-lists/new" className="px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                티어표 만들기
              </Link>
              <Link to="/my-groups" className="px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                나만의 그룹
              </Link>
            </nav>
          </div>
        </header>
        <main className="pt-20 px-4 container mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tier-lists" element={<TierListsPage />} />
            <Route path="/tier-lists/new" element={<TierListEditor />} />
            <Route path="/tier-lists/:id" element={<TierListEditor />} />
            <Route path="/my-groups" element={<MyGroupsPage />} />
            <Route path="/my-groups/new" element={<MyGroupEditor />} />
            <Route path="/my-groups/:id" element={<MyGroupEditor />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminGroups />} />
                <Route path="groups/:groupId" element={<AdminIdols />} />
                <Route path="tier-lists" element={<AdminTierLists />} />
                <Route path="my-groups" element={<AdminMyGroups />} />
                <Route path="my-groups/:id" element={<MyGroupEditor />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
