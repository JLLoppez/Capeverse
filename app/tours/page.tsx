import { prisma } from '@/lib/prisma';
import { TourCard } from '@/components/TourCard';

export default async function ToursPage() {
  const tours = await prisma.tour.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  return (
    <section className="section">
      <div className="container">
        <div className="page-header" style={{ maxWidth: 600 }}>
          <div className="section-eyebrow">Our tours</div>
          <h1>Cape Town private experiences</h1>
          <p className="lead" style={{ marginTop: '0.75rem' }}>Choose from city, peninsula, wine, and fully custom private experiences — each one designed to be done without a coach in sight.</p>
        </div>
        {tours.length === 0 ? (
          <div className="empty-state">No tours available yet. Check back soon.</div>
        ) : (
          <div className="grid-3">
            {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
          </div>
        )}
      </div>
    </section>
  );
}
