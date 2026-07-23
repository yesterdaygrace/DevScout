# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should be able to sign in and redirect to dashboard
- Location: tests/e2e/auth.spec.ts:17:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#email')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - alert [ref=e3]:
    - generic [ref=e4]:
      - text: Back online
      - button "Dismiss notification" [ref=e5]:
        - img [ref=e6]
  - generic [ref=e8]:
    - banner [ref=e9]:
      - generic [ref=e11]:
        - link "Talent Directory" [ref=e12] [cursor=pointer]:
          - /url: /
        - navigation [ref=e13]:
          - link "Search" [ref=e14] [cursor=pointer]:
            - /url: /search
            - img [ref=e15]
            - text: Search
          - button "Toggle dark mode" [ref=e17]:
            - img [ref=e18]
          - button "Sign out" [ref=e20]:
            - img [ref=e21]
            - text: Logout
    - main [ref=e23]:
      - generic [ref=e24]:
        - heading "Dashboard" [level=1] [ref=e25]
        - generic [ref=e26]:
          - heading "Recently Viewed" [level=2] [ref=e27]:
            - img [ref=e28]
            - text: Recently Viewed
          - generic [ref=e30]:
            - text: No profiles viewed yet.
            - link "Search developers" [ref=e31] [cursor=pointer]:
              - /url: /search
        - generic [ref=e32]:
          - heading "Shortlist" [level=2] [ref=e33]:
            - img [ref=e34]
            - text: Shortlist
          - generic [ref=e36]: No developers shortlisted yet.
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
> 19 |     await page.fill('#email', 'test@example.com')
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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
  40 |     await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
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