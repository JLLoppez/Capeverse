import LoginForm from './LoginForm';

export default async function AdminLoginPage({ searchParams }: any) {
  const params = await searchParams;

  const isRateLimited = params?.error === 'too-many-attempts';
  const retrySeconds = Number(params?.retry || 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#080806',
      }}
    >
      <div style={{ width: 'min(420px, 90vw)' }}>
        {isRateLimited && (
          <div style={{ color: '#e07070', marginBottom: '1rem' }}>
            Too many attempts. Try again in {retrySeconds || 0}s
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
