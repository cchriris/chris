import fs from 'fs/promises';
import path from 'path';
import { slugify } from './slugify';
import { normalizeTagNames } from './tags';

const DATA_FILE = path.join(process.cwd(), 'data', 'storage.json');
const DEFAULT_CATEGORY = {
  name: '未分类',
  slug: 'uncategorized',
  keywords: [],
};

const clone = (value) =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const INITIAL_DATA = {
  categories: [{ id: 1, ...DEFAULT_CATEGORY }],
  tags: [],
  posts: [],
  meta: {
    nextCategoryId: 2,
    nextTagId: 1,
    nextPostId: 1,
  },
};

let writeQueue = Promise.resolve();

async function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
  }
}

function normalizeData(data) {
  if (!data || typeof data !== 'object') {
    return clone(INITIAL_DATA);
  }
  const normalized = {
    categories: Array.isArray(data.categories) ? data.categories.slice() : [],
    tags: Array.isArray(data.tags) ? data.tags.slice() : [],
    posts: Array.isArray(data.posts) ? data.posts.slice() : [],
    meta: { ...INITIAL_DATA.meta, ...(data.meta || {}) },
  };
  ensureDefaultCategory(normalized);
  return normalized;
}

async function readData() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  if (!raw) {
    return clone(INITIAL_DATA);
  }
  try {
    const parsed = JSON.parse(raw);
    return normalizeData(parsed);
  } catch {
    return clone(INITIAL_DATA);
  }
}

function ensureDefaultCategory(data) {
  let category = data.categories.find((item) => item.slug === DEFAULT_CATEGORY.slug);
  if (!category) {
    category = {
      id: data.meta.nextCategoryId++,
      ...DEFAULT_CATEGORY,
    };
    data.categories.push(category);
  }
  return category;
}

function ensureTag(data, name) {
  const lookup = String(name || '').trim();
  if (!lookup) return null;
  const existing = data.tags.find((tag) => tag.name.toLowerCase() === lookup.toLowerCase());
  if (existing) {
    return existing;
  }
  let slug = slugify(lookup);
  if (!slug) {
    slug = `tag-${data.meta.nextTagId}`;
  }
  while (data.tags.some((tag) => tag.slug === slug)) {
    slug = `${slug}-${data.meta.nextTagId}`;
  }
  const tag = {
    id: data.meta.nextTagId++,
    name: lookup,
    slug,
  };
  data.tags.push(tag);
  return tag;
}

function ensureTags(data, names) {
  return names
    .map((name) => ensureTag(data, name))
    .filter((tag, index, arr) => Boolean(tag) && arr.findIndex((item) => item.id === tag.id) === index);
}

function determineCategoryForContentInternal(data, tagNames, content) {
  const normalizedTags = tagNames.map((tag) => tag.toLowerCase());
  const normalizedContent = String(content || '').toLowerCase();

  for (const tag of normalizedTags) {
    const bySlug = data.categories.find((category) => category.slug === slugify(tag));
    if (bySlug) {
      return bySlug;
    }
  }

  for (const category of data.categories) {
    const normalizedName = slugify(category.name);
    if (normalizedTags.includes(normalizedName)) {
      return category;
    }
  }

  for (const category of data.categories) {
    const keywords = Array.isArray(category.keywords) ? category.keywords : [];
    if (keywords.some((keyword) => normalizedTags.includes(keyword.toLowerCase()))) {
      return category;
    }
    if (keywords.some((keyword) => normalizedContent.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return ensureDefaultCategory(data);
}

function normalizeKeywords(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean);
  }
  return String(value)
    .replace(/，/g, ',')
    .split(/[\,\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function createPostRecord(data, { title, content, categoryId, tagIds, source }) {
  const normalizedTitle = String(title || '').trim();
  const normalizedContent = String(content || '').trim();
  if (!normalizedTitle) {
    throw new Error('Title is required');
  }
  if (!normalizedContent) {
    throw new Error('Content is required');
  }
  const category = categoryId
    ? data.categories.find((item) => item.id === Number(categoryId)) || ensureDefaultCategory(data)
    : ensureDefaultCategory(data);
  const uniqueTagIds = Array.from(new Set((tagIds || []).map((id) => Number(id)).filter(Boolean)));
  const now = new Date().toISOString();
  const post = {
    id: data.meta.nextPostId++,
    title: normalizedTitle,
    content: normalizedContent,
    categoryId: category ? category.id : null,
    tagIds: uniqueTagIds,
    createdAt: now,
    updatedAt: now,
    source: source || 'admin',
  };
  data.posts.push(post);
  return post;
}

export function createPost({
  title,
  content,
  categoryId,
  tagNames = [],
  source = 'admin',
  autoClassify = false,
}) {
  const normalizedTags = normalizeTagNames(tagNames);
  return queueWrite(async () => {
    const data = await readData();
    const tags = ensureTags(data, normalizedTags);
    const category = autoClassify
      ? determineCategoryForContentInternal(data, normalizedTags, content)
      : categoryId
      ? data.categories.find((item) => item.id === Number(categoryId)) || ensureDefaultCategory(data)
      : ensureDefaultCategory(data);
    const post = createPostRecord(data, {
      title,
      content,
      categoryId: category ? category.id : undefined,
      tagIds: tags.map((tag) => tag.id),
      source,
    });
    await writeData(data);
    return { post, category, tags };
  });
}

function queueWrite(task) {
  const operation = writeQueue.then(() => task());
  writeQueue = operation.catch(() => {});
  return operation;
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function getCategories() {
  const data = await readData();
  return data.categories.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

export function createCategory({ name, slug, keywords = [] }) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    throw new Error('Category name is required');
  }
  return queueWrite(async () => {
    const data = await readData();
    let finalSlug = slug ? slugify(slug) : slugify(normalizedName);
    if (!finalSlug) {
      finalSlug = `category-${data.meta.nextCategoryId}`;
    }
    while (data.categories.some((category) => category.slug === finalSlug)) {
      finalSlug = `${finalSlug}-${data.meta.nextCategoryId}`;
    }
    const category = {
      id: data.meta.nextCategoryId++,
      name: normalizedName,
      slug: finalSlug,
      keywords: normalizeKeywords(keywords),
    };
    data.categories.push(category);
    await writeData(data);
    return category;
  });
}

export function updateCategoryKeywords(id, keywords) {
  return queueWrite(async () => {
    const data = await readData();
    const category = data.categories.find((item) => item.id === Number(id));
    if (!category) {
      throw new Error('Category not found');
    }
    category.keywords = normalizeKeywords(keywords);
    await writeData(data);
    return category;
  });
}

export async function getPostsWithRelations() {
  const data = await readData();
  const categoriesById = new Map(data.categories.map((category) => [category.id, category]));
  const tagsById = new Map(data.tags.map((tag) => [tag.id, tag]));
  return data.posts
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((post) => ({
      ...post,
      category: categoriesById.get(post.categoryId) || null,
      tags: (post.tagIds || []).map((id) => tagsById.get(id)).filter(Boolean),
    }));
}

export async function getPostWithRelations(id) {
  const data = await readData();
  const post = data.posts.find((item) => item.id === Number(id));
  if (!post) return null;
  const category = data.categories.find((item) => item.id === post.categoryId) || null;
  const tags = (post.tagIds || [])
    .map((tagId) => data.tags.find((tag) => tag.id === tagId))
    .filter(Boolean);
  return { ...post, category, tags };
}

export async function getCategoryWithPosts(slug) {
  const data = await readData();
  const category = data.categories.find((item) => item.slug === slug);
  if (!category) return null;
  const tagsById = new Map(data.tags.map((tag) => [tag.id, tag]));
  const posts = data.posts
    .filter((post) => post.categoryId === category.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((post) => ({
      ...post,
      category,
      tags: (post.tagIds || []).map((id) => tagsById.get(id)).filter(Boolean),
    }));
  return { category, posts };
}

export async function getTagWithPosts(slug) {
  const data = await readData();
  const tag = data.tags.find((item) => item.slug === slug);
  if (!tag) return null;
  const categoriesById = new Map(data.categories.map((category) => [category.id, category]));
  const posts = data.posts
    .filter((post) => Array.isArray(post.tagIds) && post.tagIds.includes(tag.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((post) => ({
      ...post,
      category: categoriesById.get(post.categoryId) || null,
      tags: (post.tagIds || []).map((id) => data.tags.find((item) => item.id === id)).filter(Boolean),
    }));
  return { tag, posts };
}

export async function getTags() {
  const data = await readData();
  return data.tags.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

export async function getOverview() {
  const [posts, categories, tags] = await Promise.all([
    getPostsWithRelations(),
    getCategories(),
    getTags(),
  ]);
  return { posts, categories, tags };
}

