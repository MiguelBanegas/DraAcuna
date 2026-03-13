import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PacientesProvider, usePacientes } from '../PacientesContext';
import * as pacientesService from '../../services/pacientesService';

vi.mock('../../services/pacientesService', () => ({
  getAllPacientes: vi.fn(),
  createPaciente: vi.fn(),
  updatePaciente: vi.fn(),
  deletePaciente: vi.fn(),
}));

describe('PacientesContext', () => {
  const wrapper = ({ children }) => <PacientesProvider>{children}</PacientesProvider>;
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('buscarPacientes es independiente del orden y de tildes', async () => {
    const mockData = [
      { id: 1, nombreCompleto: 'José Hernández', dni: '12345678' },
      { id: 2, nombreCompleto: 'Maria Lopez', dni: '87654321' },
    ];
    pacientesService.getAllPacientes.mockResolvedValue(mockData);

    const { result } = renderHook(() => usePacientes(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const porOrden = result.current.buscarPacientes('hernandez jose');
    const porTilde = result.current.buscarPacientes('Jose');
    const porDni = result.current.buscarPacientes('8765');

    expect(porOrden).toEqual([mockData[0]]);
    expect(porTilde).toEqual([mockData[0]]);
    expect(porDni).toEqual([mockData[1]]);
  });
});
