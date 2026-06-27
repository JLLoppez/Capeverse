import Link from 'next/link';

/**
 * /booking/success
 *
 * Stripe redirects here after a successful checkout session.
 * The `session_id` query param is appended by Stripe automatically
 * via the `{CHECKOUT_SESSION_ID}` placeholder in checkout/route.ts.
 *
 * We intentionally do NOT re-fetch the session here — the booking record
 * is created reliably by the webhook (booking/webhook/route.ts) which fires
 * server-to-server before Stripe redirects the browser. Showing the customer
 * a clean confirmation is all this page needs to do.
 */
export default function BookingSuccessPage() {
  return (
    <section className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: 560, textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--sienna)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ marginBottom: '0.75rem' }}>Booking confirmed!</h1>

        <p className="lead" style={{ marginBottom: '1rem' }}>
          Thank you — your payment was successful. A confirmation email is on
          its way to your inbox.
        </p>

        <p style={{ color: 'var(--mist)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Our team will be in touch within 24 hours to finalise your itinerary
          details and answer any questions.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/tours" className="btn btn-primary">
            Browse more tours
          </Link>
          <Link href="/" className="btn btn-outline">
            Back to home
          </Link>
        </div>

      </div>
    </section>
  );
}
