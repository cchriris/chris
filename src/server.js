const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const { Storage } = require('./services/storage');
const { renderLayout, formatContent, formatDate, escapeHtml } = require('./utils/template');
const { parseBody } = require('./utils/bodyParser');
const { extractHashtags } = require('./utils/hashtags');
const { slugify } = require('./utils/slugify');

const DATA_FILE = path.join(__dirname, '..', 'data', 'storage.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const PORT = Number(process.env.PORT || 3000);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const API_TOKEN = process.env.API_TOKEN || 'local-api-token';
const SITE_NAME = process.env.SITE_NAME || '我的记录站';

const storage = new Storage(DATA_FILE);
const sessions = new Map();

const respond = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(body);
};

const respondJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const notFound = (res) => {
  respond(
    res,
    404,
    renderLayout({
      title: '页面未找到',
      content: '<section class="card"><h1>页面未找到</h1><p>您访问的页面不存在或已被移动。</p></section>',
      navigation: getNavigation(),
      siteName: SITE_NAME,
    }),
  );
};

const getNavigation = () => [
  { href: '/', label: '首页' },
  { href: '/admin', label: '后台管理' },
];

const parseCookies = (req) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return {};
  }
  return cookieHeader.split(';').reduce((acc, item) => {
    const [key, value] = item.split('=').map((part) => part.trim());
    if (key) {
      acc[key] = decodeURIComponent(value || '');
    }
    return acc;
  }, {});
};

const getSession = (req) => {
  const cookies = parseCookies(req);
  const token = cookies.session;
  if (!token) return null;
  return sessions.get(token) || null;
};

const requireAuth = (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.writeHead(302, { Location: '/admin/login' });
    res.end();
    return null;
  }
  return session;
};

const serveStatic = (res, filePath) => {
  if (!filePath.startsWith(PUBLIC_DIR)) {
    notFound(res);
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      notFound(res);
      return;
    }
    const ext = path.extname(filePath);
    const mime =
      {
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  });
};

const renderPostCard = (post) => {
  const category = storage.getCategoryById(post.categoryId);
  const tags = storage.getPostTags(post);
  const excerpt = escapeHtml(post.content.slice(0, 160));
  const tagLinks = tags
    .map((tag) => `<a href="/tag/${tag.slug}" class="tag">#${escapeHtml(tag.name)}</a>`)
    .join(' ');
  return `<article class="card post-card">
    <div class="card-meta">
      <span class="badge">${escapeHtml(category ? category.name : '未分类')}</span>
      <time datetime="${escapeHtml(post.createdAt)}">${escapeHtml(formatDate(post.createdAt))}</time>
    </div>
    <h2 class="card-title"><a href="/posts/${post.id}">${escapeHtml(post.title)}</a></h2>
    <p class="card-excerpt">${excerpt}${post.content.length > 160 ? '…' : ''}</p>
    <div class="card-tags">${tagLinks}</div>
  </article>`;
};

const renderPostDetail = (post) => {
  const category = storage.getCategoryById(post.categoryId);
  const tags = storage.getPostTags(post);
  const tagLinks = tags
    .map((tag) => `<a href="/tag/${tag.slug}" class="tag">#${escapeHtml(tag.name)}</a>`)
    .join(' ');
  return `<article class="card post-detail">
    <div class="card-meta">
      <span class="badge">${escapeHtml(category ? category.name : '未分类')}</span>
      <time datetime="${escapeHtml(post.createdAt)}">${escapeHtml(formatDate(post.createdAt))}</time>
    </div>
    <h1 class="card-title">${escapeHtml(post.title)}</h1>
    <div class="post-content">${formatContent(post.content)}</div>
    <div class="card-tags">${tagLinks}</div>
  </article>`;
};

const renderAdminDashboard = ({
  posts,
  categories,
  tags,
  notice,
  error,
}) => {
  const noticeBlock = notice
    ? `<div class="alert alert-success">${escapeHtml(notice)}</div>`
    : '';
  const errorBlock = error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : '';
  const categoryOptions = categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join('');
  const postsList = posts
    .map(
      (post) => `<li>
          <strong>${escapeHtml(post.title)}</strong>
          <span class="meta">${escapeHtml(formatDate(post.createdAt))}</span>
          <span class="meta">分类：${escapeHtml(
            (storage.getCategoryById(post.categoryId) || {}).name || '未分类',
          )}</span>
        </li>`,
    )
    .join('');
  const categoryRows = categories
    .map(
      (category) => `<tr>
          <td>${escapeHtml(category.name)}</td>
          <td>${escapeHtml(category.slug)}</td>
          <td>
            <form method="post" action="/admin/categories/update" class="inline-form">
              <input type="hidden" name="id" value="${category.id}" />
              <input type="text" name="keywords" value="${escapeHtml(category.keywords.join(', '))}" placeholder="关键词，逗号分隔" />
              <button type="submit">更新匹配关键词</button>
            </form>
          </td>
        </tr>`,
    )
    .join('');
  const tagItems = tags
    .map((tag) => `<span class="tag">#${escapeHtml(tag.name)}</span>`)
    .join(' ');
  return `<section class="dashboard">
    ${noticeBlock}
    ${errorBlock}
    <div class="grid">
      <div class="card">
        <h2>快速发布内容</h2>
        <form method="post" action="/admin/posts" class="form">
          <label>标题
            <input type="text" name="title" required />
          </label>
          <label>正文
            <textarea name="content" rows="8" required placeholder="支持直接书写文字，换行自动转换段落"></textarea>
          </label>
          <label>分类
            <select name="categoryId">
              ${categoryOptions}
            </select>
          </label>
          <label>标签
            <input type="text" name="tags" placeholder="例如：灵感, 产品体验 或 #灵感" />
          </label>
          <button type="submit">发布</button>
        </form>
      </div>
      <div class="card">
        <h2>分类管理</h2>
        <form method="post" action="/admin/categories" class="form">
          <label>分类名称
            <input type="text" name="name" required />
          </label>
          <label>自定义地址（可选）
            <input type="text" name="slug" placeholder="例如：life-notes" />
          </label>
          <label>匹配关键词（可选）
            <input type="text" name="keywords" placeholder="用于自动归类，逗号分隔" />
          </label>
          <button type="submit">新增分类</button>
        </form>
        <table class="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>地址</th>
              <th>自动归类关键词</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <h2>全部标签</h2>
      <div class="tag-cloud">${tagItems || '<p>暂未设置标签</p>'}</div>
    </div>
    <div class="card">
      <h2>API 接入说明</h2>
      <p>使用 ChatGPT 等工具生成内容时，可以调用接口 <code>POST /api/entries</code>，在请求头中带上 <code>Authorization: Bearer ${escapeHtml(
        API_TOKEN,
      )}</code>。</p>
      <pre><code>{
  "title": "标题",
  "content": "正文，可以包含 #标签",
  "tags": ["灵感", "体验"]
}</code></pre>
      <p>系统会自动识别正文或 tags 字段中的 <code>#标签</code>，并结合分类的匹配关键词归类到最合适的分类与标签中。</p>
    </div>
    <div class="card">
      <h2>最近发布</h2>
      <ul class="post-list">
        ${postsList || '<li>暂未发布内容</li>'}
      </ul>
    </div>
  </section>`;
};

const parseTagInput = (input) => {
  if (!input) return [];
  return String(input)
    .replace(/，/g, ',')
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith('#') ? item.slice(1) : item))
    .map((item) => item.toLowerCase());
};

const determineCategoryForContent = (tags, content) => {
  const categories = storage.getCategories();
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  const normalizedContent = String(content || '').toLowerCase();

  for (const tag of normalizedTags) {
    const bySlug = storage.getCategoryBySlug(slugify(tag));
    if (bySlug) {
      return bySlug;
    }
  }

  for (const category of categories) {
    const normalizedName = slugify(category.name);
    if (normalizedTags.includes(normalizedName)) {
      return category;
    }
  }

  for (const category of categories) {
    const keywords = category.keywords || [];
    if (keywords.some((keyword) => normalizedTags.includes(keyword))) {
      return category;
    }
    if (keywords.some((keyword) => normalizedContent.includes(keyword))) {
      return category;
    }
  }

  return storage.getCategoryBySlug('uncategorized');
};

const handleHome = (res) => {
  const posts = storage.getPosts();
  const categories = storage.getCategories();
  const featured = posts.slice(0, 6).map((post) => renderPostCard(post)).join('');
  const categoryBlocks = categories
    .map((category) => {
      const categoryPosts = posts.filter((post) => post.categoryId === category.id).slice(0, 3);
      if (categoryPosts.length === 0) return '';
      const items = categoryPosts.map((post) => `<li><a href="/posts/${post.id}">${escapeHtml(post.title)}</a></li>`).join('');
      return `<section class="card">
          <h3>${escapeHtml(category.name)}</h3>
          <ul class="post-links">${items}</ul>
          <a class="more-link" href="/category/${category.slug}">查看全部 →</a>
        </section>`;
    })
    .join('');

  const content = `<section class="hero card">
      <h1>${escapeHtml(SITE_NAME)}</h1>
      <p>欢迎来到个人创作与记录空间，持续更新日常、体验与灵感。</p>
    </section>
    <section>
      <h2>最新发布</h2>
      <div class="grid">${featured || '<p>还没有内容，快去发布吧。</p>'}</div>
    </section>
    <section>
      <h2>分类速览</h2>
      <div class="grid">${categoryBlocks || '<p>暂未创建分类。</p>'}</div>
    </section>`;

  respond(
    res,
    200,
    renderLayout({
      title: SITE_NAME,
      content,
      navigation: getNavigation(),
      description: '记录日常灵感、体验与创作的个人空间',
      siteName: SITE_NAME,
    }),
  );
};

const handlePostDetail = (res, postId) => {
  const post = storage.getPostById(postId);
  if (!post) {
    notFound(res);
    return;
  }
  const content = renderPostDetail(post);
  respond(
    res,
    200,
    renderLayout({
      title: post.title,
      content,
      navigation: getNavigation(),
      description: post.content.slice(0, 120),
      siteName: SITE_NAME,
    }),
  );
};

const handleCategoryPage = (res, slug) => {
  const category = storage.getCategoryBySlug(slug);
  if (!category) {
    notFound(res);
    return;
  }
  const posts = storage.getPostsByCategorySlug(slug);
  const body = posts.map((post) => renderPostCard(post)).join('');
  const content = `<section>
      <h1>${escapeHtml(category.name)}</h1>
      <div class="grid">${body || '<p>该分类下暂无内容。</p>'}</div>
    </section>`;
  respond(
    res,
    200,
    renderLayout({
      title: `分类：${category.name}`,
      content,
      navigation: getNavigation(),
      description: `查看分类 ${category.name} 下的内容`,
      siteName: SITE_NAME,
    }),
  );
};

const handleTagPage = (res, slug) => {
  const tag = storage.getTagBySlug(slug);
  if (!tag) {
    notFound(res);
    return;
  }
  const posts = storage.getPostsByTagSlug(slug);
  const body = posts.map((post) => renderPostCard(post)).join('');
  const content = `<section>
      <h1>#${escapeHtml(tag.name)}</h1>
      <div class="grid">${body || '<p>该标签下暂无内容。</p>'}</div>
    </section>`;
  respond(
    res,
    200,
    renderLayout({
      title: `标签：${tag.name}`,
      content,
      navigation: getNavigation(),
      description: `查看标签 ${tag.name} 下的内容`,
      siteName: SITE_NAME,
    }),
  );
};

const handleLoginPage = (res, hasError = false) => {
  const content = `<section class="card auth-card">
      <h1>后台登录</h1>
      ${hasError ? '<div class="alert alert-error">账号或密码错误</div>' : ''}
      <form method="post" action="/admin/login" class="form">
        <label>用户名
          <input type="text" name="username" required />
        </label>
        <label>密码
          <input type="password" name="password" required />
        </label>
        <button type="submit">登录</button>
      </form>
    </section>`;
  respond(
    res,
    200,
    renderLayout({
      title: '后台登录',
      content,
      navigation: getNavigation(),
      siteName: SITE_NAME,
    }),
  );
};

const handleAdminDashboard = (req, res) => {
  const session = requireAuth(req, res);
  if (!session) return;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const notice = url.searchParams.get('notice');
  const error = url.searchParams.get('error');
  const html = renderLayout({
    title: '后台管理',
    content: renderAdminDashboard({
      posts: storage.getPosts().slice(0, 20),
      categories: storage.getCategories(),
      tags: storage.getTags(),
      notice,
      error,
    }),
    navigation: getNavigation(),
    siteName: SITE_NAME,
  });
  respond(res, 200, html);
};

const handleAdminLogin = async (req, res) => {
  if (req.method === 'GET') {
    if (getSession(req)) {
      res.writeHead(302, { Location: '/admin' });
      res.end();
      return;
    }
    handleLoginPage(res);
    return;
  }
  try {
    const body = await parseBody(req);
    const { username, password } = body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, { username, createdAt: Date.now() });
      res.writeHead(302, {
        'Set-Cookie': `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 6}`,
        Location: '/admin',
      });
      res.end();
      return;
    }
    handleLoginPage(res, true);
  } catch (error) {
    handleLoginPage(res, true);
  }
};

const handleAdminLogout = (req, res) => {
  const session = getSession(req);
  if (session) {
    const cookies = parseCookies(req);
    sessions.delete(cookies.session);
  }
  res.writeHead(302, {
    'Set-Cookie': 'session=; HttpOnly; Path=/; Max-Age=0',
    Location: '/admin/login',
  });
  res.end();
};

const handleAdminPostCreation = async (req, res) => {
  const session = requireAuth(req, res);
  if (!session) return;
  try {
    const body = await parseBody(req);
    const { title, content, categoryId, tags } = body;
    const tagCandidates = new Set([
      ...extractHashtags(content),
      ...parseTagInput(tags),
    ]);
    const tagEntities = storage.ensureTags(Array.from(tagCandidates));
    const category = storage.getCategoryById(Number(categoryId));
    const post = storage.createPost({
      title,
      content,
      categoryId: category ? category.id : undefined,
      tagIds: tagEntities.map((tag) => tag.id),
      source: 'admin',
    });
    const params = new URLSearchParams({ notice: `已发布《${post.title}》` });
    res.writeHead(302, { Location: `/admin?${params.toString()}` });
    res.end();
  } catch (error) {
    const params = new URLSearchParams({ error: error.message || '发布失败' });
    res.writeHead(302, { Location: `/admin?${params.toString()}` });
    res.end();
  }
};

const handleAdminCategoryCreation = async (req, res) => {
  const session = requireAuth(req, res);
  if (!session) return;
  try {
    const body = await parseBody(req);
    storage.createCategory({ name: body.name, slug: body.slug, keywords: body.keywords });
    const params = new URLSearchParams({ notice: '已新增分类' });
    res.writeHead(302, { Location: `/admin?${params.toString()}` });
    res.end();
  } catch (error) {
    const params = new URLSearchParams({ error: error.message || '新增分类失败' });
    res.writeHead(302, { Location: `/admin?${params.toString()}` });
    res.end();
  }
};

const handleAdminCategoryUpdate = async (req, res) => {
  const session = requireAuth(req, res);
  if (!session) return;
  try {
    const body = await parseBody(req);
    storage.updateCategoryKeywords(body.id, body.keywords);
    const params = new URLSearchParams({ notice: '已更新分类匹配关键词' });
    res.writeHead(302, { Location: `/admin?${params.toString()}` });
    res.end();
  } catch (error) {
    const params = new URLSearchParams({ error: error.message || '更新失败' });
    res.writeHead(302, { Location: `/admin?${params.toString()}` });
    res.end();
  }
};

const handleApiEntryCreation = async (req, res) => {
  if (req.method !== 'POST') {
    respondJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    respondJson(res, 401, { error: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7).trim();
  if (token !== API_TOKEN) {
    respondJson(res, 403, { error: 'Forbidden' });
    return;
  }
  try {
    const payload = await parseBody(req);
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid payload');
    }
    const { title, content } = payload;
    if (!title || !content) {
      respondJson(res, 422, { error: 'title and content are required' });
      return;
    }
    const explicitTags = Array.isArray(payload.tags)
      ? payload.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : parseTagInput(payload.tags);
    const tags = new Set([
      ...extractHashtags(content),
      ...explicitTags.map((tag) => tag.toLowerCase()),
    ]);
    const tagEntities = storage.ensureTags(Array.from(tags));
    const category = determineCategoryForContent(Array.from(tags), content);
    const post = storage.createPost({
      title,
      content,
      categoryId: category ? category.id : undefined,
      tagIds: tagEntities.map((tag) => tag.id),
      source: payload.source || 'api',
    });
    respondJson(res, 201, {
      message: 'created',
      postId: post.id,
      category: category ? category.slug : null,
      tags: tagEntities.map((tag) => tag.slug),
    });
  } catch (error) {
    respondJson(res, 400, { error: error.message || 'Bad request' });
  }
};

const routeRequest = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (pathname.startsWith('/static/')) {
    const filePath = path.join(PUBLIC_DIR, pathname.replace('/static/', ''));
    serveStatic(res, filePath);
    return;
  }

  if (pathname.startsWith('/api/entries')) {
    handleApiEntryCreation(req, res);
    return;
  }

  if (pathname === '/admin/login') {
    handleAdminLogin(req, res);
    return;
  }

  if (pathname === '/admin/logout') {
    handleAdminLogout(req, res);
    return;
  }

  if (pathname === '/admin' && req.method === 'GET') {
    handleAdminDashboard(req, res);
    return;
  }

  if (pathname === '/admin/posts' && req.method === 'POST') {
    handleAdminPostCreation(req, res);
    return;
  }

  if (pathname === '/admin/categories' && req.method === 'POST') {
    handleAdminCategoryCreation(req, res);
    return;
  }

  if (pathname === '/admin/categories/update' && req.method === 'POST') {
    handleAdminCategoryUpdate(req, res);
    return;
  }

  if (pathname === '/' && req.method === 'GET') {
    handleHome(res);
    return;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'posts' && segments[1]) {
    handlePostDetail(res, segments[1]);
    return;
  }
  if (segments[0] === 'category' && segments[1]) {
    handleCategoryPage(res, segments[1]);
    return;
  }
  if (segments[0] === 'tag' && segments[1]) {
    handleTagPage(res, segments[1]);
    return;
  }

  notFound(res);
};

const server = http.createServer(routeRequest);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
