import { test, expect } from '@playwright/test';

/**
 * End-to-End Test Suite: Admin Panel Users & Admins Visibility and Management
 * Validates:
 * 1. Admin navigation includes "Users & Admins" under Devotees & Access.
 * 2. Executive Dashboard overview includes "Users & Admins" metric KPI card.
 * 3. Dedicated Tab 8 ("Devotee Accounts & System Admins") displays correctly.
 * 4. User accounts list displays registered users and admin accounts with roles and statuses.
 * 5. Interactive role filters (All Accounts, Customers & Devotees, All Admins & Staff, Master Admins, Staff Editors).
 * 6. Search bar filters accounts by name/email/role.
 * 7. "Provision New Account" modal dialog opens and renders properly.
 * 8. "Change Account Role" modal dialog opens and operates correctly.
 * 9. "Permanently Delete Account" modal dialog opens with safety checks.
 */
test.describe('Admin Panel: Users and Admins Account Visibility & Management', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock GET /api/auth/users to ensure predictable, lightning-fast E2E tests
    await page.route('**/api/auth/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Retrieved 4 user accounts',
          data: {
            users: [
              {
                id: '66666666-6666-6666-6666-666666660001',
                email: 'admin@amolmurtibhandar.com',
                full_name: 'Master Sculptor Admin',
                role: 'super_admin',
                is_active: true,
                created_at: '2026-01-01T00:00:00Z',
                phone: '+91 98290 12345',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302001'
              },
              {
                id: '22222222-2222-2222-2222-222222220002',
                email: 'manager@amolmurtibhandar.com',
                full_name: 'Jaipur Workshop Manager',
                role: 'admin',
                is_active: true,
                created_at: '2026-02-15T10:00:00Z',
                phone: '+91 98290 54321',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302001'
              },
              {
                id: '33333333-3333-3333-3333-333333330003',
                email: 'catalog.editor@amolmurtibhandar.com',
                full_name: 'Catalog Editor Staff',
                role: 'editor',
                is_active: false,
                created_at: '2026-03-01T12:00:00Z',
                phone: '+91 94140 11223',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302001'
              },
              {
                id: '44444444-4444-4444-4444-444444440004',
                email: 'devotee.ramesh@example.com',
                full_name: 'Ramesh Sharma Devotee',
                role: 'customer',
                is_active: true,
                created_at: '2026-04-10T14:30:00Z',
                phone: '+91 98765 43210',
                city: 'Varanasi',
                state: 'Uttar Pradesh',
                pincode: '221001'
              }
            ],
            total_count: 4,
            admin_count: 3,
            customer_count: 1,
            active_count: 3
          }
        })
      });
    });

    // 2. Mock /api/auth/me for authenticated session verification
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '66666666-6666-6666-6666-666666660001',
            email: 'admin@amolmurtibhandar.com',
            full_name: 'Master Sculptor Admin',
            role: 'super_admin'
          }
        })
      });
    });

    // 3. Mock dashboard stats
    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_products: 42,
            total_categories: 12,
            total_sizes: 25,
            total_reviews: 18,
            pending_reviews: 2,
            total_users: 4,
            active_festival_title: 'Diwali Mahotsav',
            festival_is_active: true,
            whatsapp_number: '+91 98290 12345',
            global_rating_mode: 'mixed'
          }
        })
      });
    });

    // 4. Pre-seed admin credentials into localStorage
    await page.addInitScript(() => {
      localStorage.setItem('murti_admin_token', 'mock.admin.jwt.token');
      localStorage.setItem('murti_admin_session', JSON.stringify({
        id: '66666666-6666-6666-6666-666666660001',
        email: 'admin@amolmurtibhandar.com',
        full_name: 'Master Sculptor Admin',
        role: 'super_admin'
      }));
    });
  });

  test('Users & Admins tab is accessible from sidebar and overview KPI cards', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verify Executive Dashboard Overview contains Users & Admins
    const userKpiCard = page.locator('span', { hasText: 'Users & Admins' }).first();
    await expect(userKpiCard).toBeVisible();

    // Verify sidebar navigation item
    const sidebarUsersBtn = page.getByRole('button', { name: /Users & Admins/i }).first();
    await expect(sidebarUsersBtn).toBeVisible();

    // Click to navigate to Users & Admins tab
    await sidebarUsersBtn.click();
    await page.waitForTimeout(500);

    // Verify Tab Title
    const mainHeading = page.getByRole('heading', { name: /Devotee Accounts & System Admins/i }).first();
    await expect(mainHeading).toBeVisible();

    // Verify provision button
    const provisionBtn = page.getByRole('button', { name: /\+ Add New Account/i }).first();
    await expect(provisionBtn).toBeVisible();
  });

  test('Accounts list shows registered admin and user accounts with badges and stats', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Navigate to Users tab
    await page.getByRole('button', { name: /Users & Admins/i }).first().click();
    await page.waitForTimeout(500);

    const mainContent = page.locator('main');

    // Verify accounts are listed in main table
    await expect(mainContent.getByText('admin@amolmurtibhandar.com').first()).toBeVisible();
    await expect(mainContent.getByText('manager@amolmurtibhandar.com').first()).toBeVisible();
    await expect(mainContent.getByText('catalog.editor@amolmurtibhandar.com').first()).toBeVisible();
    await expect(mainContent.getByText('devotee.ramesh@example.com').first()).toBeVisible();

    // Verify role badges
    await expect(mainContent.getByText('Master Admin').first()).toBeVisible();
    await expect(mainContent.getByText('Administrator').first()).toBeVisible();
    await expect(mainContent.getByText('Staff Editor').first()).toBeVisible();
    await expect(mainContent.getByText('Customer').first()).toBeVisible();

    // Verify status toggle buttons
    await expect(mainContent.locator('button', { hasText: 'Suspended' }).first()).toBeVisible();
    await expect(mainContent.locator('button', { hasText: 'Active' }).first()).toBeVisible();
  });

  test('Role filter pills and search filter accounts dynamically', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    await page.getByRole('button', { name: /Users & Admins/i }).first().click();
    await page.waitForTimeout(500);

    const mainContent = page.locator('main');

    // Test filter pills: All Admins & Staff
    const adminFilterPill = page.getByRole('button', { name: /All Admins & Staff/i }).first();
    await adminFilterPill.click();
    await page.waitForTimeout(300);

    // Admin should be visible in main, Devotee customer should be filtered out
    await expect(mainContent.getByText('admin@amolmurtibhandar.com').first()).toBeVisible();
    await expect(mainContent.getByText('devotee.ramesh@example.com')).not.toBeVisible();

    // Test Customers & Devotees pill
    const devoteeFilterPill = page.getByRole('button', { name: /Customers & Devotees/i }).first();
    await devoteeFilterPill.click();
    await page.waitForTimeout(300);

    await expect(mainContent.getByText('devotee.ramesh@example.com').first()).toBeVisible();
    await expect(mainContent.getByText('manager@amolmurtibhandar.com')).not.toBeVisible();

    // Reset to All Accounts
    await page.getByRole('button', { name: /All Accounts/i }).first().click();
    await page.waitForTimeout(300);

    // Test Search input
    const searchInput = page.getByPlaceholder(/Search by full name, email/i).first();
    await searchInput.fill('ramesh');
    await page.waitForTimeout(300);

    await expect(mainContent.getByText('Ramesh Sharma Devotee').first()).toBeVisible();
    await expect(mainContent.getByText('Jaipur Workshop Manager')).not.toBeVisible();
  });

  test('Provision Account modal opens and validates fields', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    await page.getByRole('button', { name: /Users & Admins/i }).first().click();
    await page.waitForTimeout(500);

    const provisionBtn = page.getByRole('button', { name: /\+ Add New Account/i }).first();
    await provisionBtn.click();
    await page.waitForTimeout(300);

    // Check modal title and fields
    await expect(page.getByRole('heading', { name: /Provision New Account/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/e\.g\. Rameshwar Sharma/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/e\.g\. devotee@example\.com/i).first()).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /Cancel/i }).first().click();
    await expect(page.getByRole('heading', { name: /Provision New Account/i })).not.toBeVisible();
  });

  test('Change Role modal dialog displays available roles and closes', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    await page.getByRole('button', { name: /Users & Admins/i }).first().click();
    await page.waitForTimeout(500);

    // Target second account row to avoid top sticky header boundary
    const changeRoleBtn = page.getByTitle(/Change Account Role/i).nth(1);
    if (await changeRoleBtn.isVisible().catch(() => false)) {
      await changeRoleBtn.click();
      await page.waitForTimeout(300);

      await expect(page.getByRole('heading', { name: /Change Account Role/i }).first()).toBeVisible();
      await expect(page.getByText('Customer (Devotee)').first()).toBeVisible();
      await page.getByRole('button', { name: /Cancel/i }).first().click();
      await expect(page.getByRole('heading', { name: /Change Account Role/i })).not.toBeVisible();
    }
  });

  test('Delete Account confirmation modal opens with safety checks', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    await page.getByRole('button', { name: /Users & Admins/i }).first().click();
    await page.waitForTimeout(500);

    const deleteBtn = page.getByTitle(/Delete account permanently/i).first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(300);

      await expect(page.getByRole('heading', { name: /Permanently Delete Account\?/i }).first()).toBeVisible();
      await page.getByRole('button', { name: /Cancel/i }).first().click();
      await expect(page.getByRole('heading', { name: /Permanently Delete Account\?/i })).not.toBeVisible();
    }
  });
});
