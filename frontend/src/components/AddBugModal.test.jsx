import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddBugModal from './AddBugModal';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';

function renderModal(addBug) {
  const onClose = vi.fn();
  render(
    <AuthContext.Provider value={{ user: { id: 2, email: 'tester@example.com', role: 'TST' } }}>
      <AppContext.Provider value={{ addBug }}>
        <AddBugModal projectId={7} onClose={onClose} />
      </AppContext.Provider>
    </AuthContext.Provider>
  );
  return { onClose };
}

describe('AddBugModal', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('reports a bug with the chosen severity and priority', async () => {
    const addBug = vi.fn().mockResolvedValue();
    const { onClose } = renderModal(addBug);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Titlu'), 'Login button does nothing');
    await user.selectOptions(screen.getByLabelText('Severitate'), 'High');
    await user.selectOptions(screen.getByLabelText('Prioritate'), 'Medium');
    await user.type(screen.getByLabelText('Descriere'), 'Click Login, nothing happens.');
    await user.type(screen.getByLabelText('Link commit asociat (opțional)'), 'https://github.com/a/b/commit/1');
    await user.click(screen.getByRole('button', { name: 'Trimite bug' }));

    expect(addBug).toHaveBeenCalledWith({
      title: 'Login button does nothing',
      projectId: 7,
      severity: 'High',
      priority: 'Medium',
      description: 'Click Login, nothing happens.',
      commitLink: 'https://github.com/a/b/commit/1',
    });
    expect(window.alert).toHaveBeenCalledWith('Bug raportat cu succes!');
    expect(onClose).toHaveBeenCalled();
  });

  it('uses Low severity and priority by default', async () => {
    const addBug = vi.fn().mockResolvedValue();
    renderModal(addBug);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Titlu'), 'Typo on home page');
    await user.type(screen.getByLabelText('Descriere'), 'Says "Adaugă proeict".');
    await user.click(screen.getByRole('button', { name: 'Trimite bug' }));

    expect(addBug).toHaveBeenCalledWith(expect.objectContaining({ severity: 'Low', priority: 'Low' }));
  });

  it('keeps the modal open and tells the user when reporting fails', async () => {
    const addBug = vi.fn().mockRejectedValue(new Error('Request failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onClose } = renderModal(addBug);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Titlu'), 'Crash');
    await user.type(screen.getByLabelText('Descriere'), 'App crashes on save.');
    await user.click(screen.getByRole('button', { name: 'Trimite bug' }));

    expect(window.alert).toHaveBeenCalledWith('Eroare la raportarea bug-ului. Încearcă din nou.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not submit without a title and description', async () => {
    const addBug = vi.fn();
    renderModal(addBug);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Trimite bug' }));

    expect(addBug).not.toHaveBeenCalled();
  });
});
