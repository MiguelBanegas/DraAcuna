import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearFeriadosCache,
  getFeriadoByDate,
  getFeriadosByYear,
  getFeriadosMapByYears,
} from '../feriadosService';

describe('feriadosService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    clearFeriadosCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cachea los feriados por año y evita fetch duplicado', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [{ fecha: '2026-01-01', nombre: 'Año nuevo', tipo: 'inamovible' }],
    });

    const firstCall = await getFeriadosByYear(2026);
    const secondCall = await getFeriadosByYear(2026);

    expect(firstCall).toHaveLength(1);
    expect(secondCall).toEqual(firstCall);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('combina años visibles y permite buscar un feriado por fecha', async () => {
    fetch.mockImplementation(async (url) => ({
      ok: true,
      json: async () => (
        url.includes('/2025')
          ? [{ fecha: '2025-12-08', nombre: 'Inmaculada Concepción de María', tipo: 'inamovible' }]
          : [{ fecha: '2026-01-01', nombre: 'Año nuevo', tipo: 'inamovible' }]
      ),
    }));

    const feriadosMap = await getFeriadosMapByYears([2025, 2026, 2026]);
    const feriado = await getFeriadoByDate('2026-01-01');

    expect(feriadosMap.get('2025-12-08')?.nombre).toBe('Inmaculada Concepción de María');
    expect(feriado?.nombre).toBe('Año nuevo');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
