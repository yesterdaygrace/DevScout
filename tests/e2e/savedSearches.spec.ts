import { test, expect } from '@playwright/test'

test.describe('Saved Searches', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('should navigate to saved searches page', async ({ page }) => {
    await page.goto('/searches')
    await expect(page.locator('h1')).toContainText('Saved Searches')
  })

  test('should show empty state initially', async ({ page }) => {
    await page.goto('/searches')
    await expect(page.locator('text=No saved searches')).toBeVisible()
  })

  test('should show empty state with helpful message', async ({ page }) => {
    await page.goto('/searches')
    await expect(page.locator('text=Search')).toBeVisible()
  })
})
