/**
 * Documents Page E2E Tests
 * Tests document management workflow
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `e2e-docs-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'E2E Docs User',
};

test.describe('Documents Page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Register test user
    await page.goto('/register');
    await page.locator('#name').fill(TEST_USER.name);
    await page.locator('#email').fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.locator('#confirmPassword').fill(TEST_USER.password);
    await page.getByRole('button', { name: /建立帳號|註冊|Register/i }).click();
    // Wait for success message or redirect to login
    await Promise.race([
      page.getByText(/註冊成功/).waitFor({ timeout: 15000 }),
      page.waitForURL(/login/, { timeout: 15000 }),
    ]);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.locator('#email').fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  test('should navigate to documents page', async ({ page }) => {
    await page.goto('/documents');

    // Page should load with search input and add button
    await expect(page.getByPlaceholder(/搜尋文件/)).toBeVisible();
    await expect(page.getByRole('button', { name: /新增/i })).toBeVisible();
  });

  test('should show type filter tabs', async ({ page }) => {
    await page.goto('/documents');

    // Check type filter tabs are present
    await expect(page.getByRole('tab', { name: '全部' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '合約' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '郵件' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '會議' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '報價' })).toBeVisible();
  });

  test('should open document create modal', async ({ page }) => {
    await page.goto('/documents');

    // Click add button
    await page.getByRole('button', { name: /新增/i }).click();

    // Check modal is open
    const dialog = page.getByRole('dialog', { name: /新增文件/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/文件名稱/)).toBeVisible();
    await expect(dialog.locator('#doc-type')).toBeVisible();
  });

  test('should close modal with cancel button', async ({ page }) => {
    await page.goto('/documents');

    // Open modal
    await page.getByRole('button', { name: /新增/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close with cancel
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should show empty state message', async ({ page }) => {
    await page.goto('/documents');

    // If no documents exist, should show empty message
    const emptyMessage = page.getByText(/尚無文件資料|找不到/);
    const documentList = page.locator('[class*="divide-y"]');

    // Either empty message or document list should be visible
    const hasDocuments = await documentList.isVisible().catch(() => false);
    if (!hasDocuments) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should have accessible form labels in create modal', async ({ page }) => {
    await page.goto('/documents');

    // Open create modal
    await page.getByRole('button', { name: /新增/i }).click();

    // Verify form accessibility
    await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');

    // All inputs should have labels
    const inputs = await page.locator('input:not([type="hidden"]):not([type="file"])').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const hasLabel = id || ariaLabel;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should switch between text and file upload mode', async ({ page }) => {
    await page.goto('/documents');

    // Open modal
    await page.getByRole('button', { name: /新增/i }).click();

    // Check default text mode
    await expect(page.getByRole('tab', { name: '文字輸入' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel(/文件內容/)).toBeVisible();

    // Switch to file mode
    await page.getByRole('tab', { name: '檔案上傳' }).click();
    await expect(page.getByRole('tab', { name: '檔案上傳' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('拖放檔案至此處')).toBeVisible();
  });
});
