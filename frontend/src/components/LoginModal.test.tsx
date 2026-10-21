import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginModal from './LoginModal';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api/client';
import { httpError, networkError } from '../test/httpError';
import { authValue, makeUser, okResponse } from '../test/fixtures';

// Replace the real HTTP client: the tests decide what the "server" answers
vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  api: { post: vi.fn() },
}));
const post = vi.mocked(api.post);

function renderLogin() {
  const loginUser = vi.fn();
  const onClose = vi.fn();
  render(
    <AuthContext.Provider value={authValue({ loginUser })}>
      <LoginModal onClose={onClose} />
    </AuthContext.Provider>
  );
  return { loginUser, onClose };
}

async function fillAndSubmit(email = 'ana@example.com', password = 'secret-password') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginModal', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('logs the user in and closes the modal', async () => {
    const userData = makeUser({ email: 'ana@example.com' });
    post.mockResolvedValue(okResponse(userData));
    const { loginUser, onClose } = renderLogin();

    await fillAndSubmit();

    expect(post).toHaveBeenCalledWith('/users/login', { email: 'ana@example.com', password: 'secret-password' });
    expect(loginUser).toHaveBeenCalledWith(userData);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error for a wrong email or password and stays open', async () => {
    post.mockRejectedValue(httpError(401, 'Invalid email or password.'));
    const { loginUser, onClose } = renderLogin();

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
    expect(loginUser).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the message from the server for other errors (e.g. too many attempts)', async () => {
    post.mockRejectedValue(httpError(429, 'Too many login attempts. Please try again in 15 minutes.'));
    renderLogin();

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many login attempts');
  });

  it('shows a fallback message when the server cannot be reached', async () => {
    post.mockRejectedValue(networkError());
    renderLogin();

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not log in. Please try again.');
  });

  it('does not send the form while fields are empty', async () => {
    renderLogin();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Log in' }));
    expect(post).not.toHaveBeenCalled();
  });

  it('closes when Cancel is clicked', async () => {
    const { onClose } = renderLogin();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
