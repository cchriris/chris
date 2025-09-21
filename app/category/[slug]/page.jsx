import Link from 'next/link';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import { getCategoryWithPosts } from '@/lib/storage';
import { SITE_NAME } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const categoryData = await getCategoryWithPosts(params.slug);
  if (!categoryData) {
    return { title: `未找到分类 · ${SITE_NAME}` };
  }
  return {
    title: `${categoryData.category.name} · ${SITE_NAME}`,
    description: `浏览「${categoryData.category.name}」下的最新创作`,
  };
}

export default async function CategoryPage({ params }) {
  const categoryData = await getCategoryWithPosts(params.slug);
  if (!categoryData) {
    notFound();
  }
  const { category, posts } = categoryData;

  return (
    <div>
      <section className="card">
        <div className="card-meta">
          <span className="badge">分类</span>
          <span>{posts.length} 篇创作</span>
        </div>
        <h1 className="card-title">{category.name}</h1>
        {Array.isArray(category.keywords) && category.keywords.length > 0 ? (
          <p className="card-excerpt">关键词：{category.keywords.join('、')}</p>
        ) : (
          <p className="card-excerpt">持续记录这一主题的灵感与发现。</p>
        )}
      </section>

      {posts.length > 0 ? (
        <div className="post-grid" style={{ marginTop: '2rem' }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="empty-state">这个分类还没有内容，快去<Link href="/admin">后台发布</Link>吧。</p>
      )}
    </div>
  );
}
