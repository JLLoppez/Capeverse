export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Capiverse</div>
            <div className="footer-tagline">The universe of Cape Town experiences</div>
            <p className="footer-desc">Private tours, AI itinerary planning, and local expert follow-up — all in one platform.</p>
          </div>
          <div>
            <div className="footer-heading">Explore</div>
            <div className="footer-links">
              {[['Tours','/tours'],['Attractions','/attractions'],['Plan My Trip','/plan-trip'],['AI Assistant','/ai-assistant']].map(([label,href])=>(
                <a key={href} href={href}>{label}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer-heading">Contact</div>
            <div className="footer-links">
              <a href="/enquiry">Send an enquiry</a>
              <a href="/ai-assistant">Talk to AI assistant</a>
              <a href="/admin">Admin portal</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Capiverse. Crafted for Cape Town.</span>
          <span>Private tours · AI planning · Local expertise</span>
        </div>
      </div>
    </footer>
  );
}
