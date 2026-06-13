import { prisma } from '@/lib/prisma';
import { AttractionCard } from '@/components/AttractionCard';

export default async function AttractionsPage() {
  const attractions = await prisma.attraction.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  return (
    <section className="section">
      <div className="container">
        <div className="page-header" style={{ maxWidth: 600 }}>
          <div className="section-eyebrow">Highlights</div>
          <h1>Cape Town attractions</h1>
          <p className="lead" style={{ marginTop: '0.75rem' }}>Choose the places your clients want to visit and build a custom route around them using the trip planner.</p>
        </div>
        {attractions.length === 0 ? (
          <div className="empty-state">No attractions listed yet.</div>
        ) : (
          <div className="grid-4">
            {attractions.map(a => <AttractionCard key={a.id} attraction={a} />)}
          </div>
        )}
      </div>
    </section>
  );
}
