import { render, waitFor } from '@testing-library/react';
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
  beforeEach(() => {
    vi.clearAllMocks();
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
      agregarPaciente: vi.fn(),
      actualizarPaciente: vi.fn(),
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
});
