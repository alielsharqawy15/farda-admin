import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, getErrorMessage, mediaUrl, unwrap, unwrapList } from '../api/client';
import { Alert, Field, PageHeader, flattenCategories, inputClass } from '../components/ui';
import type { Brand, Category, Product, ProductSort } from '../types';

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Popular' },
];

export default function ProductsPage() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState<ProductSort>('newest');

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) {
      setMessage(stateMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadMeta = useCallback(async () => {
    try {
      const [cats, brandList] = await Promise.all([
        unwrap<Category[]>(api.get('/categories')),
        unwrap<Brand[]>(api.get('/brands')),
      ]);
      setCategories(cats);
      setBrands(brandList);
    } catch {
      // Filters still work without dropdown metadata.
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await unwrapList<Product>(
        api.get('/products', {
          params: {
            limit: 100,
            sort,
            ...(search ? { search } : {}),
            ...(category ? { category } : {}),
            ...(brand ? { brand } : {}),
            _refresh: Date.now(),
          },
        })
      );
      setProducts(result.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [brand, category, search, sort]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    setMessage('');
    try {
      await api.delete(`/products/${id}`);
      setMessage('Product deleted');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const flatCategories = flattenCategories(categories);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Create and manage catalog items shown in the mobile app"
        action={{ label: 'Add product', to: '/products/new' }}
      />

      {message && <Alert message={message} type="success" />}
      {error && <Alert message={error} />}

      <div className="mb-6 grid gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm md:grid-cols-4">
        <Field label="Search">
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
          />
        </Field>
        <Field label="Category">
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {'—'.repeat(cat.depth)}{cat.depth > 0 ? ' ' : ''}{cat.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Brand">
          <select className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">All brands</option>
            {brands.map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Sort">
          <select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value as ProductSort)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {loading ? (
        <p className="text-tertiary">Loading…</p>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/10 bg-white p-12 text-center">
          <p className="text-tertiary">No products yet.</p>
          <Link to="/products/new" className="mt-4 inline-block text-sm font-semibold text-primary underline">
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-secondary/60 text-xs uppercase tracking-wider text-tertiary">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variant = product.variants?.[0];
                return (
                  <tr key={product.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img
                            src={mediaUrl(product.images[0].thumbnailUrl || product.images[0].url)}
                            alt=""
                            className="h-12 w-12 rounded object-cover bg-secondary"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-tertiary">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.brand?.name ?? '—'}</td>
                    <td className="px-4 py-3">{product.category?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {variant ? `AED ${Number(variant.price).toFixed(0)}` : '—'}
                    </td>
                    <td className="px-4 py-3">{variant?.stock ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/products/${product.slug}/edit`} className="text-xs font-semibold text-primary underline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id, product.name)}
                          className="text-xs font-semibold text-sale"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
