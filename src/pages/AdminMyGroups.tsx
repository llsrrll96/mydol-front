import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Image, RefreshCw, Trash2, Users } from 'lucide-react';
import { myGroupService, MyGroup } from '@/features/my-group/services';

export const AdminMyGroups = () => {
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    try {
      setGroups(myGroupService.getAll());
      setError('');
    } catch (err) {
      console.error('나만의 그룹 목록을 불러오지 못했습니다.', err);
      setError('그룹 목록을 읽지 못했습니다. 브라우저 저장 데이터를 확인해주세요.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = (group: MyGroup) => {
    if (!window.confirm(`'${group.name}' 그룹을 이 브라우저에서 삭제할까요?`)) return;
    try {
      myGroupService.delete(group.id);
      load();
    } catch (err) {
      console.error('나만의 그룹 삭제에 실패했습니다.', err);
      setError('그룹을 삭제하지 못했습니다.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black md:text-3xl">나만의 그룹 관리</h2>
          <p className="mt-1 text-sm text-white/40">이 브라우저에 저장된 나만의 그룹을 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      <div className="rounded-xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-sm text-amber-100/70">
        현재 나만의 그룹은 서버에 저장되지 않고 브라우저별로 관리됩니다. 따라서 여기에는 이 브라우저에 저장된 그룹만 표시됩니다.
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
          <p>{error}</p>
          <button type="button" onClick={load} className="mt-3 rounded-lg bg-white/10 px-3 py-2">
            다시 시도
          </button>
        </div>
      )}

      {!error && groups.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-card py-14 text-center">
          <Users size={38} className="text-white/25" />
          <p className="text-sm text-white/45">이 브라우저에 저장된 그룹이 없습니다.</p>
        </div>
      )}

      {!error && groups.length > 0 && (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-card">
          {groups.map((group) => (
            <li key={group.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
              {group.imageUrl ? (
                <img src={group.imageUrl} alt={group.name} className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-white/30">
                  <Image size={22} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{group.name || '이름 없는 그룹'}</h3>
                <p className="mt-1 text-xs text-white/40">{group.memberIds.length}명 · 브라우저 저장</p>
              </div>
              <Link
                to={`/admin/my-groups/${group.id}`}
                className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                수정
              </Link>
              <button
                type="button"
                onClick={() => remove(group)}
                aria-label={`${group.name} 삭제`}
                className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
              >
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
