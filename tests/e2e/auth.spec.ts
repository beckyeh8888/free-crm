/**
 * Authentication E2E Tests
 * Tests for login/logout user flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle(/登入|Login/);

    // Check form elements exist
    await expect(page.getByLabel(/電子郵件|Email/i)).toBeVisible();
    await expect(page.getByLabel(/密碼|Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /登入|Login/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    // Click login without filling form
    await page.getByRole('button', { name: /登入|Login/i }).click();

    // Should show validation errors
    await expect(page.getByText(/請輸入|required/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill form with invalid credentials
    await page.getByLabel(/電子郵件|Email/i).fill('invalid@example.com');
    await page.getByLabel(/密碼|Password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /登入|Login/i }).click();

    // Should show error message
    await expect(page.getByText(/錯誤|invalid|incorrect/i)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    // Click register link
    await page.getByRole('link', { name: /註冊|Register|Sign up/i }).click();

    // Should navigate to register page
    await expect(page).toHaveURL(/register/);
  });

  test('should display register page with WCAG compliant form', async ({ page }) => {
    await page.goto('/register');

    // Check form accessibility
    const nameInput = page.getByLabel(/名稱|Name/i);
    const emailInput = page.getByLabel(/電子郵件|Email/i);
    const passwordInput = page.getByLabel(/密碼|Password/i);

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check aria attributes
    await expect(nameInput).toHaveAttribute('id');
    await expect(emailInput).toHaveAttribute('id');
    await expect(passwordInput).toHaveAttribute('id');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
