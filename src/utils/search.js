const normalizeSearchText = (text) => {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const tokenizeSearch = (text) => {
  const normalized = normalizeSearchText(text);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
};

const matchTokensInFields = (tokens, fields) => {
  if (!tokens.length) return true;
  const normalizedFields = fields.map((field) => normalizeSearchText(field));
  return tokens.every((token) =>
    normalizedFields.some((field) => field.includes(token))
  );
};

export { normalizeSearchText, tokenizeSearch, matchTokensInFields };
