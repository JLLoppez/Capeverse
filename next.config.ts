import type { NextConfig } from 'next';

const ALLOWED_IMAGE_HOSTS = [
  'images.unsplash.com',
  'res.cloudinary.com',
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
    })),
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          // Control referrer information
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          // Enforce HTTPS for 1 year (only meaningful in production)
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
            : []),
          // Content Security Policy — tightened for a Next.js + Google Fonts app
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inline scripts use nonces in production; allow unsafe-inline for dev
              process.env.NODE_ENV === 'production'
                ? "script-src 'self' 'unsafe-inline'"   // tighten further with nonces when ready
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: blob: ${ALLOWED_IMAGE_HOSTS.join(' ')}`,
              "connect-src 'self' https://api.anthropic.com https://api.openweathermap.org https://generativelanguage.googleapis.com https://*.sentry.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // API routes: no caching by default
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
