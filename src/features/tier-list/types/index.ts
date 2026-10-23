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

/** GET /api/idol-groups → IdolGroupResponse */
export interface IdolGroupResponse {
  id: number;
  name: string;
  image_url?: string | null;
  /** 크롤링 원본 그룹 페이지 경로 (예: /team/222). 아이돌 크롤링에 쓰인다. */
  source_url?: string | null;
  /** 이 그룹의 멤버를 마지막으로 수집한 시각 (없으면 아직 수집 전) */
  members_crawled_at?: string | null;
  created_at?: string | null;
}

/** GET /api/idols → IdolResponse (그룹에 속한 개별 아이돌) */
export interface IdolResponse {
  id: number;
  group_id: number | null;
  name: string;
  image_url: string | null;
  is_preset: boolean;
  source_url: string | null;
  /** 크롤링 부가 정보 (color, mark 등). 필드는 늘어날 수 있다. */
  meta: Record<string, unknown> | null;
  created_at?: string | null;
}

/** GET /api/idols → IdolPageResponse */
export interface IdolPageResponse {
  items: IdolResponse[];
  total: number;
  page: number;
  page_size: number;
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
