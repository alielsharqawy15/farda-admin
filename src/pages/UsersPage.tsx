import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage, unwrapList } from '../api/client';
import type { User } from '../types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await unwrapList<User>(
        api.get('/users/admin/users', {
          params: {
            limit: 50,
            ...(search ? { search } : {}),
            ...(role ? { role } : {}),
          },
        })
      );
      setUsers(result.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-tertiary">Customer and admin accounts</p>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Search email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-black/10 bg-white px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded border border-black/10 bg-white px-3 py-2 text-sm"
          >
            <option value="">All roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-sale">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-secondary/60 text-xs uppercase tracking-wider text-tertiary">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-tertiary">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-tertiary">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3">{user.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${user.role === 'ADMIN' ? 'bg-primary text-white' : 'bg-secondary'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user._count?.orders ?? 0}</td>
                  <td className="px-4 py-3 text-tertiary">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
