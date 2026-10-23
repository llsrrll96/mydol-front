import { api } from '@/services/api';
import {
  IdolGroupResponse,
  IdolPageResponse,
  TierListCreate,
  TierListPageResponse,
  TierListResponse,
  TierListUpdate,
} from '../types';

export const tierListService = {
  /** GET /api/tier-lists — paged listing (newest first). */
  getAll: (page = 1, pageSize = 50) =>
    api.get<TierListPageResponse>('/api/tier-lists', {
      params: { page, page_size: pageSize },
    }),
  /** GET /api/tier-lists/:id — detail. */
  getById: (id: string) => api.get<TierListResponse>(`/api/tier-lists/${id}`),
  /** POST /api/tier-lists — create. */
  create: (data: TierListCreate) => api.post<TierListResponse>('/api/tier-lists', data),
  /** PUT /api/tier-lists/:id — update. */
  update: (id: string, data: TierListUpdate) =>
    api.put<TierListResponse>(`/api/tier-lists/${id}`, data),
  /** DELETE /api/tier-lists/:id?password=... */
  delete: (id: string, password: string) =>
    api.delete(`/api/tier-lists/${id}`, { params: { password } }),
};

export const idolService = {
  /** GET /api/idol-groups — all idol groups (provides image_url). */
  getAll: () => api.get<IdolGroupResponse[]>('/api/idol-groups'),
  /** GET /api/idols — paged member catalog. */
  getMembers: (page = 1, pageSize = 500) =>
    api.get<IdolPageResponse>('/api/idols', {
      params: { page, page_size: pageSize },
    }),
};
