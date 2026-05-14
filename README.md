# 🧭 Capiverse v2

> An AI-powered private tourism platform for Cape Town — helping travellers discover tours, attractions, and personalised itineraries. Built for real operators, with real bookings.

**[Live Demo](https://capeverse.vercel.app)**

---

## What's new in v2

| Area | v1 | v2 |
|------|----|----|
| Itinerary AI | Rule-based slicing | GPT-4o-mini with narrative enrichment |
| AI chat | Keyword matching | Full conversation history, session memory |
| Payments | Enquiry form only | Stripe checkout + webhook booking confirmation |
| Admin credentials | Hardcoded in .env | First-run `/api/admin/setup` endpoint |
| Rate limiting | Admin login only | All public routes (enquiry, AI, itinerary) |
| Image uploads | Unsplash URLs | Cloudinary with signed upload + auto-optimise |
| Error monitoring | None | Sentry (client + server) |
| SEO | Static | Dynamic sitemap.xml + JSON-LD structured data |
| Internationalisation | English only | EN / DE / FR / NL |
| Testing | Jest unit tests | Jest + Playwright E2E |
| CI/CD | None | GitHub Actions (lint → unit → E2E → deploy) |
| Analytics | None | Admin metrics API (conversions, budgets, sources) |

---

## Features

- 🗺️ **Tour & attraction listings** — Curated Cape Town experiences with slugged detail pages
- 🤖 **AI trip planner** — GPT-4o-mini generates personalised multi-day itineraries with narrative enrichment
- 📊 **Attraction scoring engine** — Custom ranking algorithm matches attractions to traveller preferences
- 💳 **Stripe bookings** — Direct checkout with webhook-confirmed booking records
- 💬 **AI assistant** — Conversational travel assistant with session memory (20-turn context window)
- 📬 **Enquiry system** — Contact form with nodemailer email delivery and admin inbox
- 🔒 **Secure admin dashboard** — First-run setup, HMAC session tokens, multi-tier rate limiting
- 🖼️ **Cloudinary image uploads** — Signed upload with auto-optimisation (w_1200,h_800,q_auto,f_auto)
- 🌍 **i18n** — English, German, French, Dutch
- 📈 **Analytics API** — Conversion rates, budget distribution, enquiry sources
- 🗺️ **SEO** — Dynamic sitemap.xml, JSON-LD structured data for tours and attractions
- 🐛 **Sentry** — Error monitoring for client and server
- 🧪 **Test suite** — Jest unit tests + Playwright E2E covering all critical paths
- 🚀 **CI/CD** — GitHub Actions: lint → type-check → unit tests → E2E → Vercel deploy
- 🐳 **Docker** — Dockerfile and docker-compose for containerised deployment

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/yourorg/capiverse.git
cd capiverse
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL and ADMIN_SESSION_SECRET at minimum

# 3. Set up database
npx prisma migrate deploy
npm run seed

# 4. Start dev server
npm run dev

# 5. Complete first-run admin setup (replaces hardcoded credentials)
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@yourdomain.com","password":"YourSecurePassword123!"}'
```

---

## Environment variables

See `.env.example` for the full list. Required at minimum:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_SESSION_SECRET` | HMAC signing key (min 32 chars) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for sitemap and redirects |

Optional but recommended for full functionality:

| Variable | Enables |
|----------|---------|
| `OPENAI_API_KEY` | GPT-powered itinerary + chat |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Direct bookings |
| `CLOUDINARY_*` | Admin image uploads |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring |
| `SMTP_*` | Email notifications |

---

## Testing

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires running dev server)
npm run test:e2e

# E2E with interactive UI
npm run test:e2e:ui

# Everything
npm run test:all
```

---

## Deployment

The GitHub Actions pipeline handles deployment automatically:

1. **Push to `develop`** → runs lint, type-check, unit tests
2. **Push to `main`** → runs all of the above + E2E tests + deploys to Vercel

Required GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

## Rate limits

| Route | Limit |
|-------|-------|
| `/api/admin/login` | 5 requests / 15 min per IP |
| `/api/enquiries` | 10 requests / hour per IP |
| `/api/ai/chat` | 20 requests / minute per IP |
| `/api/itinerary/generate` | 15 requests / minute per IP |
| All other public routes | 60 requests / minute per IP |

---

© 2026 Capiverse • All Rights Reserved • Built by Jall Technologies
