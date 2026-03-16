export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; retry?: string }> }) {
  const params = await searchParams;
  const isRateLimited = params.error === 'too-many-attempts';
  const retrySeconds = Number(params.retry || 0);
  return (
    <section className="section">
      <div className="container narrow panel">
        <span className="eyebrow">Admin portal</span>
        <h1 className="h1">Sign in</h1>
        <p>Use the admin credentials from your environment variables.</p>
        {isRateLimited ? (
          <p className="error">Too many login attempts. Please wait {retrySeconds > 0 ? `${Math.ceil(retrySeconds / 60)} minute(s)` : 'a few minutes'} before trying again.</p>
        ) : params.error ? (
          <p className="error">Invalid credentials. Please try again.</p>
        ) : null}
        <form action="/api/admin/login" method="post" className="stack-form">
          <label><span>Email</span><input name="email" type="email" required /></label>
          <label><span>Password</span><input name="password" type="password" required /></label>
          <button className="button">Sign in</button>
        </form>
      </div>
    </section>
  );
}
