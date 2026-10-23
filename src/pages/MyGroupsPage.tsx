import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Image, Plus, Users } from 'lucide-react';
import { myGroupService, MyGroup } from '@/features/my-group/services';

export const MyGroupsPage = () => {
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      setGroups(myGroupService.getAll());
    } catch (err) {
      console.error('저장된 그룹을 불러오지 못했습니다.', err);
      setError('저장된 그룹을 불러오지 못했습니다. 브라우저 저장 공간을 확인해주세요.');
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">나만의 그룹</h1>
          <p className="text-white/40 text-sm mt-1">좋아하는 멤버를 모아 나만의 유닛을 만들어보세요.</p>
        </div>
        <Link
          to="/my-groups/new"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={18} />
          <span>그룹 만들기</span>
        </Link>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {!error && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Users className="text-white/20" size={48} />
          <p className="text-white/40">아직 만든 그룹이 없어요.</p>
          <Link
            to="/my-groups/new"
            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
          >
            첫 그룹 만들기
          </Link>
        </div>
      )}

      {!error && groups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/my-groups/${group.id}`}
              className="group rounded-2xl overflow-hidden bg-card border border-white/10 hover:border-pink-400/40 hover:-translate-y-1 transition-all"
            >
              <div className="aspect-square bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-transparent flex items-center justify-center overflow-hidden">
                {group.imageUrl ? (
                  <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <Image className="text-white/30 group-hover:text-pink-300/60 transition-colors" size={40} />
                )}
              </div>
              <div className="p-3">
                <h2 className="font-bold truncate group-hover:text-pink-300 transition-colors">
                  {group.name || '이름 없는 그룹'}
                </h2>
                <p className="text-xs text-white/40 mt-0.5">{group.memberIds.length}명</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
