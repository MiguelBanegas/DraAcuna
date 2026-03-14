import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Swal from 'sweetalert2';
import ConsultasList from '../ConsultasList';
import { useConsultas } from '../../../context/ConsultasContext';
import { usePacientes } from '../../../context/PacientesContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../context/ConsultasContext', () => ({
  useConsultas: vi.fn(),
}));

vi.mock('../../../context/PacientesContext', () => ({
  usePacientes: vi.fn(),
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('ConsultasList', () => {
  const buscarConsultas = vi.fn().mockResolvedValue(undefined);
  const eliminarConsulta = vi.fn().mockResolvedValue(undefined);

  const pacientes = [
    { id: 1, nombreCompleto: 'Juan Perez', dni: '12345678' },
    { id: 2, nombreCompleto: 'Ana Gomez', dni: '87654321' },
  ];

  const consulta = {
    id: 10,
    pacienteId: 1,
    fechaHora: '2026-03-03T10:00:00.000Z',
    motivo: 'Control',
    diagnostico: 'Normal',
  };

  const waitDebounce = async (ms = 350) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useConsultas.mockReturnValue({
      consultas: [],
      eliminarConsulta,
      buscarConsultas,
    });
    usePacientes.mockReturnValue({ pacientes });
    Swal.fire.mockResolvedValue({ isConfirmed: true });
  });

  it('muestra estado inicial vacio y fuerza limpieza de lista', async () => {
    render(<ConsultasList />);

    expect(
      screen.getByText(/Ingrese al menos 3 caracteres, seleccione un paciente o una fecha para buscar/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(buscarConsultas).toHaveBeenCalledWith({ q: '_____no_match_____' });
    });
  });

  it('solo busca por texto cuando hay al menos 3 caracteres', async () => {
    render(<ConsultasList />);

    await waitFor(() => expect(buscarConsultas).toHaveBeenCalledTimes(1));
    buscarConsultas.mockClear();

    const input = screen.getByPlaceholderText(/Buscar texto/i);
    fireEvent.change(input, { target: { value: 'ab' } });
    await waitDebounce();
    expect(buscarConsultas).not.toHaveBeenCalledWith({
      q: 'ab',
      pacienteId: '',
      fecha: '',
    });

    fireEvent.change(input, { target: { value: 'abc' } });
    await waitDebounce();

    await waitFor(() => {
      expect(buscarConsultas).toHaveBeenLastCalledWith({
        q: 'abc',
        pacienteId: '',
        fecha: '',
      });
    });
  });

  it('aplica filtros de paciente y fecha', async () => {
    render(<ConsultasList />);

    await waitFor(() => expect(buscarConsultas).toHaveBeenCalledTimes(1));
    buscarConsultas.mockClear();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText(/Filtrar por fecha/i), { target: { value: '2026-03-03' } });
    await waitDebounce();

    await waitFor(() => {
      expect(buscarConsultas).toHaveBeenLastCalledWith({
        q: '',
        pacienteId: '1',
        fecha: '2026-03-03',
      });
    });
  });

  it('limpia filtros y vuelve a forzar lista vacia', async () => {
    render(<ConsultasList />);

    await waitFor(() => expect(buscarConsultas).toHaveBeenCalledTimes(1));
    buscarConsultas.mockClear();

    fireEvent.change(screen.getByPlaceholderText(/Buscar texto/i), { target: { value: 'abc' } });
    await waitDebounce();
    await waitFor(() => expect(buscarConsultas).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    await waitFor(() => {
      expect(buscarConsultas).toHaveBeenLastCalledWith({ q: '_____no_match_____' });
    });
  });

  it('navega a nueva consulta y dispara acciones de fila', async () => {
    useConsultas.mockReturnValue({
      consultas: [consulta],
      eliminarConsulta,
      buscarConsultas,
    });

    render(<ConsultasList />);

    fireEvent.click(screen.getByRole('button', { name: /Nueva Consulta/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/consultas/nueva');

    fireEvent.click(screen.getByTitle('Ver detalle'));
    expect(mockNavigate).toHaveBeenCalledWith('/consultas/10');

    fireEvent.click(screen.getByTitle('Editar'));
    expect(mockNavigate).toHaveBeenCalledWith('/consultas/10/editar');

    fireEvent.click(screen.getByTitle('Eliminar'));

    await waitFor(() => {
      expect(eliminarConsulta).toHaveBeenCalledWith(10);
      expect(Swal.fire).toHaveBeenCalled();
    });
  });

  it('no elimina cuando el usuario cancela en confirmacion', async () => {
    Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
    useConsultas.mockReturnValue({
      consultas: [consulta],
      eliminarConsulta,
      buscarConsultas,
    });

    render(<ConsultasList />);
    fireEvent.click(screen.getByTitle('Eliminar'));

    await waitFor(() => {
      expect(eliminarConsulta).not.toHaveBeenCalled();
    });
  });

  it('muestra paciente no encontrado cuando no existe en el listado', () => {
    useConsultas.mockReturnValue({
      consultas: [{ ...consulta, pacienteId: 999 }],
      eliminarConsulta,
      buscarConsultas,
    });

    render(<ConsultasList />);

    expect(screen.getByText(/Paciente no encontrado/i)).toBeInTheDocument();
  });

  it('muestra alerta de error cuando falla la eliminacion', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    eliminarConsulta.mockRejectedValueOnce(new Error('delete failed'));
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    useConsultas.mockReturnValue({
      consultas: [consulta],
      eliminarConsulta,
      buscarConsultas,
    });

    render(<ConsultasList />);
    fireEvent.click(screen.getByTitle('Eliminar'));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudo eliminar la consulta', 'error');
    });

    consoleErrorSpy.mockRestore();
  });
});
