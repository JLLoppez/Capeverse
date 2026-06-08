'use client';

import { useEffect, useState } from 'react';

type BlockedDate = { id: string; date: string; maxGroups: number; note: string | null };

export default function AdminAvailabilityPage() {
  const [rows, setRows]       = useState<BlockedDate[]>([]);
  const [date, setDate]       = useState('');
  const [maxGroups, setMax]   = useState(0);
  const [note, setNote]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/availability');
    const data = await res.json();
    setRows(data.map((r: BlockedDate & { date: string | Date }) => ({
      ...r,
      date: typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0],
    })));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!date) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, maxGroups, note: note || undefined }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setDate(''); setMax(0); setNote('');
      await load();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: string) {
    await fetch(`/api/admin/availability?date=${d}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Availability calendar</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Block dates or set a max group limit. Blocked dates are hidden in the booking form.
      </p>

      {/* Add form */}
      <div className="panel" style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0 }}>Add blocked or limited date</h3>
        <div className="field-grid">
          <label>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>Date *</span>
            <input type="date" value={date} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
              Max groups (0 = fully blocked)
            </span>
            <input type="number" min={0} max={20} value={maxGroups}
              onChange={(e) => setMax(Number(e.target.value))} />
          </label>
        </div>
        <label>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>Internal note (optional)</span>
          <input type="text" placeholder="e.g. Public holiday, private event" value={note}
            onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
        <button className="button" disabled={!date || saving} onClick={handleAdd}>
          {saving ? 'Saving…' : maxGroups === 0 ? 'Block this date' : 'Set limit'}
        </button>
      </div>

      {/* Blocked dates list */}
      <h3 style={{ marginBottom: '0.75rem' }}>Blocked &amp; limited dates</h3>
      {rows.length === 0 ? (
        <div className="empty-state">No blocked dates. All dates are currently available.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>
                    {new Date(row.date + 'T12:00:00Z').toLocaleDateString('en-GB', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td>
                    {row.maxGroups === 0
                      ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Fully blocked</span>
                      : <span style={{ color: 'var(--gold-dark)' }}>Max {row.maxGroups} group{row.maxGroups > 1 ? 's' : ''}</span>
                    }
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{row.note ?? '—'}</td>
                  <td>
                    <button
                      className="button small outline"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => handleDelete(row.date)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
