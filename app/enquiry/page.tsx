export default async function EnquiryPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const params = await searchParams;

  return (
    <section className="section enquiry-hero-section">
      <div className="container page-header narrow">
        <span className="eyebrow">Human follow-up</span>
        <h1>Talk to a real Cape Town travel consultant</h1>
        <p className="lead">
          Submit your request and Cape Compass will save the lead, notify your team by email, and send the traveller a branded confirmation message automatically.
        </p>
      </div>
      <div className="container narrow panel luxury-panel form-panel">
        {params.success ? <div className="notice success">Your enquiry has been submitted successfully. Email notifications were triggered if SMTP is configured.</div> : null}
        <form action="/api/enquiries" method="post" className="stack-form">
          <div className="field-grid">
            <label>
              <span>Full name</span>
              <input name="fullName" required placeholder="John Smith" />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" required placeholder="john@example.com" />
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" placeholder="+27 ..." />
            </label>
            <label>
              <span>Nationality</span>
              <input name="nationality" placeholder="United Kingdom" />
            </label>
            <label>
              <span>Travel date</span>
              <input name="travelDate" type="date" />
            </label>
            <label>
              <span>Group size</span>
              <input name="groupSize" type="number" min={1} placeholder="2" />
            </label>
            <label>
              <span>Budget</span>
              <select name="budgetRange">
                <option value="">Select</option>
                <option>Budget</option>
                <option>Mid-range</option>
                <option>Premium</option>
                <option>Luxury</option>
              </select>
            </label>
            <label>
              <span>Trip length (days)</span>
              <input name="tripLengthDays" type="number" min={1} max={14} placeholder="3" />
            </label>
          </div>
          <label>
            <span>Message</span>
            <textarea
              name="message"
              rows={6}
              placeholder="Tell us what you want to see, your travel style, hotel area, and any special requests such as child-friendly, luxury vehicle, or wine experiences."
            />
          </label>
          <div className="cta-row left">
            <button className="button glow-button">Submit enquiry</button>
            <span className="muted">Admin and traveller notification emails are supported out of the box.</span>
          </div>
        </form>
      </div>
    </section>
  );
}
