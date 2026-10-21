import { describe, expect, it } from 'vitest';
import { anonymous, createProject, createUser } from './helpers.js';

describe('POST /projects', () => {
    it('lets an MP create a project they own', async () => {
        const { agent, user } = await createUser('MP');
        const res = await agent.post('/projects').send({ title: 'Web shop', commit_link: 'https://github.com/xwmara/Bugwatcher' });

        expect(res.status).toBe(201);
        expect(res.body.project).toMatchObject({ title: 'Web shop', owner_type: 'USER', owner_id: user.id });
    });

    it('makes the team the owner when the MP is in a team', async () => {
        const { agent } = await createUser('MP');
        const team = (await agent.post('/teams').send({ name: `Team ${Date.now()}` }).expect(201)).body;
        const project = await createProject(agent);
        expect(project).toMatchObject({ owner_type: 'TEAM', owner_id: team.id });
    });

    it('does not let a tester create projects', async () => {
        const { agent } = await createUser('TST');
        const res = await agent.post('/projects').send({ title: 'x', commit_link: 'https://github.com/a/b' });
        expect(res.status).toBe(403);
    });

    it('requires a title', async () => {
        const { agent } = await createUser('MP');
        const res = await agent.post('/projects').send({ title: '  ', commit_link: 'https://github.com/a/b' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Project title is required.');
    });

    it.each([
        'https://gitlab.com/group/repo/-/commit/abc',
        'https://bitbucket.org/team/repo',
        'https://www.github.com/a/b',
    ])('accepts the commit link %s', async (link) => {
        const { agent } = await createUser('MP');
        expect((await agent.post('/projects').send({ title: 'x', commit_link: link })).status).toBe(201);
    });

    // The server only checks the format and never opens the link (protection against SSRF)
    it.each([
        'http://github.com/a/b',
        'https://169.254.169.254/latest/meta-data',
        'https://localhost:3000/users',
        'https://example.com/repo',
        'https://github.com.attacker.example/repo',
        'not a url',
        '',
    ])('rejects the commit link "%s"', async (link) => {
        const { agent } = await createUser('MP');
        const res = await agent.post('/projects').send({ title: 'x', commit_link: link });
        expect(res.status).toBe(400);
    });
});

describe('GET /users/getUserProjects', () => {
    it('gives an MP their projects with owner, members and testers', async () => {
        const owner = await createUser('MP');
        const tester = await createUser('TST');
        const project = await createProject(owner.agent);
        await tester.agent.post(`/projects/${project.id}/join`).expect(200);

        const res = await owner.agent.get('/users/getUserProjects');
        expect(res.status).toBe(200);
        const mine = res.body.Projects.find((p) => p.id === project.id);
        expect(mine.Owner.email).toBe(owner.email);
        expect(mine.Users.map((u) => u.email).sort()).toEqual([owner.email, tester.email].sort());
        expect(mine.testers).toEqual([tester.email]); // the MP owner is not counted as a tester
    });

    it('shows a tester all projects and which ones they joined', async () => {
        const owner = await createUser('MP');
        const tester = await createUser('TST');
        const joined = await createProject(owner.agent);
        const notJoined = await createProject(owner.agent);
        await tester.agent.post(`/projects/${joined.id}/join`).expect(200);

        const projects = (await tester.agent.get('/users/getUserProjects').expect(200)).body.Projects;
        expect(projects.find((p) => p.id === joined.id).joined).toBe(true);
        expect(projects.find((p) => p.id === notJoined.id).joined).toBe(false);
    });
});

describe('POST /projects/:id/join', () => {
    it('only lets testers join', async () => {
        const owner = await createUser('MP');
        const otherMp = await createUser('MP');
        const project = await createProject(owner.agent);
        expect((await otherMp.agent.post(`/projects/${project.id}/join`)).status).toBe(403);
    });

    it('returns 404 for a project that does not exist', async () => {
        const { agent } = await createUser('TST');
        expect((await agent.post('/projects/999999/join')).status).toBe(404);
    });

    it('returns 400 for an id that is not a number', async () => {
        const { agent } = await createUser('TST');
        const res = await agent.post('/projects/abc/join');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid id.');
    });
});

describe('access without login', () => {
    it.each([
        ['GET', '/projects'],
        ['GET', '/projects/1'],
        ['POST', '/projects'],
        ['POST', '/projects/1/join'],
    ])('%s %s returns 401', async (method, path) => {
        const res = await anonymous()[method.toLowerCase()](path);
        expect(res.status).toBe(401);
    });
});
