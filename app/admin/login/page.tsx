export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; retry?: string }> }) {
  const params = await searchParams;
  const isRateLimited = params.error === 'too-many-attempts';
  const retrySeconds = Number(params.retry || 0);
  return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0a0a0a'}}>
      <div style={{background:'#141410',border:'1px solid rgba(240,237,230,0.1)',padding:'3rem',width:'min(420px,90vw)',borderRadius:'4px'}}>
        <div style={{marginBottom:'2rem'}}>
          <div style={{fontFamily:'serif',fontSize:'1.5rem',color:'#f0ede6',marginBottom:'0.25rem'}}>Capiverse</div>
          <div style={{fontSize:'0.65rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'#c9a96e'}}>Admin Portal</div>
        </div>
        {isRateLimited ? (
          <p style={{color:'#e07070',fontSize:'0.85rem',marginBottom:'1rem'}}>Too many attempts. Wait {retrySeconds > 0 ? `${Math.ceil(retrySeconds/60)} min` : 'a few minutes'}.</p>
        ) : params.error ? (
          <p style={{color:'#e07070',fontSize:'0.85rem',marginBottom:'1rem'}}>Invalid credentials. Please try again.</p>
        ) : null}
        <form action="/api/admin/login" method="post" style={{display:'grid',gap:'1rem'}}>
          <div style={{display:'grid',gap:'0.4rem'}}>
            <label style={{fontSize:'0.68rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(240,237,230,0.4)'}}>Email</label>
            <input name="email" type="email" required style={{background:'#1c1c17',border:'1px solid rgba(240,237,230,0.12)',color:'#f0ede6',padding:'0.75rem 1rem',fontSize:'0.9rem',outline:'none',fontFamily:'inherit',borderRadius:'0'}} />
          </div>
          <div style={{display:'grid',gap:'0.4rem'}}>
            <label style={{fontSize:'0.68rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(240,237,230,0.4)'}}>Password</label>
            <input name="password" type="password" required style={{background:'#1c1c17',border:'1px solid rgba(240,237,230,0.12)',color:'#f0ede6',padding:'0.75rem 1rem',fontSize:'0.9rem',outline:'none',fontFamily:'inherit',borderRadius:'0'}} />
          </div>
          <button type="submit" style={{background:'#c9a96e',color:'#0a0a0a',border:'none',padding:'0.85rem',fontSize:'0.78rem',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',cursor:'pointer',fontFamily:'inherit',marginTop:'0.5rem'}}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
