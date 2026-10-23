export type TierType = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

/* ---------- Front-end board model ---------- */

/** A draggable card on the board (one idol group). */
export interface TierItem {
  id: string; // String(IdolGroupResponse.id)
  name: string;
  imageUrl: string;
}

/** A tier row (S ~ E) plus the items currently inside it. */
export interface Tier {
  id: TierType;
  title: string;
  items: TierItem[];
}

/* ---------- Backend DTOs (mirror openapi.json) ---------- */

/** GET /api/idols → IdolGroupResponse */
export interface IdolGroupResponse {
  id: number;
  name: string;
  image_url?: string | null;
  created_at?: string | null;
}

/** A single tier as stored by the backend (references idol ids). */
export interface ApiTier {
  label: string;
  color: string;
  idol_group_ids: number[];
}

/** GET /api/tier-lists/{id} → TierListResponse */
export interface TierListResponse {
  id: number;
  title: string;
  tiers: ApiTier[];
  created_at?: string | null;
  updated_at?: string | null;
}

/** GET /api/tier-lists → TierListPageResponse */
export interface TierListPageResponse {
  items: TierListResponse[];
  total: number;
  page: number;
  page_size: number;
}

/** POST body */
export interface TierListCreate {
  title: string;
  tiers?: ApiTier[];
  password?: string;
  creator_id?: string;
}

/** PUT body */
export interface TierListUpdate {
  title?: string;
  tiers?: ApiTier[];
  password?: string;
}
