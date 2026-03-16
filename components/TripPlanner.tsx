'use client';

import { useMemo, useState } from 'react';

type Attraction = {
  id: string;
  name: string;
  slug: string;
  region: string;
};

type PlannerProps = {
  attractions: Attraction[];
};

type PlannerResult = {
  summary: string;
  recommendedTourType: string;
  estimatedPriceBand: string;
  days: Array<{ day: number; title: string; stops: Array<{ name: string; region: string }> }>;
};

export function TripPlanner({ attractions }: PlannerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [days, setDays] = useState(1);
  const [groupType, setGroupType] = useState('Couple');
  const [budget, setBudget] = useState('Mid-range');
  const [pace, setPace] = useState('Balanced');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAttractions = useMemo(
    () => attractions.filter((attraction) => selected.includes(attraction.id)),
    [attractions, selected]
  );

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attractionIds: selected, days, groupType, budget, pace })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? 'Failed to generate itinerary');
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid-two planner-layout">
      <section className="panel">
        <h2>Build your Cape Town itinerary</h2>
        <p>Select what you want to visit and the platform will generate a smart route.</p>

        <div className="field-grid">
          <label>
            <span>Trip length (days)</span>
            <input type="number" min={1} max={7} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </label>
          <label>
            <span>Group type</span>
            <select value={groupType} onChange={(e) => setGroupType(e.target.value)}>
              <option>Solo</option>
              <option>Couple</option>
              <option>Family</option>
              <option>Friends</option>
              <option>Private Group</option>
            </select>
          </label>
          <label>
            <span>Budget</span>
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option>Budget</option>
              <option>Mid-range</option>
              <option>Premium</option>
              <option>Luxury</option>
            </select>
          </label>
          <label>
            <span>Pace</span>
            <select value={pace} onChange={(e) => setPace(e.target.value)}>
              <option>Relaxed</option>
              <option>Balanced</option>
              <option>Packed</option>
            </select>
          </label>
        </div>

        <div className="checkbox-grid">
          {attractions.map((attraction) => {
            const checked = selected.includes(attraction.id);
            return (
              <label key={attraction.id} className={`choice-chip ${checked ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
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

        <button className="button" disabled={loading || !selected.length} onClick={handleGenerate}>
          {loading ? 'Generating itinerary...' : 'Generate itinerary'}
        </button>
      </section>

      <section className="panel">
        <h2>Your suggested plan</h2>
        {error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="button small outline" onClick={() => setError(null)}>Try again</button>
          </div>
        ) : !result ? (
          <div className="empty-state">
            <p>Select attractions to generate a realistic day-by-day itinerary.</p>
            {!!selectedAttractions.length && (
              <ul>
                {selectedAttractions.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="itinerary-output">
            <p>{result.summary}</p>
            <div className="pill-row">
              <span className="pill">{result.recommendedTourType}</span>
              <span className="pill">{result.estimatedPriceBand}</span>
            </div>
            {result.days.map((day) => (
              <div key={day.day} className="itinerary-day">
                <h3>Day {day.day}</h3>
                <strong>{day.title}</strong>
                <ul>
                  {day.stops.map((stop) => (
                    <li key={`${day.day}-${stop.name}`}>
                      {stop.name} <span className="muted">· {stop.region}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <a href="/enquiry" className="button small outline">
              Send this as an enquiry
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
