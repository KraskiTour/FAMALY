import { createHash } from 'node:crypto';

const ADMIN_COOKIE_NAME = 'admin_session';

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return acc;
    acc[k] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

export function getAdminCookieName(): string {
  return ADMIN_COOKIE_NAME;
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? '';
}

export function isAdminConfigured(): boolean {
  return getAdminPassword().length > 0;
}

export function buildSessionToken(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function isAuthorizedRequest(req: Request): boolean {
  const password = getAdminPassword();
  if (!password) return false;

  const token = parseCookieHeader(req.headers.get('cookie'))[ADMIN_COOKIE_NAME];
  if (!token) return false;

  return token === buildSessionToken(password);
}

