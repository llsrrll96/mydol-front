import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { TierListsPage } from '@/pages/TierListsPage';
import { TierListEditor } from '@/pages/TierListEditor';
import { AdminLogin } from '@/pages/AdminLogin';
import { AdminGuard } from '@/pages/AdminGuard';
import { AdminGroups } from '@/pages/AdminGroups';
import { AdminIdols } from '@/pages/AdminIdols';

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
                만들기
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
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminGroups />} />
              <Route path="/admin/groups/:groupId" element={<AdminIdols />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
