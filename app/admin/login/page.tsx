export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; retry?: string }> }) {
  const params = await searchParams;
  const isRateLimited = params.error === 'too-many-attempts';
  const retrySeconds = Number(params.retry || 0);
  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'#080806',display:'grid',placeItems:'center',fontFamily:'Inter,sans-serif'}}>
      <div style={{width:'min(420px,90vw)'}}>
        <div style={{marginBottom:'3rem',textAlign:'center'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'50%',border:'1px solid #c9a96e',display:'grid',placeItems:'center',margin:'0 auto 1.25rem',fontFamily:'Cormorant Garamond,serif',fontSize:'1.1rem',color:'#c9a96e',fontStyle:'italic'}}>C</div>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:'1.8rem',fontWeight:300,color:'#f0ede6',letterSpacing:'0.06em',marginBottom:'0.25rem'}}>Capiverse</div>
          <div style={{fontSize:'0.62rem',letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(240,237,230,0.35)'}}>Admin Portal</div>
        </div>
        {isRateLimited ? (
          <div style={{background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.25)',padding:'0.85rem 1rem',marginBottom:'1.5rem',fontSize:'0.82rem',color:'#e07070'}}>
            Too many attempts. Wait {retrySeconds > 0 ? `${Math.ceil(retrySeconds/60)} minute(s)` : 'a few minutes'}.
          </div>
        ) : params.error ? (
          <div style={{background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.25)',padding:'0.85rem 1rem',marginBottom:'1.5rem',fontSize:'0.82rem',color:'#e07070'}}>
            Invalid credentials. Please try again.
          </div>
        ) : null}
        <form action="/api/admin/login" method="post" style={{display:'grid',gap:'1rem'}}>
          <div style={{display:'grid',gap:'0.45rem'}}>
            <label style={{fontSize:'0.62rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(240,237,230,0.35)'}}>Email</label>
            <input name="email" type="email" required style={{background:'#1a1a14',border:'1px solid rgba(240,237,230,0.1)',color:'#f0ede6',padding:'0.85rem 1rem',fontSize:'0.9rem',outline:'none',fontFamily:'inherit',borderRadius:'0',transition:'border-color 200ms'}} onFocus={(e)=>e.target.style.borderColor='#c9a96e'} onBlur={(e)=>e.target.style.borderColor='rgba(240,237,230,0.1)'} />
          </div>
          <div style={{display:'grid',gap:'0.45rem'}}>
            <label style={{fontSize:'0.62rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(240,237,230,0.35)'}}>Password</label>
            <input name="password" type="password" required style={{background:'#1a1a14',border:'1px solid rgba(240,237,230,0.1)',color:'#f0ede6',padding:'0.85rem 1rem',fontSize:'0.9rem',outline:'none',fontFamily:'inherit',borderRadius:'0'}} />
          </div>
          <button type="submit" style={{background:'#c9a96e',color:'#080806',border:'none',padding:'0.95rem',fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',cursor:'pointer',fontFamily:'inherit',marginTop:'0.75rem',transition:'background 200ms'}}>
            Sign in
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'2rem',fontSize:'0.7rem',color:'rgba(240,237,230,0.2)',letterSpacing:'0.06em'}}>
          <a href="/" style={{color:'rgba(240,237,230,0.35)',textDecoration:'none'}}>← Return to site</a>
        </p>
      </div>
    </div>
  );
}
