# 个人记录站 · Next.js 版本

这是一个基于 **Next.js 14 App Router** 构建的个人内容发布框架，拥有现代化的前台展示和带权限控制的创作后台。
系统内置了 AI 发布接口，可与 ChatGPT 等工具集成，通过 `#标签` 与分类关键词自动归档。

得益于 Next.js 的全栈能力，项目可以直接部署到 [Vercel](https://vercel.com/) 获取实时预览与生产环境；同样也可以作为 Node.js 应用运行在任意支持的服务器上。

## ✨ 功能亮点

- **沉浸式前台展示**：
  - 首页采用渐变背景与卡片布局，展示最新文章、分类精选和标签漫游。
  - 分类页、标签页、文章详情页均为动态渲染，自动读取最新数据。
- **创作后台**：
  - 通过用户名密码登录（环境变量配置），可以发布文章、创建分类、维护关键词与查看标签。
  - 界面提供 API Token、最近发布等信息，便于追踪创作情况。
- **AI 自动发布接口**：
  - `POST /api/entries` 支持 Bearer Token 校验。
  - 自动从正文和自定义 `tags` 中解析 `#标签`，结合分类关键词进行归档。
- **可扩展的存储层**：
  - 默认将数据保存为 `data/storage.json`，便于快速原型与本地演示。
  - 可替换为数据库或云存储，以满足生产环境持久化需求。

## 🚀 快速开始

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动开发环境**

   ```bash
   npm run dev
   ```

   开发服务器默认监听 <http://localhost:3000>，保存文件会自动热更新。

3. **环境变量（可在 `.env.local` 中配置）**

   | 变量名 | 默认值 | 说明 |
   | ------ | ------ | ---- |
   | `SITE_NAME` | `我的记录站` | 站点名称 |
   | `SITE_TAGLINE` | `记录日常 · 捕捉灵感 · 构建创造力` | 首页副标题 |
   | `ADMIN_USERNAME` | `admin` | 后台用户名 |
   | `ADMIN_PASSWORD` | `change-me` | 后台密码 |
   | `API_TOKEN` | `local-api-token` | AI 发布接口 Bearer Token |

4. **构建与生产运行**

   ```bash
   npm run build
   npm start
   ```

## 🤖 AI 发布接口示例

```bash
curl -X POST "http://localhost:3000/api/entries" \
  -H "Authorization: Bearer local-api-token" \
  -H "Content-Type: application/json" \
  -d '{
        "title": "第一次产品测试记录",
        "content": "今天体验了全新的设备，感受很棒！#产品测试 #灵感",
        "tags": ["体验", "深度思考"]
      }'
```

接口会返回创建的文章 ID、自动识别的分类与标签 slug，方便后续同步或引用。

## ☁️ Vercel 部署指南

1. 在 Vercel 上新建项目并关联当前仓库。
2. 在 **Environment Variables** 中配置上表所需变量。
3. 保持默认的 `Build Command` (`npm run build`) 与 `Output Directory` (`.next`)。
4. 推送代码或触发部署后，即可获得实时预览域名与生产环境。

> **提示**：Vercel 的无服务器运行时无法持久写入本地文件。
> 若希望在线环境保持数据，请将 `lib/storage.js` 替换为数据库（如 Vercel Postgres、KV、PlanetScale 等）或对象存储方案。

## 🗂️ 目录结构

```
├── app
│   ├── api                 # Next.js API Routes（后台操作与 AI 接口）
│   ├── admin               # 后台页面（登录、面板）
│   ├── category/[slug]     # 分类详情页
│   ├── tag/[slug]          # 标签详情页
│   ├── posts/[id]          # 文章详情页
│   ├── layout.jsx          # 全局布局与导航
│   └── page.jsx            # 首页
├── components              # React 组件（卡片等）
├── lib                     # 数据存储、格式化等工具函数
├── data/storage.json       # 默认 JSON 数据存储
├── jsconfig.json           # 路径别名配置
└── README.md
```

## 🔧 后续扩展建议

- 将 JSON 存储替换为数据库或 SaaS 服务，提升可靠性。
- 增加草稿、作品集页面或 RSS 输出，扩展站点能力。
- 集成更多自动化流程（如 GitHub Actions、定时任务）与多用户权限。

享受记录与创造的过程吧，愿你的灵感常伴 ✨。
