import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage, mediaUrl, postForm, unwrap } from '../api/client';
import { Alert, Field, flattenCategories, inputClass } from '../components/ui';
import type { Brand, Category } from '../types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catImage, setCatImage] = useState<File | null>(null);

  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandLogo, setBrandLogo] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cats, brandList] = await Promise.all([
        unwrap<Category[]>(api.get('/categories')),
        unwrap<Brand[]>(api.get('/brands')),
      ]);
      setCategories(cats);
      setBrands(brandList);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createCategory(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      const form = new FormData();
      form.append('name', catName);
      if (catParentId) form.append('parentId', catParentId);
      if (catImage) form.append('image', catImage);
      await postForm('/categories', form);
      setCatName('');
      setCatParentId('');
      setCatImage(null);
      setMessage('Category created');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createBrand(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      const form = new FormData();
      form.append('name', brandName);
      if (brandDescription) form.append('description', brandDescription);
      if (brandLogo) form.append('logo', brandLogo);
      await postForm('/brands', form);
      setBrandName('');
      setBrandDescription('');
      setBrandLogo(null);
      setMessage('Brand created');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      setMessage('Category deleted');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteBrand(id: string, name: string) {
    if (!confirm(`Delete brand "${name}"?`)) return;
    try {
      await api.delete(`/brands/${id}`);
      setMessage('Brand deleted');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateCategoryImage(id: string, file: File) {
    try {
      const form = new FormData();
      form.append('image', file);
      await postForm(`/categories/${id}`, form, 'PUT');
      setMessage('Category image updated');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateCategoryDetails(
    id: string,
    data: { name: string; parentId: string; isActive: boolean }
  ) {
    setMessage('');
    try {
      await api.put(`/categories/${id}`, {
        name: data.name,
        parentId: data.parentId || null,
        isActive: data.isActive,
      });
      setMessage('Category updated');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateBrandLogo(id: string, file: File) {
    try {
      const form = new FormData();
      form.append('logo', file);
      await postForm(`/brands/${id}`, form, 'PUT');
      setMessage('Brand logo updated');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const flatCategories = flattenCategories(categories);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Categories & Brands</h1>
        <p className="mt-1 text-tertiary">Upload catalog structure — appears in mobile Shop by Category</p>
      </div>

      {message && <Alert message={message} type="success" />}
      {error && <Alert message={error} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createCategory} className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">New category</h2>
          <div className="mt-4 space-y-3">
            <Field label="Name">
              <input className={inputClass} value={catName} onChange={(e) => setCatName(e.target.value)} required />
            </Field>
            <Field label="Parent (optional)">
              <select className={inputClass} value={catParentId} onChange={(e) => setCatParentId(e.target.value)}>
                <option value="">Top level</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>{'—'.repeat(c.depth)}{c.depth > 0 ? ' ' : ''}{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Image">
              <input type="file" accept="image/*" onChange={(e) => setCatImage(e.target.files?.[0] ?? null)} />
            </Field>
            <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white">Create category</button>
          </div>
        </form>

        <form onSubmit={createBrand} className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">New brand</h2>
          <div className="mt-4 space-y-3">
            <Field label="Name">
              <input className={inputClass} value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
            </Field>
            <Field label="Description">
              <input className={inputClass} value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} />
            </Field>
            <Field label="Logo">
              <input type="file" accept="image/*" onChange={(e) => setBrandLogo(e.target.files?.[0] ?? null)} />
            </Field>
            <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white">Create brand</button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Categories</h2>
          {loading ? (
            <p className="mt-4 text-tertiary">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="mt-4 text-tertiary">No categories yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {flatCategories.map((cat) => (
                <li key={cat.id} className="flex items-start justify-between gap-3 border-b border-black/5 pb-4 last:border-0">
                  <div className="flex flex-1 items-start gap-3">
                    {cat.image ? (
                      <img src={mediaUrl(cat.image)} alt="" className="h-14 w-14 rounded object-cover bg-secondary" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded bg-secondary text-xs text-tertiary">No img</div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          className={inputClass}
                          defaultValue={cat.name}
                          id={`cat-name-${cat.id}`}
                        />
                        <select
                          className={inputClass}
                          defaultValue={cat.parentId ?? ''}
                          id={`cat-parent-${cat.id}`}
                        >
                          <option value="">Top level</option>
                          {flatCategories
                            .filter((option) => option.id !== cat.id)
                            .map((option) => (
                              <option key={option.id} value={option.id}>
                                {'—'.repeat(option.depth)}{option.depth > 0 ? ' ' : ''}{option.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          defaultChecked={cat.isActive}
                          id={`cat-active-${cat.id}`}
                        />
                        Active
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary underline"
                          onClick={() => {
                            const name = (document.getElementById(`cat-name-${cat.id}`) as HTMLInputElement).value;
                            const parentId = (document.getElementById(`cat-parent-${cat.id}`) as HTMLSelectElement).value;
                            const isActive = (document.getElementById(`cat-active-${cat.id}`) as HTMLInputElement).checked;
                            updateCategoryDetails(cat.id, { name, parentId, isActive });
                          }}
                        >
                          Save changes
                        </button>
                        <label className="inline-block cursor-pointer text-xs text-primary underline">
                          Upload image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) updateCategoryImage(cat.id, file);
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-tertiary">{cat.slug}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => deleteCategory(cat.id, cat.name)} className="text-xs text-sale">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Brands</h2>
          {loading ? (
            <p className="mt-4 text-tertiary">Loading…</p>
          ) : brands.length === 0 ? (
            <p className="mt-4 text-tertiary">No brands yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {brands.map((brand) => (
                <li key={brand.id} className="flex items-start justify-between gap-3 border-b border-black/5 pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    {brand.logo ? (
                      <img src={mediaUrl(brand.logo)} alt="" className="h-14 w-14 rounded object-contain bg-secondary p-1" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded bg-secondary text-xs text-tertiary">No logo</div>
                    )}
                    <div>
                      <p className="font-medium">{brand.name}</p>
                      <p className="text-xs text-tertiary">{brand.slug}</p>
                      <label className="mt-1 inline-block cursor-pointer text-xs text-primary underline">
                        Upload logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateBrandLogo(brand.id, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <button type="button" onClick={() => deleteBrand(brand.id, brand.name)} className="text-xs text-sale">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
