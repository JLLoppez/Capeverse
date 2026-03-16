import { prisma } from '@/lib/prisma';
import { AttractionCard } from '@/components/AttractionCard';

export default async function AttractionsPage() {
  const attractions = await prisma.attraction.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });

  return (
    <section className="section">
      <div className="container page-header narrow">
        <span className="eyebrow">Attractions</span>
        <h1>Cape Town highlights</h1>
        <p>Choose the places your clients want to visit and build a custom route around them.</p>
      </div>
      <div className="container grid-three">
        {attractions.map((attraction) => (
          <AttractionCard key={attraction.id} attraction={attraction} />
        ))}
      </div>
    </section>
  );
}
