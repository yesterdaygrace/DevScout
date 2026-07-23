import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('h1')).toContainText('DevScout')
  })

  test('should show login form with email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
  })

  test('should be able to sign in and redirect to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard after mock auth
    await expect(page).toHaveURL('/')
  })

  test('should show dashboard after login', async ({ page }) => {
    // Mock auth is automatic in demo mode
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In')

    await page.click('button:has-text("Sign Up")')
    await expect(page.locator('button[type="submit"]')).toContainText('Sign Up')

    await page.click('button:has-text("Sign In")')
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
  })
})
