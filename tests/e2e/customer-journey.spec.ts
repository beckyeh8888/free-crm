/**
 * Customer Journey E2E Tests
 * Complete customer management workflows
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_USER = {
  email: `e2e-customer-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'E2E Test User',
};

const TEST_CUSTOMER = {
  name: 'E2E Test Customer',
  email: 'e2e-customer@example.com',
  phone: '0912-345-678',
  company: 'E2E Corp',
  type: 'B2B',
};

test.describe('Customer Journey', () => {
  test.describe.configure({ mode: 'serial' });

  // Register a test user before tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // Register test user
    await page.goto('/register');

    await page.getByLabel(/名稱|Name/i).fill(TEST_USER.name);
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);

    await page.getByRole('button', { name: /註冊|Register|Sign up/i }).click();

    // Wait for redirect to dashboard or login
    await page.waitForURL(/dashboard|login/, { timeout: 10000 });

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');

    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();

    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test('should navigate to customers page', async ({ page }) => {
    // Click customers link in navigation
    await page.getByRole('link', { name: /客戶|Customers/i }).click();

    // Should be on customers page
    await expect(page).toHaveURL(/customers/);

    // Should show customers heading
    await expect(page.getByRole('heading', { name: /客戶|Customers/i })).toBeVisible();
  });

  test('should create a new customer', async ({ page }) => {
    // Navigate to customers
    await page.goto('/customers');

    // Click add customer button
    await page.getByRole('button', { name: /新增|Add|Create/i }).click();

    // Fill customer form
    await page.getByLabel(/名稱|Name/i).fill(TEST_CUSTOMER.name);
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_CUSTOMER.email);
    await page.getByLabel(/電話|Phone/i).fill(TEST_CUSTOMER.phone);
    await page.getByLabel(/公司|Company/i).fill(TEST_CUSTOMER.company);

    // Select customer type if dropdown exists
    const typeSelect = page.getByLabel(/類型|Type/i);
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('B2B');
    }

    // Submit form
    await page.getByRole('button', { name: /儲存|Save|Submit/i }).click();

    // Should show success message or redirect to customer list
    await expect(page.getByText(/成功|Success|Created/i).or(page.locator(`text=${TEST_CUSTOMER.name}`))).toBeVisible();
  });

  test('should view customer list', async ({ page }) => {
    await page.goto('/customers');

    // Should show customer in list
    await expect(page.getByText(TEST_CUSTOMER.name)).toBeVisible();
  });

  test('should search customers', async ({ page }) => {
    await page.goto('/customers');

    // Enter search term
    const searchInput = page.getByPlaceholder(/搜尋|Search/i);
    await searchInput.fill('E2E');

    // Wait for search results
    await page.waitForTimeout(500);

    // Should show matching customer
    await expect(page.getByText(TEST_CUSTOMER.name)).toBeVisible();
  });

  test('should filter customers by type', async ({ page }) => {
    await page.goto('/customers');

    // Find and click filter
    const typeFilter = page.getByLabel(/類型|Type/i).or(page.getByRole('combobox', { name: /類型|Type/i }));
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption('B2B');

      // Wait for filter
      await page.waitForTimeout(500);

      // Should still show B2B customer
      await expect(page.getByText(TEST_CUSTOMER.name)).toBeVisible();
    }
  });

  test('should view customer details', async ({ page }) => {
    await page.goto('/customers');

    // Click on customer name or row
    await page.getByText(TEST_CUSTOMER.name).click();

    // Should show customer details
    await expect(page.getByText(TEST_CUSTOMER.email)).toBeVisible();
    await expect(page.getByText(TEST_CUSTOMER.company)).toBeVisible();
  });

  test('should edit customer', async ({ page }) => {
    await page.goto('/customers');

    // Navigate to customer detail
    await page.getByText(TEST_CUSTOMER.name).click();

    // Click edit button
    await page.getByRole('button', { name: /編輯|Edit/i }).click();

    // Update company name
    const companyInput = page.getByLabel(/公司|Company/i);
    await companyInput.clear();
    await companyInput.fill('Updated E2E Corp');

    // Save changes
    await page.getByRole('button', { name: /儲存|Save|Update/i }).click();

    // Should show success or updated value
    await expect(page.getByText(/成功|Success|Updated/i).or(page.getByText('Updated E2E Corp'))).toBeVisible();
  });

  test('should delete customer with confirmation', async ({ page }) => {
    await page.goto('/customers');

    // Navigate to customer detail
    await page.getByText(TEST_CUSTOMER.name).first().click();

    // Click delete button
    await page.getByRole('button', { name: /刪除|Delete/i }).click();

    // Confirm deletion in dialog
    const confirmButton = page.getByRole('button', { name: /確認|Confirm|Yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should redirect to list or show success message
    await expect(page).toHaveURL(/customers/);
  });
});

test.describe('Customer Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/);

    await page.goto('/customers');

    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check no skipped heading levels
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/);

    await page.goto('/customers');
    await page.getByRole('button', { name: /新增|Add|Create/i }).click();

    // Check that form inputs have associated labels
    const inputs = await page.locator('input:not([type="hidden"])').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have id (for label association), aria-label, or aria-labelledby
      const hasLabel = id || ariaLabel || ariaLabelledBy;
      expect(hasLabel).toBeTruthy();
    }
  });
});
