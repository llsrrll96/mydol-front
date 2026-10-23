import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { ADMIN_TOKEN_KEY, adminService } from '@/services/admin';

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await adminService.login(username, password);
      if (data.user.role !== 'ADMIN') throw new Error('not admin');
      localStorage.setItem(ADMIN_TOKEN_KEY, data.access_token);
      navigate('/admin', { replace: true });
    } catch (err) {
      // 429(시도 횟수 초과)는 서버 메시지를 그대로 보여준다.
      if (isAxiosError(err) && err.response?.status === 429) {
        setError(err.response.data?.detail ?? '로그인 시도가 너무 많습니다.');
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-16 space-y-3">
      <h1 className="text-xl font-bold mb-4">관리자 로그인</h1>
      <input
        className="w-full p-2 rounded bg-white/10"
        placeholder="아이디"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="w-full p-2 rounded bg-white/10"
        type="password"
        placeholder="비밀번호"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        disabled={loading || !username || !password}
        className="w-full p-2 rounded bg-pink-500 disabled:opacity-50"
      >
        {loading ? '확인 중...' : '로그인'}
      </button>
    </form>
  );
}
