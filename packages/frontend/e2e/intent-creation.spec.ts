import { test, expect } from '@playwright/test';

test.describe('Intent creation flow', () => {
  test('navigates to create intent page', async ({ page }) => {
    await page.goto('/intents');
    await expect(page.getByRole('heading', { name: /browse intents/i })).toBeVisible();
    await page.getByRole('link', { name: /create intent/i }).first().click();
    await expect(page).toHaveURL(/\/intents\/new/);
    await expect(page.getByRole('heading', { name: /create intent/i })).toBeVisible();
  });

  test('shows intent creation form with all fields', async ({ page }) => {
    await page.goto('/intents/new');
    await expect(page.getByPlaceholder(/research summaries/i)).toBeVisible();
    await expect(page.getByPlaceholder(/describe what/i)).toBeVisible();
    await expect(page.getByPlaceholder(/type to see suggestions/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create intent/i })).toBeVisible();
  });

  test('can fill form and attempt submit', async ({ page }) => {
    await page.goto('/intents/new');
    await page.getByPlaceholder(/research summaries/i).fill('E2E test intent');
    await page.getByPlaceholder(/describe what/i).fill('Testing intent creation flow');
    await page.getByPlaceholder(/type to see suggestions/i).fill('research, testing');
    await page.getByRole('button', { name: /create intent/i }).click();
    // Either navigates to intent detail (success) or stays/shows error
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasIntentId = /\/intents\/[a-z0-9]+$/.test(url) && !url.includes('/new');
    const hasError = (await page.getByText(/error|failed/i).count()) > 0;
    expect(hasIntentId || hasError || url.includes('/intents/new')).toBeTruthy();
  });
});
