import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostWithRelations } from '@/lib/storage';
import { formatDate } from '@/lib/format';
import { SITE_NAME } from '@/lib/settings';

export const dynamic = 'force-dynamic';

function renderContent(content) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.split(/\n/))
    .map((lines, index) => (
      <p key={index}>
        {lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </p>
    ));
}

export async function generateMetadata({ params }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return { title: SITE_NAME };
  }
  const post = await getPostWithRelations(id);
  if (!post) {
    return { title: `未找到文章 · ${SITE_NAME}` };
  }
  const excerpt = post.content.replace(/\s+/g, ' ').slice(0, 80);
  return {
    title: `${post.title} · ${SITE_NAME}`,
    description: excerpt,
  };
}

export default async function PostDetailPage({ params }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    notFound();
  }
  const post = await getPostWithRelations(id);
  if (!post) {
    notFound();
  }

  return (
    <article className="card post-detail">
      <div className="card-meta">
        <span className="badge">{post.category ? post.category.name : '未分类'}</span>
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
      </div>
      <h1 className="card-title">{post.title}</h1>
      <div className="post-content">{renderContent(post.content)}</div>
      {post.tags.length > 0 ? (
        <div className="card-tags">
          {post.tags.map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag">
              #{tag.name}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="hero-actions">
        <Link href="/">返回首页</Link>
        {post.category ? <Link href={`/category/${post.category.slug}`}>更多 {post.category.name}</Link> : null}
      </div>
    </article>
  );
}
