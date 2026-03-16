import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'cape_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured');
  return secret;
}

function base64url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function fromBase64url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function createAdminToken() {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, scope: 'admin' });
  const encoded = base64url(payload);
  const signature = createHmac('sha256', getSecret()).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

export function verifyAdminToken(token?: string | null) {
  if (!token) return false;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;
  const expected = createHmac('sha256', getSecret()).update(encoded).digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false;

  try {
    const payload = JSON.parse(fromBase64url(encoded)) as { exp: number; scope: string };
    return payload.scope === 'admin' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

export async function requireAdmin() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect('/admin/login');
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}
