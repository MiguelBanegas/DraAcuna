import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsultasProvider, useConsultas } from '../ConsultasContext';
import * as consultasService from '../../services/consultasService';

vi.mock('../../services/consultasService', () => ({
  getAllConsultas: vi.fn(),
  createConsulta: vi.fn(),
  updateConsulta: vi.fn(),
  deleteConsulta: vi.fn(),
  searchConsultas: vi.fn(),
  getConsultasByPaciente: vi.fn(),
}));

describe('ConsultasContext', () => {
  const wrapper = ({ children }) => <ConsultasProvider>{children}</ConsultasProvider>;
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('buscarConsultas actualiza estado y devuelve resultados', async () => {
    const mockData = [
      { id: 1, pacienteId: 11, motivo: 'Control' },
      { id: 2, pacienteId: 22, motivo: 'Seguimiento' },
    ];
    consultasService.searchConsultas.mockResolvedValue(mockData);

    const { result } = renderHook(() => useConsultas(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.buscarConsultas({ q: 'con' });
    });

    expect(consultasService.searchConsultas).toHaveBeenCalledWith({ q: 'con' });
    expect(response).toEqual(mockData);
    await waitFor(() => {
      expect(result.current.consultas).toEqual(mockData);
    });
  });

  it('buscarConsultas devuelve [] si el servicio falla', async () => {
    consultasService.searchConsultas.mockRejectedValue(new Error('fallo'));

    const { result } = renderHook(() => useConsultas(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.buscarConsultas({ q: 'con' });
    });

    expect(response).toEqual([]);
    expect(result.current.consultas).toEqual([]);
  });

  it('eliminarConsulta remueve el item del estado', async () => {
    const initial = [
      { id: 1, pacienteId: 11, motivo: 'Control' },
      { id: 2, pacienteId: 22, motivo: 'Seguimiento' },
    ];
    consultasService.searchConsultas.mockResolvedValue(initial);
    consultasService.deleteConsulta.mockResolvedValue(true);

    const { result } = renderHook(() => useConsultas(), { wrapper });

    await act(async () => {
      await result.current.buscarConsultas({ q: 'a' });
    });

    await act(async () => {
      await result.current.eliminarConsulta(1);
    });

    expect(consultasService.deleteConsulta).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(result.current.consultas).toEqual([{ id: 2, pacienteId: 22, motivo: 'Seguimiento' }]);
    });
  });

  it('eliminarConsulta propaga error del servicio', async () => {
    consultasService.deleteConsulta.mockRejectedValue(new Error('delete error'));

    const { result } = renderHook(() => useConsultas(), { wrapper });

    await expect(result.current.eliminarConsulta(99)).rejects.toThrow('delete error');
  });

  it('cargarConsultas carga datos y actualiza loading', async () => {
    const mockData = [{ id: 1, pacienteId: 1, motivo: 'Control' }];
    consultasService.getAllConsultas.mockResolvedValue(mockData);

    const { result } = renderHook(() => useConsultas(), { wrapper });

    await act(async () => {
      await result.current.cargarConsultas();
    });

    expect(consultasService.getAllConsultas).toHaveBeenCalledTimes(1);
    expect(result.current.consultas).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('cargarConsultas maneja error y mantiene loading en false', async () => {
    consultasService.getAllConsultas.mockRejectedValue(new Error('load failed'));

    const { result } = renderHook(() => useConsultas(), { wrapper });

    await act(async () => {
      await result.current.cargarConsultas();
    });

    expect(result.current.consultas).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('agregarConsulta inserta la nueva consulta al inicio', async () => {
    const consultaNueva = { id: 20, pacienteId: 1, motivo: 'Nueva' };
    const consultaVieja = { id: 10, pacienteId: 2, motivo: 'Vieja' };
    consultasService.searchConsultas.mockResolvedValue([consultaVieja]);
    consultasService.createConsulta.mockResolvedValue(consultaNueva);

    const { result } = renderHook(() => useConsultas(), { wrapper });

    await act(async () => {
      await result.current.buscarConsultas({ q: 'a' });
    });

    await act(async () => {
      await result.current.agregarConsulta({ motivo: 'Nueva' });
    });

    expect(result.current.consultas).toEqual([consultaNueva, consultaVieja]);
  });

  it('actualizarConsulta reemplaza la consulta en estado', async () => {
    const initial = [
      { id: 1, pacienteId: 11, motivo: 'Control' },
      { id: 2, pacienteId: 22, motivo: 'Seguimiento' },
    ];
    const updated = { id: 2, pacienteId: 22, motivo: 'Actualizada' };
    consultasService.searchConsultas.mockResolvedValue(initial);
    consultasService.updateConsulta.mockResolvedValue(updated);

    const { result } = renderHook(() => useConsultas(), { wrapper });

    await act(async () => {
      await result.current.buscarConsultas({ q: 'a' });
    });

    await act(async () => {
      await result.current.actualizarConsulta(2, { motivo: 'Actualizada' });
    });

    expect(result.current.consultas).toEqual([
      { id: 1, pacienteId: 11, motivo: 'Control' },
      updated,
    ]);
  });

  it('obtenerConsultasPorPaciente devuelve [] si falla', async () => {
    consultasService.getConsultasByPaciente.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useConsultas(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.obtenerConsultasPorPaciente(1);
    });

    expect(response).toEqual([]);
  });

  it('obtenerConsultasPorPaciente devuelve datos del servicio', async () => {
    const mockData = [{ id: 9, pacienteId: 1, motivo: 'Control' }];
    consultasService.getConsultasByPaciente.mockResolvedValue(mockData);

    const { result } = renderHook(() => useConsultas(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.obtenerConsultasPorPaciente(1);
    });

    expect(consultasService.getConsultasByPaciente).toHaveBeenCalledWith(1);
    expect(response).toEqual(mockData);
  });
});
