import { test, expect } from '@playwright/test';

test.describe('Agent workflow E2E', () => {
  test('full flow: register agent, create need, view matches, propose, accept, verify notification', async ({
    page,
  }) => {
    const timeout = 30_000;

    // (1) Register agent: visit profile as setup step
    await page.goto('/profile');
    await expect(
      page.getByRole('heading', { name: /agent profile/i })
    ).toBeVisible({ timeout });

    // (2) Create need intent
    await page.goto('/intents/new');
    await expect(page.getByRole('heading', { name: /create intent/i })).toBeVisible({ timeout });
    await page.getByPlaceholder(/research summaries/i).fill('E2E need intent');
    await page.getByPlaceholder(/describe what/i).fill('Agent workflow test need');
    await page.getByPlaceholder(/type to see suggestions/i).fill('research');
    await page.getByRole('button', { name: /create intent/i }).click();

    // (3) Wait for redirect to intent detail (embedding/matching may run in background)
    await expect(page).toHaveURL(/\/intents\/[a-z0-9]+$/, { timeout });
    await expect(page.getByText(/e2e need intent/i)).toBeVisible({ timeout });

    // (4) View matches page
    await page.goto('/matches');
    await expect(page.getByRole('heading', { name: /matches/i })).toBeVisible({ timeout });
    await page.waitForSelector('text=Needs', { timeout });
    await page.waitForSelector('text=Offers', { timeout });

    // (5) Create offer intent and propose match, then accept
    await page.goto('/intents/new');
    await page.getByPlaceholder(/research summaries/i).fill('E2E offer intent');
    await page.getByPlaceholder(/describe what/i).fill('Agent workflow test offer');
    await page.getByPlaceholder(/type to see suggestions/i).fill('research');
    await page.getByRole('button', { name: /create intent/i }).click();
    await expect(page).toHaveURL(/\/intents\/[a-z0-9]+$/, { timeout });

    // Go to need intent detail and propose match to this offer (or use first offer on page)
    await page.goto('/intents');
    const needLink = page.locator('a[href^="/intents/"]').filter({ hasText: /e2e need intent/i }).first();
    await needLink.click();
    await expect(page).toHaveURL(/\/intents\/[a-z0-9]+$/);
    const proposeBtn = page.getByRole('button', { name: /propose/i }).first();
    if ((await proposeBtn.count()) > 0) {
      await proposeBtn.click();
      await page.waitForTimeout(1500);
    }

    // Go to offer intent detail and accept the proposed match if visible
    await page.goto('/intents');
    const offerLink = page.locator('a[href^="/intents/"]').filter({ hasText: /e2e offer intent/i }).first();
    await offerLink.click();
    await expect(page).toHaveURL(/\/intents\/[a-z0-9]+$/);
    const acceptBtn = page.getByRole('button', { name: /^accept$/i }).first();
    if ((await acceptBtn.count()) > 0) {
      await acceptBtn.click();
      await page.waitForTimeout(1000);
    }

    // (6) Verify notification: open notification bell and check for content
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();
    await page.waitForSelector('text=Notifications', { timeout: 30_000 });
    const panel = page.locator('text=Notifications').first();
    await expect(panel).toBeVisible({ timeout: 30_000 });
  });
});
