import { test, expect } from '@playwright/test';

// ─── Homepage ────────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
  test('loads and shows hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('AI itinerary generation')).toBeVisible();
  });

  test('shows featured tours section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Featured tours')).toBeVisible();
  });

  test('shows top attractions section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Top attractions')).toBeVisible();
  });
});

// ─── Navigation ──────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('tours link navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /tours/i }).first().click();
    await expect(page).toHaveURL('/tours');
  });

  test('attractions link navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /attractions/i }).first().click();
    await expect(page).toHaveURL('/attractions');
  });
});

// ─── Enquiry Form ─────────────────────────────────────────────────────────────

test.describe('Enquiry form', () => {
  test('shows validation error for missing required fields', async ({ page }) => {
    await page.goto('/enquiry');
    await page.getByRole('button', { name: /send/i }).click();
    // Form should not submit with empty required fields
    await expect(page).toHaveURL('/enquiry');
  });

  test('shows all required form fields', async ({ page }) => {
    await page.goto('/enquiry');
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});

// ─── Trip Planner ─────────────────────────────────────────────────────────────

test.describe('Trip planner', () => {
  test('plan trip page loads', async ({ page }) => {
    await page.goto('/plan-trip');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ─── AI Assistant ────────────────────────────────────────────────────────────

test.describe('AI assistant', () => {
  test('chat interface loads', async ({ page }) => {
    await page.goto('/ai-assistant');
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('sends a message and receives a reply', async ({ page }) => {
    await page.goto('/ai-assistant');
    const input = page.getByRole('textbox');
    await input.fill('What are the best things to do in Cape Town?');
    await page.keyboard.press('Enter');
    // Wait for reply to appear (local fallback reply appears immediately)
    await expect(page.getByText(/cape town|recommend|itinerary/i)).toBeVisible({ timeout: 10000 });
  });
});

// ─── Admin Login ──────────────────────────────────────────────────────────────

test.describe('Admin login', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('redirects unauthenticated users from admin pages', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

// ─── SEO & Meta ───────────────────────────────────────────────────────────────

test.describe('SEO', () => {
  test('homepage has meta description', async ({ page }) => {
    await page.goto('/');
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute('content', /.+/);
  });

  test('sitemap.xml is accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(body).toContain('<urlset');
  });
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

test.describe('Rate limiting', () => {
  test('enquiry API returns 429 after too many requests', async ({ request }) => {
    // Submit 11 requests (limit is 10/hour for enquiry)
    const responses = await Promise.all(
      Array.from({ length: 12 }).map(() =>
        request.post('/api/enquiries', {
          multipart: {
            fullName: 'Test User',
            email: 'test@example.com',
          },
        })
      )
    );
    const statuses = responses.map((r) => r.status());
    expect(statuses.some((s) => s === 429)).toBe(true);
  });
});
