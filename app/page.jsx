import Link from 'next/link';
import PostCard from '@/components/PostCard';
import { getOverview } from '@/lib/storage';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { posts, categories, tags } = await getOverview();
  const latestPosts = posts.slice(0, 6);
  const categoryHighlights = categories
    .map((category) => ({
      category,
      posts: posts.filter((post) => post.category?.id === category.id).slice(0, 3),
    }))
    .filter((entry) => entry.posts.length > 0)
    .slice(0, 3);
  const tagCloud = tags.slice(0, 18);

  return (
    <div className="page-home">
      <section className="hero">
        <div>
          <h1>{SITE_NAME}</h1>
          <p>{SITE_TAGLINE}</p>
        </div>
        <div className="hero-actions">
          <Link href="/admin">开始创作</Link>
          <Link href="#latest">查看最新发布</Link>
        </div>
      </section>

      <section id="latest">
        <h2 className="section-title">最新更新</h2>
        {latestPosts.length > 0 ? (
          <div className="post-grid">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="empty-state">还没有文章，快去后台创作第一篇吧。</p>
        )}
      </section>

      {categoryHighlights.length > 0 ? (
        <section>
          <h2 className="section-title">主题精选</h2>
          <div className="two-column">
            {categoryHighlights.map(({ category, posts: categoryPosts }) => (
              <div key={category.id} className="card">
                <div className="card-meta">
                  <span className="badge">{category.name}</span>
                  <Link href={`/category/${category.slug}`}>查看全部</Link>
                </div>
                <ul className="post-links">
                  {categoryPosts.map((post) => (
                    <li key={post.id}>
                      <Link href={`/posts/${post.id}`}>{post.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tagCloud.length > 0 ? (
        <section>
          <h2 className="section-title">标签漫游</h2>
          <div className="card tag-cloud">
            <div className="tag-list">
              {tagCloud.map((tag) => (
                <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag">
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
