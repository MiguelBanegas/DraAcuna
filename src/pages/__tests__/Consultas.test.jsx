import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Consultas from '../Consultas';

vi.mock('../../components/consultas/ConsultasList', () => ({
  default: () => <div>Mock ConsultasList</div>,
}));

describe('Consultas page', () => {
  it('renders ConsultasList component', () => {
    render(<Consultas />);
    expect(screen.getByText('Mock ConsultasList')).toBeInTheDocument();
  });
});
