import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CalendarView from '../CalendarView';

vi.mock('../MiniCalendar', () => ({
  default: ({ year, month }) => <div>{`${month + 1}/${year}`}</div>,
}));

vi.mock('../TurnosDiaModal', () => ({
  default: () => null,
}));

describe('CalendarView', () => {
  it('muestra una ventana de tres meses y permite avanzar hasta tres meses adelante', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T12:00:00'));

    render(<CalendarView />);

    expect(screen.getByText('3/2026')).toBeInTheDocument();
    expect(screen.getByText('4/2026')).toBeInTheDocument();
    expect(screen.getByText('5/2026')).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /Ver meses siguientes/i });
    fireEvent.click(nextButton);

    expect(screen.queryByText('3/2026')).not.toBeInTheDocument();
    expect(screen.getByText('6/2026')).toBeInTheDocument();

    fireEvent.click(nextButton);

    expect(screen.getByText('7/2026')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();

    const prevButton = screen.getByRole('button', { name: /Ver meses anteriores/i });
    fireEvent.click(prevButton);

    expect(screen.getByText('6/2026')).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();

    vi.useRealTimers();
  });
});
