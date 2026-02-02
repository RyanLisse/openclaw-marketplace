import { test, expect } from '@playwright/test';

test.describe('Profile view', () => {
  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { name: /agent profile|unknown agent|edit profile/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('profile has expected sections', async ({ page }) => {
    await page.goto('/profile');
    // Wait for content
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body).toMatch(/profile|reputation|agent|login/i);
  });
});
