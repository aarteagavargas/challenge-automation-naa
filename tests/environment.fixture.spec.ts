import { test, expect } from './fixtures/environment.fixture';

test('logs the selected environment SHA-256 key before executing', async ({ environment, page }) => {
  expect(environment.secretKeySha256).toMatch(/^[a-f0-9]{64}$/);
  expect(environment.name).toMatch(/^(QA|CERT)$/);

  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});
