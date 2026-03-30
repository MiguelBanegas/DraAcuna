import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Swal from 'sweetalert2';
import TurnoForm from '../TurnoForm';
import { useTurnos } from '../../../context/TurnosContext';
import { usePacientes } from '../../../context/PacientesContext';

const mockNavigate = vi.fn();
const mockParams = { id: undefined };
const mockLocation = { state: null };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  useLocation: () => mockLocation,
}));

vi.mock('../../../context/TurnosContext', () => ({
  useTurnos: vi.fn(),
}));

vi.mock('../../../context/PacientesContext', () => ({
  usePacientes: vi.fn(),
}));

vi.mock('../../../services/pacientesService', () => ({
  searchPacientes: vi.fn().mockResolvedValue([]),
  getPacienteById: vi.fn(),
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
  isLoading: vi.fn(() => false),
  showValidationMessage: vi.fn(),
}));

vi.mock('react-select/async', () => ({
  default: ({ onChange, placeholder, isDisabled }) => (
    <div>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onChange({ value: 1, label: 'Juan Perez - DNI: 12345678' })}
      >
        Seleccionar paciente mock
      </button>
      <span>{placeholder}</span>
    </div>
  ),
}));

describe('TurnoForm', () => {
  const agregarTurno = vi.fn();
  const actualizarTurno = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePacientes.mockReturnValue({
      pacientes: [{ id: 1, nombreCompleto: 'Juan Perez', dni: '12345678', telefono: '11-1234-5678' }],
    });
    useTurnos.mockReturnValue({
      turnos: [],
      agregarTurno,
      actualizarTurno,
    });
    Swal.fire.mockResolvedValue({});
  });

  it('bloquea el envío repetido mientras guarda', async () => {
    let resolveTurno;
    agregarTurno.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveTurno = resolve;
        }),
    );

    render(<TurnoForm />);

    await waitFor(() => {
      const fechaInput = document.querySelector('input[name="fechaHora"]');
      expect(fechaInput).not.toBeNull();
      expect(fechaInput.value).not.toBe('');
    });

    fireEvent.click(screen.getByRole('button', { name: /Seleccionar paciente mock/i }));
    fireEvent.change(screen.getByPlaceholderText(/Control de rutina/i), {
      target: { value: 'Control general' },
    });

    const submitButton = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Guardando/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardando/i }));
    expect(agregarTurno).toHaveBeenCalledTimes(1);

    resolveTurno({ id: 1 });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/turnos');
    });
  }, 20000);
});
