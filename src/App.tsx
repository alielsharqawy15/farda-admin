import { Routes, Route, Navigate } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import RefundDetailPage from './pages/RefundDetailPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import SliderPage from './pages/SliderPage';
import ProductFormPage from './pages/ProductFormPage';
import UsersPage from './pages/UsersPage';
import {
  AnalyticsPage,
  AuditLogDetailPage,
  AuditLogsPage,
  CouponsPage,
  JobsPage,
  InventoryPage,
  NotificationsPage,
  ReturnsPage,
  ReviewsPage,
  StoreSettingsPage,
  StylesPage,
  TwoFactorPage,
} from './pages/PlatformPages';

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:slug/edit" element={<ProductFormPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/slider" element={<SliderPage />} />
        <Route path="/styles" element={<StylesPage />} />
        <Route path="/store-settings" element={<StoreSettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/returns/:id" element={<RefundDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/audit-logs/:id" element={<AuditLogDetailPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/security/2fa" element={<TwoFactorPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
