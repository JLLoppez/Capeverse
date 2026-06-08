'use client';

type WhatsAppButtonProps = {
  message?: string;
  phone?: string;
  label?: string;
  variant?: 'fixed' | 'inline';
};

export function WhatsAppButton({
  message = "Hi! I'd love to find out more about a private Cape Town tour.",
  phone,
  label = 'Chat on WhatsApp',
  variant = 'inline',
}: WhatsAppButtonProps) {
  // Guard: if no phone number and variant is fixed, don't render a dead button
  if (variant === 'fixed' && !phone) return null;

  const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
  const url  = `${base}?text=${encodeURIComponent(message)}`;

  if (variant === 'fixed') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 200,
          width: 56, height: 56, borderRadius: '50%',
          background: '#25D366', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
          fontSize: '1.5rem', textDecoration: 'none',
          transition: 'transform 150ms, box-shadow 150ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}
      >
        💬
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="button"
      style={{ background: '#25D366', boxShadow: '0 3px 12px rgba(37,211,102,0.35)' }}
    >
      💬 {label}
    </a>
  );
}
