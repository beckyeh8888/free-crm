/**
 * Deal Pipeline E2E Tests
 * Complete deal management workflows
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_USER = {
  email: `e2e-deal-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'E2E Deal Tester',
};

const TEST_CUSTOMER = {
  name: 'Deal Pipeline Customer',
  email: 'deal-customer@example.com',
  company: 'Deal Corp',
};

const TEST_DEAL = {
  title: 'E2E Test Deal',
  value: '50000',
  stage: 'lead',
};

test.describe('Deal Pipeline', () => {
  test.describe.configure({ mode: 'serial' });

  // Setup: Register user and create customer
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // Register test user
    await page.goto('/register');
    await page.getByLabel(/名稱|Name/i).fill(TEST_USER.name);
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /註冊|Register|Sign up/i }).click();
    await page.waitForURL(/dashboard|login/, { timeout: 10000 });

    // Login
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Create a customer for deals
    await page.goto('/customers');
    await page.getByRole('button', { name: /新增|Add|Create/i }).click();
    await page.getByLabel(/名稱|Name/i).fill(TEST_CUSTOMER.name);
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_CUSTOMER.email);
    await page.getByLabel(/公司|Company/i).fill(TEST_CUSTOMER.company);
    await page.getByRole('button', { name: /儲存|Save|Submit/i }).click();
    await page.waitForTimeout(1000);

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test('should navigate to deals page', async ({ page }) => {
    // Click deals link in navigation
    await page.getByRole('link', { name: /商機|Deals/i }).click();

    // Should be on deals page
    await expect(page).toHaveURL(/deals/);

    // Should show deals heading
    await expect(page.getByRole('heading', { name: /商機|Deals/i })).toBeVisible();
  });

  test('should create a new deal', async ({ page }) => {
    await page.goto('/deals');

    // Click add deal button
    await page.getByRole('button', { name: /新增|Add|Create/i }).click();

    // Fill deal form
    await page.getByLabel(/標題|Title/i).fill(TEST_DEAL.title);
    await page.getByLabel(/金額|Value|Amount/i).fill(TEST_DEAL.value);

    // Select customer - use text match to find the option, then get its value
    const customerSelect = page.getByLabel(/客戶|Customer/i);
    if (await customerSelect.isVisible()) {
      // Find option that matches customer name and select it
      const option = customerSelect.locator(`option:has-text("${TEST_CUSTOMER.name}")`);
      const optionValue = await option.getAttribute('value');
      if (optionValue) {
        await customerSelect.selectOption(optionValue);
      }
    }

    // Submit form
    await page.getByRole('button', { name: /儲存|Save|Submit/i }).click();

    // Should show success message or redirect
    await expect(page.getByText(/成功|Success|Created/i).or(page.getByText(TEST_DEAL.title))).toBeVisible();
  });

  test('should view deals list', async ({ page }) => {
    await page.goto('/deals');

    // Should show deal in list
    await expect(page.getByText(TEST_DEAL.title)).toBeVisible();
  });

  test('should filter deals by stage', async ({ page }) => {
    await page.goto('/deals');

    // Find and click stage filter
    const stageFilter = page.getByLabel(/階段|Stage/i).or(page.getByRole('combobox', { name: /階段|Stage/i }));
    if (await stageFilter.isVisible()) {
      await stageFilter.selectOption('lead');

      // Wait for filter
      await page.waitForTimeout(500);

      // Should show lead stage deal
      await expect(page.getByText(TEST_DEAL.title)).toBeVisible();
    }
  });

  test('should update deal stage', async ({ page }) => {
    await page.goto('/deals');

    // Click on deal
    await page.getByText(TEST_DEAL.title).click();

    // Click edit or find stage selector
    const editButton = page.getByRole('button', { name: /編輯|Edit/i });
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    // Change stage to qualified
    const stageSelect = page.getByLabel(/階段|Stage/i);
    if (await stageSelect.isVisible()) {
      await stageSelect.selectOption('qualified');
    }

    // Save
    await page.getByRole('button', { name: /儲存|Save|Update/i }).click();

    // Should show success
    await expect(page.getByText(/成功|Success|Updated|qualified/i)).toBeVisible();
  });

  test('should update deal value', async ({ page }) => {
    await page.goto('/deals');

    // Click on deal
    await page.getByText(TEST_DEAL.title).click();

    // Click edit
    await page.getByRole('button', { name: /編輯|Edit/i }).click();

    // Update value
    const valueInput = page.getByLabel(/金額|Value|Amount/i);
    await valueInput.clear();
    await valueInput.fill('75000');

    // Save
    await page.getByRole('button', { name: /儲存|Save|Update/i }).click();

    // Should show success
    await expect(page.getByText(/成功|Success|Updated/i).or(page.getByText('75000'))).toBeVisible();
  });

  test('should close deal as won', async ({ page }) => {
    await page.goto('/deals');

    // Click on deal
    await page.getByText(TEST_DEAL.title).click();

    // Click edit
    await page.getByRole('button', { name: /編輯|Edit/i }).click();

    // Change stage to closed_won
    const stageSelect = page.getByLabel(/階段|Stage/i);
    if (await stageSelect.isVisible()) {
      await stageSelect.selectOption('closed_won');
    }

    // Save
    await page.getByRole('button', { name: /儲存|Save|Update/i }).click();

    // Should show success
    await expect(page.getByText(/成功|Success|closed_won|成交/i)).toBeVisible();
  });

  test('should delete deal', async ({ page }) => {
    await page.goto('/deals');

    // Click on deal
    await page.getByText(TEST_DEAL.title).first().click();

    // Click delete
    await page.getByRole('button', { name: /刪除|Delete/i }).click();

    // Confirm deletion
    const confirmButton = page.getByRole('button', { name: /確認|Confirm|Yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should redirect to deals list
    await expect(page).toHaveURL(/deals/);
  });
});

test.describe('Deal Pipeline Accessibility', () => {
  test('should have keyboard navigable deal cards', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/);

    await page.goto('/deals');

    // Check that interactive elements are focusable
    await page.keyboard.press('Tab');

    // Should be able to navigate with keyboard
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
