export function parseTagInput(input) {
  if (!input) return [];
  return String(input)
    .replace(/，/g, ',')
    .split(/[\,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith('#') ? item.slice(1) : item));
}

export function normalizeTagNames(values) {
  const seen = new Set();
  const result = [];
  for (const value of values || []) {
    const raw = String(value || '').trim();
    if (!raw) continue;
    const cleaned = raw.startsWith('#') ? raw.slice(1) : raw;
    const key = cleaned.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}
