export interface MyGroup {
  id: string;
  name: string;
  imageUrl: string | null;
  memberIds: string[];
  updatedAt: string;
}

const STORAGE_KEY = 'mydol_custom_groups';

const isMyGroup = (value: unknown): value is MyGroup => {
  if (typeof value !== 'object' || value === null) return false;
  const group = value as Record<string, unknown>;
  return (
    typeof group.id === 'string' &&
    typeof group.name === 'string' &&
    (typeof group.imageUrl === 'string' || group.imageUrl === null) &&
    Array.isArray(group.memberIds) &&
    group.memberIds.every((id) => typeof id === 'string') &&
    typeof group.updatedAt === 'string'
  );
};

const readGroups = (): MyGroup[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isMyGroup)) {
    throw new Error('저장된 그룹 데이터 형식이 올바르지 않습니다.');
  }
  return parsed;
};

export const myGroupService = {
  getAll: () => readGroups(),

  getById: (id: string) => readGroups().find((group) => group.id === id) ?? null,

  save: (group: MyGroup) => {
    const groups = readGroups();
    const index = groups.findIndex((item) => item.id === group.id);
    if (index >= 0) groups[index] = group;
    else groups.unshift(group);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  },

  delete: (id: string) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(readGroups().filter((group) => group.id !== id))
    );
  },
};
