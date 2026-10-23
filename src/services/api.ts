import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 관리자 토큰이 있으면 모든 요청에 Bearer 토큰을 붙인다.
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // localStorage 접근 불가 시 토큰 없이 진행
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 티어리스트 비밀번호 오류일 때만 안내 (관리자 로그인 401은 각 화면에서 처리)
    const url: string = error.config?.url ?? '';
    if (error.response?.status === 401 && url.startsWith('/api/tier-lists')) {
      alert('비밀번호가 일치하지 않습니다.');
    }
    return Promise.reject(error);
  }
);
