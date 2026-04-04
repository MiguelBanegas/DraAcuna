import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PacienteForm from '../PacienteForm';
import { usePacientes } from '../../../context/PacientesContext';

const mockNavigate = vi.fn();
const mockParams = { id: '1' };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

vi.mock('../../../context/PacientesContext', () => ({
  usePacientes: vi.fn(),
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('PacienteForm', () => {
  let agregarPaciente;
  let actualizarPaciente;
  let resolveSubmit;

  beforeEach(() => {
    vi.clearAllMocks();
    resolveSubmit = undefined;
    agregarPaciente = vi.fn();
    actualizarPaciente = vi.fn();
    mockParams.id = '1';
    usePacientes.mockReturnValue({
      pacientes: [
        {
          id: 1,
          nombreCompleto: 'Ana Perez',
          dni: '12345678',
          fechaNacimiento: '1990-05-14T00:00:00.000Z',
          genero: 'Femenino',
          telefono: '11-1234-5678',
          email: 'ana@example.com',
          direccion: 'Calle 123',
          obraSocial: 'OSDE',
          numeroAfiliado: '999',
          fechaCreacion: '2026-03-03T10:00:00.000Z',
        },
      ],
      agregarPaciente,
      actualizarPaciente,
    });
  });

  it('precarga las fechas al editar un paciente', async () => {
    const { container } = render(<PacienteForm />);

    await waitFor(() => {
      const fechaNacimientoInput = container.querySelector('input[name="fechaNacimiento"]');
      expect(fechaNacimientoInput).toHaveValue('1990-05-14');

      const fechaRegistradaInput = container.querySelector('input[readonly]');
      expect(fechaRegistradaInput).not.toHaveValue('-');
      expect(fechaRegistradaInput.value).toContain('2026');
    });
  });

  it('detecta un DNI existente al salir del campo y muestra el nombre del paciente', async () => {
    mockParams.id = undefined;
    usePacientes.mockReturnValue({
      pacientes: [
        {
          id: 1,
          nombreCompleto: 'Ana Perez',
          dni: '12345678',
        },
      ],
      agregarPaciente,
      actualizarPaciente,
    });

    render(<PacienteForm />);

    const dniInput = document.querySelector('input[name="dni"]');
    fireEvent.change(dniInput, { target: { value: '12345678' } });
    fireEvent.blur(dniInput);

    expect(await screen.findByText('Ya existe un paciente registrado con ese DNI')).toBeInTheDocument();
    expect(screen.getByText(/Ya existe el paciente:/i)).toBeInTheDocument();
    expect(screen.getByText('Ana Perez')).toBeInTheDocument();
  });

  it('bloquea envíos repetidos mientras el paciente se está guardando', async () => {
    mockParams.id = undefined;
    agregarPaciente.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    usePacientes.mockReturnValue({
      pacientes: [],
      agregarPaciente,
      actualizarPaciente,
    });

    render(<PacienteForm />);

    fireEvent.change(document.querySelector('input[name="nombreCompleto"]'), {
      target: { value: 'Juan Perez' },
    });
    fireEvent.change(document.querySelector('input[name="dni"]'), {
      target: { value: '12345678' },
    });
    fireEvent.change(document.querySelector('input[name="fechaNacimiento"]'), {
      target: { value: '1990-05-14' },
    });
    fireEvent.change(document.querySelector('select[name="genero"]'), {
      target: { value: 'Masculino' },
    });
    fireEvent.change(document.querySelector('input[name="telefono"]'), {
      target: { value: '11-1234-5678' },
    });
    fireEvent.change(document.querySelector('input[name="email"]'), {
      target: { value: 'juan@example.com' },
    });

    const submitButton = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Guardando/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardando/i }));
    expect(agregarPaciente).toHaveBeenCalledTimes(1);

    resolveSubmit({ id: 2 });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pacientes');
    });
  }, 30000);
});
