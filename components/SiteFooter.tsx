export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Capeverse</div>
            <div className="footer-tagline">The universe of Cape Town</div>
            <p className="footer-desc">Private tours, AI itinerary planning, and local expert follow-up — built for operators who care about the experience.</p>
            <div className="footer-coord">34°02′S · 18°25′E · Cape Town</div>
          </div>
          <div>
            <div className="footer-heading">Explore</div>
            <div className="footer-links">
              {[['Tours','/tours'],['Attractions','/attractions'],['Plan my trip','/plan-trip'],['AI assistant','/ai-assistant']].map(([label,href]) => (
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
              <a href="/admin" style={{ opacity: 0.5, fontSize: '0.76rem' }}>Admin portal</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Capeverse. All rights reserved.</span>
          <span>Private tours · AI planning · Local expertise</span>
        </div>
      </div>
    </footer>
  );
}
