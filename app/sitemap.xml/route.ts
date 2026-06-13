import { prisma } from '@/lib/prisma';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://capeverse.vercel.app';

  const [tours, attractions] = await Promise.all([
    prisma.tour.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.attraction.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/tours', priority: '0.9', changefreq: 'weekly' },
    { url: '/attractions', priority: '0.9', changefreq: 'weekly' },
    { url: '/plan-trip', priority: '0.8', changefreq: 'monthly' },
    { url: '/ai-assistant', priority: '0.7', changefreq: 'monthly' },
    { url: '/enquiry', priority: '0.8', changefreq: 'monthly' },
  ];

  const tourEntries = tours.map((t) => ({
    url: `/tours/${t.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: t.updatedAt.toISOString(),
  }));

  const attractionEntries = attractions.map((a) => ({
    url: `/attractions/${a.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: a.updatedAt.toISOString(),
  }));

  const allEntries = [...staticPages, ...tourEntries, ...attractionEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) => `  <url>
    <loc>${baseUrl}${entry.url}</loc>
    <priority>${entry.priority}</priority>
    <changefreq>${entry.changefreq}</changefreq>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
