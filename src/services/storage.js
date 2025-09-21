const fs = require('fs');
const path = require('path');
const { slugify } = require('../utils/slugify');

const DEFAULT_CATEGORY = {
  name: '未分类',
  slug: 'uncategorized',
  keywords: [],
};

class Storage {
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureFile();
    this.state = this.load();
    this.ensureDefaultCategory();
  }

  ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(
          {
            categories: [],
            tags: [],
            posts: [],
            meta: {
              nextCategoryId: 1,
              nextTagId: 1,
              nextPostId: 1,
            },
          },
          null,
          2,
        ),
      );
    }
  }

  load() {
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    parsed.categories = parsed.categories || [];
    parsed.tags = parsed.tags || [];
    parsed.posts = parsed.posts || [];
    parsed.meta = parsed.meta || {
      nextCategoryId: 1,
      nextTagId: 1,
      nextPostId: 1,
    };
    return parsed;
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  ensureDefaultCategory() {
    const existing = this.state.categories.find((c) => c.slug === DEFAULT_CATEGORY.slug);
    if (!existing) {
      this.createCategory(DEFAULT_CATEGORY);
    }
  }

  getCategories() {
    return this.state.categories.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  }

  getCategoryById(id) {
    return this.state.categories.find((category) => category.id === Number(id));
  }

  getCategoryBySlug(slug) {
    return this.state.categories.find((category) => category.slug === slug);
  }

  createCategory({ name, slug, keywords = [] }) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) {
      throw new Error('Category name is required');
    }
    let finalSlug = slug ? slugify(slug) : slugify(normalizedName);
    if (!finalSlug) {
      finalSlug = `category-${Date.now()}`;
    }
    if (this.getCategoryBySlug(finalSlug)) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }
    const category = {
      id: this.state.meta.nextCategoryId++,
      name: normalizedName,
      slug: finalSlug,
      keywords: Array.isArray(keywords)
        ? keywords.filter(Boolean).map((k) => k.toLowerCase())
        : String(keywords || '')
            .replace(/，/g, ',')
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
            .map((k) => k.toLowerCase()),
    };
    this.state.categories.push(category);
    this.save();
    return category;
  }

  updateCategoryKeywords(id, keywords) {
    const category = this.getCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    category.keywords = Array.isArray(keywords)
      ? keywords.filter(Boolean).map((k) => k.toLowerCase())
      : String(keywords || '')
          .replace(/，/g, ',')
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
          .map((k) => k.toLowerCase());
    this.save();
    return category;
  }

  getTags() {
    return this.state.tags.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  }

  getTagById(id) {
    return this.state.tags.find((tag) => tag.id === Number(id));
  }

  getTagBySlug(slug) {
    return this.state.tags.find((tag) => tag.slug === slug);
  }

  getTagByName(name) {
    const target = String(name || '').trim().toLowerCase();
    return this.state.tags.find((tag) => tag.name.toLowerCase() === target);
  }

  createTag(name) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) {
      throw new Error('Tag name is required');
    }
    const existing = this.getTagByName(normalizedName);
    if (existing) {
      return existing;
    }
    let slug = slugify(normalizedName);
    if (!slug) {
      slug = `tag-${Date.now()}`;
    }
    if (this.getTagBySlug(slug)) {
      slug = `${slug}-${Date.now()}`;
    }
    const tag = {
      id: this.state.meta.nextTagId++,
      name: normalizedName,
      slug,
    };
    this.state.tags.push(tag);
    this.save();
    return tag;
  }

  ensureTags(tagNames) {
    return (tagNames || []).map((name) => this.createTag(name));
  }

  getPosts() {
    return this.state.posts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPostById(id) {
    return this.state.posts.find((post) => post.id === Number(id));
  }

  createPost({ title, content, categoryId, tagIds = [], source = 'admin' }) {
    const normalizedTitle = String(title || '').trim();
    const normalizedContent = String(content || '').trim();
    if (!normalizedTitle) {
      throw new Error('Title is required');
    }
    if (!normalizedContent) {
      throw new Error('Content is required');
    }
    const category = this.getCategoryById(categoryId) || this.getCategoryBySlug(DEFAULT_CATEGORY.slug);
    const uniqueTagIds = Array.from(new Set(tagIds.map((id) => Number(id)))).filter(Boolean);
    const now = new Date().toISOString();
    const post = {
      id: this.state.meta.nextPostId++,
      title: normalizedTitle,
      content: normalizedContent,
      categoryId: category ? category.id : null,
      tagIds: uniqueTagIds,
      createdAt: now,
      updatedAt: now,
      source,
    };
    this.state.posts.push(post);
    this.save();
    return post;
  }

  updatePostTags(postId, tagIds) {
    const post = this.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    post.tagIds = Array.from(new Set((tagIds || []).map((id) => Number(id)))).filter(Boolean);
    post.updatedAt = new Date().toISOString();
    this.save();
    return post;
  }

  getPostsByCategorySlug(slug) {
    const category = this.getCategoryBySlug(slug);
    if (!category) {
      return [];
    }
    return this.getPosts().filter((post) => post.categoryId === category.id);
  }

  getPostsByTagSlug(slug) {
    const tag = this.getTagBySlug(slug);
    if (!tag) {
      return [];
    }
    return this.getPosts().filter((post) => post.tagIds.includes(tag.id));
  }

  getPostTags(post) {
    return (post.tagIds || []).map((id) => this.getTagById(id)).filter(Boolean);
  }
}

module.exports = {
  Storage,
  DEFAULT_CATEGORY,
};
