import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Swal from 'sweetalert2';
import Cuenta from '../Cuenta';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('Cuenta', () => {
  const updateCredentials = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'draana',
        nombre: 'Dra. Ana Acuña',
      },
      updateCredentials,
    });
    Swal.fire.mockResolvedValue({});
  });

  it('valida confirmación de contraseña', async () => {
    render(<Cuenta />);

    fireEvent.change(screen.getByPlaceholderText(/Ingrese su contraseña actual/i), {
      target: { value: 'actual123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese una nueva contraseña/i), {
      target: { value: 'nueva123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Repita la nueva contraseña/i), {
      target: { value: 'otra123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    expect(await screen.findByText(/La confirmación no coincide/i)).toBeInTheDocument();
    expect(updateCredentials).not.toHaveBeenCalled();
  }, 20000);

  it('envía el cambio de credenciales y resetea el formulario sensible', async () => {
    updateCredentials.mockResolvedValue({
      success: true,
      user: {
        id: 1,
        username: 'ana.acuna',
        nombre: 'Dra. Ana Acuña',
      },
    });

    render(<Cuenta />);

    fireEvent.change(screen.getByPlaceholderText(/Ingrese el nuevo nombre de usuario/i), {
      target: { value: 'ana.acuna' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese su contraseña actual/i), {
      target: { value: 'actual123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ingrese una nueva contraseña/i), {
      target: { value: 'nueva123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Repita la nueva contraseña/i), {
      target: { value: 'nueva123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(updateCredentials).toHaveBeenCalledWith({
        currentPassword: 'actual123',
        newUsername: 'ana.acuna',
        newPassword: 'nueva123',
      });
    });

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Credenciales actualizadas',
        icon: 'success',
      }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ingrese su contraseña actual/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/Repita la nueva contraseña/i)).toHaveValue('');
    });
  }, 20000);
});
