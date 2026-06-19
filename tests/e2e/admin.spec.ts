import { expect, Page, test } from '@playwright/test';

const token = 'test-admin-token';

async function mockApi(page: Page) {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({ json: { success: true, data: { accessToken: token } } });
  });
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { id: 'admin_1', email: 'admin@farda.com', role: 'ADMIN', twoFactorEnabled: true },
      },
    });
  });
  await page.route('**/api/v1/admin/stats', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { revenue: 1000, orders: 1, customers: 1, products: 1, categories: 1, lowStockProducts: 0, conversionRate: 0 },
      },
    });
  });
  await page.route('**/api/v1/admin/orders?**', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: [{
          id: 'clxorder000000000000000001',
          orderNumber: 'SU-TEST-1',
          total: 105,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentProvider: 'CARD',
          createdAt: new Date().toISOString(),
          user: { email: 'customer@example.com' },
        }],
      },
    });
  });
  await page.route('**/api/v1/admin/orders/clxorder000000000000000001', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          id: 'clxorder000000000000000001',
          orderNumber: 'SU-TEST-1',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentProvider: 'CARD',
          subtotal: 100,
          tax: 5,
          shipping: 0,
          discount: 0,
          total: 105,
          createdAt: new Date().toISOString(),
          user: { email: 'customer@example.com', name: 'Test Customer' },
          items: [{ id: 'item_1', qty: 1, unitPrice: 100, productSnapshot: { name: 'Test Shoe', sku: 'SKU1' } }],
          payments: [{ id: 'pay_1', provider: 'CARD', status: 'PAID', amount: 105, createdAt: new Date().toISOString() }],
          tracking: [{ id: 'track_1', status: 'CONFIRMED', description: 'Payment received', timestamp: new Date().toISOString() }],
          returns: [],
        },
      },
    });
  });
  await page.route('**/api/v1/admin/orders/clxorder000000000000000001/shipment', async (route) => {
    await route.fulfill({ json: { success: true, data: {} } });
  });
  await page.route('**/api/v1/admin/returns?**', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: [{ id: 'clxreturn0000000000000001', status: 'REQUESTED', reason: 'Too small', refundAmount: 50, createdAt: new Date().toISOString(), order: { orderNumber: 'SU-TEST-1', user: { email: 'customer@example.com' } } }],
      },
    });
  });
  await page.route('**/api/v1/admin/returns/clxreturn0000000000000001', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          id: 'clxreturn0000000000000001',
          status: 'REQUESTED',
          reason: 'Too small',
          refundAmount: 50,
          createdAt: new Date().toISOString(),
          order: { orderNumber: 'SU-TEST-1', total: 105, paymentProvider: 'CARD', paymentStatus: 'PAID', user: { email: 'customer@example.com' }, payments: [] },
        },
      },
    });
  });
  await page.route('**/api/v1/admin/audit-logs?**', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: [{ id: 'clxaudit00000000000000001', action: 'order.shipment', entityType: 'Order', entityId: 'clxorder000000000000000001', createdAt: new Date().toISOString(), actor: { email: 'admin@farda.com' } }],
      },
    });
  });
  await page.route('**/api/v1/admin/jobs/payment-maintenance', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { configured: true, nextRunAt: new Date().toISOString(), lastRun: { status: 'success', startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), result: { expired: 1, reconciled: 1 } }, failures: [] },
      },
    });
  });
  await page.route('**/api/v1/admin/jobs/payment-maintenance/run', async (route) => {
    await route.fulfill({ status: 202, json: { success: true, data: { queued: true, jobId: 'job_1' } } });
  });
  await page.route('**/api/v1/auth/enable-2fa', async (route) => {
    await route.fulfill({ json: { success: true, data: { secret: 'SECRET', qrCode: 'data:image/png;base64,iVBORw0KGgo=' } } });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

test('admin login and orders list render', async ({ page }) => {
  await signIn(page);
  await page.goto('/orders');
  await expect(page.getByText('SU-TEST-1')).toBeVisible();
});

test('order detail and shipment update render', async ({ page }) => {
  await signIn(page);
  await page.goto('/orders/clxorder000000000000000001');
  await expect(page.getByText('Test Customer')).toBeVisible();
  await page.getByLabel('Carrier').fill('DHL');
  await page.getByLabel('Tracking number').fill('TRACK123');
  await page.getByRole('button', { name: /save shipment/i }).click();
  await expect(page.getByText('Shipment updated')).toBeVisible();
});

test('refund detail, audit filters, jobs, and 2FA render', async ({ page }) => {
  await signIn(page);
  await page.goto('/returns/clxreturn0000000000000001');
  await expect(page.getByText('Refund Review')).toBeVisible();
  await page.goto('/audit-logs');
  await page.getByLabel('Action').fill('order.shipment');
  await expect(page.getByText('order.shipment')).toBeVisible();
  await page.goto('/jobs');
  await page.getByRole('button', { name: /run now/i }).click();
  await expect(page.getByText('Payment maintenance job queued')).toBeVisible();
  await page.goto('/security/2fa');
  await expect(page.getByText('Two-Factor Authentication')).toBeVisible();
});
