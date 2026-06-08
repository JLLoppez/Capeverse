'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { ItinerarySkeleton } from '@/components/ItinerarySkeleton';

type Attraction = { id: string; name: string; slug: string; region: string };
type PlannerProps = { attractions: Attraction[] };
type Stop = { name: string; region: string; reason?: string };
type DayResult = { day: number; title: string; stops: Stop[] };
type PlannerResult = {
  summary: string;
  recommendedTourType: string;
  estimatedPriceBand: string;
  days: DayResult[];
  warnings?: string[];
  droppedAttractions?: string[];
  aiEnriched?: boolean;
};

const INTEREST_OPTIONS = [
  { value: 'scenic',    label: '🏔 Scenic' },
  { value: 'wine',      label: '🍷 Wine' },
  { value: 'culture',   label: '🎭 Culture' },
  { value: 'family',    label: '👨‍👩‍👧 Family' },
  { value: 'adventure', label: '🧗 Adventure' },
  { value: 'food',      label: '🍽 Food' },
  { value: 'luxury',    label: '✨ Luxury' },
  { value: 'beach',     label: '🏖 Beach' },
  { value: 'wildlife',  label: '🦁 Wildlife' },
  { value: 'city',      label: '🏙 City' },
];

function trackFunnel(event: string, meta?: Record<string, unknown>) {
  const sessionId = sessionStorage.getItem('cv_session') ?? (() => {
    const id = crypto.randomUUID();
    sessionStorage.setItem('cv_session', id);
    return id;
  })();
  fetch('/api/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, sessionId, path: window.location.pathname, meta }),
  }).catch(() => {});
}

export function TripPlanner({ attractions }: PlannerProps) {
  const [selected, setSelected]         = useState<string[]>([]);
  const [interests, setInterests]       = useState<string[]>([]);
  const [days, setDays]                 = useState(1);
  const [groupType, setGroupType]       = useState('Couple');
  const [budget, setBudget]             = useState('Mid-range');
  const [pace, setPace]                 = useState('Balanced');
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<PlannerResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [shareToken, setShareToken]     = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [copied, setCopied]             = useState(false);
  const resultRef                       = useRef<HTMLDivElement>(null);
  const hasTrackedStart                 = useRef(false);

  // Track planner start on first interaction
  useEffect(() => {
    if ((selected.length > 0 || interests.length > 0) && !hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackFunnel('started_planner');
    }
  }, [selected, interests]);

  const selectedAttractions = useMemo(
    () => attractions.filter((a) => selected.includes(a.id)),
    [attractions, selected]
  );

  const canGenerate = selected.length > 0 && interests.length > 0;

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    setError(null);
    setShareToken(null);
    try {
      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attractionIds: selected, days, groupType, budget, pace, interests }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? 'Failed to generate itinerary');
      }
      const data = await response.json();
      setResult(data);
      trackFunnel('generated_itinerary', { days, budget, pace, interests });
      // Scroll to result on mobile
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/itinerary/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryJson: result,
          inputJson: { attractionIds: selected, days, groupType, budget, pace, interests },
          days, budget, pace, groupType, interests,
        }),
      });
      const data = await res.json();
      setShareToken(data.token);
      trackFunnel('saved_itinerary', { token: data.token });
    } catch {
      // silent fail — saving is non-critical
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink() {
    if (!shareToken) return;
    const url = `${window.location.origin}/itinerary/${shareToken}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function whatsappUrl() {
    if (!shareToken) return '#';
    const link = `${window.location.origin}/itinerary/${shareToken}`;
    const text = `Hi! I'd love some help finalising my Cape Town itinerary: ${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="grid-two planner-layout">
      {/* ── LEFT: inputs ────────────────────────────────────────────── */}
      <section className="panel">
        <h2>Build your Cape Town itinerary</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Select places, pick your interests, and we'll generate a smart geographic day plan.
        </p>

        <div className="field-grid">
          <label>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Trip length (days)</span>
            <input type="number" min={1} max={14} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </label>
          <label>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Group type</span>
            <select value={groupType} onChange={(e) => setGroupType(e.target.value)}>
              <option>Solo</option><option>Couple</option><option>Family</option>
              <option>Friends</option><option>Private Group</option>
            </select>
          </label>
          <label>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Budget</span>
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option>Budget</option><option>Mid-range</option><option>Premium</option><option>Luxury</option>
            </select>
          </label>
          <label>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Pace</span>
            <select value={pace} onChange={(e) => setPace(e.target.value)}>
              <option>Relaxed</option><option>Balanced</option><option>Packed</option>
            </select>
          </label>
        </div>

        {/* Interests */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.65rem' }}>
            Interests <span style={{ color: 'var(--brand)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>* required</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '0.5rem' }}>
            {INTEREST_OPTIONS.map((opt) => {
              const active = interests.includes(opt.value);
              return (
                <label key={opt.value} className={`choice-chip ${active ? 'active' : ''}`} style={{ padding: '0.6rem 0.75rem' }}>
                  <input type="checkbox" checked={active} onChange={() => toggleInterest(opt.value)} style={{ display: 'none' }} />
                  <strong style={{ fontSize: '0.82rem' }}>{opt.label}</strong>
                </label>
              );
            })}
          </div>
        </div>

        {/* Attractions */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.65rem' }}>
            Places to visit
          </p>
          <div className="checkbox-grid">
            {attractions.map((attraction) => {
              const checked = selected.includes(attraction.id);
              return (
                <label key={attraction.id} className={`choice-chip ${checked ? 'active' : ''}`}>
                  <input type="checkbox" checked={checked} style={{ display: 'none' }}
                    onChange={() =>
                      setSelected((prev) =>
                        prev.includes(attraction.id)
                          ? prev.filter((id) => id !== attraction.id)
                          : [...prev, attraction.id]
                      )
                    }
                  />
                  <div>
                    <strong>{attraction.name}</strong>
                    <span>{attraction.region}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <button
          className="button" style={{ marginTop: '1.5rem' }}
          disabled={loading || !canGenerate} onClick={handleGenerate}
        >
          {loading ? 'Generating…' : 'Generate itinerary'}
        </button>
        {!canGenerate && !loading && (
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
            {selected.length === 0 && interests.length === 0 ? 'Pick attractions and interests to start.'
              : selected.length === 0 ? 'Select at least one attraction.'
              : 'Select at least one interest.'}
          </p>
        )}
      </section>

      {/* ── RIGHT: output ────────────────────────────────────────────── */}
      <section className="panel" ref={resultRef}>
        <h2>Your suggested plan</h2>

        {error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="button small outline" style={{ marginTop: '0.75rem' }} onClick={() => setError(null)}>Try again</button>
          </div>
        ) : loading ? (
          <ItinerarySkeleton />
        ) : !result ? (
          <div className="empty-state">
            <p>Select attractions and interests to generate a realistic, geographically-grouped day plan.</p>
            {selectedAttractions.length > 0 && (
              <>
                <p style={{ fontWeight: 600, marginTop: '1rem', textAlign: 'left' }}>Selected so far:</p>
                <ul style={{ textAlign: 'left', marginTop: '0.4rem' }}>
                  {selectedAttractions.map((item) => (
                    <li key={item.id}>{item.name} <span className="muted">· {item.region}</span></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <div className="itinerary-output">
            {result.aiEnriched !== undefined && (
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                {result.aiEnriched ? '✦ AI-enriched itinerary' : '⚙ Rule-based itinerary'}
              </p>
            )}

            <p style={{ marginBottom: '1rem' }}>{result.summary}</p>

            <div className="pill-row" style={{ marginBottom: '1.25rem' }}>
              <span className="pill">{result.recommendedTourType}</span>
              <span className="pill">{result.estimatedPriceBand}</span>
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div style={{
                background: 'rgba(255,180,0,0.09)', border: '1px solid rgba(255,180,0,0.35)',
                borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem',
              }}>
                {result.warnings.map((w, i) => (
                  <p key={i} style={{ fontSize: '0.83rem', margin: i > 0 ? '0.4rem 0 0' : 0 }}>⚠ {w}</p>
                ))}
              </div>
            )}

            {result.days.map((day) => (
              <div key={day.day} className="itinerary-day">
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Day {day.day}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{day.title}</strong>
                </div>
                <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'grid', gap: '0.5rem' }}>
                  {day.stops.map((stop) => (
                    <li key={`${day.day}-${stop.name}`} style={{ padding: '0.6rem 0.75rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      <span style={{ fontWeight: 700 }}>{stop.name}</span>
                      <span className="muted" style={{ fontSize: '0.8rem' }}> · {stop.region}</span>
                      {stop.reason && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0.15rem 0 0' }}>{stop.reason}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {result.droppedAttractions && result.droppedAttractions.length > 0 && (
              <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '0.75rem', marginTop: '0.25rem', border: '1px solid var(--line)' }}>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                  <strong>Couldn't fit:</strong> {result.droppedAttractions.join(', ')}. A consultant can extend the trip.
                </p>
              </div>
            )}

            {/* Save + share */}
            <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem' }}>
              {!shareToken ? (
                <button className="button dark" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving…' : '🔗 Save & get shareable link'}
                </button>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{
                    display: 'flex', gap: '0.5rem', alignItems: 'center',
                    background: 'var(--bg)', border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)', padding: '0.6rem 0.85rem',
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/itinerary/${shareToken}`}
                    </span>
                    <button className="button small outline" style={{ flexShrink: 0 }} onClick={handleCopyLink}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={whatsappUrl()} target="_blank" rel="noopener noreferrer"
                      className="button small"
                      style={{ background: '#25D366', boxShadow: 'none', flex: 1, justifyContent: 'center' }}
                    >
                      💬 Share on WhatsApp
                    </a>
                    <a
                      href={`/enquiry?itinerary=${shareToken}`}
                      className="button small outline"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Send as enquiry
                    </a>
                  </div>
                </div>
              )}
              {!shareToken && (
                <a href="/enquiry" className="button small outline" style={{ textAlign: 'center' }}>
                  Send as enquiry
                </a>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
