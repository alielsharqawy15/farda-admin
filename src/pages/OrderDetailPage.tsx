import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage, unwrap } from '../api/client';
import { Alert, Field, inputClass } from '../components/ui';
import type { Order } from '../types';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const SHIPMENT_STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED'];
const ONLINE_PAYMENT_PROVIDERS = new Set(['CARD', 'APPLE_PAY', 'INSTAPAY']);

function canSelectStatus(order: Order, status: string) {
  return !(
    status === 'CONFIRMED' &&
    order.paymentProvider &&
    ONLINE_PAYMENT_PROVIDERS.has(order.paymentProvider) &&
    order.paymentStatus !== 'PAID'
  );
}

function money(value?: string | number) {
  return `AED ${Number(value ?? 0).toFixed(2)}`;
}

function productName(item: NonNullable<Order['items']>[number]) {
  return item.productSnapshot?.name || item.productName || 'Product';
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const result = await unwrap<Order>(api.get(`/admin/orders/${id}`));
      setOrder(result);
      setStatus(result.status);
      setCarrier(result.carrier ?? '');
      setTrackingNumber(result.trackingNumber ?? '');
      setShipmentStatus('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(e: FormEvent) {
    e.preventDefault();
    if (!order || !id) return;
    if (!canSelectStatus(order, status)) {
      setError('Online orders must be paid before confirmation.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.put(`/admin/orders/${id}/status`, { status, ...(description ? { description } : {}) });
      setMessage('Order status updated');
      setDescription('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateShipment(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/admin/orders/${id}/shipment`, {
        carrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        status: shipmentStatus || undefined,
      });
      setMessage('Shipment updated');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-tertiary">Loading...</p>;
  if (!order) return <Alert message={error || 'Order not found'} />;

  return (
    <div>
      <div className="mb-6 text-sm text-tertiary">
        <Link to="/orders" className="text-primary underline">Orders</Link>
        <span className="mx-2">/</span>
        <span>{order.orderNumber}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="mt-1 text-tertiary">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{order.status}</p>
          <p className="text-tertiary">{order.paymentProvider ?? 'Payment'} / {order.paymentStatus}</p>
        </div>
      </div>

      {error && <Alert message={error} />}
      {message && <Alert message={message} type="success" />}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Products</h2>
            <div className="mt-4 divide-y divide-black/5">
              {(order.items ?? []).map((item, index) => (
                <div key={item.id ?? index} className="flex justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{productName(item)}</p>
                    <p className="text-tertiary">
                      {item.productSnapshot?.brand} {item.productSnapshot?.size ? `/ Size ${item.productSnapshot.size}` : ''} {item.productSnapshot?.color ? `/ ${item.productSnapshot.color}` : ''}
                    </p>
                    {item.productSnapshot?.sku && <p className="text-xs text-tertiary">SKU {item.productSnapshot.sku}</p>}
                  </div>
                  <div className="text-right">
                    <p>Qty {item.qty}</p>
                    <p className="text-tertiary">{money(item.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Payment History</h2>
            <div className="mt-4 divide-y divide-black/5 text-sm">
              {(order.payments ?? []).map((payment) => (
                <div key={payment.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{payment.provider} / {payment.status}</p>
                    {payment.providerPaymentId && <p className="text-xs text-tertiary">{payment.providerPaymentId}</p>}
                  </div>
                  <div className="text-right">
                    <p>{money(payment.amount)}</p>
                    <p className="text-xs text-tertiary">{new Date(payment.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Inventory / Status History</h2>
            <div className="mt-4 space-y-3 text-sm">
              {(order.tracking ?? []).map((item) => (
                <div key={item.id} className="rounded border border-black/5 p-3">
                  <p className="font-medium">{item.status}</p>
                  <p className="text-tertiary">{item.description}</p>
                  <p className="mt-1 text-xs text-tertiary">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Customer</h2>
            <div className="mt-3 text-sm">
              <p>{order.user?.name || `${order.user?.firstName ?? ''} ${order.user?.lastName ?? ''}`.trim() || 'Customer'}</p>
              <p className="text-tertiary">{order.user?.email}</p>
              {order.user?.phone && <p className="text-tertiary">{order.user.phone}</p>}
            </div>
          </section>

          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Totals</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Discount</dt><dd>{money(order.discount)}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{money(order.shipping)}</dd></div>
              <div className="flex justify-between"><dt>VAT</dt><dd>{money(order.tax)}</dd></div>
              <div className="flex justify-between border-t border-black/10 pt-2 font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            </dl>
          </section>

          <form onSubmit={updateStatus} className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Safe Status Update</h2>
            <div className="mt-4 space-y-3">
              <Field label="Status">
                <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((item) => (
                    <option key={item} value={item} disabled={!canSelectStatus(order, item)}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Note">
                <textarea className={`${inputClass} min-h-20`} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <button disabled={saving} className="w-full rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-60">
                Update status
              </button>
            </div>
          </form>

          <form onSubmit={updateShipment} className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Shipment</h2>
            <div className="mt-4 space-y-3">
              <Field label="Carrier">
                <input className={inputClass} value={carrier} onChange={(e) => setCarrier(e.target.value)} />
              </Field>
              <Field label="Tracking number">
                <input className={inputClass} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              </Field>
              <Field label="Shipment status">
                <select className={inputClass} value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value)}>
                  <option value="">No status change</option>
                  {SHIPMENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <button disabled={saving} className="w-full rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-60">
                Save shipment
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
