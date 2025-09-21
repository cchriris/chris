import { NextResponse } from 'next/server';
import { createPost } from '@/lib/storage';
import { parseTagInput } from '@/lib/tags';
import { getSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

function ensureAdmin(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token !== getSessionToken()) {
    return false;
  }
  return true;
}

export async function POST(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!ensureAdmin(request)) {
    if (contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (contentType.includes('application/json')) {
    try {
      const payload = await request.json();
      const { post, category, tags } = await createPost({
        title: payload?.title,
        content: payload?.content,
        categoryId: payload?.categoryId,
        tagNames: Array.isArray(payload?.tags) ? payload.tags : parseTagInput(payload?.tags),
        source: 'admin-api',
      });
      return NextResponse.json({ post, category, tags });
    } catch (error) {
      return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 400 });
    }
  }

  const formData = await request.formData();
  const redirectTarget = formData.get('redirect') || '/admin';
  const redirectUrl = new URL(redirectTarget, request.url);

  try {
    const { post } = await createPost({
      title: formData.get('title'),
      content: formData.get('content'),
      categoryId: formData.get('categoryId'),
      tagNames: parseTagInput(formData.get('tags')), 
      source: 'admin',
    });
    redirectUrl.searchParams.set('notice', `已发布《${post.title}》`);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    redirectUrl.searchParams.set('error', error.message || '发布失败');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
