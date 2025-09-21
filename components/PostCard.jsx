import Link from 'next/link';
import { formatDate } from '@/lib/format';

function buildExcerpt(content) {
  const text = String(content || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 140) return text;
  return `${text.slice(0, 140)}…`;
}

export default function PostCard({ post }) {
  const category = post.category ? post.category.name : '未分类';
  const tags = Array.isArray(post.tags) ? post.tags : [];
  return (
    <article className="card post-card">
      <div className="card-meta">
        <span className="badge">{category}</span>
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
      </div>
      <h3 className="card-title">
        <Link href={`/posts/${post.id}`}>{post.title}</Link>
      </h3>
      <p className="card-excerpt">{buildExcerpt(post.content)}</p>
      {tags.length > 0 ? (
        <div className="card-tags">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag">
              #{tag.name}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}
