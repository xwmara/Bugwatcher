import { describe, expect, it } from 'vitest';
import { anonymous, createProject, createProjectWithBug, createUser } from './helpers.js';

describe('POST /bugs (report a bug)', () => {
    it('requires the tester to join the project first', async () => {
        const owner = await createUser('MP');
        const tester = await createUser('TST');
        const project = await createProject(owner.agent);
        const bug = { title: 'Crash', severity: 'Low', priority: 'Low', projectId: project.id };

        expect((await tester.agent.post('/bugs').send(bug)).status).toBe(403);

        await tester.agent.post(`/projects/${project.id}/join`).expect(200);
        const res = await tester.agent.post('/bugs').send(bug);
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ title: 'Crash', status: 'OPEN', reporterId: tester.user.id, assignedUserId: null });
    });

    it.each([
        ['no title', { severity: 'Low', priority: 'Low' }, 'Title is required.'],
        ['an unknown severity', { title: 't', severity: 'Huge', priority: 'Low' }, 'Invalid severity. Use one of: Low, Medium, High, Critical.'],
        ['an unknown priority', { title: 't', severity: 'Low', priority: 'Urgent' }, 'Invalid priority. Use one of: Low, Medium, High.'],
    ])('rejects a bug with %s', async (_case, body, message) => {
        const { tester, project } = await createProjectWithBug();
        const res = await tester.agent.post('/bugs').send({ ...body, projectId: project.id });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(message);
    });
});

describe('PUT /bugs/:id (update and assign)', () => {
    it('lets the project owner assign the bug to themselves', async () => {
        const { owner, bug } = await createProjectWithBug();
        await owner.agent.put(`/bugs/${bug.id}`).send({ assignedUserId: owner.user.id }).expect(200);

        const res = await owner.agent.get(`/bugs/${bug.id}`).expect(200);
        expect(res.body.assignedUser.email).toBe(owner.email);
    });

    it('does not let the tester or another MP change the bug', async () => {
        const { tester, bug } = await createProjectWithBug();
        const otherMp = await createUser('MP');
        expect((await tester.agent.put(`/bugs/${bug.id}`).send({ status: 'CLOSED' })).status).toBe(403);
        expect((await otherMp.agent.put(`/bugs/${bug.id}`).send({ status: 'CLOSED' })).status).toBe(403);
    });

    it('lets members of the owning team manage the bug', async () => {
        const owner = await createUser('MP');
        const teammate = await createUser('MP');
        const tester = await createUser('TST');
        await owner.agent.post('/teams').send({ name: `Team ${Date.now()}` }).expect(201);
        await owner.agent.post('/teams/invite').send({ email: teammate.email }).expect(200);
        const project = await createProject(owner.agent);
        await tester.agent.post(`/projects/${project.id}/join`).expect(200);
        const bug = (await tester.agent.post('/bugs')
            .send({ title: 'b', severity: 'Low', priority: 'Low', projectId: project.id }).expect(201)).body;

        expect((await teammate.agent.put(`/bugs/${bug.id}`).send({ status: 'IN_PROGRESS' })).status).toBe(200);
    });

    it('only assigns bugs to MP members of the project', async () => {
        const { owner, tester, bug } = await createProjectWithBug();
        const outsider = await createUser('MP');
        const toTester = await owner.agent.put(`/bugs/${bug.id}`).send({ assignedUserId: tester.user.id });
        const toOutsider = await owner.agent.put(`/bugs/${bug.id}`).send({ assignedUserId: outsider.user.id });
        expect(toTester.status).toBe(400);
        expect(toOutsider.status).toBe(400);
    });

    it('changes only the fields that are sent', async () => {
        const { owner, bug } = await createProjectWithBug();
        await owner.agent.put(`/bugs/${bug.id}`).send({ assignedUserId: owner.user.id }).expect(200);
        await owner.agent.put(`/bugs/${bug.id}`).send({ status: 'IN_PROGRESS', description: '' }).expect(200);

        const updated = (await owner.agent.get(`/bugs/${bug.id}`)).body;
        expect(updated).toMatchObject({
            status: 'IN_PROGRESS',
            description: '',
            title: bug.title,
            severity: bug.severity,
            assignedUserId: owner.user.id,
        });
    });

    it('unassigns the bug with assignedUserId: null', async () => {
        const { owner, bug } = await createProjectWithBug();
        await owner.agent.put(`/bugs/${bug.id}`).send({ assignedUserId: owner.user.id }).expect(200);
        await owner.agent.put(`/bugs/${bug.id}`).send({ assignedUserId: null }).expect(200);
        expect((await owner.agent.get(`/bugs/${bug.id}`)).body.assignedUserId).toBeNull();
    });

    it.each([
        [{ status: 'DONE' }],
        [{ severity: 'Huge' }],
        [{ title: '   ' }],
        [{ assignedUserId: 'abc' }],
    ])('rejects invalid data %j', async (body) => {
        const { owner, bug } = await createProjectWithBug();
        expect((await owner.agent.put(`/bugs/${bug.id}`).send(body)).status).toBe(400);
    });
});

describe('DELETE /bugs/:id', () => {
    it('only lets the project owner delete a bug', async () => {
        const { owner, tester, bug } = await createProjectWithBug();
        expect((await tester.agent.delete(`/bugs/${bug.id}`)).status).toBe(403);
        expect((await owner.agent.delete(`/bugs/${bug.id}`)).status).toBe(200);
        expect((await owner.agent.get(`/bugs/${bug.id}`)).status).toBe(404);
    });
});

describe('reading bugs', () => {
    it('lists the bugs of a project with reporter and assignee', async () => {
        const { owner, tester, project, bug } = await createProjectWithBug();
        const res = await owner.agent.get(`/bugs/project/${project.id}`).expect(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({ id: bug.id, reporter: { email: tester.email }, assignedUser: null });
    });

    it('returns 400 for an id that is not a number and 404 for a missing bug', async () => {
        const { agent } = await createUser('MP');
        expect((await agent.get('/bugs/not-a-number')).status).toBe(400);
        expect((await agent.get('/bugs/999999')).status).toBe(404);
    });

    it.each([
        ['GET', '/bugs/1'],
        ['GET', '/bugs/project/1'],
        ['POST', '/bugs'],
        ['PUT', '/bugs/1'],
        ['DELETE', '/bugs/1'],
    ])('%s %s without login returns 401', async (method, path) => {
        expect((await anonymous()[method.toLowerCase()](path)).status).toBe(401);
    });
});
