import { AIAssistant } from '@/components/AIAssistant';

export default function AIAssistantPage() {
  return (
    <section className="section">
      <div className="container page-header narrow">
        <span className="eyebrow">AI travel assistant</span>
        <h1>Get a personalized recommendation</h1>
        <p>If your traveller is not sure where to begin, the assistant can recommend the best Cape Town experiences.</p>
      </div>
      <div className="container narrow">
        <AIAssistant />
      </div>
    </section>
  );
}
