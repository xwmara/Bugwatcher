import { describe, expect, it } from 'vitest';
import { anonymous, createProject, createUser, uniqueEmail } from './helpers.js';

describe('PUT /users/:id', () => {
    it('lets users change their own email', async () => {
        const { agent, user } = await createUser();
        const email = uniqueEmail('changed');
        const res = await agent.put(`/users/${user.id}`).send({ email });
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(email);
    });

    it('does not let users change someone else', async () => {
        const me = await createUser('MP');
        const other = await createUser('TST');
        expect((await me.agent.put(`/users/${other.user.id}`).send({ email: uniqueEmail() })).status).toBe(403);
    });

    it('does not let a tester make themselves an MP', async () => {
        const { agent, user } = await createUser('TST');
        const res = await agent.put(`/users/${user.id}`).send({ role: 'MP' });
        expect(res.status).toBe(403);
        expect((await agent.get('/users/me')).body.role).toBe('TST');
    });

    it('rejects an email that another user already has', async () => {
        const me = await createUser();
        const other = await createUser();
        expect((await me.agent.put(`/users/${me.user.id}`).send({ email: other.email })).status).toBe(409);
    });
});

describe('DELETE /users/:id', () => {
    it('lets users delete their own account and ends the session', async () => {
        const { agent, user } = await createUser();
        expect((await agent.delete(`/users/${user.id}`)).status).toBe(204);
        expect((await agent.get('/users/me')).status).toBe(401);
    });

    it('does not let users delete someone else', async () => {
        const me = await createUser('MP');
        const other = await createUser();
        expect((await me.agent.delete(`/users/${other.user.id}`)).status).toBe(403);
    });

    it('removes the deleted user from the projects they joined', async () => {
        const owner = await createUser('MP');
        const tester = await createUser('TST');
        const project = await createProject(owner.agent);
        await tester.agent.post(`/projects/${project.id}/join`).expect(200);

        await tester.agent.delete(`/users/${tester.user.id}`).expect(204);
        const members = (await owner.agent.get(`/projects/${project.id}`).expect(200)).body.Users;
        expect(members.map((u) => u.id)).not.toContain(tester.user.id);
    });
});

describe('removed and protected user routes', () => {
    it('no longer lists all users (GET /users)', async () => {
        const { agent } = await createUser('MP');
        expect((await agent.get('/users')).status).toBe(404);
    });

    it('no longer allows signup without checks (POST /users)', async () => {
        expect((await anonymous().post('/users').send({ email: uniqueEmail(), password: 'abcdef', role: 'MP' })).status).toBe(404);
    });

    it.each([['GET'], ['PUT'], ['DELETE']])('%s /users/:id without login returns 401', async (method) => {
        expect((await anonymous()[method.toLowerCase()]('/users/1')).status).toBe(401);
    });
});

describe('teams', () => {
    it('lets an MP create a team and see its members', async () => {
        const { agent, email } = await createUser('MP');
        const name = `Team ${Date.now()}`;
        expect((await agent.post('/teams').send({ name })).status).toBe(201);

        const res = await agent.get('/teams/my').expect(200);
        expect(res.body.name).toBe(name);
        expect(res.body.Users.map((u) => u.email)).toEqual([email]);
    });

    it('requires a unique team name', async () => {
        const first = await createUser('MP');
        const second = await createUser('MP');
        const name = `Team ${Date.now()}`;
        await first.agent.post('/teams').send({ name }).expect(201);
        expect((await second.agent.post('/teams').send({ name })).status).toBe(400);
        expect((await second.agent.post('/teams').send({})).status).toBe(400);
    });

    it('does not let testers create teams', async () => {
        const { agent } = await createUser('TST');
        expect((await agent.post('/teams').send({ name: `Team ${Date.now()}` })).status).toBe(403);
    });

    it('invites another MP and lets members leave', async () => {
        const owner = await createUser('MP');
        const invited = await createUser('MP');
        const tester = await createUser('TST');
        await owner.agent.post('/teams').send({ name: `Team ${Date.now()}` }).expect(201);

        expect((await owner.agent.post('/teams/invite').send({ email: tester.email })).status).toBe(400);
        expect((await owner.agent.post('/teams/invite').send({ email: invited.email })).status).toBe(200);
        expect((await invited.agent.get('/teams/my')).body.Users).toHaveLength(2);

        expect((await invited.agent.post('/teams/leave')).status).toBe(200);
        expect((await invited.agent.get('/teams/my')).body).toEqual({ team: null });
    });
});
