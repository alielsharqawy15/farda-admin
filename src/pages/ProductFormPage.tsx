import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getAccessToken, getErrorMessage, mediaUrl, postForm, unwrap } from '../api/client';
import { Alert, Field, flattenCategories, inputClass } from '../components/ui';
import type { Brand, Category, Product, ProductImage, Style, Variant } from '../types';

type VariantRow = {
  id?: string;
  size: string;
  color: string;
  colorHex: string;
  price: string;
  stock: string;
  lowStockThreshold: string;
};

const defaultVariant = (): VariantRow => ({
  size: '42',
  color: 'Black',
  colorHex: '#121212',
  price: '299',
  stock: '10',
  lowStockThreshold: '5',
});

function toVariantRow(v: Variant): VariantRow {
  return {
    id: v.id,
    size: String(v.size),
    color: String(v.color),
    colorHex: String(v.colorHex || '#121212'),
    price: String(v.price),
    stock: String(v.stock),
    lowStockThreshold: String(v.lowStockThreshold ?? 5),
  };
}

function validateVariant(v: VariantRow): string | null {
  if (!v.size.trim() || !v.color.trim()) return 'Each variant needs a size and color.';
  const price = Number(v.price);
  if (!Number.isFinite(price) || price <= 0) return 'Variant price must be greater than 0.';
  const stock = Number(v.stock);
  if (!Number.isInteger(stock) || stock < 0) return 'Variant stock must be a whole number of 0 or more.';
  return null;
}

function variantPayload(v: VariantRow) {
  return {
    size: v.size.trim(),
    color: v.color.trim(),
    colorHex: v.colorHex,
    price: Number(v.price),
    stock: Number(v.stock),
    lowStockThreshold: Number(v.lowStockThreshold),
  };
}

function validateProductForm(
  name: string,
  description: string,
  brandId: string,
  categoryId: string,
  variants: VariantRow[]
): string | null {
  if (name.trim().length < 2) return 'Product name must be at least 2 characters.';
  if (description.trim().length < 10) return 'Description must be at least 10 characters.';
  if (!brandId) return 'Select a brand.';
  if (!categoryId) return 'Select a category.';
  if (variants.length === 0) return 'Add at least one variant.';

  const seen = new Set<string>();
  for (const v of variants) {
    const vErr = validateVariant(v);
    if (vErr) return vErr;
    const key = `${v.size.trim().toLowerCase()}|${v.color.trim().toLowerCase()}`;
    if (seen.has(key)) return 'Each variant must have a unique size and color combination.';
    seen.add(key);
  }
  return null;
}

export default function ProductFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const isNew = slug === 'new';
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [styleIds, setStyleIds] = useState<string[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([defaultVariant()]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [brandList, categoryList, styleList] = await Promise.all([
          unwrap<Brand[]>(api.get('/brands')),
          unwrap<Category[]>(api.get('/categories')),
          unwrap<Style[]>(api.get('/admin/styles')),
        ]);
        setBrands(brandList);
        setCategories(categoryList);
        setStyles(styleList);

        if (!isNew && slug) {
          const product = await unwrap<Product>(api.get(`/products/${slug}`));
          setProductId(product.id);
          setName(product.name);
          setDescription(product.description || '');
          setBrandId(product.brand?.id ?? '');
          setCategoryId(product.category?.id ?? '');
          setTags((product.tags || []).join(', '));
          setIsFeatured(product.isFeatured);
          setStyleIds((product.styles || []).map((item) => item.style.id));
          setExistingImages(product.images || []);
          setVariants(
            product.variants?.length
              ? product.variants.map((v) => toVariantRow(v as Variant))
              : [defaultVariant()]
          );
        }
      } catch (err) {
        if (!isNew) {
          setNotFound(true);
        }
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [isNew, slug]);

  function updateRow(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!getAccessToken()) {
      setError('Your session expired. Please sign in again.');
      navigate('/login', { replace: true });
      return;
    }

    const validationError = validateProductForm(name, description, brandId, categoryId, variants);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const meta = {
        name: name.trim(),
        description: description.trim(),
        brandId,
        categoryId,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        isFeatured,
        styleIds,
      };

      let id = productId;
      const created = !productId;

      // Create when there is no existing product yet (new form, OR an edit URL
      // pointing at a product that was never actually saved).
      if (!productId) {
        const createdProduct = await unwrap<{ id: string; slug: string }>(
          api.post('/products', { ...meta, variants: variants.map(variantPayload) })
        );
        id = createdProduct.id;
      } else {
        await unwrap<Product>(api.put(`/products/${productId}`, meta));

        for (const row of variants) {
          if (row.id) {
            await unwrap(api.put(`/variants/${row.id}`, variantPayload(row)));
          } else {
            await unwrap<Variant>(
              api.post(`/products/${productId}/variants`, variantPayload(row))
            );
          }
        }
      }

      if (id && imageFiles?.length) {
        const form = new FormData();
        Array.from(imageFiles).forEach((file) => form.append('images', file));
        await postForm<ProductImage[]>(`/products/${id}/images`, form);
      }

      navigate('/products', {
        state: { message: created ? 'Product created successfully' : 'Product saved successfully' },
      });
      return;
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token')) {
        navigate('/login', { replace: true });
        return;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function deleteExistingVariant(index: number) {
    setError('');
    setMessage('');
    const row = variants[index];
    if (!row.id) {
      setVariants((rows) => rows.filter((_, i) => i !== index));
      return;
    }
    if (variants.length <= 1) {
      setError('A product must keep at least one variant.');
      return;
    }
    if (!confirm('Delete this variant?')) return;

    setSaving(true);
    try {
      await api.delete(`/variants/${row.id}`);
      setVariants((rows) => rows.filter((_, i) => i !== index));
      setMessage('Variant removed.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteImage(imageId: string) {
    setError('');
    setMessage('');
    if (!productId) return;
    if (!confirm('Delete this image?')) return;

    setSaving(true);
    try {
      await api.delete(`/products/${productId}/images/${imageId}`);
      setExistingImages((imgs) => imgs.filter((img) => img.id !== imageId));
      setMessage('Image removed.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-tertiary">Loading…</p>;
  }

  if (notFound) {
    return (
      <div className="max-w-lg rounded-lg border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <p className="mt-2 text-sm text-tertiary">
          &quot;{slug}&quot; is not in the database. It was never created, or the link is outdated.
        </p>
        {error && <Alert message={error} />}
        <div className="mt-6 flex gap-3">
          <Link to="/products/new" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">
            Add product
          </Link>
          <Link to="/products" className="rounded border border-black/10 px-4 py-2 text-sm">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const flatCategories = flattenCategories(categories);
  const selectedFileCount = imageFiles?.length ?? 0;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-center gap-3 text-sm text-tertiary">
        <Link to="/products" className="hover:text-primary">Products</Link>
        <span>/</span>
        <span>{isNew ? 'New product' : name || slug}</span>
      </div>

      <h1 className="text-2xl font-semibold">{isNew ? 'Create product' : 'Edit product'}</h1>
      <p className="mt-1 text-sm text-tertiary">
        Fill in the details, add variants and images, then click <strong>Save product</strong> once at the bottom.
      </p>

      {(error || message) && (
        <div className="sticky top-0 z-10 mt-4 rounded-lg border border-black/5 bg-white p-3 shadow-sm">
          {error && <Alert message={error} />}
          {message && <Alert message={message} type="success" />}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-8">
        {/* Details */}
        <section className="space-y-6 rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Details</h2>
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Description (min. 10 characters)">
            <textarea
              className={`${inputClass} min-h-28`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minLength={10}
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand">
              <select className={inputClass} value={brandId} onChange={(e) => setBrandId(e.target.value)} required>
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">Select category</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'—'.repeat(c.depth)}{c.depth > 0 ? ' ' : ''}{c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Tags (comma separated)">
            <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="running, sneakers" />
          </Field>
          <Field label="Styles">
            <div className="flex flex-wrap gap-2 rounded border border-black/10 p-3">
              {styles.map((style) => (
                <label key={style.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={styleIds.includes(style.id)}
                    onChange={(e) => {
                      setStyleIds((ids) =>
                        e.target.checked ? [...ids, style.id] : ids.filter((id) => id !== style.id)
                      );
                    }}
                  />
                  {style.name}
                </label>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured on homepage
          </label>
        </section>

        {/* Variants */}
        <section className="space-y-4 rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Variants</h2>
            <button
              type="button"
              onClick={() => setVariants((v) => [...v, defaultVariant()])}
              className="text-sm font-semibold text-primary underline"
            >
              + Add variant row
            </button>
          </div>
          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={variant.id ?? index} className="grid gap-2 rounded border border-black/5 p-3 sm:grid-cols-6">
                <input className={inputClass} placeholder="Size" value={variant.size}
                  onChange={(e) => updateRow(index, { size: e.target.value })} />
                <input className={inputClass} placeholder="Color" value={variant.color}
                  onChange={(e) => updateRow(index, { color: e.target.value })} />
                <input className={inputClass} placeholder="Price" type="number" min="0.01" step="0.01" value={variant.price}
                  onChange={(e) => updateRow(index, { price: e.target.value })} />
                <input className={inputClass} placeholder="Stock" type="number" min="0" step="1" value={variant.stock}
                  onChange={(e) => updateRow(index, { stock: e.target.value })} />
                <input className={inputClass} placeholder="Low stock" type="number" min="0" step="1" value={variant.lowStockThreshold}
                  onChange={(e) => updateRow(index, { lowStockThreshold: e.target.value })} />
                {variants.length > 1 && (
                  <button type="button" className="text-sm font-semibold text-sale"
                    onClick={() => deleteExistingVariant(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Images */}
        <section className="space-y-4 rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Images</h2>

          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative">
                  <img src={mediaUrl(img.thumbnailUrl || img.url)} alt="" className="h-20 w-20 rounded object-cover bg-secondary" />
                  {!isNew && (
                    <button type="button" onClick={() => deleteImage(img.id)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sale text-xs font-bold text-white">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <Field label={existingImages.length ? 'Add more images' : 'Product images'}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setImageFiles(e.target.files)}
            />
            {selectedFileCount > 0 && (
              <p className="mt-1 text-xs text-tertiary">
                {selectedFileCount} file(s) selected — they will upload when you click Save product.
              </p>
            )}
          </Field>
        </section>

        {/* Single save action */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/10 bg-white/95 px-6 py-4 backdrop-blur md:left-64">
          <div className="mx-auto flex max-w-3xl gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-primary px-8 py-2.5 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : isNew ? 'Create product' : 'Save product'}
            </button>
            <Link to="/products" className="rounded border border-black/10 px-6 py-2.5 text-sm leading-8">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
