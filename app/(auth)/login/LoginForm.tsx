"use client";

export default function LoginForm() {
  return (
    <form
      action="/api/admin/login"
      method="post"
      style={{ display: 'grid', gap: '1rem' }}
    >
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        <label>Email</label>

        <input
          name="email"
          type="email"
          required
          style={{
            background: '#1a1a14',
            border: '1px solid rgba(240,237,230,0.1)',
            color: '#f0ede6',
            padding: '0.85rem 1rem',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: '0.45rem' }}>
        <label>Password</label>

        <input
          name="password"
          type="password"
          required
          style={{
            background: '#1a1a14',
            border: '1px solid rgba(240,237,230,0.1)',
            color: '#f0ede6',
            padding: '0.85rem 1rem',
            outline: 'none',
          }}
        />
      </div>

      <button
        type="submit"
        style={{
          background: '#c9a96e',
          color: '#080806',
          border: 'none',
          padding: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Sign in
      </button>
    </form>
  );
}
