import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
  return response;
}
