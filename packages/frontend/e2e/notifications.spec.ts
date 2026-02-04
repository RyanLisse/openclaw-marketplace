import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test('notification bell opens dropdown and shows list or empty state', async ({ page }) => {
    await page.goto('/');
    const bell = page.getByRole('button', { name: /notifications/i });
    await expect(bell).toBeVisible({ timeout: 15_000 });
    await bell.click();
    await expect(page.getByText('Notifications').first()).toBeVisible({ timeout: 5000 });
  });

  test('mark all read reduces unread badge when present', async ({ page }) => {
    await page.goto('/');
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();
    const markAllRead = page.getByRole('button', { name: /mark all read/i });
    if ((await markAllRead.count()) > 0) {
      await markAllRead.click();
      await page.waitForTimeout(800);
      await bell.click();
      const badge = page.locator('[class*="rounded-full"]').filter({ hasText: /^\d+$/ });
      await expect(badge).toHaveCount(0);
    }
  });

  test('notification list shows items or empty message', async ({ page }) => {
    await page.goto('/');
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();
    const hasList = (await page.locator('ul li').count()) > 0;
    const hasEmpty = (await page.getByText(/no notifications/i).count()) > 0;
    expect(hasList || hasEmpty).toBeTruthy();
  });
});
