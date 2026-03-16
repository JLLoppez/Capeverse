import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminEnquiriesPage() {
  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="section-stack">
      <div>
        <span className="eyebrow">Admin</span>
        <h1>Enquiries</h1>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Group</th>
              <th>Status</th>
              <th>Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((enquiry) => (
              <tr key={enquiry.id}>
                <td>{enquiry.fullName}</td>
                <td>{enquiry.email}</td>
                <td>{enquiry.groupSize ?? '—'}</td>
                <td><span className="status">{enquiry.status}</span></td>
                <td>{enquiry.source}</td>
                <td>
                  <Link href={`/admin/enquiries/${enquiry.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
