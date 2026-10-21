import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AddBugModal from './AddBugModal';
import { AppContext, type AppContextValue } from '../context/AppContext';
import { NotificationContext } from '../context/NotificationContext';
import { httpError } from '../test/httpError';
import { appValue } from '../test/fixtures';

function renderModal(addBug: AppContextValue['addBug']) {
  const onClose = vi.fn();
  const notify = vi.fn();
  render(
    <NotificationContext.Provider value={{ notify }}>
      <AppContext.Provider value={appValue({ addBug })}>
        <AddBugModal projectId={7} onClose={onClose} />
      </AppContext.Provider>
    </NotificationContext.Provider>
  );
  return { onClose, notify };
}

describe('AddBugModal', () => {
  it('reports a bug with the chosen severity, priority and commit link', async () => {
    const addBug = vi.fn().mockResolvedValue(undefined);
    const { onClose, notify } = renderModal(addBug);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Title'), 'Login button does nothing');
    await user.selectOptions(screen.getByLabelText('Severity'), 'High');
    await user.selectOptions(screen.getByLabelText('Priority'), 'Medium');
    await user.type(screen.getByLabelText('Description'), 'Click Login, nothing happens.');
    await user.type(screen.getByLabelText('Related commit link (optional)'), 'https://github.com/a/b/commit/1');
    await user.click(screen.getByRole('button', { name: 'Send bug report' }));

    expect(addBug).toHaveBeenCalledWith({
      title: 'Login button does nothing',
      projectId: 7,
      severity: 'High',
      priority: 'Medium',
      description: 'Click Login, nothing happens.',
      commitLink: 'https://github.com/a/b/commit/1',
    });
    expect(notify).toHaveBeenCalledWith('Bug reported. Thank you!');
    expect(onClose).toHaveBeenCalled();
  });

  it('uses Low severity and priority by default', async () => {
    const addBug = vi.fn().mockResolvedValue(undefined);
    renderModal(addBug);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Title'), 'Typo on home page');
    await user.type(screen.getByLabelText('Description'), 'Says "New projcet".');
    await user.click(screen.getByRole('button', { name: 'Send bug report' }));

    expect(addBug).toHaveBeenCalledWith(expect.objectContaining({ severity: 'Low', priority: 'Low' }));
  });

  it('keeps the modal open and shows the reason when reporting fails', async () => {
    const addBug = vi.fn().mockRejectedValue(
      httpError(400, 'Commit link must be an https:// link to GitHub, GitLab or Bitbucket.')
    );
    const { onClose, notify } = renderModal(addBug);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Title'), 'Crash');
    await user.type(screen.getByLabelText('Description'), 'App crashes on save.');
    await user.type(screen.getByLabelText('Related commit link (optional)'), 'https://example.com/x');
    await user.click(screen.getByRole('button', { name: 'Send bug report' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Commit link must be an https:// link');
    expect(notify).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not submit without a title and description', async () => {
    const addBug = vi.fn();
    renderModal(addBug);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Send bug report' }));

    expect(addBug).not.toHaveBeenCalled();
  });
});
