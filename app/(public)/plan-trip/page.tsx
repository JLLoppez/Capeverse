import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { TripPlanner } from '@/components/TripPlanner';

function PlannerSkeleton() {
  return (
    <div className="grid-two planner-layout" aria-busy="true">
      <section className="panel">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-chip" />
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text short" />
      </section>
    </div>
  );
}

async function PlannerLoader() {
  const attractions = await prisma.attraction.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, region: true },
    orderBy: { name: 'asc' }
  });
  return <TripPlanner attractions={attractions} />;
}

export default function PlanTripPage() {
  return (
    <section className="section">
      <div className="container page-header narrow">
        <span className="eyebrow">Trip planner</span>
        <h1>Auto-generate a Cape Town itinerary</h1>
        <p>Select the places your client wants to visit and let the platform build a realistic day plan.</p>
      </div>
      <div className="container">
        <Suspense fallback={<PlannerSkeleton />}>
          <PlannerLoader />
        </Suspense>
      </div>
    </section>
  );
}
