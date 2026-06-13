import { AIAssistant } from '@/components/AIAssistant';

export default function AIAssistantPage() {
  return (
    <section className="section">
      <div className="container narrow">
        <div className="page-header">
          <div className="section-eyebrow">AI travel assistant</div>
          <h1 style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
            Describe the trip and let the <em>assistant shape it</em>.
          </h1>
          <p className="lead">
            Tell us how many days, who you're travelling with, and what you love — the assistant extracts your preferences and routes you straight to a pre-filled itinerary planner.
          </p>
        </div>
        <AIAssistant />
      </div>
    </section>
  );
}
