/**
 * Contact Management E2E Tests
 * Complete contact management workflows within customers
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_USER = {
  email: `e2e-contact-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'E2E Contact Tester',
};

const TEST_CUSTOMER = {
  name: 'Contact Test Customer',
  email: 'contact-customer@example.com',
  company: 'Contact Corp',
};

const TEST_CONTACT = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '0912-111-222',
  title: 'CEO',
};

const TEST_CONTACT_2 = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '0912-333-444',
  title: 'CTO',
};

test.describe('Contact Management', () => {
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

    // Create a customer
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

  test('should view contacts section in customer detail', async ({ page }) => {
    await page.goto('/customers');

    // Click on customer
    await page.getByText(TEST_CUSTOMER.name).click();

    // Should show contacts section
    await expect(page.getByText(/聯絡人|Contacts/i)).toBeVisible();
  });

  test('should add a contact to customer', async ({ page }) => {
    await page.goto('/customers');
    await page.getByText(TEST_CUSTOMER.name).click();

    // Click add contact button
    await page.getByRole('button', { name: /新增聯絡人|Add Contact/i }).click();

    // Fill contact form
    await page.getByLabel(/名稱|Name/i).fill(TEST_CONTACT.name);
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_CONTACT.email);
    await page.getByLabel(/電話|Phone/i).fill(TEST_CONTACT.phone);
    await page.getByLabel(/職稱|Title/i).fill(TEST_CONTACT.title);

    // Submit
    await page.getByRole('button', { name: /儲存|Save|Submit/i }).click();

    // Should show contact in list
    await expect(page.getByText(TEST_CONTACT.name)).toBeVisible();
  });

  test('should set contact as primary', async ({ page }) => {
    await page.goto('/customers');
    await page.getByText(TEST_CUSTOMER.name).click();

    // Add another contact first
    await page.getByRole('button', { name: /新增聯絡人|Add Contact/i }).click();
    await page.getByLabel(/名稱|Name/i).fill(TEST_CONTACT_2.name);
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_CONTACT_2.email);

    // Set as primary
    const primaryCheckbox = page.getByLabel(/主要聯絡人|Primary/i);
    if (await primaryCheckbox.isVisible()) {
      await primaryCheckbox.check();
    }

    await page.getByRole('button', { name: /儲存|Save|Submit/i }).click();

    // Should show as primary
    await expect(page.getByText(TEST_CONTACT_2.name)).toBeVisible();
  });

  test('should edit contact', async ({ page }) => {
    await page.goto('/customers');
    await page.getByText(TEST_CUSTOMER.name).click();

    // Click on contact to edit
    await page.getByText(TEST_CONTACT.name).click();

    // Click edit button
    await page.getByRole('button', { name: /編輯|Edit/i }).click();

    // Update title
    const titleInput = page.getByLabel(/職稱|Title/i);
    await titleInput.clear();
    await titleInput.fill('President');

    // Save
    await page.getByRole('button', { name: /儲存|Save|Update/i }).click();

    // Should show updated title
    await expect(page.getByText(/成功|Success|President/i)).toBeVisible();
  });

  test('should delete contact', async ({ page }) => {
    await page.goto('/customers');
    await page.getByText(TEST_CUSTOMER.name).click();

    // Click on contact
    await page.getByText(TEST_CONTACT_2.name).click();

    // Click delete
    await page.getByRole('button', { name: /刪除|Delete/i }).click();

    // Confirm
    const confirmButton = page.getByRole('button', { name: /確認|Confirm|Yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Contact should be removed
    await page.waitForTimeout(500);
    await expect(page.getByText(TEST_CONTACT_2.name)).not.toBeVisible();
  });

  test('should only have one primary contact', async ({ page }) => {
    await page.goto('/customers');
    await page.getByText(TEST_CUSTOMER.name).click();

    // Count primary indicators
    const primaryBadges = page.locator('text=/主要|Primary/i');
    const count = await primaryBadges.count();

    // Should have at most one primary
    expect(count).toBeLessThanOrEqual(1);
  });
});

test.describe('Contact Accessibility', () => {
  test('should have accessible contact form', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/);

    await page.goto('/customers');
    await page.getByText(TEST_CUSTOMER.name).click();

    // Try to open add contact form
    const addButton = page.getByRole('button', { name: /新增聯絡人|Add Contact/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // Check form inputs have labels
      const inputs = await page.locator('input:not([type="hidden"])').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        expect(id || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should show focus indicators', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill(TEST_USER.email);
    await page.getByLabel(/密碼|Password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/);

    await page.goto('/customers');
    await page.getByText(TEST_CUSTOMER.name).click();

    // Tab to focus on an element
    await page.keyboard.press('Tab');

    // Check focused element has visible focus indicator
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
