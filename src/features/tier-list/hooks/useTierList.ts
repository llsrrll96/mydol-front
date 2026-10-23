import { useMemo, useState } from 'react';
import { ApiTier, TierItem, TierType } from '../types';

/** Ordered tiers shown on the board. */
export const TIER_ORDER: TierType[] = ['S', 'A', 'B', 'C', 'D', 'E'];

export const TIER_TITLES: Record<TierType, string> = {
  S: 'S TIER',
  A: 'A TIER',
  B: 'B TIER',
  C: 'C TIER',
  D: 'D TIER',
  E: 'E TIER',
};

/** Tailwind background tokens (defined in tailwind.config.js). */
export const TIER_COLORS: Record<TierType, string> = {
  S: 'bg-tier-s',
  A: 'bg-tier-a',
  B: 'bg-tier-b',
  C: 'bg-tier-c',
  D: 'bg-tier-d',
  E: 'bg-tier-e',
};

/** Hex values sent to the backend (ApiTier.color). */
export const TIER_HEX: Record<TierType, string> = {
  S: '#FF7F7F',
  A: '#FFBF7F',
  B: '#FFFF7F',
  C: '#7FFF7F',
  D: '#7EFFFF',
  E: '#BF7FFF',
};

export const POOL_ID = 'pool';
export type ContainerId = TierType | typeof POOL_ID;

export type Containers = Record<ContainerId, TierItem[]>;

const emptyContainers = (): Containers => {
  const base = { [POOL_ID]: [] } as Containers;
  TIER_ORDER.forEach((t) => {
    base[t] = [];
  });
  return base;
};

export const useTierList = () => {
  const [containers, setContainers] = useState<Containers>(emptyContainers);

  /** Which container holds a given item / container id. */
  const findContainer = (id: string): ContainerId | undefined => {
    if (id in containers) return id as ContainerId;
    return (Object.keys(containers) as ContainerId[]).find((key) =>
      containers[key].some((item) => item.id === id)
    );
  };

  /** Replace the pool contents (e.g. after fetching idol groups). */
  const setPool = (items: TierItem[]) =>
    setContainers((prev) => ({ ...prev, [POOL_ID]: items }));

  /**
   * Hydrate the board from a backend tier list. Each ApiTier references idol
   * ids, so we resolve them against the full idol list; leftovers go to pool.
   */
  const hydrate = (apiTiers: ApiTier[], allIdols: TierItem[]) => {
    const byId = new Map(allIdols.map((i) => [i.id, i]));
    const next = emptyContainers();
    const placed = new Set<string>();

    apiTiers.forEach((tier) => {
      const key = tier.label.toUpperCase() as TierType;
      if (!(key in next)) return;
      const items = tier.idol_group_ids
        .map((gid) => byId.get(String(gid)))
        .filter((i): i is TierItem => Boolean(i));
      next[key] = items;
      items.forEach((i) => placed.add(i.id));
    });

    next[POOL_ID] = allIdols.filter((i) => !placed.has(i.id));
    setContainers(next);
  };

  /** Serialize the board into the backend payload shape (ApiTier[]). */
  const toApiTiers = (): ApiTier[] =>
    TIER_ORDER.map((id) => ({
      label: id,
      color: TIER_HEX[id],
      idol_group_ids: containers[id].map((i) => Number(i.id)),
    }));

  const placedCount = useMemo(
    () => TIER_ORDER.reduce((sum, t) => sum + containers[t].length, 0),
    [containers]
  );

  return {
    containers,
    setContainers,
    findContainer,
    setPool,
    hydrate,
    toApiTiers,
    placedCount,
  };
};
