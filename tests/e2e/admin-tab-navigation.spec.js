const { test, expect } = require('@playwright/test');

test.describe('Admin tab navigation gestures', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  async function loginAdmin(page) {
    await page.goto('/admin.html');
    await page.locator('#password').fill('265598');
    await page.locator('#loginForm button[type="submit"]').click();
    await expect(page.locator('#adminContainer')).toHaveClass(/visible/);
    await expect(page.locator('.tab[data-tab="entry"]')).toHaveClass(/active/);
  }

  async function syntheticSwipe(page, { selector = '#adminContainer', startX, startY, endX, endY }) {
    await page.evaluate(({ selectorArg, startXArg, startYArg, endXArg, endYArg }) => {
      const el = document.querySelector(selectorArg);
      if (!el) throw new Error(`Swipe target not found: ${selectorArg}`);

      const makeTouchEvent = (type, { touches, changedTouches }) => {
        const ev = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(ev, 'touches', { configurable: true, value: touches });
        Object.defineProperty(ev, 'changedTouches', { configurable: true, value: changedTouches });
        return ev;
      };

      const startPoint = { clientX: startXArg, clientY: startYArg };
      const endPoint = { clientX: endXArg, clientY: endYArg };

      el.dispatchEvent(makeTouchEvent('touchstart', {
        touches: [startPoint],
        changedTouches: [startPoint],
      }));

      el.dispatchEvent(makeTouchEvent('touchend', {
        touches: [],
        changedTouches: [endPoint],
      }));
    }, {
      selectorArg: selector,
      startXArg: startX,
      startYArg: startY,
      endXArg: endX,
      endYArg: endY,
    });
  }

  test('horizontal swipe left/right switches between Entry and Dashboard tabs', async ({ page }) => {
    await loginAdmin(page);

    const entryTab = page.locator('.tab[data-tab="entry"]');
    const dashboardTab = page.locator('.tab[data-tab="dashboard"]');

    await syntheticSwipe(page, {
      startX: 340,
      startY: 260,
      endX: 70,
      endY: 252,
    });

    await expect(dashboardTab).toHaveClass(/active/);
    await expect(page.locator('#dashboardTab')).toHaveClass(/active/);

    await page.waitForTimeout(360);

    await syntheticSwipe(page, {
      startX: 70,
      startY: 260,
      endX: 340,
      endY: 252,
    });

    await expect(entryTab).toHaveClass(/active/);
    await expect(page.locator('#entryTab')).toHaveClass(/active/);
  });
});
