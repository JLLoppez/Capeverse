import { prisma } from '@/lib/prisma';
import { TripPlanner } from '@/components/TripPlanner';

export default async function PlanTripPage() {
  const attractions = await prisma.attraction.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, region: true },
  });

  return (
    <section className="section">
      <div className="container">
        <div className="page-header" style={{ maxWidth: 640, marginBottom: '2.5rem' }}>
          <div className="section-eyebrow">Trip planner</div>
          <h1 style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
            Build an itinerary that <em>holds up on the ground</em>.
          </h1>
          <p className="lead">Select the places you want to visit, pick your interests, and the engine will group them into realistic geographically-clustered days.</p>
        </div>
        <TripPlanner attractions={attractions} />
      </div>
    </section>
  );
}
