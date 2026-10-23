import { isAxiosError } from 'axios';
import { api } from './api';
import type {
  IdolGroupResponse,
  IdolPageResponse,
  IdolResponse,
} from '@/features/tier-list/types';

export const ADMIN_TOKEN_KEY = 'admin_token';

export interface AdminLoginResponse {
  access_token: string;
  user: { id: string; username: string; role: string };
  message: string;
}

/* ---------- 크롤링 ---------- */

export type CrawlJob = 'groups' | 'idols';

export interface CrawlFailure {
  name: string;
  reason: string;
}

export interface CrawlResult {
  job: CrawlJob;
  added: number;
  updated?: number;
  skipped: number;
  failed: CrawlFailure[];
  error: string | null;
  finished_at: string;
  // 아이돌 크롤링 전용
  groups_total?: number;
  groups_done?: number;
  groups_without_members?: number;
  /** 그룹 크롤링: 사이트에서 읽어 온 그룹 수 */
  crawled_total?: number;
  /** 화면에서 자세히 보여주기 위한 항목 목록 */
  added_items?: string[];
  updated_items?: string[];
  skipped_items?: string[];
  /** 하루 상한 등으로 일부만 처리했을 때의 안내 문구 */
  notice?: string;
  progress?: IdolCrawlProgress;
}

/** GET /api/crawl/idols/progress — 아이돌 크롤링이 어디까지 진행됐는지 */
export interface IdolCrawlProgress {
  total: number;
  done: number;
  pending: number;
  today_done: number;
  daily_limit: number;
  remaining_today: number;
  days_left: number;
  next_groups: string[];
}

export interface CrawlProgress {
  done: number;
  total: number;
  current: string;
}

export interface CrawlStatus {
  running: boolean;
  job: CrawlJob | null;
  started_at: string | null;
  progress: CrawlProgress | null;
  last_result: CrawlResult | null;
}

/** 서버가 내려준 detail 메시지가 있으면 그것을, 없으면 fallback 을 돌려준다. */
export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string' && detail) return detail;
  }
  return fallback;
};

const toForm = (fields: Record<string, string | number | File | null | undefined>) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, typeof value === 'number' ? String(value) : value);
    }
  });
  return form;
};

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const adminService = {
  /* 인증 */
  /** POST /api/auth/admin/login */
  login: (username: string, password: string) =>
    api.post<AdminLoginResponse>('/api/auth/admin/login', { username, password }),
  /** GET /api/users/me (JWT 필요) */
  me: () => api.get<{ id: string; username: string; role: string }>('/api/users/me'),

  /* 크롤링 */
  /** POST /api/crawl — 그룹 크롤링 (새 그룹 추가 + 기존 그룹의 원본 주소 보완) */
  crawlGroups: () => api.post('/api/crawl'),
  /** POST /api/crawl/idols — 아이돌 크롤링. groupId 를 주면 해당 그룹만 */
  crawlIdols: (groupId?: number) =>
    api.post('/api/crawl/idols', null, { params: groupId !== undefined ? { group_id: groupId } : {} }),
  /** GET /api/crawl/idols/progress — 전체/완료/남은 그룹 수, 오늘 처리량 */
  idolCrawlProgress: () => api.get<IdolCrawlProgress>('/api/crawl/idols/progress'),
  /** GET /api/crawl/status — 진행 여부·진행률·마지막 결과 */
  crawlStatus: () => api.get<CrawlStatus>('/api/crawl/status'),

  /* 그룹 (ADMIN: 생성·수정·삭제) */
  getGroup: (id: number) => api.get<IdolGroupResponse>(`/api/idol-groups/${id}`),
  createGroup: (name: string, image?: File | null) =>
    api.post<IdolGroupResponse>('/api/idol-groups', toForm({ name, image }), multipart),
  /** 이름/이미지 중 바꿀 것만 보낸다. */
  updateGroup: (id: number, changes: { name?: string; image?: File }) =>
    api.put<IdolGroupResponse>(`/api/idol-groups/${id}`, toForm({ ...changes }), multipart),
  deleteGroup: (id: number) => api.delete(`/api/idol-groups/${id}`),

  /* 아이돌 (ADMIN: 생성·수정·삭제) */
  listIdols: (params: { group_id?: number; q?: string; page?: number; page_size?: number }) =>
    api.get<IdolPageResponse>('/api/idols', { params }),
  createIdol: (groupId: number, name: string, image?: File | null) =>
    api.post<IdolResponse>('/api/idols', toForm({ group_id: groupId, name, image }), multipart),
  /** 이름/이미지 중 바꿀 것만 보낸다. */
  updateIdol: (id: number, changes: { name?: string; image?: File }) =>
    api.put<IdolResponse>(`/api/idols/${id}`, toForm({ ...changes }), multipart),
  deleteIdol: (id: number) => api.delete(`/api/idols/${id}`),
};
