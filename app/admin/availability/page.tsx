'use client';
import { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';

type BlockedDate = { id: string; date: string; maxGroups: number; note: string | null };

export default function AdminAvailabilityPage() {
  const [rows, setRows]     = useState<BlockedDate[]>([]);
  const [date, setDate]     = useState('');
  const [maxGroups, setMax] = useState(0);
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function load() {
    const res  = await fetch('/api/admin/availability');
    const data = await res.json();
    setRows(data.map((r: BlockedDate & { date: string | Date }) => ({
      ...r,
      date: typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0],
    })));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!date) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, maxGroups, note: note || undefined }),
      });
      if (!res.ok) throw new Error();
      setDate(''); setMax(0); setNote('');
      await load();
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(d: string) {
    await fetch(`/api/admin/availability?date=${d}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div>
        <h1 style={{ marginBottom: '0.3rem' }}>Availability calendar</h1>
        <p className="muted" style={{ fontWeight: 300, fontSize: '0.85rem' }}>
          Block dates or limit capacity. Blocked dates are hidden from the public booking form.
        </p>
      </div>

      {/* Add form */}
      <div className="panel">
        <h3 style={{ marginBottom: '1.25rem' }}>Add blocked or limited date</h3>
        <div className="field-grid">
          <label>
            <span className="field-label">Date *</span>
            <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} />
          </label>
          <label>
            <span className="field-label">Max groups (0 = fully blocked)</span>
            <input type="number" min={0} max={20} value={maxGroups} onChange={e => setMax(Number(e.target.value))} />
          </label>
        </div>
        <label style={{ marginTop: '0.85rem', display: 'grid', gap: '0.35rem' }}>
          <span className="field-label">Internal note (optional)</span>
          <input type="text" placeholder="e.g. Public holiday, private event" value={note} onChange={e => setNote(e.target.value)} />
        </label>
        {error && <p className="notice error" style={{ marginTop: '0.75rem' }}>{error}</p>}
        <div style={{ marginTop: '1.1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ink" disabled={!date || saving} onClick={handleAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} />
            {saving ? 'Saving…' : maxGroups === 0 ? 'Block this date' : 'Set capacity limit'}
          </button>
        </div>
      </div>

      {/* Blocked dates list */}
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Blocked &amp; limited dates</h3>
        {rows.length === 0 ? (
          <div className="empty-state">
            <Calendar size={24} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            No blocked dates — all dates are currently available.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Status</th><th>Note</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600 }}>
                      {new Date(row.date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      {row.maxGroups === 0
                        ? <span className="status" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Fully blocked</span>
                        : <span className="status" style={{ background: 'var(--warn-bg)', color: 'var(--sienna)' }}>Max {row.maxGroups} group{row.maxGroups > 1 ? 's' : ''}</span>
                      }
                    </td>
                    <td className="muted" style={{ fontSize: '0.82rem' }}>{row.note ?? '—'}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => handleDelete(row.date)}
                        style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Trash2 size={13} />Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
