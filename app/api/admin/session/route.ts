import { NextResponse } from 'next/server';
import {
  buildSessionToken,
  getAdminCookieName,
  getAdminPassword,
  isAdminConfigured,
  isAuthorizedRequest,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const configured = isAdminConfigured();
  return NextResponse.json({
    configured,
    authenticated: configured ? isAuthorizedRequest(req) : false,
  });
}

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD is not configured in environment variables' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const password = String(body?.password ?? '');
  if (password !== getAdminPassword()) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: getAdminCookieName(),
    value: buildSessionToken(password),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: getAdminCookieName(),
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}

