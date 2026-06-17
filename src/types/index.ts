export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: { hasMore?: boolean; nextCursor?: string | null };
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  emailVerified?: boolean;
  loyaltyPoints?: number;
  createdAt?: string;
  _count?: { orders: number };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentProvider?: string | null;
  total: number | string;
  createdAt: string;
  user?: { email: string; name?: string | null };
  items?: Array<{ qty: number; productName?: string }>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tags?: string[];
  isActive: boolean;
  isFeatured: boolean;
  brand?: { id?: string; name: string; slug?: string };
  category?: { id?: string; name: string; slug?: string };
  images?: Array<{ id: string; url: string; thumbnailUrl: string }>;
  variants?: Array<{ id: string; size: string; color: string; colorHex?: string; price: string | number; comparePrice?: string | number | null; stock: number }>;
}

export interface Variant {
  id: string;
  size: string;
  color: string;
  colorHex?: string | null;
  sku?: string;
  price: string | number;
  comparePrice?: string | number | null;
  stock: number;
}

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parentId?: string | null;
  isActive: boolean;
  children?: Category[];
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  isActive: boolean;
}
