import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, unwrapList } from '../api/client';
import type { Order } from '../types';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const ONLINE_PAYMENT_PROVIDERS = new Set(['CARD', 'APPLE_PAY', 'INSTAPAY']);

function canSelectStatus(order: Order, status: string) {
  if (
    status === 'CONFIRMED' &&
    order.paymentProvider &&
    ONLINE_PAYMENT_PROVIDERS.has(order.paymentProvider) &&
    order.paymentStatus !== 'PAID'
  ) {
    return false;
  }
  return true;
}

function badgeClass(value: string) {
  if (['PAID', 'DELIVERED', 'CONFIRMED'].includes(value)) return 'bg-success/10 text-success';
  if (['FAILED', 'CANCELLED', 'REFUNDED'].includes(value)) return 'bg-sale/10 text-sale';
  return 'bg-secondary text-tertiary';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await unwrapList<Order>(
        api.get('/admin/orders', {
          params: { limit: 50, ...(statusFilter ? { status: statusFilter } : {}) },
        })
      );
      setOrders(result.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    const order = orders.find((item) => item.id === id);
    if (order && !canSelectStatus(order, status)) {
      setError('Online orders must be paid before they can be confirmed.');
      return;
    }

    setMessage('');
    setError('');
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      setMessage('Order status updated');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="mt-1 text-tertiary">View and update customer orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-black/10 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {message && <p className="mt-4 text-sm text-success">{message}</p>}
      {error && <p className="mt-4 text-sm text-sale">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-secondary/60 text-xs uppercase tracking-wider text-tertiary">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-tertiary">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-tertiary">No orders found</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/orders/${order.id}`} className="text-primary underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.user?.email ?? '—'}</td>
                  <td className="px-4 py-3">AED {Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ${badgeClass(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                      {order.paymentProvider && (
                        <span className="text-xs text-tertiary">{order.paymentProvider}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="rounded border border-black/10 bg-white px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} disabled={!canSelectStatus(order, s)}>{s}</option>
                      ))}
                    </select>
                    {order.paymentProvider &&
                      ONLINE_PAYMENT_PROVIDERS.has(order.paymentProvider) &&
                      order.paymentStatus !== 'PAID' && (
                        <p className="mt-1 max-w-44 text-xs text-tertiary">
                          Await payment before confirmation.
                        </p>
                      )}
                  </td>
                  <td className="px-4 py-3 text-tertiary">
                    {new Date(order.createdAt).toLocaleDateString()}
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
