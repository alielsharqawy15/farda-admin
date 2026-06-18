import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage, mediaUrl, postForm, unwrap } from '../api/client';
import { Alert, Field, PageHeader, inputClass } from '../components/ui';
import type { Banner } from '../types';

type BannerForm = {
  id?: string;
  title: string;
  subtitle: string;
  image: string;
  imageFile: File | null;
  ctaLabel: string;
  ctaLink: string;
  order: string;
  isActive: boolean;
};

const emptyForm: BannerForm = {
  title: '',
  subtitle: '',
  image: '',
  imageFile: null,
  ctaLabel: 'Shop now',
  ctaLink: '/listing',
  order: '0',
  isActive: true,
};

function formFromBanner(banner: Banner): BannerForm {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle ?? '',
    image: banner.image,
    imageFile: null,
    ctaLabel: banner.ctaLabel ?? '',
    ctaLink: banner.ctaLink ?? '',
    order: String(banner.order ?? 0),
    isActive: banner.isActive,
  };
}

function appendOptional(form: FormData, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) form.append(key, trimmed);
}

export default function SliderPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const editing = Boolean(form.id);
  const previewImage = useMemo(() => {
    if (form.imageFile) return URL.createObjectURL(form.imageFile);
    return mediaUrl(form.image);
  }, [form.image, form.imageFile]);

  useEffect(() => {
    return () => {
      if (form.imageFile && previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
    };
  }, [form.imageFile, previewImage]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const items = await unwrap<Banner[]>(api.get('/banners/all'));
      setBanners(items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField<K extends keyof BannerForm>(key: K, value: BannerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
  }

  async function saveBanner(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const data = new FormData();
      data.append('title', form.title.trim());
      appendOptional(data, 'subtitle', form.subtitle);
      appendOptional(data, 'image', form.image);
      appendOptional(data, 'ctaLabel', form.ctaLabel);
      appendOptional(data, 'ctaLink', form.ctaLink);
      data.append('order', form.order || '0');
      data.append('isActive', String(form.isActive));
      if (form.imageFile) data.append('image', form.imageFile);

      if (editing && form.id) {
        await postForm(`/banners/${form.id}`, data, 'PUT');
        setMessage('Slider updated');
      } else {
        await postForm('/banners', data);
        setMessage('Slider added');
      }

      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteBanner(banner: Banner) {
    if (!confirm(`Delete slider "${banner.title}"?`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/banners/${banner.id}`);
      setMessage('Slider deleted');
      if (form.id === banner.id) resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleBanner(banner: Banner) {
    setError('');
    setMessage('');
    try {
      const data = new FormData();
      data.append('isActive', String(!banner.isActive));
      await postForm(`/banners/${banner.id}`, data, 'PUT');
      setMessage(!banner.isActive ? 'Slider published' : 'Slider hidden');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Hero Slider"
        subtitle="Change the homepage slider banners, text, links, order, and visibility."
      />

      {message && <Alert message={message} type="success" />}
      {error && <Alert message={error} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4">
            <h2 className="font-semibold">Current slides</h2>
          </div>

          {loading ? (
            <p className="p-5 text-tertiary">Loading...</p>
          ) : banners.length === 0 ? (
            <p className="p-5 text-tertiary">No slider banners yet.</p>
          ) : (
            <div className="divide-y divide-black/5">
              {banners.map((banner) => (
                <div key={banner.id} className="grid gap-4 p-5 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                  <div className="relative aspect-[16/9] overflow-hidden rounded bg-secondary">
                    <img src={mediaUrl(banner.image)} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{banner.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          banner.isActive ? 'bg-success/10 text-success' : 'bg-secondary text-tertiary'
                        }`}
                      >
                        {banner.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    {banner.subtitle && <p className="mt-1 text-sm text-tertiary">{banner.subtitle}</p>}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-tertiary">
                      <span>Order: {banner.order}</span>
                      {banner.ctaLabel && <span>Button: {banner.ctaLabel}</span>}
                      {banner.ctaLink && <span className="truncate">Link: {banner.ctaLink}</span>}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 md:flex-col">
                    <button
                      type="button"
                      onClick={() => setForm(formFromBanner(banner))}
                      className="rounded border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBanner(banner)}
                      className="rounded border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary"
                    >
                      {banner.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBanner(banner)}
                      className="rounded border border-sale/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sale"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={saveBanner} className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-semibold">{editing ? 'Edit slide' : 'New slide'}</h2>
            {editing && (
              <button type="button" onClick={resetForm} className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                Cancel
              </button>
            )}
          </div>

          <div className="space-y-4">
            <Field label="Title">
              <input className={inputClass} value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
            </Field>

            <Field label="Subtitle">
              <input className={inputClass} value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} />
            </Field>

            <Field label="Image URL">
              <input
                className={inputClass}
                value={form.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="https://..."
              />
            </Field>

            <Field label="Upload image">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => updateField('imageFile', e.target.files?.[0] ?? null)}
              />
            </Field>

            {previewImage && (
              <div className="overflow-hidden rounded bg-secondary">
                <img src={previewImage} alt="" className="aspect-[16/9] w-full object-cover" />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Button text">
                <input className={inputClass} value={form.ctaLabel} onChange={(e) => updateField('ctaLabel', e.target.value)} />
              </Field>
              <Field label="Button link">
                <input className={inputClass} value={form.ctaLink} onChange={(e) => updateField('ctaLink', e.target.value)} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Order">
                <input
                  className={inputClass}
                  type="number"
                  value={form.order}
                  onChange={(e) => updateField('order', e.target.value)}
                />
              </Field>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                />
                Active
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded bg-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : editing ? 'Save slide' : 'Add slide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
