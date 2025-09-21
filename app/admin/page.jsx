import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOverview } from '@/lib/storage';
import { formatDate } from '@/lib/format';
import { getApiToken, getSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({ searchParams }) {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (session !== getSessionToken()) {
    redirect('/admin/login');
  }

  const { posts, categories, tags } = await getOverview();
  const notice = searchParams?.notice;
  const error = searchParams?.error;
  const apiToken = getApiToken();

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <h1 className="card-title" style={{ marginBottom: '1rem' }}>
          创作管理面板
        </h1>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="link-button">
            退出登录
          </button>
        </form>
      </div>

      {notice ? <div className="alert alert-success">{notice}</div> : null}
      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="two-column">
        <div className="column">
          <section className="card">
            <h2 className="card-title">快速发布</h2>
            <p className="card-excerpt">支持 #标签 自动识别，也可以手动填写标签。</p>
            <form className="styled-form" action="/api/admin/posts" method="post">
              <label>
                标题
                <input type="text" name="title" required placeholder="今天记录了什么？" />
              </label>
              <label>
                正文
                <textarea name="content" required placeholder="详细记录内容、灵感与想法…" />
              </label>
              <label>
                分类
                <select name="categoryId" defaultValue={categories[0]?.id || ''}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                标签
                <input
                  type="text"
                  name="tags"
                  placeholder="使用逗号或空格分隔，如：产品测试，灵感"
                />
              </label>
              <input type="hidden" name="redirect" value="/admin" />
              <button type="submit">发布内容</button>
            </form>
          </section>

          <section className="card">
            <h2 className="card-title">新增分类</h2>
            <p className="card-excerpt">为不同创作主题创建分类，并配置匹配关键词。</p>
            <form className="styled-form" action="/api/admin/categories" method="post">
              <label>
                名称
                <input type="text" name="name" required placeholder="例如：产品测试" />
              </label>
              <label>
                自定义地址（可选）
                <input type="text" name="slug" placeholder="英文短语，例如 product-review" />
              </label>
              <label>
                匹配关键词（可选）
                <input type="text" name="keywords" placeholder="使用逗号分隔，自动分类时匹配" />
              </label>
              <input type="hidden" name="redirect" value="/admin" />
              <button type="submit">创建分类</button>
            </form>
          </section>

          <section className="card">
            <h2 className="card-title">AI 发布接口</h2>
            <p className="card-excerpt">使用 Bearer Token 触发自动归类与发布。</p>
            <pre className="mono">POST /api/entries</pre>
            <p className="mono">Authorization: Bearer {apiToken}</p>
            <p className="card-excerpt">
              在内容里加入 <code>#标签</code> 或通过 <code>tags</code> 字段传入，系统会结合分类关键词进行归类。
            </p>
          </section>
        </div>

        <div className="column">
          <section className="card">
            <h2 className="card-title">分类管理</h2>
            <div className="table-list">
              {categories.map((category) => (
                <div key={category.id} className="table-row">
                  <div className="table-row-header">
                    <h4>{category.name}</h4>
                    <span className="mono">/{category.slug}</span>
                  </div>
                  <form className="styled-form" action="/api/admin/categories/update" method="post">
                    <input type="hidden" name="id" value={category.id} />
                    <label>
                      匹配关键词
                      <input
                        type="text"
                        name="keywords"
                        defaultValue={(category.keywords || []).join(', ')}
                        placeholder="自动归类的关键词"
                      />
                    </label>
                    <input type="hidden" name="redirect" value="/admin" />
                    <button type="submit">保存</button>
                  </form>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">最近发布</h2>
            <ul className="post-links">
              {posts.slice(0, 8).map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.id}`}>
                    {post.title}
                    <span style={{ color: 'var(--muted)', marginLeft: '0.5rem' }}>
                      {formatDate(post.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 className="card-title">全部标签</h2>
            {tags.length > 0 ? (
              <div className="tag-list">
                {tags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-state">暂未创建标签。</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
