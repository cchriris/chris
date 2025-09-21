const removeDiacritics = (str) => {
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
};

const slugify = (input) => {
  if (!input) {
    return '';
  }
  const value = removeDiacritics(String(input).trim().toLowerCase());
  return value
    .replace(/[^a-z0-9\u4e00-\u9fa5\s_-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-]+|[-]+$/g, '');
};

module.exports = {
  slugify,
};
