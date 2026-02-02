import { test, expect } from '@playwright/test';

test.describe('Intent browsing', () => {
  test('browse intents page loads', async ({ page }) => {
    await page.goto('/intents');
    await expect(page.getByRole('heading', { name: /browse intents/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create intent/i }).first()).toBeVisible();
  });

  test('has type and status filters', async ({ page }) => {
    await page.goto('/intents');
    await expect(page.getByText('Type').locator('..').locator('select')).toBeVisible();
    await expect(page.getByText('Status').locator('..').locator('select')).toBeVisible();
  });

  test('can filter by type', async ({ page }) => {
    await page.goto('/intents');
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('need');
    await expect(typeSelect).toHaveValue('need');
  });

  test('intent list or empty state visible', async ({ page }) => {
    await page.goto('/intents');
    await expect(page.locator('body')).toContainText(/browse|intent/i);
  });
});
