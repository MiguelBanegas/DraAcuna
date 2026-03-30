import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Swal from 'sweetalert2';
import Usuarios from '../Usuarios';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('Usuarios', () => {
  const getUsers = vi.fn();
  const createUser = vi.fn();
  const adminResetUserCredentials = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      isAdmin: () => true,
      getUsers,
      createUser,
      adminResetUserCredentials,
    });
    getUsers.mockResolvedValue({
      success: true,
      users: [
        {
          id: 1,
          nombre: 'Dra. Ana Acuña',
          username: 'draana',
          email: 'ana@example.com',
          rol: 'admin',
        },
      ],
    });
    Swal.fire.mockResolvedValue({});
  });

  it('crea un usuario nuevo', async () => {
    createUser.mockResolvedValue({
      success: true,
      user: { id: 2, nombre: 'Secretaria', username: 'secretaria' },
    });

    const { container } = render(<Usuarios />);

    await screen.findByText('Dra. Ana Acuña');

    fireEvent.change(container.querySelector('input[name="nombre"]'), {
      target: { value: 'Secretaria' },
    });
    fireEvent.change(container.querySelector('input[name="username"]'), {
      target: { value: 'secretaria' },
    });
    fireEvent.change(container.querySelector('input[name="password"]'), {
      target: { value: 'temporal123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Crear usuario/i }));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith({
        nombre: 'Secretaria',
        username: 'secretaria',
        email: '',
        rol: 'admin',
        password: 'temporal123',
      });
    });
  }, 20000);

  it('restablece las credenciales de un usuario', async () => {
    adminResetUserCredentials.mockResolvedValue({
      success: true,
      user: { id: 1, nombre: 'Dra. Ana Acuña', username: 'draana2' },
    });

    const { container } = render(<Usuarios />);

    await screen.findByText('Dra. Ana Acuña');

    fireEvent.change(container.querySelectorAll('select')[1], {
      target: { value: '1' },
    });
    fireEvent.change(container.querySelector('input[name="resetUsername"]'), {
      target: { value: 'draana2' },
    });
    fireEvent.change(container.querySelector('input[name="resetPassword"]'), {
      target: { value: 'nueva123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Restablecer credenciales/i }));

    await waitFor(() => {
      expect(adminResetUserCredentials).toHaveBeenCalledWith({
        userId: '1',
        username: 'draana2',
        password: 'nueva123',
      });
    });
  }, 20000);
});
