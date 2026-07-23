# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Navigation >> should protect routes when not authenticated
- Location: tests/e2e/navigation.spec.ts:44:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
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
  3  | test.describe('Navigation', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login')
> 6  |     await page.fill('#email', 'test@example.com')
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  7  |     await page.fill('#password', 'password123')
  8  |     await page.click('button[type="submit"]')
  9  |     await expect(page).toHaveURL('/')
  10 |   })
  11 | 
  12 |   test('should navigate between pages via header', async ({ page }) => {
  13 |     // Search
  14 |     await page.click('a:has-text("Search")')
  15 |     await expect(page).toHaveURL('/search')
  16 | 
  17 |     // Back to dashboard
  18 |     await page.click('a:has-text("Talent Directory")')
  19 |     await expect(page).toHaveURL('/')
  20 |   })
  21 | 
  22 |   test('should toggle dark mode', async ({ page }) => {
  23 |     const darkModeButton = page.locator('button[aria-label="Toggle dark mode"]')
  24 |     await expect(darkModeButton).toBeVisible()
  25 | 
  26 |     // Check initial state (light mode - no 'dark' class on html)
  27 |     const html = page.locator('html')
  28 |     const hasDarkBefore = await html.evaluate(el => el.classList.contains('dark'))
  29 | 
  30 |     await darkModeButton.click()
  31 | 
  32 |     const hasDarkAfter = await html.evaluate(el => el.classList.contains('dark'))
  33 |     expect(hasDarkAfter).not.toBe(hasDarkBefore)
  34 |   })
  35 | 
  36 |   test('should be able to logout', async ({ page }) => {
  37 |     const logoutButton = page.locator('button[aria-label="Sign out"]')
  38 |     await expect(logoutButton).toBeVisible()
  39 | 
  40 |     await logoutButton.click()
  41 |     await expect(page).toHaveURL(/\/login/)
  42 |   })
  43 | 
  44 |   test('should protect routes when not authenticated', async ({ page }) => {
  45 |     // Logout first
  46 |     await page.click('button[aria-label="Sign out"]')
  47 |     await expect(page).toHaveURL(/\/login/)
  48 | 
  49 |     // Try to access protected route
  50 |     await page.goto('/')
  51 |     await expect(page).toHaveURL(/\/login/)
  52 |   })
  53 | })
  54 | 
```