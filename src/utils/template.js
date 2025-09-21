const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('zh-CN', { hour12: false });
};

const formatContent = (content) => {
  const escaped = escapeHtml(content);
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, '<br />'))
    .map((block) => `<p>${block}</p>`);
  return paragraphs.join('\n');
};

const renderLayout = ({ title, content, description = '', navigation = [], styles = [], siteName = '我的记录站' }) => {
  const navLinks = navigation
    .map((item) => `<a href="${item.href}" class="nav-link">${escapeHtml(item.label)}</a>`)
    .join('');

  const extraStyles = styles.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} · ${escapeHtml(siteName)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="stylesheet" href="/static/styles.css" />
    ${extraStyles}
  </head>
  <body>
    <header class="site-header">
      <div class="container header-container">
        <div class="branding">
          <a href="/" class="brand">${escapeHtml(siteName)}</a>
          <p class="tagline">记录日常 · 捕捉灵感 · 构建创造力</p>
        </div>
        <nav class="site-nav">${navLinks}</nav>
      </div>
    </header>
    <main class="container">
      ${content}
    </main>
    <footer class="site-footer">
      <div class="container">
        <p>由 Node.js 驱动 · 保持好奇与创造</p>
      </div>
    </footer>
  </body>
</html>`;
};

module.exports = {
  escapeHtml,
  formatContent,
  formatDate,
  renderLayout,
};
