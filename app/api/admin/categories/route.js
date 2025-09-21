import { NextResponse } from 'next/server';
import { createCategory } from '@/lib/storage';
import { getSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

function isAuthorized(request) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value === getSessionToken();
}

export async function POST(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!isAuthorized(request)) {
    if (contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (contentType.includes('application/json')) {
    try {
      const payload = await request.json();
      const category = await createCategory({
        name: payload?.name,
        slug: payload?.slug,
        keywords: payload?.keywords,
      });
      return NextResponse.json({ category });
    } catch (error) {
      return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 400 });
    }
  }

  const formData = await request.formData();
  const redirectTarget = formData.get('redirect') || '/admin';
  const redirectUrl = new URL(redirectTarget, request.url);

  try {
    await createCategory({
      name: formData.get('name'),
      slug: formData.get('slug'),
      keywords: formData.get('keywords'),
    });
    redirectUrl.searchParams.set('notice', '已新增分类');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    redirectUrl.searchParams.set('error', error.message || '新增分类失败');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
