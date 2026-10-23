const STORAGE_KEY = 'mydol_tier_list_likes';

export interface TierListLikeRecord {
  count: number;
  voterIds: string[];
}

export type TierListLikes = Record<string, TierListLikeRecord>;

const isTierListLikes = (value: unknown): value is TierListLikes => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

  return Object.values(value).every(
    (record) =>
      typeof record === 'object' &&
      record !== null &&
      'count' in record &&
      typeof record.count === 'number' &&
      Number.isFinite(record.count) &&
      record.count >= 0 &&
      'voterIds' in record &&
      Array.isArray(record.voterIds) &&
      record.voterIds.every((id) => typeof id === 'string')
  );
};

const readLikes = (): TierListLikes => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};

  const parsed: unknown = JSON.parse(stored);
  if (!isTierListLikes(parsed)) {
    throw new Error('저장된 좋아요 정보 형식이 올바르지 않습니다.');
  }
  return parsed;
};

export const tierListLikesService = {
  getAll: () => readLikes(),

  toggle: (listId: number, voterId: string) => {
    const likes = readLikes();
    const key = String(listId);
    const current = likes[key] ?? { count: 0, voterIds: [] };
    const alreadyLiked = current.voterIds.includes(voterId);
    const voterIds = alreadyLiked
      ? current.voterIds.filter((id) => id !== voterId)
      : [...current.voterIds, voterId];
    const updated = { count: voterIds.length, voterIds };

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...likes, [key]: updated }));
    return updated;
  },
};
