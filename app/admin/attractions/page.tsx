import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus } from 'lucide-react';

export default async function AdminAttractionsPage() {
  const attractions = await prisma.attraction.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="section-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Attractions</h1>
          <p className="muted" style={{ fontSize: '0.84rem', fontWeight: 400 }}>{attractions.length} total</p>
        </div>
        <Link href="/admin/attractions/new" className="btn btn-ink btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Plus size={14} />New attraction
        </Link>
      </div>
      {attractions.length === 0 ? (
        <div className="empty-state">No attractions yet. Create your first one.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Region</th><th>Visit time</th><th>Tags</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {attractions.map(attraction => {
                const tags = Array.isArray(attraction.tags) ? (attraction.tags as string[]).slice(0, 3) : [];
                return (
                  <tr key={attraction.id}>
                    <td style={{ fontWeight: 600 }}>{attraction.name}</td>
                    <td><span className="pill">{attraction.region}</span></td>
                    <td className="muted">{attraction.estimatedVisitMinutes} min</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
                      </div>
                    </td>
                    <td>
                      <span className="status" style={{ background: attraction.isActive ? 'rgba(61,107,90,0.1)' : 'rgba(13,31,45,0.07)', color: attraction.isActive ? 'var(--jade)' : 'rgba(13,31,45,0.4)' }}>
                        {attraction.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        <Link href={`/admin/attractions/${attraction.id}`}>Edit</Link>
                        <form action={`/api/admin/attractions/${attraction.id}/delete`} method="post">
                          <button type="submit">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
