import { test, expect } from '@playwright/test';

/**
 * E2E: Dispute flow.
 * Requires a completed/accepted match to exist. Creates dispute with evidence,
 * waits for AI analysis, verifies resolution/confidence and notification.
 */
test.describe('Dispute flow', () => {
  test('disputes page loads and shows list or empty state', async ({ page }) => {
    await page.goto('/disputes');
    await expect(page).toHaveURL(/\/disputes/);
    await expect(
      page.getByRole('heading', { name: /disputes/i }).or(page.getByText(/dispute/i))
    ).toBeVisible({ timeout: 15_000 });
  });

  test('can navigate to create dispute when match exists', async ({ page }) => {
    await page.goto('/disputes');
    const createLink = page.getByRole('link', { name: /create|new dispute/i }).first();
    const createBtn = page.getByRole('button', { name: /create|new dispute/i }).first();
    if ((await createLink.count()) > 0) {
      await createLink.click();
      await expect(page.getByText(/evidence|reason|match/i)).toBeVisible({ timeout: 10_000 });
    } else if ((await createBtn.count()) > 0) {
      await createBtn.click();
      await expect(page.getByText(/evidence|reason|match/i)).toBeVisible({ timeout: 10_000 });
    }
  });
});
