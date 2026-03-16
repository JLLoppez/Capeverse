'use client';

import { useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

const starters = [
  'We are a couple visiting for 2 days and love scenic drives and wine tasting.',
  'Family of 4 with children, looking for relaxed wildlife and city highlights.',
  'Solo traveller, premium budget, first time in Cape Town, want iconic views.'
];

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Welcome to Cape Compass ✨ Tell me how many days you have, who you are travelling with, and what style fits you best — scenic, wine, culture, family, food, or luxury.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(customInput?: string) {
    const outgoing = (customInput ?? input).trim();
    if (!outgoing) return;
    const nextMessages = [...messages, { role: 'user' as const, content: outgoing }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages })
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

  return (
    <div className="ai-shell premium-ai-shell">
      <div className="ai-header-row">
        <div>
          <span className="eyebrow">Personalised planning</span>
          <h2>Describe the trip and let the assistant shape it.</h2>
        </div>
        <a href="/enquiry" className="button small outline">
          Speak to a consultant
        </a>
      </div>
      <div className="prompt-row">
        {starters.map((starter) => (
          <button key={starter} type="button" className="starter-chip" onClick={() => handleSend(starter)} disabled={loading}>
            {starter}
          </button>
        ))}
      </div>
      <div className="chat-window luxury-chat-window">
        {messages.map((message, index) => (
          <div key={index} className={`chat-bubble ${message.role}`}>
            {message.content}
          </div>
        ))}
        {loading ? <div className="chat-bubble assistant">Shaping the best route for you…</div> : null}
        {error ? <div className="chat-bubble error-bubble">{error}</div> : null}
      </div>
      <div className="chat-input-row">
        <textarea
          rows={3}
          placeholder="Example: We are three friends coming for 3 days. We want a balanced mix of city, nature, beach, and one premium wine day."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="button glow-button" onClick={() => handleSend()} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
