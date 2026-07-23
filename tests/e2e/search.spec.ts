import { test, expect } from '@playwright/test'

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate first
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')

    // Navigate to search
    await page.click('a:has-text("Search")')
    await expect(page).toHaveURL('/search')
  })

  test('should show search input on search page', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test('should show initial empty state', async ({ page }) => {
    await expect(page.locator('text=Start typing to search')).toBeVisible()
  })

  test('should navigate to search from header', async ({ page }) => {
    await expect(page.locator('nav a:has-text("Search")')).toBeVisible()
  })
})
