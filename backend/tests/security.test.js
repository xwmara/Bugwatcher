import { describe, expect, it, vi } from 'vitest';
import { anonymous } from './helpers.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { canManageProject } from '../utils/permissions.js';

describe('security headers (helmet)', () => {
    it('hides X-Powered-By and blocks MIME sniffing', async () => {
        const res = await anonymous().get('/users/me');
        expect(res.headers['x-powered-by']).toBeUndefined();
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
});

describe('error handling', () => {
    it('answers a malformed JSON body with 400', async () => {
        const res = await anonymous()
            .post('/users/login')
            .set('Content-Type', 'application/json')
            .send('{bad json');
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: 'Invalid request body.' });
    });

    it('sends a generic 500 and keeps the details in the server log', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
        const err = new Error('relation "Users" does not exist');

        errorHandler(err, { method: 'GET', originalUrl: '/bugs/1' }, res, () => {});

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
        expect(consoleError).toHaveBeenCalledWith(expect.any(String), err);
        consoleError.mockRestore();
    });
});

describe('canManageProject', () => {
    const userOwned = { owner_type: 'USER', owner_id: 1 };
    const teamOwned = { owner_type: 'TEAM', owner_id: 7 };

    it('allows the user who owns the project', () => {
        expect(canManageProject({ id: 1, teamId: null }, userOwned)).toBe(true);
        expect(canManageProject({ id: 2, teamId: null }, userOwned)).toBe(false);
    });

    it('allows members of the team that owns the project', () => {
        expect(canManageProject({ id: 3, teamId: 7 }, teamOwned)).toBe(true);
        expect(canManageProject({ id: 3, teamId: 8 }, teamOwned)).toBe(false);
        expect(canManageProject({ id: 3, teamId: null }, teamOwned)).toBe(false);
    });

    it('denies when the user or project is missing', () => {
        expect(canManageProject(null, userOwned)).toBe(false);
        expect(canManageProject({ id: 1 }, null)).toBe(false);
    });
});
