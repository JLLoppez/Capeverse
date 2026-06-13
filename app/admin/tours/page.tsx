import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { currency } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default async function AdminToursPage() {
  const tours = await prisma.tour.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div className="section-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Tours</h1>
          <p className="muted" style={{ fontSize: '0.84rem', fontWeight: 300 }}>{tours.length} total</p>
        </div>
        <Link href="/admin/tours/new" className="btn btn-ink btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Plus size={14} />New tour
        </Link>
      </div>
      {tours.length === 0 ? (
        <div className="empty-state">No tours yet. Create your first one.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Title</th><th>Category</th><th>Duration</th><th>From</th><th>Featured</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {tours.map(tour => (
                <tr key={tour.id}>
                  <td style={{ fontWeight: 600 }}>{tour.title}</td>
                  <td><span className="pill">{tour.category}</span></td>
                  <td className="muted">{tour.durationType}</td>
                  <td style={{ fontWeight: 500 }}>{currency(Number(tour.priceFrom))}</td>
                  <td>{tour.isFeatured ? <span className="badge">Featured</span> : <span style={{ color: 'rgba(13,31,45,0.3)', fontSize: '0.78rem' }}>—</span>}</td>
                  <td>
                    <span className="status" style={{ background: tour.isActive ? 'rgba(61,107,90,0.1)' : 'rgba(13,31,45,0.07)', color: tour.isActive ? 'var(--jade)' : 'rgba(13,31,45,0.4)' }}>
                      {tour.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className="inline-actions">
                      <Link href={`/admin/tours/${tour.id}`}>Edit</Link>
                      <form action={`/api/admin/tours/${tour.id}/delete`} method="post">
                        <button type="submit">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
