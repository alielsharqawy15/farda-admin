import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, unwrap } from '../api/client';

type AdminStats = {
  orders: number;
  products: number;
  users: number;
  categories: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats>({ orders: 0, products: 0, users: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setStats(await unwrap<AdminStats>(api.get('/admin/stats')));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: 'Products', value: loading ? '...' : stats.products, to: '/products', hint: 'Add products for mobile app' },
    { label: 'Categories', value: loading ? '...' : stats.categories, to: '/categories', hint: 'Upload category images' },
    { label: 'Orders', value: loading ? '...' : stats.orders, to: '/orders', hint: 'Customer orders' },
    { label: 'Users', value: loading ? '...' : stats.users, to: '/users', hint: 'Registered accounts' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-tertiary">Add data here - stored in database - shown in mobile app</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-lg border border-black/5 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm uppercase tracking-wider text-tertiary">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
            <p className="mt-2 text-xs text-tertiary">{card.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Getting started</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-tertiary">
          <li>Create <Link to="/categories" className="text-primary underline">brands & categories</Link> with images</li>
          <li><Link to="/products/new" className="text-primary underline">Add products</Link> with variants and photos</li>
          <li>Hot restart the mobile app to load fresh data</li>
        </ol>
      </div>
    </div>
  );
}
