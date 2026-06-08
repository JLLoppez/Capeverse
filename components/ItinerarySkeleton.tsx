export function ItinerarySkeleton() {
  return (
    <div className="itinerary-skeleton" aria-busy="true" aria-label="Generating your itinerary…">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .sk {
          background: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>

      {/* Summary block */}
      <div className="sk" style={{ height: 14, width: '90%', marginBottom: 8 }} />
      <div className="sk" style={{ height: 14, width: '70%', marginBottom: 8 }} />
      <div className="sk" style={{ height: 14, width: '50%', marginBottom: 20 }} />

      {/* Pill row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div className="sk" style={{ height: 28, width: 140, borderRadius: 999 }} />
        <div className="sk" style={{ height: 28, width: 180, borderRadius: 999 }} />
      </div>

      {/* Day cards */}
      {[1, 2, 3].map((d) => (
        <div key={d} style={{
          border: '1px solid #e8e8e8', borderRadius: 12,
          padding: '1rem', marginBottom: '0.75rem',
        }}>
          <div className="sk" style={{ height: 12, width: 40, marginBottom: 8 }} />
          <div className="sk" style={{ height: 16, width: '55%', marginBottom: 14 }} />
          {[1, 2].map((s) => (
            <div key={s} style={{
              border: '1px solid #efefef', borderRadius: 8,
              padding: '0.65rem 0.75rem', marginBottom: '0.5rem',
            }}>
              <div className="sk" style={{ height: 13, width: '60%', marginBottom: 6 }} />
              <div className="sk" style={{ height: 11, width: '80%' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
