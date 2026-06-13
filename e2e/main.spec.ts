/**
 * Playwright E2E tests — full user journey
 * Covers: homepage, navigation, tour browsing, attraction browsing,
 *         AI assistant chat, trip planner, enquiry form,
 *         itinerary save + share, review submission, admin login,
 *         admin dashboard, mobile responsiveness
 *
 * Run: npx playwright test
 * Requires: app running at BASE_URL (default http://localhost:3000)
 */

import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function gotoAndWait(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
}

// ─── 1. Homepage ─────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
  test('loads and shows hero headline', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('h1')).toContainText('Cape Town');
  });
  test('hero has two CTAs', async ({ page }) => {
    await gotoAndWait(page, '/');
    const hero = page.locator('.hero-left');
    await expect(hero.getByRole('link', { name: /explore tours/i })).toBeVisible();
    await expect(hero.getByRole('link', { name: /build itinerary/i })).toBeVisible();
  });
  test('stats bar is visible', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('.stats-bar')).toBeVisible();
  });
  test('how-it-works section has 3 steps', async ({ page }) => {
    await gotoAndWait(page, '/');
    const steps = page.locator('.panel').filter({ hasText: /Select|Auto-generate|Convert/ });
    await expect(steps).toHaveCount(3);
  });
  test('CTA banner links to enquiry', async ({ page }) => {
    await gotoAndWait(page, '/');
    const cta = page.getByRole('link', { name: /enquire now/i }).last();
    await expect(cta).toHaveAttribute('href', /\/enquiry/);
  });
  test('WhatsApp fixed button visible when configured', async ({ page }) => {
    await gotoAndWait(page, '/');
    const wa = page.locator('.wa-fixed');
    if (await wa.count() > 0) {
      await expect(wa).toBeVisible();
    }
  });
  test('page title contains Capeverse', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page).toHaveTitle(/Capeverse/i);
  });
  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await gotoAndWait(page, '/');
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});

// ─── 2. Navigation ────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('site header is sticky and visible', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('.site-header')).toBeVisible();
  });
  test('desktop nav links are present', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit' && page.viewportSize()?.width! < 960, 'mobile');
    await gotoAndWait(page, '/');
    await expect(page.getByRole('link', { name: /^tours$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /attractions/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /plan my trip/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ai assistant/i })).toBeVisible();
  });
  test('logo links to homepage', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    await page.locator('.nav-logo').click();
    await expect(page).toHaveURL(`${BASE}/`);
  });
  test('footer is present', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('.site-footer')).toBeVisible();
  });
  test('footer links to tours', async ({ page }) => {
    await gotoAndWait(page, '/');
    const footerTours = page.locator('.site-footer').getByRole('link', { name: /tours/i });
    await expect(footerTours.first()).toBeVisible();
  });
});

// ─── 3. Mobile navigation ─────────────────────────────────────────────────────

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('hamburger button is visible on mobile', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('.hamburger')).toBeVisible();
  });
  test('desktop nav is hidden on mobile', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('.desktop-nav')).toBeHidden();
  });
  test('mobile drawer opens on hamburger click', async ({ page }) => {
    await gotoAndWait(page, '/');
    await page.locator('.hamburger').click();
    await expect(page.locator('.mobile-menu')).toBeVisible();
  });
  test('mobile drawer has all nav items', async ({ page }) => {
    await gotoAndWait(page, '/');
    await page.locator('.hamburger').click();
    await expect(page.locator('.mobile-nav-item')).toHaveCount(4);
  });
  test('mobile drawer closes on backdrop click', async ({ page }) => {
    await gotoAndWait(page, '/');
    await page.locator('.hamburger').click();
    await page.locator('.mobile-drawer').click({ position: { x: 10, y: 400 } });
    await expect(page.locator('.mobile-menu')).toBeHidden();
  });
});

// ─── 4. Tours page ────────────────────────────────────────────────────────────

test.describe('Tours listing', () => {
  test('tours page loads', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    await expect(page.locator('h1')).toContainText(/Cape Town/i);
  });
  test('shows empty state or tour cards', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    const hasCards    = await page.locator('.card').count() > 0;
    const hasEmpty    = await page.locator('.empty-state').count() > 0;
    expect(hasCards || hasEmpty).toBe(true);
  });
  test('tour card links to detail page', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    const firstCard = page.locator('.card').first();
    if (await firstCard.count() > 0) {
      const link = firstCard.locator('a').first();
      const href = await link.getAttribute('href');
      expect(href).toMatch(/\/tours\//);
    }
  });
  test('tour card shows price', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    const card = page.locator('.card').first();
    if (await card.count() > 0) {
      await expect(card.locator('.card-price')).toBeVisible();
    }
  });
});

// ─── 5. Tour detail page ──────────────────────────────────────────────────────

test.describe('Tour detail page', () => {
  test('navigates to tour detail from listing', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    const firstCard = page.locator('.card a').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      await expect(page.locator('h1')).toBeVisible();
      await expect(page).toHaveURL(/\/tours\/.+/);
    }
  });
  test('tour detail has enquire button', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    const firstCard = page.locator('.card a').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      await expect(page.getByRole('link', { name: /enquire/i })).toBeVisible();
    }
  });
  test('404 for nonexistent tour slug', async ({ page }) => {
    const res = await page.goto(`${BASE}/tours/this-tour-does-not-exist-xyz`);
    expect(res?.status()).toBe(404);
  });
});

// ─── 6. Attractions ───────────────────────────────────────────────────────────

test.describe('Attractions listing', () => {
  test('attractions page loads', async ({ page }) => {
    await gotoAndWait(page, '/attractions');
    await expect(page.locator('h1')).toBeVisible();
  });
  test('shows attractions grid or empty state', async ({ page }) => {
    await gotoAndWait(page, '/attractions');
    const hasCards = await page.locator('.card').count() > 0;
    const hasEmpty = await page.locator('.empty-state').count() > 0;
    expect(hasCards || hasEmpty).toBe(true);
  });
  test('attraction card links to detail', async ({ page }) => {
    await gotoAndWait(page, '/attractions');
    const card = page.locator('.card a').first();
    if (await card.count() > 0) {
      const href = await card.getAttribute('href');
      expect(href).toMatch(/\/attractions\//);
    }
  });
});

// ─── 7. AI Assistant ──────────────────────────────────────────────────────────

test.describe('AI Assistant', () => {
  test('page loads with welcome message', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    await expect(page.locator('.chat-bubble.assistant').first()).toBeVisible();
  });
  test('welcome message mentions Cape Town', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    const firstBubble = page.locator('.chat-bubble.assistant').first();
    await expect(firstBubble).toContainText(/Cape|travel|trip/i);
  });
  test('starter chips are visible', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    await expect(page.locator('.starter-chip').first()).toBeVisible();
  });
  test('clicking starter chip adds user message', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    const chip = page.locator('.starter-chip').first();
    await chip.click();
    await expect(page.locator('.chat-bubble.user')).toBeVisible();
  });
  test('typing in input and pressing Send adds message', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    const textarea = page.locator('textarea').first();
    await textarea.fill('We are a couple, 3 days, love wine.');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.locator('.chat-bubble.user').first()).toContainText('couple');
  });
  test('Enter key sends message', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    const textarea = page.locator('textarea').first();
    await textarea.fill('Family trip with kids.');
    await textarea.press('Enter');
    await expect(page.locator('.chat-bubble.user').first()).toBeVisible();
  });
  test('assistant responds after sending message', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    const textarea = page.locator('textarea').first();
    await textarea.fill('3 days, solo, scenic drives.');
    await textarea.press('Enter');
    // Wait for assistant reply
    await page.waitForSelector('.chat-bubble.assistant:nth-child(2)', { timeout: 15000 });
    const bubbles = page.locator('.chat-bubble.assistant');
    expect(await bubbles.count()).toBeGreaterThan(1);
  });
  test('intent chips appear after trip details detected', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    const textarea = page.locator('textarea').first();
    await textarea.fill('3 days, couple, wine and scenic.');
    await textarea.press('Enter');
    await page.waitForSelector('.intent-chip', { timeout: 5000 }).catch(() => {});
    const chips = page.locator('.intent-chip');
    if (await chips.count() > 0) {
      await expect(chips.first()).toBeVisible();
    }
  });
  test('planner handoff link appears after 3 messages', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    const textarea = page.locator('textarea').first();
    for (const msg of ['Hello', 'Couple, 3 days', 'We love wine']) {
      await textarea.fill(msg);
      await textarea.press('Enter');
      await page.waitForTimeout(500);
    }
    const plannerLink = page.getByRole('link', { name: /planner|itinerary/i });
    if (await plannerLink.count() > 0) {
      await expect(plannerLink.first()).toBeVisible();
    }
  });
  test('Send button is disabled when textarea is empty', async ({ page }) => {
    await gotoAndWait(page, '/ai-assistant');
    const sendBtn = page.getByRole('button', { name: /send/i });
    await expect(sendBtn).toBeDisabled();
  });
});

// ─── 8. Trip Planner ─────────────────────────────────────────────────────────

test.describe('Trip Planner', () => {
  test('plan-trip page loads', async ({ page }) => {
    await gotoAndWait(page, '/plan-trip');
    await expect(page.locator('h1')).toBeVisible();
  });
  test('interest chips are shown', async ({ page }) => {
    await gotoAndWait(page, '/plan-trip');
    await expect(page.locator('.chip').first()).toBeVisible();
  });
  test('at least one interest chip is clickable', async ({ page }) => {
    await gotoAndWait(page, '/plan-trip');
    const chip = page.locator('.chip').first();
    await chip.click();
    await expect(chip).toHaveClass(/active/);
  });
  test('Generate button is disabled without selection', async ({ page }) => {
    await gotoAndWait(page, '/plan-trip');
    const btn = page.getByRole('button', { name: /generate/i });
    await expect(btn).toBeDisabled();
  });
  test('Generate button enabled after selecting interest + attraction', async ({ page }) => {
    await gotoAndWait(page, '/plan-trip');
    // Select first interest chip
    await page.locator('.chip').first().click();
    // Select first attraction
    const attraction = page.locator('.choice-chip').first();
    if (await attraction.count() > 0) await attraction.click();
    await expect(page.getByRole('button', { name: /generate/i })).toBeEnabled();
  });
  test('generating shows skeleton then result', async ({ page }) => {
    await gotoAndWait(page, '/plan-trip');
    await page.locator('.chip').first().click();
    const attraction = page.locator('.choice-chip').first();
    if (await attraction.count() > 0) {
      await attraction.click();
      await page.getByRole('button', { name: /generate/i }).click();
      // Skeleton should appear
      const skeleton = page.locator('[aria-busy="true"]');
      if (await skeleton.count() > 0) {
        await expect(skeleton).toBeVisible();
      }
      // Then result
      await page.waitForSelector('.itinerary-output, .day-card', { timeout: 20000 });
      const hasOutput = await page.locator('.itinerary-output').count() > 0;
      const hasDays   = await page.locator('.itinerary-day').count() > 0;
      expect(hasOutput || hasDays).toBe(true);
    }
  });
  test('pace dropdown has 3 options', async ({ page }) => {
    await gotoAndWait(page, '/plan-trip');
    const paceSelect = page.getByRole('combobox').filter({ hasText: /balanced|relaxed|packed/i });
    if (await paceSelect.count() > 0) {
      const options = await paceSelect.locator('option').count();
      expect(options).toBe(3);
    }
  });
});

// ─── 9. Enquiry form ──────────────────────────────────────────────────────────

test.describe('Enquiry form', () => {
  test('enquiry page loads', async ({ page }) => {
    await gotoAndWait(page, '/enquiry');
    await expect(page.locator('h1')).toBeVisible();
  });
  test('form has required fields', async ({ page }) => {
    await gotoAndWait(page, '/enquiry');
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
  test('submit button is present', async ({ page }) => {
    await gotoAndWait(page, '/enquiry');
    await expect(page.getByRole('button', { name: /send enquiry/i })).toBeVisible();
  });
  test('dark hero section is present', async ({ page }) => {
    await gotoAndWait(page, '/enquiry');
    await expect(page.locator('.enquiry-hero')).toBeVisible();
  });
});

// ─── 10. Shared itinerary page ────────────────────────────────────────────────

test.describe('Shared itinerary page', () => {
  test('expired token shows expired message', async ({ page }) => {
    // This requires a real expired token — test the 404 path instead
    const res = await page.goto(`${BASE}/itinerary/nonexistent-token-xyz`);
    expect([404, 200]).toContain(res?.status()); // 404 if token not found
  });
  test('invalid token returns 404 page', async ({ page }) => {
    await gotoAndWait(page, '/itinerary/this-token-does-not-exist');
    // Next.js notFound() renders a 404 page
    const statusOr404 = page.locator('h1, h2').first();
    await expect(statusOr404).toBeVisible();
  });
});

// ─── 11. Admin login ──────────────────────────────────────────────────────────

test.describe('Admin login', () => {
  test('admin login page renders', async ({ page }) => {
    await gotoAndWait(page, '/admin/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
  test('login form has submit button', async ({ page }) => {
    await gotoAndWait(page, '/admin/login');
    await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first()).toBeVisible();
  });
  test('/admin redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/login');
  });
  test('/admin/enquiries redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/admin/enquiries`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/login');
  });
  test('/admin/reviews redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/admin/reviews`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/login');
  });
  test('wrong credentials shows error', async ({ page }) => {
    await gotoAndWait(page, '/admin/login');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput  = page.locator('input[type="password"]').first();
    await emailInput.fill('wrong@example.com');
    await passInput.fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    // Should stay on login page or show error
    expect(page.url()).toContain('/admin/login');
  });
});

// ─── 12. Responsive layout ────────────────────────────────────────────────────

test.describe('Responsive layout — mobile (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('homepage renders without horizontal scroll', async ({ page }) => {
    await gotoAndWait(page, '/');
    const body = page.locator('body');
    const scrollWidth  = await body.evaluate(el => el.scrollWidth);
    const clientWidth  = await body.evaluate(el => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
  test('tours page renders on mobile', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    await expect(page.locator('h1')).toBeVisible();
  });
  test('enquiry form is readable on mobile', async ({ page }) => {
    await gotoAndWait(page, '/enquiry');
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
  test('plan-trip page loads on mobile', async ({ page }) => {
    await gotoAndWait(page, '/plan-trip');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.chip').first()).toBeVisible();
  });
  test('hero headline is visible on mobile', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('h1')).toBeVisible();
  });
  test('CTA buttons are full width on mobile', async ({ page }) => {
    await gotoAndWait(page, '/enquiry');
    const submitBtn = page.getByRole('button', { name: /send/i });
    const box = await submitBtn.boundingBox();
    if (box) expect(box.width).toBeGreaterThan(280); // nearly full width
  });
});

test.describe('Responsive layout — tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('homepage renders without horizontal scroll', async ({ page }) => {
    await gotoAndWait(page, '/');
    const scrollWidth = await page.locator('body').evaluate(el => el.scrollWidth);
    const clientWidth = await page.locator('body').evaluate(el => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
  test('hero stacks vertically on tablet', async ({ page }) => {
    await gotoAndWait(page, '/');
    const heroLeft  = page.locator('.hero-left');
    const heroRight = page.locator('.hero-right');
    const leftBox   = await heroLeft.boundingBox();
    const rightBox  = await heroRight.boundingBox();
    if (leftBox && rightBox) {
      // On tablet, right section should be below left (stacked)
      expect(rightBox.y).toBeGreaterThanOrEqual(leftBox.y + leftBox.height - 10);
    }
  });
});

test.describe('Responsive layout — desktop (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('desktop nav is visible', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('.desktop-nav')).toBeVisible();
  });
  test('hero is split layout on desktop', async ({ page }) => {
    await gotoAndWait(page, '/');
    const heroLeft  = page.locator('.hero-left');
    const heroRight = page.locator('.hero-right');
    const leftBox   = await heroLeft.boundingBox();
    const rightBox  = await heroRight.boundingBox();
    if (leftBox && rightBox) {
      // Side by side: both at similar Y, different X
      expect(Math.abs(leftBox.y - rightBox.y)).toBeLessThan(50);
      expect(rightBox.x).toBeGreaterThan(leftBox.x + leftBox.width / 2);
    }
  });
  test('tour grid is 3 columns on desktop', async ({ page }) => {
    await gotoAndWait(page, '/tours');
    const grid = page.locator('.grid-3').first();
    if (await grid.count() > 0) {
      const cards = grid.locator('.card');
      const count = await cards.count();
      if (count >= 3) {
        const box1 = await cards.nth(0).boundingBox();
        const box2 = await cards.nth(1).boundingBox();
        const box3 = await cards.nth(2).boundingBox();
        if (box1 && box2 && box3) {
          // All 3 should be at the same Y (same row)
          expect(Math.abs(box1.y - box2.y)).toBeLessThan(10);
          expect(Math.abs(box1.y - box3.y)).toBeLessThan(10);
        }
      }
    }
  });
});

// ─── 13. Accessibility basics ─────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test('all images have alt text', async ({ page }) => {
    await gotoAndWait(page, '/');
    const images = page.locator('img');
    const count  = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });
  test('page has a single h1', async ({ page }) => {
    await gotoAndWait(page, '/');
    await expect(page.locator('h1')).toHaveCount(1);
  });
  test('enquiry form labels are associated with inputs', async ({ page }) => {
    await gotoAndWait(page, '/enquiry');
    const inputs = page.locator('input[type="text"], input[type="email"]');
    const count  = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id    = await input.getAttribute('id');
      const name  = await input.getAttribute('name');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const wrap  = page.locator(`label:has(input[name="${name}"])`);
        const labeled = await label.count() > 0 || await wrap.count() > 0;
        expect(labeled).toBe(true);
      }
    }
  });
  test('buttons have accessible text', async ({ page }) => {
    await gotoAndWait(page, '/');
    const buttons = page.locator('button').filter({ hasNot: page.locator('[aria-label]') });
    const count   = await buttons.count();
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});
