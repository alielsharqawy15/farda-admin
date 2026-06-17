import { Link } from 'react-router-dom';
import type { Category } from '../types';

export function flattenCategories(categories: Category[], depth = 0): Array<Category & { depth: number }> {
  return categories.flatMap((cat) => [
    { ...cat, depth },
    ...flattenCategories(cat.children ?? [], depth + 1),
  ]);
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-tertiary">{subtitle}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="rounded bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Alert({ message, type = 'error' }: { message: string; type?: 'error' | 'success' }) {
  return (
    <p className={`mt-4 text-sm ${type === 'success' ? 'text-success' : 'text-sale'}`}>{message}</p>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-tertiary">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = 'w-full rounded border border-black/10 px-3 py-2 outline-none focus:border-primary';
