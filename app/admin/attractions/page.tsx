import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminAttractionsPage() {
  const attractions = await prisma.attraction.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Attractions</h1>
        </div>
        <Link href="/admin/attractions/new" className="button small">
          New attraction
        </Link>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Region</th>
              <th>Visit time</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {attractions.map((attraction) => (
              <tr key={attraction.id}>
                <td>{attraction.name}</td>
                <td>{attraction.region}</td>
                <td>{attraction.estimatedVisitMinutes} min</td>
                <td><span className="status">{attraction.isActive ? 'Active' : 'Hidden'}</span></td>
                <td>
                  <div className="inline-actions">
                    <Link href={`/admin/attractions/${attraction.id}`}>Edit</Link>
                    <form action={`/api/admin/attractions/${attraction.id}/delete`} method="post">
                      <button type="submit">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
