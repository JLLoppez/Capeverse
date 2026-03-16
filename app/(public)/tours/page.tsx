import { prisma } from '@/lib/prisma';
import { TourCard } from '@/components/TourCard';

export default async function ToursPage() {
  const tours = await prisma.tour.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });

  return (
    <section className="section">
      <div className="container page-header narrow">
        <span className="eyebrow">Tours</span>
        <h1>Cape Town tours</h1>
        <p>Choose from city, peninsula, wine, and custom private experiences.</p>
      </div>
      <div className="container grid-three">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  );
}
