export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('zh-CN', { hour12: false });
}
