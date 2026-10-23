import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-extrabold tracking-tighter sm:text-7xl bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
          Create Your Best Tiers
        </h2>
        <p className="text-xl text-white/50 max-w-[600px] mx-auto">
          가장 좋아하는 아이돌을 티어별로 분류하고 친구들과 공유해보세요.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/tier-lists/new"
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(236,72,153,0.45)]"
        >
          티어표 만들기
        </Link>
        <Link
          to="/tier-lists"
          className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors active:scale-95"
        >
          둘러보기
        </Link>
        <Link
          to="/my-groups/new"
          className="px-8 py-4 bg-white/5 border border-pink-400/30 text-pink-100 rounded-full font-bold text-lg hover:bg-pink-400/10 transition-colors active:scale-95"
        >
          나만의 그룹 만들기
        </Link>
      </div>
    </div>
  );
};
