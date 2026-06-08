import { prisma } from '@/lib/prisma';

export default async function EnquiryPage() {
  const tours = await prisma.tour.findMany({ where: { isActive: true }, orderBy: { title: 'asc' } });
  return (
    <>
      <section style={{background:'var(--surface-2)',borderBottom:'1px solid var(--line)',padding:'5rem 0 4rem'}}>
        <div className="container narrow">
          <span className="eyebrow">Begin your journey</span>
          <h1 style={{color:'var(--text)',marginTop:'1rem',marginBottom:'1rem'}}>Talk to a Cape Town specialist</h1>
          <p style={{color:'var(--text-muted)',fontSize:'1rem',maxWidth:'480px'}}>Submit your request and our team will save the lead, notify you by email, and send the traveller a branded confirmation automatically.</p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <form action="/api/enquiries" method="post" style={{display:'grid',gap:'1.5rem'}}>
            <div className="field-grid">
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Full name *</label>
                <input name="fullName" type="text" required placeholder="Jane Smith" />
              </div>
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Email *</label>
                <input name="email" type="email" required placeholder="jane@example.com" />
              </div>
            </div>
            <div className="field-grid">
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Phone</label>
                <input name="phone" type="tel" placeholder="+27 ..." />
              </div>
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Nationality</label>
                <input name="nationality" type="text" placeholder="United Kingdom" />
              </div>
            </div>
            <div className="field-grid">
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Travel date</label>
                <input name="travelDate" type="date" />
              </div>
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Group size</label>
                <input name="groupSize" type="number" min="1" max="500" placeholder="2" defaultValue="2" />
              </div>
            </div>
            <div className="field-grid">
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Budget range</label>
                <select name="budgetRange">
                  <option value="">Select</option>
                  <option>Budget</option>
                  <option>Mid-range</option>
                  <option>Premium</option>
                  <option>Luxury</option>
                </select>
              </div>
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Trip length (days)</label>
                <input name="tripLengthDays" type="number" min="1" max="90" placeholder="3" defaultValue="3" />
              </div>
            </div>
            {tours.length > 0 && (
              <div style={{display:'grid',gap:'0.5rem'}}>
                <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Interested in a specific tour?</label>
                <select name="tourInterest">
                  <option value="">No preference</option>
                  {tours.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            )}
            <div style={{display:'grid',gap:'0.5rem'}}>
              <label style={{fontSize:'0.65rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-faint)'}}>Message</label>
              <textarea name="message" rows={5} placeholder="Tell us what you want to see, your travel style, hotel area, and any special requests such as child-friendly, luxury vehicle, or wine experiences." />
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem',paddingTop:'0.5rem',borderTop:'1px solid var(--line)'}}>
              <p style={{fontSize:'0.78rem',color:'var(--text-faint)',margin:0}}>Admin and traveller notification emails sent automatically.</p>
              <button type="submit" className="button solid" style={{minWidth:'180px'}}>Submit enquiry</button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
