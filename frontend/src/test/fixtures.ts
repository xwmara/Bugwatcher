// Ready-made values for the component tests.
import { vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import type { AuthContextValue } from '../context/AuthContext';
import type { AppContextValue } from '../context/AppContext';
import type { Bug, Project, User } from '../types';

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 1, email: 'mp@example.com', role: 'MP', teamId: null, ...overrides,
});

export const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 10, title: 'Online Bookshop', description: null, commit_link: 'https://github.com/example/shop',
  owner_type: 'USER', owner_id: 1, ...overrides,
});

export const makeBug = (overrides: Partial<Bug> = {}): Bug => ({
  id: 1, title: 'Bug 1', description: null, severity: 'Low', priority: 'Low', status: 'OPEN',
  projectId: 10, assignedUserId: 1, reporterId: 2, commitLink: null, resolutionCommit: null, ...overrides,
});

// Full context values: tests override only the parts they care about
export const authValue = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  user: null, setUser: vi.fn(), loginUser: vi.fn(), logoutUser: vi.fn(), ...overrides,
});

export const appValue = (overrides: Partial<AppContextValue> = {}): AppContextValue => ({
  projects: [], bugs: [], loading: false,
  fetchProjects: vi.fn(), addTesterToProject: vi.fn(), addBug: vi.fn(), ...overrides,
});

// A successful axios response with the given body
export const okResponse = <T,>(data: T, status = 200) => ({ data, status }) as AxiosResponse<T>;
