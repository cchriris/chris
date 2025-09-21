# 个人记录站框架

这个仓库包含了一个基于 Node.js 原生能力实现的个人网站基础框架，提供前台展示和后台管理两部分。系统支持在网页后台手动发布，也支持通过 ChatGPT 等 AI 工具调用接口自动发布，并根据内容中的 `#标签` 与分类关键词进行归类。

## 功能概览

- 🌐 **前台展示页**：
  - 首页展示最新内容和分类速览。
  - 支持按分类、标签查看内容。
  - 文章页自动将换行转换为段落，便于阅读。
- 🔐 **后台管理页**：
  - 登录后可以快速发布内容，管理分类和标签。
  - 分类支持配置“自动归类关键词”，用于接口自动分类。
  - 提供最近发布内容、全部标签等信息面板。
- 🤖 **AI 发布接口**：
  - `POST /api/entries` 接口支持携带 `Authorization: Bearer <TOKEN>` 调用。
  - 自动从正文及提供的标签中解析 `#标签`，匹配分类并创建文章。
  - 返回创建后的文章 ID、归类信息等，便于后续同步。

## 快速开始

1. **准备环境**
   - Node.js ≥ 18（已启用 ES2020 特性）。
   - 推荐使用 `npm` 或 `pnpm` 运行脚本。

2. **安装依赖**
   - 本项目使用 Node.js 原生模块，无需额外安装依赖。

3. **运行服务**

   ```bash
   npm start
   ```

   服务器默认监听 `http://localhost:3000`。

4. **环境变量**（可选）

   | 变量名 | 默认值 | 说明 |
   | ------ | ------ | ---- |
   | `PORT` | `3000` | 服务端口 |
   | `SITE_NAME` | `我的记录站` | 页面展示的站点名称 |
   | `ADMIN_USERNAME` | `admin` | 后台登录用户名 |
   | `ADMIN_PASSWORD` | `change-me` | 后台登录密码 |
   | `API_TOKEN` | `local-api-token` | AI 发布接口的 Bearer Token |

5. **首次登录与分类配置**
   - 访问 `http://localhost:3000/admin/login`，使用上面的账户密码登录。
   - 在后台创建分类时，可填写“匹配关键词”，多个关键词以中文或英文逗号分隔。
   - 当通过 API 发布内容时，系统会优先根据标签、分类名称、关键词进行匹配；若未命中，自动归类到“未分类”。

## API 示例

```bash
curl -X POST "http://localhost:3000/api/entries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer local-api-token" \
  -d '{
    "title": "第一次产品测试记录",
    "content": "今天体验了全新的设备，感受很棒！#产品测试 #灵感",
    "tags": ["体验", "深度思考"]
  }'
```

响应示例：

```json
{
  "message": "created",
  "postId": 1,
  "category": "uncategorized",
  "tags": ["产品测试", "灵感", "体验", "深度思考"]
}
```

## 数据持久化

- 所有数据存储在 `data/storage.json` 中，使用简单的 JSON 结构保存分类、文章与标签。
- 可以根据需要自行接入数据库或云存储，只需在 `src/services/storage.js` 中扩展对应逻辑。

## 目录结构

```
├── data
│   └── storage.json        # 数据文件
├── public
│   └── styles.css          # 页面样式
├── src
│   ├── server.js           # HTTP 服务入口
│   ├── services
│   │   └── storage.js      # 数据读写封装
│   └── utils
│       ├── bodyParser.js   # 请求体解析工具
│       ├── hashtags.js     # 标签解析工具
│       ├── slugify.js      # 简易 slug 转换
│       └── template.js     # 页面渲染辅助
└── README.md
```

## 后续扩展建议

- 接入更完整的身份验证机制（如多用户、多角色）。
- 使用前端框架或静态站点生成器增强展示效果。
- 将数据持久化迁移到正式数据库，并增加草稿、评论等功能。
- 结合自动化部署流程，将后台发布与静态构建结合，提高访问效率。

欢迎基于此框架继续打造属于你的创作阵地 ✨。
