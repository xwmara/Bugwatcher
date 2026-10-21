import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import BugListForMP from './BugListForMP';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import type { Bug } from '../types';
import { appValue, authValue, makeBug, makeProject, makeUser } from '../test/fixtures';

const me = makeUser({ id: 1, email: 'mp@example.com', role: 'MP' });
const projects = [makeProject({ id: 10, title: 'Online Bookshop' }), makeProject({ id: 11, title: 'Weather Dashboard' })];
const bug = (id: number, overrides: Partial<Bug> = {}) => makeBug({ id, title: `Bug ${id}`, assignedUserId: me.id, ...overrides });

function renderList(bugs: Bug[], { loading = false } = {}) {
  render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue({ user: me })}>
        <AppContext.Provider value={appValue({ projects, bugs, loading })}>
          <BugListForMP />
        </AppContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('BugListForMP (bugs assigned to me)', () => {
  it('lists only my bugs that are not closed, most severe first', () => {
    renderList([
      bug(1, { severity: 'Low' }),
      bug(2, { severity: 'Critical', projectId: 11, status: 'IN_PROGRESS' }),
      bug(3, { assignedUserId: 99 }), // someone else's
      bug(4, { status: 'CLOSED' }), // done
      bug(5, { assignedUserId: null }), // unassigned
    ]);

    expect(screen.getByRole('heading', { name: 'Bugs assigned to me (2)' })).toBeInTheDocument();
    const rows = screen.getAllByRole('row').slice(1); // skip the header row
    expect(rows.map((r) => within(r).getAllByRole('cell')[0].textContent)).toEqual(['Bug 2', 'Bug 1']);
    expect(within(rows[0]).getByText('Weather Dashboard')).toBeInTheDocument();
    expect(within(rows[0]).getByText('In progress')).toBeInTheDocument();
  });

  it('links each bug to its page', () => {
    renderList([bug(7)]);
    expect(screen.getByRole('link', { name: 'Bug 7' })).toHaveAttribute('href', '/bugs/7');
  });

  it('says when nothing is assigned', () => {
    renderList([bug(3, { assignedUserId: 99 })]);
    expect(screen.getByText('No open bugs are assigned to you.')).toBeInTheDocument();
  });

  it('shows nothing while the data is loading', () => {
    renderList([bug(1)], { loading: true });
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
