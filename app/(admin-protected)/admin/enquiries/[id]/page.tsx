import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function AdminEnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) notFound();

  const interests = Array.isArray(enquiry.interests) ? (enquiry.interests as string[]) : [];
  const mustSee = Array.isArray(enquiry.mustSee) ? (enquiry.mustSee as string[]) : [];

  return (
    <div className="section-stack">
      <div>
        <span className="eyebrow">Admin</span>
        <h1>{enquiry.fullName}</h1>
        <p className="lead">{enquiry.email}</p>
      </div>
      <div className="grid-two">
        <div className="panel section-stack">
          <h2>Client request</h2>
          <p><strong>Status:</strong> <span className="status">{enquiry.status}</span></p>
          <p><strong>Phone:</strong> {enquiry.phone || '—'}</p>
          <p><strong>Travel date:</strong> {enquiry.travelDate ? enquiry.travelDate.toISOString().slice(0, 10) : '—'}</p>
          <p><strong>Group size:</strong> {enquiry.groupSize ?? '—'}</p>
          <p><strong>Budget:</strong> {enquiry.budgetRange || '—'}</p>
          <p><strong>Trip length:</strong> {enquiry.tripLengthDays ?? '—'} days</p>
          <p><strong>Pace:</strong> {enquiry.pace || '—'}</p>
          <p><strong>Travel style:</strong> {enquiry.travelStyle || '—'}</p>
          <p><strong>Interests:</strong> {interests.join(', ') || '—'}</p>
          <p><strong>Must-see:</strong> {mustSee.join(', ') || '—'}</p>
          <p><strong>Message:</strong> {enquiry.message || '—'}</p>
        </div>
        <div className="panel section-stack">
          <h2>AI summary & notes</h2>
          <p>{enquiry.aiSummary || 'No AI summary captured for this enquiry.'}</p>
          <form action={`/api/admin/enquiries/${enquiry.id}`} method="post" className="stack-form">
            <label>
              <span>Status</span>
              <select name="status" defaultValue={enquiry.status}>
                <option>New</option>
                <option>Reviewed</option>
                <option>Contacted</option>
                <option>Awaiting Client Reply</option>
                <option>Quote Sent</option>
                <option>Confirmed</option>
                <option>Closed Lost</option>
                <option>Cancelled</option>
              </select>
            </label>
            <label>
              <span>Consultant notes</span>
              <textarea name="consultantNotes" rows={8} defaultValue={enquiry.consultantNotes || ''} />
            </label>
            <button className="button">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
}
