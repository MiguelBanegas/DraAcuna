import { describe, expect, it } from 'vitest';
import { buildRefreshUrl } from '../utils/browserRefresh';

describe('buildRefreshUrl', () => {
  it('adds a cache-busting timestamp to the current URL', () => {
    const url = 'https://localhost:5173/backups?tab=1#restore';
    const refreshed = buildRefreshUrl(url);

    expect(refreshed).toContain('/backups');
    expect(refreshed).toContain('_t=');
    expect(refreshed).toContain('tab=1');
    expect(refreshed).toContain('#restore');
  });
});
