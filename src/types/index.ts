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
  variants?: Array<{ id: string; size: string; color: string; colorHex?: string; price: string | number; comparePrice?: string | number | null; stock: number; lowStockThreshold?: number }>;
  styles?: Array<{ style: Style }>;
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
  lowStockThreshold?: number;
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

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  isActive: boolean;
}

export interface Style {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface StoreSettings {
  storeName: string;
  logo?: string | null;
  banner?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  whatsapp?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  address?: string | null;
  workingHours?: string | null;
  aboutUs?: string | null;
  termsConditions?: string | null;
  privacyPolicy?: string | null;
  returnPolicy?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  value: string | number;
  minOrder?: string | number | null;
  usageLimit?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
}

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  isHidden: boolean;
  isVerified: boolean;
  createdAt: string;
  product?: { name: string; slug: string };
  user?: { email: string; name?: string | null };
}

export interface ReturnRequest {
  id: string;
  status: string;
  reason: string;
  refundAmount?: string | number | null;
  createdAt: string;
  order?: { orderNumber: string; user?: { email: string; name?: string | null } };
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsStats {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  conversionRate: number;
  lowStockProducts: number;
  bestSellers?: Array<{ variantId: string | null; _sum: { qty: number | null } }>;
}
