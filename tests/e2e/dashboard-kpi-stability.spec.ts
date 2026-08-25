import { test, expect } from '@playwright/test'

test.describe('Dashboard KPI stability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    // If already authenticated, we are redirected to /; handle both
    if (await page.locator('#email').count()) {
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'password123')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/', { timeout: 10000 })
    } else {
      await expect(page).toHaveURL('/')
    }
  })

  test('KPI cards have numeric values', async ({ page }) => {
    // Ensure dashboard loaded
    await expect(page.locator('text=Dashboard').first()).toBeVisible()
    
    // KPIGrid: 4 cards by title - target KPI cards specifically (a.group with rounded-lg, not sidebar)
    const titles = ['Searches', 'Collections', 'Shortlisted', 'Saved Searches']
    for (const title of titles) {
      const kpiCard = page.locator(`a.group:has-text("${title}")`).first()
      await expect(kpiCard).toBeVisible({ timeout: 10000 })
      // Value: the large tabular-nums number (36px) inside KPI card
      const valueEl = kpiCard.locator('p.font-bold').first()
      await expect(valueEl).toBeVisible()
      await expect(valueEl).toHaveText(/^\d+$/, { timeout: 5000 })
      // Secondary text present
      await expect(kpiCard).toContainText(/today|candidates|—/i)
    }

    // Additional dashboard cards have information (not just empty)
    const dashboardSections = ['Search Analytics', 'Language Distribution', 'Collections', 'Quick Actions', 'Activity']
    for (const section of dashboardSections) {
      await expect(page.locator(`text=${section}`).first()).toBeVisible()
    }
  })
})
