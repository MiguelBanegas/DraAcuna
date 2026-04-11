import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CalendarView from '../CalendarView';

vi.mock('../../../services/feriadosService', () => ({
  getFeriadosMapByYears: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock('../../../services/agendaExcepcionesService', () => ({
  getAgendaExcepciones: vi.fn().mockResolvedValue([]),
}));

vi.mock('../MiniCalendar', () => ({
  default: ({ year, month }) => <div>{`${month + 1}/${year}`}</div>,
}));

vi.mock('../TurnosDiaModal', () => ({
  default: () => null,
}));

describe('CalendarView', () => {
  it('muestra una ventana de tres meses y permite avanzar hasta tres meses adelante', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T12:00:00'));

    await act(async () => {
      render(<CalendarView />);
    });

    expect(screen.getByText('3/2026')).toBeInTheDocument();
    expect(screen.getByText('4/2026')).toBeInTheDocument();
    expect(screen.getByText('5/2026')).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /Ver meses siguientes/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(screen.queryByText('3/2026')).not.toBeInTheDocument();
    expect(screen.getByText('6/2026')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(screen.getByText('7/2026')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();

    const prevButton = screen.getByRole('button', { name: /Ver meses anteriores/i });
    await act(async () => {
      fireEvent.click(prevButton);
    });

    expect(screen.getByText('6/2026')).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();

    vi.useRealTimers();
  });

  it('resuelve bien el cruce de año cuando el mes actual es enero', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-11T12:00:00'));

    await act(async () => {
      render(<CalendarView />);
    });

    expect(screen.getByText('12/2025')).toBeInTheDocument();
    expect(screen.getByText('1/2026')).toBeInTheDocument();
    expect(screen.getByText('2/2026')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
