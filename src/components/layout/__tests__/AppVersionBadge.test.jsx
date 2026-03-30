import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppVersionBadge from '../AppVersionBadge';

describe('AppVersionBadge', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.2.0' }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra la versión actual del sistema', async () => {
    render(<AppVersionBadge />);

    await waitFor(() => {
      expect(screen.getByText('Versión 1.2.0')).toBeInTheDocument();
    });
  });
});
