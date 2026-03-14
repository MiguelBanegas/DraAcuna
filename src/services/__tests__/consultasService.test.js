import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import API_URL from '../../utils/apiConfig';
import {
  createConsulta,
  deleteConsulta,
  getAllConsultas,
  getConsultasByPaciente,
  searchConsultas,
  updateConsulta,
} from '../consultasService';

describe('consultasService', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    global.fetch = vi.fn();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    localStorage.clear();
  });

  it('searchConsultas lanza error si no hay conexion (fetch rechaza)', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(searchConsultas({ q: 'abc' })).rejects.toThrow('Failed to fetch');
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/consultas/search?q=abc&`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('deleteConsulta lanza error si no hay conexion (fetch rechaza)', async () => {
    fetch.mockRejectedValue(new TypeError('NetworkError'));

    await expect(deleteConsulta(10)).rejects.toThrow('NetworkError');
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/consultas/10`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('searchConsultas lanza error cuando response.ok es false', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    await expect(searchConsultas({ q: 'abc' })).rejects.toThrow('Error al buscar consultas');
  });

  it('getAllConsultas mapea formato API a formato frontend', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 7,
          paciente_id: 12,
          paciente_nombre: 'Juan Perez',
          fecha_hora: '2026-03-03T10:00:00.000Z',
          motivo: 'Control',
          diagnostico: 'Normal',
          tratamiento: 'Reposo',
          observaciones: 'Sin novedades',
          proxima_consulta: '2026-03-10',
          signos_vitales: { fc: 70 },
          fecha_creacion: '2026-03-03T10:00:00.000Z',
        },
      ]),
    });

    const result = await getAllConsultas();

    expect(result).toEqual([
      {
        id: 7,
        pacienteId: 12,
        pacienteNombre: 'Juan Perez',
        fechaHora: '2026-03-03T10:00:00.000Z',
        motivo: 'Control',
        diagnostico: 'Normal',
        tratamiento: 'Reposo',
        observaciones: 'Sin novedades',
        proximaConsulta: '2026-03-10',
        signosVitales: { fc: 70 },
        fechaCreacion: '2026-03-03T10:00:00.000Z',
      },
    ]);
  });

  it('getConsultasByPaciente usa endpoint correcto y mapea respuesta', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 5,
          paciente_id: 99,
          paciente_nombre: 'Ana Gomez',
          fecha_hora: '2026-03-05T11:00:00.000Z',
          motivo: 'Control',
          diagnostico: '',
          tratamiento: '',
          observaciones: '',
          proxima_consulta: '',
          signos_vitales: {},
          fecha_creacion: '2026-03-05T11:00:00.000Z',
        },
      ]),
    });

    const result = await getConsultasByPaciente(99);

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/consultas/paciente/99`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result[0].pacienteId).toBe(99);
  });

  it('createConsulta envía payload mapeado y devuelve entidad mapeada', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 8,
        paciente_id: 1,
        paciente_nombre: 'Juan Perez',
        fecha_hora: '2026-03-03T10:00:00.000Z',
        motivo: 'Dolor',
        diagnostico: 'Migraña',
        tratamiento: 'Reposo',
        observaciones: '',
        proxima_consulta: '',
        signos_vitales: { temperatura: '36.5' },
        fecha_creacion: '2026-03-03T10:00:00.000Z',
      }),
    });

    const payload = {
      pacienteId: 1,
      fechaHora: '2026-03-03T10:00:00.000Z',
      motivo: 'Dolor',
      diagnostico: 'Migraña',
      tratamiento: 'Reposo',
      observaciones: '',
      proximaConsulta: '',
      signosVitales: { temperatura: '36.5' },
    };

    const result = await createConsulta(payload);
    const fetchArgs = fetch.mock.calls[0];
    const sentBody = JSON.parse(fetchArgs[1].body);

    expect(fetchArgs[0]).toBe(`${API_URL}/consultas`);
    expect(fetchArgs[1].method).toBe('POST');
    expect(sentBody).toEqual({
      paciente_id: 1,
      fecha_hora: '2026-03-03T10:00:00.000Z',
      motivo: 'Dolor',
      diagnostico: 'Migraña',
      tratamiento: 'Reposo',
      observaciones: '',
      proxima_consulta: '',
      signos_vitales: { temperatura: '36.5' },
    });
    expect(result.pacienteId).toBe(1);
    expect(result.motivo).toBe('Dolor');
  });

  it('updateConsulta usa metodo PUT y ruta con id', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 22,
        paciente_id: 2,
        paciente_nombre: 'Ana Gomez',
        fecha_hora: '2026-03-03T10:00:00.000Z',
        motivo: 'Control actualizado',
        diagnostico: '',
        tratamiento: '',
        observaciones: '',
        proxima_consulta: '',
        signos_vitales: {},
        fecha_creacion: '2026-03-03T10:00:00.000Z',
      }),
    });

    const result = await updateConsulta(22, {
      pacienteId: 2,
      fechaHora: '2026-03-03T10:00:00.000Z',
      motivo: 'Control actualizado',
      diagnostico: '',
      tratamiento: '',
      observaciones: '',
      proximaConsulta: '',
      signosVitales: {},
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/consultas/22`,
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(result.id).toBe(22);
    expect(result.motivo).toBe('Control actualizado');
  });
});
