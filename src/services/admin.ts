import { api } from './api';

export const ADMIN_TOKEN_KEY = 'admin_token';

export interface AdminLoginResponse {
  access_token: string;
  user: { id: string; username: string; role: string };
  message: string;
}

export const adminService = {
  /** POST /api/auth/admin/login */
  login: (username: string, password: string) =>
    api.post<AdminLoginResponse>('/api/auth/admin/login', { username, password }),
  /** GET /api/users/me (JWT 필요) */
  me: () => api.get<{ id: string; username: string; role: string }>('/api/users/me'),
  /** POST /api/crawl (ADMIN) */
  crawl: () => api.post('/api/crawl'),
  /** POST /api/idols (ADMIN, multipart) */
  createIdol: (name: string, image?: File | null) => {
    const form = new FormData();
    form.append('name', name);
    if (image) form.append('image', image);
    return api.post('/api/idols', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  /** PUT /api/idols/:id (ADMIN, multipart) — 이름/이미지 중 바꿀 것만 보낸다. */
  updateIdol: (id: number, changes: { name?: string; image?: File }) => {
    const form = new FormData();
    if (changes.name !== undefined) form.append('name', changes.name);
    if (changes.image) form.append('image', changes.image);
    return api.put(`/api/idols/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  /** DELETE /api/idols/:id (ADMIN) */
  deleteIdol: (id: number) => api.delete(`/api/idols/${id}`),
};
