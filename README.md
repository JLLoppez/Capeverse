# Cape Compass

Cape Compass is a production-ready tourism platform for Cape Town tours with a public booking/enquiry experience, AI-powered trip planning, itinerary generation, and an admin portal for content and lead management.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- OpenAI (optional — graceful fallback built in)
- Zod for input validation
- Nodemailer for transactional email
- Jest + ts-jest for unit testing

## Features

### Public platform
- Branded luxury-style landing page and navigation
- Tours catalogue
- Attraction catalogue
- Tour detail pages
- Attraction detail pages
- Manual trip planner with Suspense-based loading states and error recovery
- AI trip assistant with graceful fallback logic and error handling
- Enquiry form with Zod validation for human follow-up
- Branded traveller confirmation states

### Admin portal
- Admin authentication with HMAC-signed session tokens
- Rate limiting on login endpoint (5 attempts / 15 min per IP)
- Dashboard with lead/content stats
- Manage tours
- Manage attractions
- Review and update enquiries
- Email notification hooks when enquiry status changes

## Quick start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Push schema to your database:
   ```bash
   npm run prisma:push
   ```
5. Seed sample data:
   ```bash
   npm run seed
   ```
6. Run locally:
   ```bash
   npm run dev
   ```

## Running tests

```bash
npm test
```

Tests cover the pure scoring logic in `lib/scoring.ts` — the attraction ranking engine, day grouping, and tag weight expansion. No database or external API required.

## Admin login

Use the credentials in `.env`:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Admin URL: `/admin/login`

The login endpoint is rate-limited to 5 attempts per IP per 15 minutes. For multi-instance deployments, swap the in-memory store in `lib/rateLimit.ts` for a Redis-backed solution (e.g. Upstash).

## Deployment

### Vercel
- Create a Postgres database (Neon, Supabase, Railway, or Vercel Postgres)
- Add environment variables from `.env.example`
- Run build command: `npm run build`
- Set install command: `npm install`
- Set output to default Next.js
- After deployment, run:
  - `npm run prisma:generate`
  - `npm run prisma:migrate` or `npm run prisma:push`
  - `npm run seed`

### Docker
```bash
npm install
npm run build
npm run start
```

## OpenAI

If `OPENAI_API_KEY` is not set, the AI assistant and trip planner both work using the built-in recommendation engine (`lib/scoring.ts`). When a key is provided, the API uses `gpt-4o-mini` via `chat.completions.create` with `response_format: { type: 'json_object' }` for structured output.

## Email notifications

SMTP-based email notifications are built in via Nodemailer.

Configure these environment variables:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`
- `ADMIN_NOTIFICATION_EMAIL`

Behaviour:
- New public enquiries notify admin
- New public enquiries send a branded confirmation to the traveller
- Admin enquiry status updates notify the traveller

## Image handling

`imageUrl` fields on Tour and Attraction models store external URLs. For production, integrate an image upload service:
- **Cloudinary** — managed uploads, transformations, CDN delivery
- **Vercel Blob** — native to Vercel deployments, simple SDK
- **AWS S3 + CloudFront** — for self-hosted or high-volume setups

The upload UI can be added to the admin tour/attraction forms as a next iteration.

## Notes

- Authentication is admin-only for this MVP. Payments and live bookings can be added on top of the enquiry flow.
- All content is editable from the admin portal.
- Rate limiting uses in-memory storage per process — suitable for single-instance deployments. Swap to Redis for scaled environments.


Cape Compass is a production-ready tourism platform for Cape Town tours with a public booking/enquiry experience, AI-powered trip planning, itinerary generation, and an admin portal for content and lead management.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- Optional OpenAI integration

## Features

### Public platform
- Branded luxury-style landing page and navigation
- Tours catalogue
- Attraction catalogue
- Tour detail pages
- Attraction detail pages
- Manual trip planner
- AI trip assistant with graceful fallback logic
- Enquiry form for human follow-up
- Branded traveller confirmation states

### Admin portal
- Admin authentication
- Dashboard with lead/content stats
- Manage tours
- Manage attractions
- Review and update enquiries
- Email notification hooks when enquiry status changes

## Quick start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Push schema to your database:
   ```bash
   npm run prisma:push
   ```
5. Seed sample data:
   ```bash
   npm run seed
   ```
6. Run locally:
   ```bash
   npm run dev
   ```

## Admin login

Use the credentials in `.env`:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Admin URL:
- `/admin/login`

## Deployment

### Vercel
- Create a Postgres database (Neon, Supabase, Railway, or Vercel Postgres)
- Add environment variables from `.env.example`
- Run build command: `npm run build`
- Set install command: `npm install`
- Set output to default Next.js
- After deployment, run:
  - `npm run prisma:generate`
  - `npm run prisma:migrate` or `npm run prisma:push`
  - `npm run seed`

### Docker
```bash
npm install
npm run build
npm run start
```

## OpenAI

If `OPENAI_API_KEY` is not set, the AI assistant still works with the built-in recommendation engine.

## Email notifications

SMTP-based email notifications are built in.

Configure these environment variables:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`
- `ADMIN_NOTIFICATION_EMAIL`

Behaviour:
- new public enquiries notify admin
- new public enquiries send a branded confirmation to the traveller
- admin enquiry status updates can notify the traveller

## Notes

- Authentication is admin-only for this MVP.
- Payments and live bookings can be added on top of the enquiry flow.
- All content is editable from the admin portal.
