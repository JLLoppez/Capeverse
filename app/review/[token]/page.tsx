'use client';
import { useEffect, useState } from 'react';

export default function ReviewPage({ params }: { params: { token: string } }) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [body, setBody]       = useState('');
  const [name, setName]       = useState('');
  const [status, setStatus]   = useState<'idle'|'submitting'|'done'|'error'|'invalid'>('idle');

  useEffect(() => {
    fetch(`/api/reviews/validate?token=${params.token}`)
      .then(r => { if (!r.ok) setStatus('invalid'); })
      .catch(() => setStatus('invalid'));
  }, [params.token]);

  async function handleSubmit() {
    if (!rating || body.length < 10 || !name) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, rating, body, authorName: name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === 'Review already submitted') { setStatus('done'); return; }
        throw new Error();
      }
      setStatus('done');
    } catch { setStatus('error'); }
  }

  if (status === 'invalid') return (
    <section className="section">
      <div className="narrow" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <h2>Invalid or expired review link</h2>
        <p className="lead" style={{ marginTop: '0.75rem' }}>This link is no longer valid. Please contact us if you believe this is an error.</p>
      </div>
    </section>
  );

  if (status === 'done') return (
    <section className="section">
      <div className="narrow" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙏</div>
        <h2>Thank you for your review!</h2>
        <p className="lead" style={{ marginTop: '0.75rem', maxWidth: 420, margin: '0.75rem auto 0' }}>
          Your feedback helps other travellers discover the best of Cape Town.
        </p>
      </div>
    </section>
  );

  return (
    <section className="section">
      <div className="narrow">
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <div className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>Share your experience</div>
          <h1 style={{ marginBottom: '0.5rem' }}>How was your Cape Town tour?</h1>
          <p className="lead" style={{ marginBottom: '2.5rem' }}>Your honest review helps other travellers and supports our local guides.</p>

          <div className="panel" style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Star rating */}
            <div>
              <div className="field-label" style={{ marginBottom: '0.75rem' }}>Your rating *</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button" onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
                    style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      filter: star <= (hover || rating) ? 'none' : 'grayscale(1) opacity(0.25)',
                      transform: star === (hover || rating) ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 100ms' }} aria-label={`${star} star`}>⭐</button>
                ))}
              </div>
              {rating > 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--mist)', marginTop: '0.4rem' }}>
                  {['','Poor','Fair','Good','Very good','Excellent'][rating]}
                </p>
              )}
            </div>

            <label>
              <span className="field-label">Your name *</span>
              <input type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} />
            </label>

            <label>
              <span className="field-label">Your review * <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.72rem' }}>(min 10 characters)</span></span>
              <textarea rows={5} value={body} onChange={e => setBody(e.target.value)}
                placeholder="Tell us what you loved most, what surprised you, and whether you'd recommend it…" />
              <span style={{ fontSize: '0.72rem', color: 'var(--mist)', textAlign: 'right' }}>{body.length} / 1200</span>
            </label>

            {status === 'error' && <p className="notice error" style={{ margin: 0 }}>Something went wrong. Please try again.</p>}

            <button className="btn btn-primary"
              disabled={!rating || body.length < 10 || !name || status === 'submitting'}
              onClick={handleSubmit}>
              {status === 'submitting' ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
