# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should toggle between sign in and sign up
- Location: tests/e2e/auth.spec.ts:38:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('button[type="submit"]')
Expected substring: "Sign In"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('button[type="submit"]')

```

```yaml
- alert:
  - text: Back online
  - button "Dismiss notification"
- banner:
  - link "Talent Directory":
    - /url: /
  - navigation:
    - link "Search":
      - /url: /search
    - button "Toggle dark mode"
    - button "Sign out": Logout
- main:
  - heading "Dashboard" [level=1]
  - heading "Recently Viewed" [level=2]
  - text: No profiles viewed yet.
  - link "Search developers":
    - /url: /search
  - heading "Shortlist" [level=2]
  - text: No developers shortlisted yet.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Authentication', () => {
  4  |   test('should show login page when not authenticated', async ({ page }) => {
  5  |     await page.goto('/')
  6  |     await expect(page).toHaveURL(/\/login/)
  7  |     await expect(page.locator('h1')).toContainText('Talent Directory')
  8  |   })
  9  | 
  10 |   test('should show login form with email and password fields', async ({ page }) => {
  11 |     await page.goto('/login')
  12 |     await expect(page.locator('#email')).toBeVisible()
  13 |     await expect(page.locator('#password')).toBeVisible()
  14 |     await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
  15 |   })
  16 | 
  17 |   test('should be able to sign in and redirect to dashboard', async ({ page }) => {
  18 |     await page.goto('/login')
  19 |     await page.fill('#email', 'test@example.com')
  20 |     await page.fill('#password', 'password123')
  21 |     await page.click('button[type="submit"]')
  22 | 
  23 |     // Should redirect to dashboard after mock auth
  24 |     await expect(page).toHaveURL('/')
  25 |   })
  26 | 
  27 |   test('should show dashboard after login', async ({ page }) => {
  28 |     // Mock auth is automatic in demo mode
  29 |     await page.goto('/login')
  30 |     await page.fill('#email', 'test@example.com')
  31 |     await page.fill('#password', 'password123')
  32 |     await page.click('button[type="submit"]')
  33 | 
  34 |     await expect(page).toHaveURL('/')
  35 |     await expect(page.locator('h1')).toContainText('Dashboard')
  36 |   })
  37 | 
  38 |   test('should toggle between sign in and sign up', async ({ page }) => {
  39 |     await page.goto('/login')
> 40 |     await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
     |                                                         ^ Error: expect(locator).toContainText(expected) failed
  41 | 
  42 |     await page.click('button:has-text("Sign Up")')
  43 |     await expect(page.locator('button[type="submit"]')).toContainText('Sign Up')
  44 | 
  45 |     await page.click('button:has-text("Sign In")')
  46 |     await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
  47 |   })
  48 | })
  49 | 
```