import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterModal from './RegisterModal';
import { api } from '../api/client';
import { httpError } from '../test/httpError';

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal()),
  api: { post: vi.fn() },
}));

async function fillAndSubmit({ role } = {}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Parolă'), 'Correct-Horse-Battery-42');
  if (role) await user.selectOptions(screen.getByLabelText('Rol'), role);
  await user.click(screen.getByRole('button', { name: 'Creează cont' }));
}

describe('RegisterModal', () => {
  beforeEach(() => {
    api.post.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('registers a tester by default, confirms and closes', async () => {
    api.post.mockResolvedValue({ status: 201, data: { id: 1 } });
    const onClose = vi.fn();
    render(<RegisterModal onClose={onClose} />);

    await fillAndSubmit();

    expect(api.post).toHaveBeenCalledWith('/users/register', {
      email: 'ana@example.com',
      password: 'Correct-Horse-Battery-42',
      role: 'TST',
    });
    expect(window.alert).toHaveBeenCalledWith('Cont creat cu succes! Acum te poți loga.');
    expect(onClose).toHaveBeenCalled();
  });

  it('sends the chosen role', async () => {
    api.post.mockResolvedValue({ status: 201, data: {} });
    render(<RegisterModal onClose={vi.fn()} />);

    await fillAndSubmit({ role: 'MP' });

    expect(api.post.mock.calls[0][1].role).toBe('MP');
  });

  it('says when the email is already used', async () => {
    api.post.mockRejectedValue(httpError(409, 'User with this email already exists.'));
    const onClose = vi.fn();
    render(<RegisterModal onClose={onClose} />);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Acest email este deja folosit.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the reason from the server, e.g. a weak password', async () => {
    api.post.mockRejectedValue(httpError(400, 'Password too weak.'));
    render(<RegisterModal onClose={vi.fn()} />);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Password too weak.');
    expect(window.alert).not.toHaveBeenCalled();
  });
});
