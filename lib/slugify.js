const DIACRITIC_REGEX = /[\u0300-\u036f]/g;

function removeDiacritics(value) {
  return value.normalize('NFKD').replace(DIACRITIC_REGEX, '');
}

export function slugify(input) {
  if (!input) {
    return '';
  }
  const value = removeDiacritics(String(input).trim().toLowerCase());
  return value
    .replace(/[^a-z0-9\u4e00-\u9fa5\s_-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-]+|[-]+$/g, '');
}
