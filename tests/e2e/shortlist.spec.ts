import { test, expect } from '@playwright/test'

test.describe('Shortlist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('should show empty shortlist on dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard')
    await expect(page.locator('text=No developers shortlisted yet')).toBeVisible()
  })

  test('should show empty recently viewed on dashboard', async ({ page }) => {
    await expect(page.locator('text=No profiles viewed yet')).toBeVisible()
    await expect(page.locator('a:has-text("Search developers")')).toBeVisible()
  })
})
