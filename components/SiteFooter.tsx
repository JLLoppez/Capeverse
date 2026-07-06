import { Instagram, Facebook, Globe } from 'lucide-react';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Capeverse</div>
            <div className="footer-tagline">One place. Every experience.</div>
            <p className="footer-desc">Your AI travel companion for Cape Town — discover, plan, book, and experience it all in one intelligent platform.</p>
            <div className="footer-social">
              <a href="https://instagram.com/capeverse.app" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={15} /></a>
              <a href="https://facebook.com/Capeverse" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={15} /></a>
              <a href="https://capeverse.com" target="_blank" rel="noopener noreferrer" aria-label="Website"><Globe size={15} /></a>
            </div>
            <div className="footer-coord">34°02′S · 18°25′E · Cape Town</div>
          </div>
          <div>
            <div className="footer-heading">Explore</div>
            <div className="footer-links">
              {[['Tours','/tours'],['Attractions','/attractions'],['Events','/events'],['Plan my trip','/plan-trip'],['AI assistant','/ai-assistant'],['Saved','/saved']].map(([label,href]) => (
                <a key={href} href={href}>{label}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer-heading">Contact</div>
            <div className="footer-links">
              <a href="/enquiry">Send an enquiry</a>
              <a href="/ai-assistant">Talk to the AI assistant</a>
              {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
              )}
              <a href="mailto:hello@capeverse.com">hello@capeverse.com</a>
              <a href="/admin" style={{ opacity: 0.5, fontSize: '0.76rem' }}>Admin portal</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Capeverse. All rights reserved.</span>
          <span>Discover · Plan · Book · Connect</span>
        </div>
      </div>
    </footer>
  );
}
