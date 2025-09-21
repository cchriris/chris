const HASH_TAG_REGEX = /#([\p{L}\p{N}_-]+)/gu;

export function extractHashtags(text) {
  if (!text) return [];
  const tags = new Set();
  const input = String(text);
  let match;
  while ((match = HASH_TAG_REGEX.exec(input)) !== null) {
    tags.add(match[1].toLowerCase());
  }
  return Array.from(tags);
}
