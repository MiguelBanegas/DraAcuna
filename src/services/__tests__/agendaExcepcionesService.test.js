import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAgendaExcepcion,
  deleteAgendaExcepcion,
  getAgendaExcepciones,
  updateAgendaExcepcion,
} from '../agendaExcepcionesService';

describe('agendaExcepcionesService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'token'),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mapea excepciones desde la API', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 1,
        fecha: '2026-07-14T03:00:00.000Z',
        tipo: 'vacaciones',
        motivo: 'Invierno',
        hora_inicio: null,
        hora_fin: null,
        bloquea_turnos: true,
      }],
    });

    const data = await getAgendaExcepciones('2026-07-01', '2026-07-31');

    expect(data[0]).toEqual({
      id: 1,
      fecha: '2026-07-14',
      tipo: 'vacaciones',
      motivo: 'Invierno',
      horaInicio: null,
      horaFin: null,
      bloqueaTurnos: true,
    });
  });

  it('crea, actualiza y elimina una excepción', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          fecha: '2026-08-10',
          tipo: 'cerrado',
          motivo: 'Descanso',
          hora_inicio: null,
          hora_fin: null,
          bloquea_turnos: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          fecha: '2026-08-10',
          tipo: 'horario_especial',
          motivo: 'Solo tarde',
          hora_inicio: '14:00:00',
          hora_fin: '18:00:00',
          bloquea_turnos: false,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'ok' }),
      });

    const created = await createAgendaExcepcion({
      fecha: '2026-08-10',
      tipo: 'cerrado',
      motivo: 'Descanso',
      horaInicio: '',
      horaFin: '',
      bloqueaTurnos: true,
    });

    const updated = await updateAgendaExcepcion(2, {
      fecha: '2026-08-10',
      tipo: 'horario_especial',
      motivo: 'Solo tarde',
      horaInicio: '14:00',
      horaFin: '18:00',
      bloqueaTurnos: false,
    });

    const deleted = await deleteAgendaExcepcion(2);

    expect(created.tipo).toBe('cerrado');
    expect(updated.horaInicio).toBe('14:00:00');
    expect(updated.bloqueaTurnos).toBe(false);
    expect(deleted.message).toBe('ok');
  });
});
