import { test, expect } from '@playwright/test'

test.describe('Notes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('should navigate to notes page', async ({ page }) => {
    await page.goto('/notes-search')
    await expect(page.locator('h1')).toContainText('Notes')
  })

  test('should show search input on notes page', async ({ page }) => {
    await page.goto('/notes-search')
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test('should show empty state initially', async ({ page }) => {
    await page.goto('/notes-search')
    await expect(page.locator('text=No notes found')).toBeVisible()
  })
})
