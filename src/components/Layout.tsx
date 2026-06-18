import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/orders', label: 'Orders' },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/slider', label: 'Hero Slider' },
  { to: '/styles', label: 'Styles' },
  { to: '/store-settings', label: 'Store Settings' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/coupons', label: 'Coupons' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/returns', label: 'Returns' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/users', label: 'Users' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-primary text-white">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-lg font-semibold tracking-wide">Farda</p>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Admin</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition ${
                  isActive ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-6 py-4">
          <p className="truncate text-sm text-white/80">{user?.email}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-2 text-xs uppercase tracking-wider text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
