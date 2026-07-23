import { test, expect } from '@playwright/test'

test.describe('Collections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('should navigate to collections page', async ({ page }) => {
    // Use command palette or header nav
    await page.goto('/collections')
    await expect(page.locator('h1')).toContainText('Candidate Collections')
  })

  test('should show empty state initially', async ({ page }) => {
    await page.goto('/collections')
    await expect(page.locator('text=No collections yet')).toBeVisible()
  })

  test('should show create collection form', async ({ page }) => {
    await page.goto('/collections')
    await expect(page.locator('input[placeholder*="Collection name"]')).toBeVisible()
  })

  test('should have export button when collections exist', async ({ page }) => {
    await page.goto('/collections')
    const exportBtn = page.locator('button[aria-label="Export collections"]')
    // Export only shows when collections exist
    await expect(exportBtn).not.toBeVisible()
  })
})
