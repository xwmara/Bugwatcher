import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterModal from './RegisterModal';
import { NotificationContext } from '../context/NotificationContext';
import { api } from '../api/client';
import { httpError } from '../test/httpError';
import { okResponse } from '../test/fixtures';

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  api: { post: vi.fn() },
}));
const post = vi.mocked(api.post);

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

async function fillAndSubmit({ role }: { role?: 'MP' | 'TST' } = {}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Password'), 'Correct-Horse-Battery-42');
  if (role) await user.selectOptions(screen.getByLabelText('Role'), role);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterModal', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('registers a tester by default, confirms and closes', async () => {
    post.mockResolvedValue(okResponse({ id: 1 }, 201));
    const { notify, onClose } = renderRegister();

    await fillAndSubmit();

    expect(post).toHaveBeenCalledWith('/users/register', {
      email: 'ana@example.com',
      password: 'Correct-Horse-Battery-42',
      role: 'TST',
    });
    expect(notify).toHaveBeenCalledWith('Account created. You can now log in.');
    expect(onClose).toHaveBeenCalled();
  });

  it('sends the chosen role', async () => {
    post.mockResolvedValue(okResponse({}, 201));
    renderRegister();

    await fillAndSubmit({ role: 'MP' });

    expect(post).toHaveBeenCalledWith('/users/register', expect.objectContaining({ role: 'MP' }));
  });

  it('says when the email is already used', async () => {
    post.mockRejectedValue(httpError(409, 'User with this email already exists.'));
    const { onClose } = renderRegister();

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('This email is already registered.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the reason from the server, e.g. a weak password', async () => {
    post.mockRejectedValue(httpError(400, 'Password too weak.'));
    const { notify } = renderRegister();

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Password too weak.');
    expect(notify).not.toHaveBeenCalled();
  });
});
