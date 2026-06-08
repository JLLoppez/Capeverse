'use client';

import { useState, useEffect, useRef } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

type ItineraryHint = {
  days?: number;
  groupType?: string;
  budget?: string;
  pace?: string;
  interests?: string[];
};

const STARTERS = [
  'We're a couple visiting for 3 days — we love scenic drives and wine tasting.',
  'Family of 4 with young kids, looking for wildlife and relaxed city highlights.',
  'Solo traveller, luxury budget, first time in Cape Town, want the iconic highlights.',
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

// Pull structured hints out of freeform messages so the chat can pre-fill the planner
function extractHints(messages: Message[]): ItineraryHint {
  const text = messages.map((m) => m.content.toLowerCase()).join(' ');
  const hint: ItineraryHint = {};

  const dayMatch = text.match(/(\d+)\s*day/);
  if (dayMatch) hint.days = Math.min(14, Math.max(1, Number(dayMatch[1])));

  if (text.includes('family') || text.includes('kids') || text.includes('children')) hint.groupType = 'Family';
  else if (text.includes('couple') || text.includes('honeymoon') || text.includes('romantic')) hint.groupType = 'Couple';
  else if (text.includes('solo') || text.includes('alone') || text.includes('myself')) hint.groupType = 'Solo';
  else if (text.includes('friends') || text.includes('group')) hint.groupType = 'Friends';

  if (text.includes('luxury')) hint.budget = 'Luxury';
  else if (text.includes('premium')) hint.budget = 'Premium';
  else if (text.includes('budget')) hint.budget = 'Budget';

  if (text.includes('relaxed') || text.includes('slow') || text.includes('leisurely')) hint.pace = 'Relaxed';
  else if (text.includes('packed') || text.includes('full day') || text.includes('fit in as much')) hint.pace = 'Packed';

  const interests: string[] = [];
  if (text.includes('wine') || text.includes('winelands') || text.includes('tasting')) interests.push('wine');
  if (text.includes('scenic') || text.includes('views') || text.includes('mountains')) interests.push('scenic');
  if (text.includes('food') || text.includes('restaurant') || text.includes('dining')) interests.push('food');
  if (text.includes('culture') || text.includes('history') || text.includes('museum')) interests.push('culture');
  if (text.includes('beach') || text.includes('swim') || text.includes('coast')) interests.push('beach');
  if (text.includes('wildlife') || text.includes('penguin') || text.includes('animals')) interests.push('wildlife');
  if (text.includes('adventure') || text.includes('hike') || text.includes('hiking')) interests.push('adventure');
  if (text.includes('family') || text.includes('kids')) interests.push('family');
  if (hint.budget === 'Luxury') interests.push('luxury');
  if (interests.length > 0) hint.interests = [...new Set(interests)];

  return hint;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Restore chat from localStorage on mount (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cv_chat_history');
        if (stored) {
          const parsed = JSON.parse(stored) as { messages: Message[]; ts: number };
          // Discard if older than 24 hours
          if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) return parsed.messages;
        }
      } catch { /* ignore parse errors */ }
    }
    return [{
      role: 'assistant',
      content:
        'Welcome to Cape Compass ✨ Tell me how many days you have, who you\'re travelling with, and what style fits you best — scenic, wine, culture, family, food, or luxury. The more detail you give, the better I can tailor the plan.',
    }];
  });
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [sessionId, setSessionId]   = useState('');
  const [hints, setHints]           = useState<ItineraryHint>({});
  const [plannerUrl, setPlannerUrl] = useState<string | null>(null);
  const chatEndRef                  = useRef<HTMLDivElement>(null);
  const hasTracked                  = useRef(false);

  useEffect(() => {
    const id = sessionStorage.getItem('cv_session') ?? crypto.randomUUID();
    sessionStorage.setItem('cv_session', id);
    setSessionId(id);
  }, []);

  // Persist chat history to localStorage on every message update
  useEffect(() => {
    try {
      localStorage.setItem('cv_chat_history', JSON.stringify({ messages, ts: Date.now() }));
    } catch { /* quota exceeded or SSR — ignore */ }
  }, [messages]);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Re-extract hints whenever messages change
  useEffect(() => {
    const h = extractHints(messages);
    setHints(h);
    // Build planner URL with pre-filled params if we have enough
    if (h.days || h.groupType || h.interests?.length) {
      const params = new URLSearchParams();
      if (h.days) params.set('days', String(h.days));
      if (h.groupType) params.set('groupType', h.groupType);
      if (h.budget) params.set('budget', h.budget);
      if (h.pace) params.set('pace', h.pace);
      if (h.interests?.length) params.set('interests', h.interests.join(','));
      setPlannerUrl(`/plan-trip?${params.toString()}`);
    }
  }, [messages]);

  async function handleSend(customInput?: string) {
    const outgoing = (customInput ?? input).trim();
    if (!outgoing || loading) return;

    if (!hasTracked.current) {
      hasTracked.current = true;
      trackFunnel('started_planner', { source: 'ai_chat' });
    }

    const nextMessages: Message[] = [...messages, { role: 'user', content: outgoing }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, sessionId }),
      });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setError('Something went wrong. Please try again or speak to a consultant.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasEnoughForPlanner = !!(hints.days && hints.interests?.length);

  return (
    <div className="ai-shell premium-ai-shell">
      {/* Header */}
      <div className="ai-header-row">
        <div>
          <span className="eyebrow">Personalised planning</span>
          <h2 style={{ marginTop: '0.3rem' }}>Describe the trip and let the assistant shape it.</h2>
        </div>
        <a href="/enquiry" className="button small outline">Speak to a consultant</a>
      </div>

      {/* Extracted intent chips — show what the AI understood */}
      {(hints.days || hints.groupType || hints.interests?.length) && (
        <div style={{
          background: 'rgba(14,77,100,0.04)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius)', padding: '0.65rem 0.9rem',
          marginBottom: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.35rem' }}>
            Understood:
          </span>
          {hints.days && <span className="pill">{hints.days} day{hints.days > 1 ? 's' : ''}</span>}
          {hints.groupType && <span className="pill">{hints.groupType}</span>}
          {hints.budget && <span className="pill">{hints.budget}</span>}
          {hints.pace && <span className="pill">{hints.pace}</span>}
          {hints.interests?.map((i) => <span key={i} className="pill">{i}</span>)}
        </div>
      )}

      {/* Starter chips */}
      <div className="prompt-row">
        {STARTERS.map((starter) => (
          <button
            key={starter} type="button" className="starter-chip"
            onClick={() => handleSend(starter)} disabled={loading}
          >
            {starter}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="chat-window luxury-chat-window">
        {messages.map((message, index) => (
          <div key={index} className={`chat-bubble ${message.role}`}>
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant" style={{ opacity: 0.6 }}>
            <span style={{ letterSpacing: '0.15em' }}>···</span>
          </div>
        )}
        {error && <div className="chat-bubble error-bubble">{error}</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input row */}
      <div className="chat-input-row">
        <textarea
          rows={2}
          placeholder="Example: 3 days, couple, love wine and scenic drives, mid-range budget…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button className="button glow-button" onClick={() => handleSend()} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>

      {/* Smart handoff: open planner pre-filled + WhatsApp CTA */}
      {messages.length >= 3 && (
        <div style={{
          marginTop: '1rem', borderTop: '1px solid var(--line)', paddingTop: '1rem',
          display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center',
        }}>
          {hasEnoughForPlanner && plannerUrl ? (
            <a href={plannerUrl} className="button small dark">
              → Open trip planner (pre-filled)
            </a>
          ) : (
            <a href="/plan-trip" className="button small dark">
              → Build a full itinerary
            </a>
          )}
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Hi! I\'ve been planning a Cape Town trip and would love some help. Can we continue on WhatsApp?')}`}
            target="_blank" rel="noopener noreferrer"
            className="button small"
            style={{ background: '#25D366', boxShadow: 'none' }}
          >
            💬 Continue on WhatsApp
          </a>
          <a href="/enquiry" className="button small outline">Submit an enquiry</a>
        </div>
      )}
    </div>
  );
}
