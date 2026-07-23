export const buildRefreshUrl = (url = window.location.href) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('_t', String(Date.now()));
    parsed.searchParams.set('refresh', '1');
    return parsed.toString();
  } catch {
    return `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}&refresh=1`;
  }
};

export const hardRefreshPage = () => {
  const refreshedUrl = buildRefreshUrl();
  window.setTimeout(() => {
    window.location.assign(refreshedUrl);
  }, 250);
};
