import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AdminEnquiryDetailPage({
  params, searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) notFound();

  const interests = Array.isArray(enquiry.interests) ? (enquiry.interests as string[]) : [];
  const mustSee   = Array.isArray(enquiry.mustSee)   ? (enquiry.mustSee   as string[]) : [];

  return (
    <div className="section-stack">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/admin/enquiries" style={{ color: 'var(--mist)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
          <ArrowLeft size={14} />All enquiries
        </Link>
      </div>

      {sp.updated === '1' && (
        <div className="updated-notice">✓ Enquiry updated successfully.</div>
      )}

      <div>
        <h1 style={{ marginBottom: '0.2rem' }}>{enquiry.fullName}</h1>
        <p className="muted" style={{ fontWeight: 400 }}>{enquiry.email} · Received {new Date(enquiry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid-two">
        {/* Client details */}
        <div className="panel section-stack">
          <h2>Client request</h2>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {[
              ['Status',       <span className="status" style={{ background: enquiry.status === 'New' ? 'rgba(196,120,74,0.1)' : 'rgba(61,107,90,0.1)', color: enquiry.status === 'New' ? 'var(--sienna)' : 'var(--jade)' }}>{enquiry.status}</span>],
              ['Phone',        enquiry.phone || '—'],
              ['Nationality',  enquiry.nationality || '—'],
              ['Travel date',  enquiry.travelDate ? new Date(enquiry.travelDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
              ['Group size',   enquiry.groupSize ?? '—'],
              ['Budget',       enquiry.budgetRange || '—'],
              ['Trip length',  enquiry.tripLengthDays ? `${enquiry.tripLengthDays} days` : '—'],
              ['Pace',         enquiry.pace || '—'],
              ['Travel style', enquiry.travelStyle || '—'],
            ].map(([label, value]) => (
              <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(13,31,45,0.06)' }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(13,31,45,0.45)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            {interests.length > 0 && (
              <div style={{ paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'rgba(13,31,45,0.45)', fontWeight: 500, marginBottom: '0.5rem' }}>Interests</div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {interests.map(i => <span key={i} className="badge">{i}</span>)}
                </div>
              </div>
            )}
            {mustSee.length > 0 && (
              <div style={{ paddingTop: '0.25rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'rgba(13,31,45,0.45)', fontWeight: 500, marginBottom: '0.5rem' }}>Must-see</div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {mustSee.map(s => <span key={s} className="pill">{s}</span>)}
                </div>
              </div>
            )}
            {enquiry.message && (
              <div style={{ paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'rgba(13,31,45,0.45)', fontWeight: 500, marginBottom: '0.5rem' }}>Message</div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'rgba(13,31,45,0.7)', fontWeight: 400 }}>{enquiry.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Consultant panel */}
        <div className="panel section-stack">
          <h2>Consultant notes</h2>
          {enquiry.aiSummary && (
            <div style={{ padding: '0.85rem', background: 'var(--sienna-pale)', borderRadius: 'var(--r)', marginBottom: '0.25rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--sienna)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>AI summary</div>
              <p style={{ fontSize: '0.84rem', fontWeight: 400, lineHeight: 1.7 }}>{enquiry.aiSummary}</p>
            </div>
          )}
          <form action={`/api/admin/enquiries/${enquiry.id}`} method="post" className="stack-form">
            <label>
              <span className="field-label">Status</span>
              <select name="status" defaultValue={enquiry.status}>
                {['New','Reviewed','Contacted','Awaiting Client Reply','Quote Sent','Confirmed','Closed Lost','Cancelled'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Consultant notes (sent to client on save)</span>
              <textarea name="consultantNotes" rows={8} defaultValue={enquiry.consultantNotes || ''} placeholder="Add notes, proposal details, or follow-up actions…" />
            </label>
            <button type="submit" className="btn btn-ink">Save changes</button>
          </form>
        </div>
      </div>
    </div>
  );
}
