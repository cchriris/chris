import { NextResponse } from 'next/server';
import { createPost } from '@/lib/storage';
import { extractHashtags } from '@/lib/hashtags';
import { parseTagInput } from '@/lib/tags';
import { getApiToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7).trim();
  if (token !== getApiToken()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const title = payload.title;
  const content = payload.content;
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 422 });
  }

  const explicitTags = Array.isArray(payload.tags)
    ? payload.tags
    : parseTagInput(payload.tags);
  const tagNames = Array.from(
    new Set([...explicitTags, ...extractHashtags(content)]),
  );

  try {
    const { post, category, tags } = await createPost({
      title,
      content,
      tagNames,
      source: payload.source || 'api',
      autoClassify: true,
    });
    return NextResponse.json(
      {
        message: 'created',
        postId: post.id,
        category: category ? category.slug : null,
        tags: tags.map((tag) => tag.slug),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 400 });
  }
}
