'use client';

import { useEffect, useState } from 'react';

export default function ReviewPage({ params }: { params: { token: string } }) {
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [body, setBody]         = useState('');
  const [authorName, setAuthor] = useState('');
  const [status, setStatus]     = useState<'idle' | 'submitting' | 'done' | 'error' | 'invalid'>('idle');

  // Validate the token exists
  useEffect(() => {
    fetch(`/api/reviews/validate?token=${params.token}`)
      .then((r) => { if (!r.ok) setStatus('invalid'); })
      .catch(() => setStatus('invalid'));
  }, [params.token]);

  async function handleSubmit() {
    if (!rating || body.length < 10 || !authorName) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, rating, body, authorName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === 'Review already submitted') { setStatus('done'); return; }
        throw new Error();
      }
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'invalid') {
    return (
      <section className="section">
        <div className="container narrow" style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <h2>Invalid or expired review link</h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.75rem' }}>
            This review link is no longer valid. If you believe this is an error, please contact us.
          </p>
        </div>
      </section>
    );
  }

  if (status === 'done') {
    return (
      <section className="section">
        <div className="container narrow" style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙏</div>
          <h2>Thank you for your review!</h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.75rem', maxWidth: '400px', margin: '0.75rem auto 0' }}>
            Your feedback helps other travellers discover the best of Cape Town. We'll review it shortly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container narrow">
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <span className="eyebrow">Share your experience</span>
          <h1 style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>How was your Cape Town tour?</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '2.5rem' }}>
            Your honest review helps other travellers and supports our local guides.
          </p>

          <div className="panel" style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Star rating */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '0.75rem' }}>
                Your rating *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    style={{
                      fontSize: '2.2rem', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '0',
                      filter: star <= (hover || rating) ? 'none' : 'grayscale(1) opacity(0.3)',
                      transition: 'filter 100ms, transform 100ms',
                      transform: star === (hover || rating) ? 'scale(1.15)' : 'scale(1)',
                    }}
                    aria-label={`${star} star`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                  {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
                </p>
              )}
            </div>

            {/* Name */}
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Your name *
              </label>
              <input
                type="text" placeholder="Jane Smith"
                value={authorName} onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            {/* Review body */}
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Your review * <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(min 10 characters)</span>
              </label>
              <textarea
                rows={5}
                placeholder="Tell us what you loved most, what surprised you, and whether you'd recommend it to other travellers…"
                value={body} onChange={(e) => setBody(e.target.value)}
              />
              <span style={{ fontSize: '0.76rem', color: 'var(--muted)', textAlign: 'right' }}>
                {body.length} / 1200
              </span>
            </div>

            {status === 'error' && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                Something went wrong. Please try again.
              </p>
            )}

            <button
              className="button"
              disabled={!rating || body.length < 10 || !authorName || status === 'submitting'}
              onClick={handleSubmit}
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
