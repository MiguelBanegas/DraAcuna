import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Swal from 'sweetalert2';
import TurnosList from '../TurnosList';
import { useTurnos } from '../../../context/TurnosContext';
import { usePacientes } from '../../../context/PacientesContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../context/TurnosContext', () => ({
  useTurnos: vi.fn(),
}));

vi.mock('../../../context/PacientesContext', () => ({
  usePacientes: vi.fn(),
}));

vi.mock('../../layout/CalendarView', () => ({
  default: () => <div>Calendar mock</div>,
}));

vi.mock('../AgendaExcepcionesPanel', () => ({
  default: () => <div>Agenda exceptions mock</div>,
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
    isLoading: vi.fn(() => false),
    showValidationMessage: vi.fn(),
  },
}));

describe('TurnosList', () => {
  const eliminarTurno = vi.fn();
  const cambiarEstadoTurno = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePacientes.mockReturnValue({
      pacientes: [{ id: 1, nombreCompleto: 'Juan Perez', telefono: '11-1234-5678' }],
    });
    useTurnos.mockReturnValue({
      turnos: [
        {
          id: 10,
          pacienteId: 1,
          fechaHora: '2026-04-01T10:00:00.000Z',
          duracion: 30,
          estado: 'cancelado',
          motivo: 'Control',
        },
      ],
      eliminarTurno,
      cambiarEstadoTurno,
    });
  });

  it('pagina el listado en bloques de 10 y ordena desde el turno más reciente', async () => {
    useTurnos.mockReturnValue({
      turnos: Array.from({ length: 12 }, (_, index) => ({
        id: index + 1,
        pacienteId: 1,
        fechaHora: `2026-04-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
        duracion: 30,
        estado: 'pendiente',
        motivo: `Control ${index + 1}`,
      })),
      eliminarTurno,
      cambiarEstadoTurno,
    });

    render(<TurnosList />);

    expect(screen.getByText(/Mostrando 1 a 10 de 12/i)).toBeInTheDocument();
    expect(screen.getByText(/Control 12/i)).toBeInTheDocument();
    expect(screen.getByText(/Control 3/i)).toBeInTheDocument();
    expect(screen.queryByText(/Control 2/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('2'));

    await waitFor(() => {
      expect(screen.getByText(/Mostrando 11 a 12 de 12/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Control 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Control 1/i)).toBeInTheDocument();
  }, 20000);

  it('bloquea acciones mientras elimina un turno', async () => {
    let resolveDelete;
    eliminarTurno.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
    );

    Swal.fire
      .mockImplementationOnce(async (options) => {
        await options.preConfirm();
        return { isConfirmed: true };
      })
      .mockResolvedValueOnce({});

    render(<TurnosList />);

    const deleteButton = screen.getByTitle(/Eliminar/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTitle(/Eliminar/i)).toBeDisabled();
    });

    expect(screen.getByTitle(/Editar/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Nuevo Turno/i })).toBeDisabled();

    expect(eliminarTurno).toHaveBeenCalledTimes(1);

    resolveDelete(true);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledTimes(2);
    });
  }, 20000);
});
