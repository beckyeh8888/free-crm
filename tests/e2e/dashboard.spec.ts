/**
 * Dashboard Page E2E Tests
 * Tests for dashboard page layout and content
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test('should display dashboard structure after login', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill login form
    await page.getByLabel(/電子郵件|Email/i).fill('admin@example.com');
    await page.getByLabel(/密碼|Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登入|Login/i }).click();

    // Wait for navigation to dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Check sidebar navigation items
    await expect(page.getByRole('link', { name: /儀表板|Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /客戶|Customers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /商機|Deals/i })).toBeVisible();
  });

  test('should display stat cards on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill('admin@example.com');
    await page.getByLabel(/密碼|Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Check that stat card articles are present
    const statCards = page.locator('article');
    await expect(statCards.first()).toBeVisible();
  });

  test('should display pipeline overview section', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill('admin@example.com');
    await page.getByLabel(/密碼|Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Check pipeline overview heading
    await expect(page.getByRole('heading', { name: /Pipeline 概覽/i })).toBeVisible();
  });

  test('should display recent activity section', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill('admin@example.com');
    await page.getByLabel(/密碼|Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Check recent activity heading
    await expect(page.getByRole('heading', { name: /近期活動/i })).toBeVisible();
  });

  test('should have accessible skip link', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill('admin@example.com');
    await page.getByLabel(/密碼|Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Check skip link exists (may be visually hidden)
    const skipLink = page.getByRole('link', { name: /跳至主要內容|Skip/i });
    await expect(skipLink).toBeAttached();
  });

  test('should navigate to customers page from sidebar', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/電子郵件|Email/i).fill('admin@example.com');
    await page.getByLabel(/密碼|Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登入|Login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Click customers link in sidebar
    await page.getByRole('link', { name: /客戶|Customers/i }).click();

    // Should navigate to customers page
    await expect(page).toHaveURL(/customers/);
  });
});
