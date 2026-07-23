# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> Search >> should show initial empty state
- Location: tests/e2e/search.spec.ts:21:3

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
  3  | test.describe('Search', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Navigate to login and authenticate first
  6  |     await page.goto('/login')
> 7  |     await page.fill('#email', 'test@example.com')
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill('#password', 'password123')
  9  |     await page.click('button[type="submit"]')
  10 |     await expect(page).toHaveURL('/')
  11 | 
  12 |     // Navigate to search
  13 |     await page.click('a:has-text("Search")')
  14 |     await expect(page).toHaveURL('/search')
  15 |   })
  16 | 
  17 |   test('should show search input on search page', async ({ page }) => {
  18 |     await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  19 |   })
  20 | 
  21 |   test('should show initial empty state', async ({ page }) => {
  22 |     await expect(page.locator('text=Start typing to search')).toBeVisible()
  23 |   })
  24 | 
  25 |   test('should navigate to search from header', async ({ page }) => {
  26 |     await expect(page.locator('nav a:has-text("Search")')).toBeVisible()
  27 |   })
  28 | })
  29 | 
```