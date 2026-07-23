import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('should navigate between pages via header', async ({ page }) => {
    // Search
    await page.click('a:has-text("Search")')
    await expect(page).toHaveURL('/search')

    // Back to dashboard
    await page.click('a:has-text("DevScout")')
    await expect(page).toHaveURL('/')
  })

  test('should toggle dark mode', async ({ page }) => {
    const darkModeButton = page.locator('button[aria-label="Toggle dark mode"]')
    await expect(darkModeButton).toBeVisible()

    // Check initial state (light mode - no 'dark' class on html)
    const html = page.locator('html')
    const hasDarkBefore = await html.evaluate(el => el.classList.contains('dark'))

    await darkModeButton.click()

    const hasDarkAfter = await html.evaluate(el => el.classList.contains('dark'))
    expect(hasDarkAfter).not.toBe(hasDarkBefore)
  })

  test('should be able to logout', async ({ page }) => {
    const logoutButton = page.locator('button[aria-label="Sign out"]')
    await expect(logoutButton).toBeVisible()

    await logoutButton.click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('should protect routes when not authenticated', async ({ page }) => {
    // Logout first
    await page.click('button[aria-label="Sign out"]')
    await expect(page).toHaveURL(/\/login/)

    // Try to access protected route
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })
})
