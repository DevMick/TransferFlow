import { expect, test } from '@playwright/test';

test('home page renders and navigates to transfers', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /move money with confidence/i })).toBeVisible();

  await page.getByRole('button', { name: /view transfers/i }).click();
  await expect(page).toHaveURL(/\/transfers$/);

  // Not signed in → prompted to sign in.
  await expect(page.getByText(/sign in required/i)).toBeVisible();
});
