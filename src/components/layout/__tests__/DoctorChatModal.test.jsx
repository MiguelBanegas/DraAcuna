import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DoctorChatModal from '../DoctorChatModal';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { nombre: 'Dra Acuna', rol: 'admin' },
  }),
}));

const enviarMensaje = vi.fn().mockResolvedValue('Respuesta mock');

vi.mock('../../../services/chatService', () => ({
  enviarMensaje: (...args) => enviarMensaje(...args),
}));

describe('DoctorChatModal', () => {
  it('mantiene el scroll en la ultima respuesta', async () => {
    render(<DoctorChatModal />);

    const mensajesBox = await screen.findByTestId('chat-mensajes');

    Object.defineProperty(mensajesBox, 'scrollHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(mensajesBox, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    });

    fireEvent.change(screen.getByPlaceholderText(/Escrib/i), {
      target: { value: 'Hola' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Enviar/i }));

    await waitFor(() =>
      expect(enviarMensaje).toHaveBeenCalledWith('Hola')
    );

    await waitFor(() => {
      expect(mensajesBox.scrollTop).toBe(500);
    });
  });
});
