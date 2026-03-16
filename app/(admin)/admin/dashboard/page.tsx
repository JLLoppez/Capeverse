import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboardPage() {
  const [tours, attractions, enquiries, recentEnquiries] = await Promise.all([
    prisma.tour.count(),
    prisma.attraction.count(),
    prisma.enquiry.count(),
    prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 6 })
  ]);

  return (
    <div className="section-stack">
      <div>
        <span className="eyebrow">Admin dashboard</span>
        <h1>Overview</h1>
      </div>
      <div className="metric-grid">
        <div className="metric-card">
          <h3>Total tours</h3>
          <strong>{tours}</strong>
        </div>
        <div className="metric-card">
          <h3>Total attractions</h3>
          <strong>{attractions}</strong>
        </div>
        <div className="metric-card">
          <h3>Total enquiries</h3>
          <strong>{enquiries}</strong>
        </div>
        <div className="metric-card">
          <h3>New leads this week</h3>
          <strong>{recentEnquiries.length}</strong>
        </div>
      </div>

      <div className="panel section-stack">
        <div className="section-header">
          <div>
            <h2>Recent enquiries</h2>
          </div>
          <Link href="/admin/enquiries" className="button small outline">
            View all
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Travel date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td>{enquiry.fullName}</td>
                  <td>{enquiry.email}</td>
                  <td><span className="status">{enquiry.status}</span></td>
                  <td>{enquiry.travelDate ? enquiry.travelDate.toISOString().slice(0, 10) : '—'}</td>
                  <td>
                    <Link href={`/admin/enquiries/${enquiry.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
