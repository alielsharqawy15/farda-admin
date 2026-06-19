import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@farda.com');
  const [password, setPassword] = useState('Password123!');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, totpCode.trim() || undefined);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-tertiary">Farda Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-tertiary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-black/10 px-3 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-tertiary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-black/10 px-3 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-tertiary">2FA code</label>
            <input
              inputMode="numeric"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="w-full rounded border border-black/10 px-3 py-2 outline-none focus:border-primary"
              placeholder="Required when enabled"
            />
          </div>
          {error && <p className="text-sm text-sale">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-2.5 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
