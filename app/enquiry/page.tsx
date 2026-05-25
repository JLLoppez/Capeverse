'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function EnquiryForm() {
  const params = useSearchParams();
  const success = params.get('success');
  const errorMsg = params.get('error');
  const aiChat = params.get('aiChat') ?? '';

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!success);
  const [formError, setFormError] = useState(errorMsg ?? '');
  // Controlled textarea value — initialised from aiChat so React doesn't warn
  const [message, setMessage] = useState(
    aiChat ? '[Sent from AI assistant — see attached conversation]\n\n' : ''
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/enquiries', { method: 'POST', body: data });
      if (res.ok || res.redirected) {
        setSubmitted(true);
      } else {
        const json = await res.json().catch(() => ({}));
        setFormError(json.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2>Enquiry received!</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
          Our team will review your request and follow up within 24 hours with tailored recommendations.
        </p>
        <a href="/" className="button" style={{ marginTop: '2rem', display: 'inline-block' }}>Back to home</a>
      </div>
    );
  }

  return (
    <>
      <section style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', padding: '5rem 0 4rem' }}>
        <div className="container narrow">
          <span className="eyebrow">Begin your journey</span>
          <h1 style={{ color: 'var(--text)', marginTop: '1rem', marginBottom: '1rem' }}>Talk to a Cape Town specialist</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '480px' }}>
            Submit your request and our team will save the lead, notify you by email, and send the traveller a branded confirmation automatically.
          </p>
          {aiChat && (
            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.1rem', background: 'rgba(14,77,100,0.07)', borderRadius: '10px', border: '1px solid rgba(14,77,100,0.15)', fontSize: '0.85rem', color: 'var(--brand)' }}>
              ✨ Your AI assistant conversation has been attached — our consultant will have full context.
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          {formError && (
            <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#dc2626', fontSize: '0.9rem' }}>
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Hidden: carry AI chat summary through to the API */}
            {aiChat && <input type="hidden" name="aiChatSummary" value={aiChat} />}

            <div className="field-grid">
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Full name *</label>
                <input name="fullName" type="text" required placeholder="Jane Smith" />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Email *</label>
                <input name="email" type="email" required placeholder="jane@example.com" />
              </div>
            </div>
            <div className="field-grid">
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Phone</label>
                <input name="phone" type="tel" placeholder="+27 ..." />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Nationality</label>
                <input name="nationality" type="text" placeholder="United Kingdom" />
              </div>
            </div>
            <div className="field-grid">
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Travel date</label>
                <input name="travelDate" type="date" />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Group size</label>
                <input name="groupSize" type="number" min="1" max="500" placeholder="2" defaultValue="2" />
              </div>
            </div>
            <div className="field-grid">
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Budget range</label>
                <select name="budgetRange">
                  <option value="">Select</option>
                  <option>Budget (≈ €75–110/day)</option>
                  <option>Mid-range (≈ €110–150/day)</option>
                  <option>Premium (≈ €150–200/day)</option>
                  <option>Luxury (≈ €200+/day)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Trip length (days)</label>
                <input name="tripLengthDays" type="number" min="1" max="90" placeholder="3" defaultValue="3" />
              </div>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Message</label>
              <textarea
                name="message"
                rows={5}
                placeholder="Tell us what you want to see, your travel style, hotel area, and any special requests such as child-friendly, luxury vehicle, or wine experiences."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--line)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)', margin: 0 }}>Admin and traveller notification emails sent automatically.</p>
              <button type="submit" className="button solid" style={{ minWidth: '180px' }} disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit enquiry'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

export default function EnquiryPage() {
  return (
    <Suspense>
      <EnquiryForm />
    </Suspense>
  );
}
