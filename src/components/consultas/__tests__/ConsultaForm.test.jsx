import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Swal from 'sweetalert2';
import ConsultaForm from '../ConsultaForm';
import { useConsultas } from '../../../context/ConsultasContext';
import { usePacientes } from '../../../context/PacientesContext';

const mockNavigate = vi.fn();
const mockParams = { id: undefined };
const mockLocation = { state: null };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  useLocation: () => mockLocation,
}));

vi.mock('../../../context/ConsultasContext', () => ({
  useConsultas: vi.fn(),
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
}));

vi.mock('react-select/async', () => ({
  default: ({ onChange, placeholder }) => (
    <div>
      <button
        type="button"
        onClick={() => onChange({ value: 1, label: 'Juan Perez - DNI: 12345678' })}
      >
        Seleccionar paciente mock
      </button>
      <span>{placeholder}</span>
    </div>
  ),
}));

describe('ConsultaForm', () => {
  const agregarConsulta = vi.fn();
  const actualizarConsulta = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.id = undefined;
    mockLocation.state = null;
    usePacientes.mockReturnValue({
      pacientes: [{ id: 1, nombreCompleto: 'Juan Perez', dni: '12345678', obraSocial: 'OSDE' }],
    });
    useConsultas.mockReturnValue({
      consultas: [],
      agregarConsulta,
      actualizarConsulta,
    });
    Swal.fire.mockResolvedValue({});
  });

  it('valida campos requeridos al enviar sin datos', async () => {
    render(<ConsultaForm />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    expect(await screen.findByText('Debe seleccionar un paciente')).toBeInTheDocument();
    expect(screen.getByText('El motivo de consulta es requerido')).toBeInTheDocument();
    expect(agregarConsulta).not.toHaveBeenCalled();
  });

  it('guarda una consulta nueva y navega al listado', async () => {
    agregarConsulta.mockResolvedValue({ id: 10 });
    render(<ConsultaForm />);
    await waitFor(() => {
      const fechaInput = document.querySelector('input[name="fechaHora"]');
      expect(fechaInput).not.toBeNull();
      expect(fechaInput.value).not.toBe('');
    });

    fireEvent.click(screen.getByRole('button', { name: /Seleccionar paciente mock/i }));
    fireEvent.change(screen.getByPlaceholderText(/Describa el motivo de la consulta/i), {
      target: { value: 'Dolor de cabeza' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(agregarConsulta).toHaveBeenCalledWith(
        expect.objectContaining({
          pacienteId: 1,
          motivo: 'Dolor de cabeza',
          fechaHora: expect.stringContaining('T'),
        }),
      );
    });

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '¡Guardado!',
        icon: 'success',
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/consultas');
  });

  it('muestra error si falla el guardado', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    agregarConsulta.mockRejectedValue(new Error('save failed'));
    render(<ConsultaForm />);
    await waitFor(() => {
      const fechaInput = document.querySelector('input[name="fechaHora"]');
      expect(fechaInput).not.toBeNull();
      expect(fechaInput.value).not.toBe('');
    });

    fireEvent.click(screen.getByRole('button', { name: /Seleccionar paciente mock/i }));
    fireEvent.change(screen.getByPlaceholderText(/Describa el motivo de la consulta/i), {
      target: { value: 'Dolor de cabeza' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudo guardar la consulta', 'error');
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/consultas');

    consoleErrorSpy.mockRestore();
  });
});
