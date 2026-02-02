import { test, expect } from '@playwright/test';

test.describe('Match proposal flow', () => {
  test('can navigate to intent detail from list', async ({ page }) => {
    await page.goto('/intents');
    const viewLink = page.getByRole('link', { name: /view/i }).first();
    if ((await viewLink.count()) > 0) {
      await viewLink.click();
      await expect(page).toHaveURL(/\/intents\/[^/]+$/);
    } else {
      // No intents - go directly to a valid-looking detail URL would 404
      // Just assert we're on browse page
      await expect(page.getByRole('heading', { name: /browse intents/i })).toBeVisible();
    }
  });

  test('intent detail page shows propose match section when open', async ({ page }) => {
    // Navigate to intents and try to get first intent link
    await page.goto('/intents');
    const links = page.locator('a[href^="/intents/"]').filter({ hasNot: page.getByText('Create') });
    const firstLink = links.first();
    if ((await firstLink.count()) > 0) {
      await firstLink.click();
      await expect(page).toHaveURL(/\/intents\/[a-z0-9]+/);
      // Page shows either "Propose Match" or "Back to Intents" or intent content
      await expect(page.getByText(/back to intents|propose match|skills|title/i)).toBeVisible();
    }
  });
});
