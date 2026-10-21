import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterModal from './RegisterModal';
import { NotificationContext } from '../context/NotificationContext';
import { api } from '../api/client';
import { httpError } from '../test/httpError';

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal()),
  api: { post: vi.fn() },
}));

function renderRegister() {
  const notify = vi.fn();
  const onClose = vi.fn();
  render(
    <NotificationContext.Provider value={{ notify }}>
      <RegisterModal onClose={onClose} />
    </NotificationContext.Provider>
  );
  return { notify, onClose };
}

async function fillAndSubmit({ role } = {}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Password'), 'Correct-Horse-Battery-42');
  if (role) await user.selectOptions(screen.getByLabelText('Role'), role);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterModal', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('registers a tester by default, confirms and closes', async () => {
    api.post.mockResolvedValue({ status: 201, data: { id: 1 } });
    const { notify, onClose } = renderRegister();

    await fillAndSubmit();

    expect(api.post).toHaveBeenCalledWith('/users/register', {
      email: 'ana@example.com',
      password: 'Correct-Horse-Battery-42',
      role: 'TST',
    });
    expect(notify).toHaveBeenCalledWith('Account created. You can now log in.');
    expect(onClose).toHaveBeenCalled();
  });

  it('sends the chosen role', async () => {
    api.post.mockResolvedValue({ status: 201, data: {} });
    renderRegister();

    await fillAndSubmit({ role: 'MP' });

    expect(api.post.mock.calls[0][1].role).toBe('MP');
  });

  it('says when the email is already used', async () => {
    api.post.mockRejectedValue(httpError(409, 'User with this email already exists.'));
    const { onClose } = renderRegister();

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('This email is already registered.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the reason from the server, e.g. a weak password', async () => {
    api.post.mockRejectedValue(httpError(400, 'Password too weak.'));
    const { notify } = renderRegister();

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Password too weak.');
    expect(notify).not.toHaveBeenCalled();
  });
});
