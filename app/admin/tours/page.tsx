import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { currency } from '@/lib/utils';

export default async function AdminToursPage() {
  const tours = await prisma.tour.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Tours</h1>
        </div>
        <Link href="/admin/tours/new" className="button small">
          New tour
        </Link>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Duration</th>
              <th>From</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tours.map((tour) => (
              <tr key={tour.id}>
                <td>{tour.title}</td>
                <td>{tour.category}</td>
                <td>{tour.durationType}</td>
                <td>{currency(Number(tour.priceFrom))}</td>
                <td><span className="status">{tour.isActive ? 'Active' : 'Hidden'}</span></td>
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
    </div>
  );
}
