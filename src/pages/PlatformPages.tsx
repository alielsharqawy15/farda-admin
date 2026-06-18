import { FormEvent, useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { api, getErrorMessage, mediaUrl, postForm, unwrap, unwrapList } from '../api/client';
import { Alert, Field, inputClass, PageHeader } from '../components/ui';
import type {
  AnalyticsStats,
  Coupon,
  NotificationItem,
  ReturnRequest,
  Review,
  StoreSettings,
  Style,
  Variant,
} from '../types';

export function StylesPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setStyles(await unwrap<Style[]>(api.get('/admin/styles')));
  }, []);

  useEffect(() => { load().catch((err) => setError(getErrorMessage(err))); }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const form = new FormData();
    form.append('name', name);
    form.append('sortOrder', sortOrder);
    if (image) form.append('image', image);
    await postForm('/admin/styles', form);
    setName('');
    setSortOrder('0');
    setImage(null);
    setMessage('Style created');
    await load();
  }

  async function update(style: Style, patch: Partial<Style>) {
    await api.put(`/admin/styles/${style.id}`, patch);
    await load();
  }

  async function remove(style: Style) {
    if (!confirm(`Delete ${style.name}?`)) return;
    await api.delete(`/admin/styles/${style.id}`);
    await load();
  }

  return (
    <div>
      <PageHeader title="Styles" subtitle="Manage product style collections" />
      {message && <Alert message={message} type="success" />}
      {error && <Alert message={error} />}
      <form onSubmit={create} className="mb-6 grid gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm md:grid-cols-4">
        <Field label="Name"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Sort order"><input className={inputClass} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} type="number" /></Field>
        <Field label="Image"><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} /></Field>
        <button className="self-end rounded bg-primary px-4 py-2 text-sm text-white">Create style</button>
      </form>
      <div className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase text-tertiary"><tr><th className="px-4 py-3">Style</th><th>Sort</th><th>Active</th><th>Products</th><th>Actions</th></tr></thead>
          <tbody>
            {styles.map((style) => (
              <tr key={style.id} className="border-t border-black/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {style.image && <img src={mediaUrl(style.image)} alt="" className="h-10 w-10 rounded object-cover" />}
                    <div><p className="font-medium">{style.name}</p><p className="text-xs text-tertiary">{style.slug}</p></div>
                  </div>
                </td>
                <td><input className={`${inputClass} w-20`} defaultValue={style.sortOrder} id={`sort-${style.id}`} /></td>
                <td><input type="checkbox" defaultChecked={style.isActive} id={`active-${style.id}`} /></td>
                <td>{style._count?.products ?? 0}</td>
                <td className="space-x-3">
                  <button type="button" className="text-primary underline" onClick={() => update(style, {
                    sortOrder: Number((document.getElementById(`sort-${style.id}`) as HTMLInputElement).value),
                    isActive: (document.getElementById(`active-${style.id}`) as HTMLInputElement).checked,
                  })}>Save</button>
                  <button type="button" className="text-sale" onClick={() => remove(style)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({ storeName: 'Farda' });
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    unwrap<StoreSettings>(api.get('/store/settings')).then(setSettings).catch((err) => setError(getErrorMessage(err)));
  }, []);

  function setField(key: keyof StoreSettings, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const form = new FormData();
    Object.entries(settings).forEach(([key, value]) => {
      if (typeof value === 'string') form.append(key, value);
    });
    if (logo) form.append('logo', logo);
    if (banner) form.append('banner', banner);
    setSettings(await postForm<StoreSettings>('/admin/store/settings', form, 'PATCH'));
    setMessage('Store settings saved');
  }

  const fields: Array<[keyof StoreSettings, string, 'input' | 'textarea']> = [
    ['storeName', 'Store name', 'input'], ['supportEmail', 'Support email', 'input'], ['supportPhone', 'Support phone', 'input'],
    ['whatsapp', 'WhatsApp', 'input'], ['facebook', 'Facebook', 'input'], ['instagram', 'Instagram', 'input'],
    ['tiktok', 'TikTok', 'input'], ['twitter', 'Twitter/X', 'input'], ['youtube', 'YouTube', 'input'], ['linkedin', 'LinkedIn', 'input'],
    ['address', 'Address', 'textarea'], ['workingHours', 'Working hours', 'textarea'], ['aboutUs', 'About us', 'textarea'],
    ['termsConditions', 'Terms & conditions', 'textarea'], ['privacyPolicy', 'Privacy policy', 'textarea'], ['returnPolicy', 'Return policy', 'textarea'],
  ];

  return (
    <div>
      <PageHeader title="Store Settings" subtitle="Dynamic storefront identity, contacts, social links, and policies" />
      {message && <Alert message={message} type="success" />}
      {error && <Alert message={error} />}
      <form onSubmit={save} className="grid max-w-4xl gap-4 rounded-lg border border-black/5 bg-white p-6 shadow-sm md:grid-cols-2">
        {fields.map(([key, label, kind]) => (
          <Field key={key} label={label}>
            {kind === 'textarea' ? (
              <textarea className={`${inputClass} min-h-24`} value={String(settings[key] ?? '')} onChange={(e) => setField(key, e.target.value)} />
            ) : (
              <input className={inputClass} value={String(settings[key] ?? '')} onChange={(e) => setField(key, e.target.value)} />
            )}
          </Field>
        ))}
        <Field label="Logo"><input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} /></Field>
        <Field label="Banner"><input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] ?? null)} /></Field>
        <button className="rounded bg-primary px-4 py-2 text-sm text-white md:col-span-2">Save settings</button>
      </form>
    </div>
  );
}

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: '10', minOrder: '', usageLimit: '', expiresAt: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => setCoupons((await unwrapList<Coupon>(api.get('/admin/coupons'))).items), []);
  useEffect(() => { load().catch((err) => setError(getErrorMessage(err))); }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api.post('/admin/coupons', {
      ...form,
      value: Number(form.value),
      minOrder: form.minOrder ? Number(form.minOrder) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    });
    setForm({ code: '', type: 'PERCENTAGE', value: '10', minOrder: '', usageLimit: '', expiresAt: '' });
    await load();
  }

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Create and manage checkout discounts" />
      {error && <Alert message={error} />}
      <form onSubmit={create} className="mb-6 grid gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm md:grid-cols-6">
        <input className={inputClass} placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed</option><option value="FREE_SHIPPING">Free shipping</option>
        </select>
        <input className={inputClass} placeholder="Value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <input className={inputClass} placeholder="Min order" type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
        <input className={inputClass} placeholder="Usage limit" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
        <button className="rounded bg-primary px-4 py-2 text-sm text-white">Create</button>
      </form>
      <SimpleTable headers={['Code', 'Type', 'Value', 'Used', 'Active', 'Actions']} rows={coupons.map((coupon) => [
        coupon.code, coupon.type, String(coupon.value), `${coupon.usedCount}/${coupon.usageLimit ?? '∞'}`, coupon.isActive ? 'Yes' : 'No',
        <button key={coupon.id} className="text-sale" onClick={() => api.delete(`/admin/coupons/${coupon.id}`).then(load)}>Delete</button>,
      ])} />
    </div>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const load = useCallback(async () => setReviews((await unwrapList<Review>(api.get('/admin/reviews'))).items), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews" />
      <SimpleTable headers={['Product', 'Customer', 'Rating', 'Review', 'Visible', 'Actions']} rows={reviews.map((review) => [
        review.product?.name ?? '-', review.user?.email ?? '-', String(review.rating), review.body, review.isHidden ? 'Hidden' : 'Visible',
        <button key={review.id} className="text-primary underline" onClick={() => api.patch(`/admin/reviews/${review.id}/moderation`, { isHidden: !review.isHidden }).then(load)}>
          {review.isHidden ? 'Unhide' : 'Hide'}
        </button>,
      ])} />
    </div>
  );
}

export function InventoryPage() {
  const [variants, setVariants] = useState<Array<Variant & { product?: { name: string } }>>([]);
  const load = useCallback(async () => setVariants(await unwrap(api.get('/admin/inventory/low-stock'))), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Low stock and out-of-stock variants" />
      <SimpleTable headers={['Product', 'SKU', 'Size', 'Color', 'Stock', 'Threshold']} rows={variants.map((variant) => [
        variant.product?.name ?? '-', variant.sku ?? '-', variant.size, variant.color, String(variant.stock), String(variant.lowStockThreshold ?? 5),
      ])} />
    </div>
  );
}

export function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const load = useCallback(async () => setReturns((await unwrapList<ReturnRequest>(api.get('/admin/returns'))).items), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <PageHeader title="Returns" subtitle="Approve, reject, and refund return requests" />
      <SimpleTable headers={['Order', 'Customer', 'Reason', 'Status', 'Refund', 'Actions']} rows={returns.map((ret) => [
        ret.order?.orderNumber ?? '-', ret.order?.user?.email ?? '-', ret.reason, ret.status, String(ret.refundAmount ?? '-'),
        <select key={ret.id} className={inputClass} value={ret.status} onChange={(e) => api.patch(`/admin/returns/${ret.id}/status`, { status: e.target.value }).then(load)}>
          <option value="REQUESTED">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="REFUNDED">Refunded</option>
        </select>,
      ])} />
    </div>
  );
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  useEffect(() => { unwrapList<NotificationItem>(api.get('/admin/notifications')).then((result) => setItems(result.items)); }, []);
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Admin event feed" />
      <SimpleTable headers={['Type', 'Title', 'Body', 'Created']} rows={items.map((item) => [item.type, item.title, item.body, new Date(item.createdAt).toLocaleString()])} />
    </div>
  );
}

export function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  useEffect(() => { unwrap<AnalyticsStats>(api.get('/admin/analytics')).then(setStats); }, []);
  const cards = [
    ['Revenue', `AED ${Number(stats?.revenue ?? 0).toFixed(0)}`],
    ['Orders', stats?.orders ?? 0],
    ['Customers', stats?.customers ?? 0],
    ['Products', stats?.products ?? 0],
    ['Low stock', stats?.lowStockProducts ?? 0],
    ['Conversion', `${stats?.conversionRate ?? 0}%`],
  ];
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Revenue, orders, customers, products, and stock signals" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-wider text-tertiary">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-black/5 bg-secondary/60 text-xs uppercase tracking-wider text-tertiary">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-black/5 last:border-0">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
