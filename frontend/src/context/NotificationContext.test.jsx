import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationProvider, useNotify } from './NotificationContext';

function Demo() {
  const notify = useNotify();
  return (
    <>
      <button onClick={() => notify('Bug reported.')}>success</button>
      <button onClick={() => notify('Could not join the project.', 'error')}>error</button>
    </>
  );
}

const renderDemo = () => render(<NotificationProvider><Demo /></NotificationProvider>);

describe('notifications', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a success message as a status and an error as an alert', async () => {
    renderDemo();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'success' }));
    await user.click(screen.getByRole('button', { name: 'error' }));

    expect(screen.getByRole('status')).toHaveTextContent('Bug reported.');
    expect(screen.getByRole('alert')).toHaveTextContent('Could not join the project.');
  });

  it('can be dismissed', async () => {
    renderDemo();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'success' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText('Bug reported.')).not.toBeInTheDocument();
  });

  it('disappears by itself after a few seconds', () => {
    vi.useFakeTimers();
    renderDemo();

    act(() => screen.getByRole('button', { name: 'success' }).click());
    expect(screen.getByText('Bug reported.')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText('Bug reported.')).not.toBeInTheDocument();
  });
});
