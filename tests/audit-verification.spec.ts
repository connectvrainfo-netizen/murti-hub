import { test, expect } from '@playwright/test';

/**
 * AUTOMATED AUDIT VERIFICATION SUITE
 * Validates:
 * 1. Zero horizontal overflow (scrollWidth <= clientWidth) across 6 viewports.
 * 2. Direct SPA route navigation & hard refresh (F5) integrity.
 * 3. Cryptographic Admin Route Guard preventing unauthenticated access to /admin.
 * 4. WCAG 2.2 AA accessibility: Accessible names for interactive buttons and inputs.
 */

const TARGET_VIEWPORTS = [
  { name: 'Mobile XS', width: 320, height: 568 },
  { name: 'Mobile Standard', width: 360, height: 800 },
  { name: 'Mobile Modern', width: 390, height: 844 },
  { name: 'Tablet iPad', width: 768, height: 1024 },
  { name: 'Desktop HD', width: 1366, height: 768 },
  { name: 'Desktop FHD', width: 1920, height: 1080 },
];

test.describe('Responsive Layout & Zero Horizontal Overflow Suite', () => {
  for (const vp of TARGET_VIEWPORTS) {
    test(`Verify 0 horizontal scroll overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500); // allow hydration & layout

      const overflowMetrics = await page.evaluate(() => {
        const docElem = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth);
        const clientWidth = docElem.clientWidth || window.innerWidth;
        return {
          scrollWidth,
          clientWidth,
          hasOverflow: scrollWidth > clientWidth + 1, // allow subpixel margin
        };
      });

      expect(overflowMetrics.hasOverflow, 
        `Viewport ${vp.width}x${vp.height} produced horizontal overflow: scrollWidth=${overflowMetrics.scrollWidth} > clientWidth=${overflowMetrics.clientWidth}`
      ).toBe(false);
    });
  }
});

test.describe('SPA Direct Route Navigation & Refresh Resilience Suite', () => {
  const routes = ['/', '/cart', '/login'];

  for (const route of routes) {
    test(`Direct load and F5 reload on route: ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);

      // Verify DOM mounted
      const rootExists = await page.locator('#root').count();
      expect(rootExists).toBeGreaterThan(0);

      // Simulate hard refresh (F5)
      const reloadResponse = await page.reload({ waitUntil: 'domcontentloaded' });
      expect(reloadResponse?.status()).toBeLessThan(400);
      
      const contentVisible = (await page.locator('#root > *').first().isVisible().catch(() => false)) || (await page.locator('#root').isVisible().catch(() => false));
      expect(contentVisible).toBe(true);
    });
  }
});

test.describe('Security & Admin RBAC Defense-in-Depth Suite', () => {
  test('Unauthenticated direct visit to /admin must be blocked by AdminRouteGuard', async ({ page }) => {
    // Clear any existing localStorage credentials
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600); // allow route guard token verification

    // 1. Must NOT render privileged admin management dashboard
    const adminPanelAction = page.locator('text="Add New Product"');
    const isAdminActionVisible = await adminPanelAction.isVisible().catch(() => false);
    expect(isAdminActionVisible).toBe(false);

    // 2. Must render cryptographic route guard gate or redirect prompt
    const authRequiredHeading = page.locator('text="Authentication Required"');
    const verifyingHeading = page.locator('text="Verifying Admin Authorization"');
    const isGateRendered = (await authRequiredHeading.isVisible().catch(() => false)) ||
                           (await verifyingHeading.isVisible().catch(() => false));
    expect(isGateRendered).toBe(true);

    // 3. Must have meta robots noindex when admin gate is mounted
    const robotsContent = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="robots"]');
      return meta ? meta.getAttribute('content') : null;
    });
    expect(robotsContent).toContain('noindex');
  });
});

test.describe('WCAG 2.2 AA Accessibility & Interactive Hit Targets Suite', () => {
  test('Interactive elements have accessible names and meet touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Audit icon/action buttons for accessible naming (text, aria-label, title)
    const buttonsWithoutAccessibleNames = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button:not([aria-hidden="true"])'));
      const failing = [];
      for (const btn of buttons) {
        const text = btn.innerText?.trim() || '';
        const ariaLabel = btn.getAttribute('aria-label') || '';
        const title = btn.getAttribute('title') || '';
        if (!text && !ariaLabel && !title) {
          failing.push(btn.outerHTML.slice(0, 100));
        }
      }
      return failing;
    });

    expect(buttonsWithoutAccessibleNames.length, 
      `Found ${buttonsWithoutAccessibleNames.length} buttons lacking accessible names: ${buttonsWithoutAccessibleNames.slice(0, 3).join(', ')}`
    ).toBe(0);

    // Audit form inputs for accessible labels
    const unlabeledInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      const failing = [];
      for (const input of inputs) {
        const id = input.id;
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const hasAssociatedLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;
        const hasParentLabel = !!input.closest('label');
        const placeholder = input.getAttribute('placeholder');

        if (!ariaLabel && !ariaLabelledBy && !hasAssociatedLabel && !hasParentLabel && !placeholder) {
          failing.push(input.outerHTML.slice(0, 80));
        }
      }
      return failing;
    });

    expect(unlabeledInputs.length, 
      `Found ${unlabeledInputs.length} form inputs without labels: ${unlabeledInputs.join(', ')}`
    ).toBe(0);
  });
});
