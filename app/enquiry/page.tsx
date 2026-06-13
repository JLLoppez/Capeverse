import { prisma } from '@/lib/prisma';

export default async function EnquiryPage() {
  const tours = await prisma.tour.findMany({ where: { isActive: true }, orderBy: { title: 'asc' } });
  return (
    <>
      <div className="enquiry-hero">
        <div className="container narrow">
          <div className="section-eyebrow" style={{ color: 'var(--sienna-lt)', marginBottom: '1rem' }}>Begin your journey</div>
          <h1 style={{ color: 'var(--salt)', marginBottom: '1rem' }}>Talk to a Cape Town specialist</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 300, maxWidth: 480 }}>
            Submit your request and our team will respond within one business day with a tailored proposal.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container narrow">
          <form action="/api/enquiries" method="post" className="stack-form">
            <div className="field-grid">
              <label>
                <span className="field-label">Full name *</span>
                <input name="fullName" type="text" required placeholder="Jane Smith" />
              </label>
              <label>
                <span className="field-label">Email *</span>
                <input name="email" type="email" required placeholder="jane@example.com" />
              </label>
            </div>
            <div className="field-grid">
              <label>
                <span className="field-label">Phone</span>
                <input name="phone" type="tel" placeholder="+27 ..." />
              </label>
              <label>
                <span className="field-label">Nationality</span>
                <input name="nationality" type="text" placeholder="United Kingdom" />
              </label>
            </div>
            <div className="field-grid">
              <label>
                <span className="field-label">Travel date</span>
                <input name="travelDate" type="date" />
              </label>
              <label>
                <span className="field-label">Group size</span>
                <input name="groupSize" type="number" min="1" max="500" placeholder="2" defaultValue="2" />
              </label>
            </div>
            <div className="field-grid">
              <label>
                <span className="field-label">Budget range</span>
                <select name="budgetRange">
                  <option value="">Select</option>
                  <option>Budget</option>
                  <option>Mid-range</option>
                  <option>Premium</option>
                  <option>Luxury</option>
                </select>
              </label>
              <label>
                <span className="field-label">Trip length (days)</span>
                <input name="tripLengthDays" type="number" min="1" max="90" placeholder="3" defaultValue="3" />
              </label>
            </div>
            {tours.length > 0 && (
              <label>
                <span className="field-label">Interested in a specific tour?</span>
                <select name="tourInterest">
                  <option value="">No preference</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </label>
            )}
            <label>
              <span className="field-label">Message</span>
              <textarea name="message" rows={5} placeholder="Tell us about your travel style, must-see places, hotel area, and any special requests — wine experiences, family-friendly, luxury vehicle, etc." />
            </label>
            <div className="enquiry-submit-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(13,31,45,0.08)' }}>
              <p style={{ fontSize: '0.76rem', color: 'var(--mist)', margin: 0, fontWeight: 300 }}>
                Notification emails sent automatically to admin and traveller.
              </p>
              <button type="submit" className="btn btn-primary btn-lg">Send enquiry →</button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
