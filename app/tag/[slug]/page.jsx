import Link from 'next/link';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import { getTagWithPosts } from '@/lib/storage';
import { SITE_NAME } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const tagData = await getTagWithPosts(params.slug);
  if (!tagData) {
    return { title: `未找到标签 · ${SITE_NAME}` };
  }
  return {
    title: `#${tagData.tag.name} · ${SITE_NAME}`,
    description: `浏览带有 #${tagData.tag.name} 的全部创作`,
  };
}

export default async function TagPage({ params }) {
  const tagData = await getTagWithPosts(params.slug);
  if (!tagData) {
    notFound();
  }
  const { tag, posts } = tagData;

  return (
    <div>
      <section className="card">
        <div className="card-meta">
          <span className="badge">标签</span>
          <span>{posts.length} 篇创作</span>
        </div>
        <h1 className="card-title">#{tag.name}</h1>
        <p className="card-excerpt">与这个标签相关的记录都在这里。</p>
      </section>

      {posts.length > 0 ? (
        <div className="post-grid" style={{ marginTop: '2rem' }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="empty-state">这个标签还没有内容，试着<Link href="/admin">发布</Link>一篇。</p>
      )}
    </div>
  );
}
