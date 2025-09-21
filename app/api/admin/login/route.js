import { NextResponse } from 'next/server';
import { getSessionToken, verifyCredentials, SESSION_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

function buildRedirect(request, path) {
  return new URL(path, request.url);
}

export async function POST(request) {
  const contentType = request.headers.get('content-type') || '';
  let username;
  let password;
  let redirectTo = '/admin';

  if (contentType.includes('application/json')) {
    try {
      const payload = await request.json();
      username = payload?.username;
      password = payload?.password;
      redirectTo = payload?.redirect || redirectTo;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
  } else {
    const formData = await request.formData();
    username = formData.get('username');
    password = formData.get('password');
    redirectTo = formData.get('redirect') || redirectTo;
  }

  if (!verifyCredentials(username, password)) {
    if (contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = buildRedirect(request, '/admin/login');
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(buildRedirect(request, redirectTo));
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: getSessionToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 6,
    path: '/',
  });
  return response;
}
