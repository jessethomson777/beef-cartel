import 'server-only';
import { adminAuth } from '../firebase-admin';

export class AdminError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export interface AdminContext {
  uid: string;
  email: string;
}

function allowlist(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Gate an admin API route. Verifies the caller's Firebase ID token and checks
 * the email against ADMIN_EMAILS. Throws AdminError(401|403) on failure.
 * NOTE: email allowlist is the v1 gate. Harden later by setting a custom claim
 * (e.g. `admin: true`) on the brother's user and checking `decoded.admin`.
 */
export async function requireAdmin(req: Request): Promise<AdminContext> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new AdminError(401, 'Missing authorization token');

  let decoded;
  try {
    // checkRevoked: reject tokens from signed-out / disabled / revoked sessions
    // immediately (these endpoints move money — worth the extra lookup).
    decoded = await adminAuth().verifyIdToken(token, true);
  } catch {
    throw new AdminError(401, 'Invalid or expired token');
  }

  // Require a VERIFIED email. The web API key is public, so anyone could mint a
  // token whose `email` equals an admin's via password sign-up — but that token
  // has email_verified=false. Email-link sign-in (what admins use) sets it true.
  if (!decoded.email_verified) {
    throw new AdminError(403, 'Not authorised');
  }

  const email = (decoded.email ?? '').toLowerCase();
  const allowed = allowlist();
  if (!email || allowed.length === 0 || !allowed.includes(email)) {
    throw new AdminError(403, 'Not authorised');
  }
  return { uid: decoded.uid, email };
}
