import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConsultaDetalle from '../ConsultaDetalle';
import { useConsultas } from '../../../context/ConsultasContext';
import { usePacientes } from '../../../context/PacientesContext';

const mockNavigate = vi.fn();
const mockParams = { id: '10' };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

vi.mock('../../../context/ConsultasContext', () => ({
  useConsultas: vi.fn(),
}));

vi.mock('../../../context/PacientesContext', () => ({
  usePacientes: vi.fn(),
}));

describe('ConsultaDetalle', () => {
  const consulta = {
    id: 10,
    pacienteId: 1,
    fechaHora: '2026-03-03T10:00:00.000Z',
    fechaCreacion: '2026-03-03T10:00:00.000Z',
    motivo: 'Dolor de cabeza',
    diagnostico: 'Migraña',
    tratamiento: 'Reposo',
    observaciones: 'Control en 7 dias',
    signosVitales: {
      presionArterial: { sistolica: 120, diastolica: 80 },
      frecuenciaCardiaca: 72,
      temperatura: 36.5,
      peso: 70,
      talla: 170,
      imc: 24.2,
    },
  };

  const paciente = {
    id: 1,
    nombreCompleto: 'Juan Perez',
    dni: '12345678',
    obraSocial: 'OSDE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.id = '10';
    useConsultas.mockReturnValue({ consultas: [consulta] });
    usePacientes.mockReturnValue({ pacientes: [paciente] });
  });

  it('renderiza detalle de consulta y datos del paciente', async () => {
    render(<ConsultaDetalle />);

    expect(await screen.findByText('Detalle de Consulta')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Dolor de cabeza')).toBeInTheDocument();
    expect(screen.getByText('Migraña')).toBeInTheDocument();
    expect(screen.getByText('Reposo')).toBeInTheDocument();
    expect(screen.getByText('Control en 7 dias')).toBeInTheDocument();
  });

  it('muestra alerta cuando el paciente no existe', async () => {
    usePacientes.mockReturnValue({ pacientes: [] });
    render(<ConsultaDetalle />);

    expect(await screen.findByText(/Paciente no encontrado/i)).toBeInTheDocument();
  });

  it('redirecciona al listado cuando la consulta no existe', async () => {
    useConsultas.mockReturnValue({ consultas: [] });
    render(<ConsultaDetalle />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/consultas');
    });
  });

  it('permite navegar con botones principales', async () => {
    render(<ConsultaDetalle />);
    await screen.findByText('Detalle de Consulta');

    fireEvent.click(screen.getByRole('button', { name: /Volver a Consultas/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/consultas');

    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/consultas/10/editar');

    fireEvent.click(screen.getByRole('button', { name: /Ver Historial del Paciente/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/pacientes/1');
  });
});
