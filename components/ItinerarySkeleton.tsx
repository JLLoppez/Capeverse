export function ItinerarySkeleton() {
  return (
    <div aria-busy="true" aria-label="Generating your itinerary…" style={{ padding: '0.25rem 0' }}>
      <div className="sk" style={{ height: 12, width: '80%', marginBottom: 8 }} />
      <div className="sk" style={{ height: 12, width: '60%', marginBottom: 8 }} />
      <div className="sk" style={{ height: 12, width: '45%', marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div className="sk" style={{ height: 26, width: 140, borderRadius: 999 }} />
        <div className="sk" style={{ height: 26, width: 160, borderRadius: 999 }} />
      </div>
      {[1, 2, 3].map(d => (
        <div key={d} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--r-lg)', padding: '1rem', marginBottom: '0.6rem' }}>
          <div className="sk" style={{ height: 10, width: '28%', marginBottom: 8 }} />
          <div className="sk" style={{ height: 14, width: '55%', marginBottom: 14 }} />
          {[1, 2].map(s => (
            <div key={s} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.6rem 0.7rem', marginBottom: '0.4rem' }}>
              <div className="sk" style={{ height: 11, width: '55%', marginBottom: 5 }} />
              <div className="sk" style={{ height: 9, width: '75%' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
