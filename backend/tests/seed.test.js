import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import db from '../models/index.js';
import { DEMO_USERS, down, up } from '../seeders/20261021120000-demo-data.js';

const DEMO_PASSWORD = 'Demo-Password-Only-For-Tests-1';
const queryInterface = db.sequelize.getQueryInterface();
const login = async (email) => {
    const agent = request.agent(app);
    const res = await agent.post('/users/login').send({ email, password: DEMO_PASSWORD });
    return { agent, res };
};

describe('demo data seeder', () => {
    afterAll(async () => {
        await down(queryInterface);
    });

    it('refuses to run without DEMO_PASSWORD', async () => {
        delete process.env.DEMO_PASSWORD;
        await expect(up(queryInterface)).rejects.toThrow('DEMO_PASSWORD');
    });

    it('creates demo accounts, projects and bugs, and is safe to run twice', async () => {
        process.env.DEMO_PASSWORD = DEMO_PASSWORD;
        await up(queryInterface);
        await up(queryInterface); // second run: "already exists", no duplicates

        const { agent, res } = await login('demo-manager@example.com');
        expect(res.status).toBe(200);

        const projects = (await agent.get('/users/getUserProjects').expect(200)).body.Projects;
        expect(projects.map((p) => p.title).sort()).toEqual(['Online Bookshop', 'Weather Dashboard']);
        expect(projects[0].Owner.name).toBe('Bugwatcher Demo Team');
        expect(projects[0].testers).toHaveLength(2);

        const bugs = (await agent.get(`/bugs/project/${projects[0].id}`).expect(200)).body;
        expect(bugs.length).toBeGreaterThan(0);
    });

    it('lets team members manage the demo bugs and testers log in', async () => {
        const { agent } = await login('demo-developer@example.com');
        const projects = (await agent.get('/users/getUserProjects').expect(200)).body.Projects;
        const bug = (await agent.get(`/bugs/project/${projects[0].id}`).expect(200)).body[0];
        expect((await agent.put(`/bugs/${bug.id}`).send({ status: 'IN_PROGRESS' })).status).toBe(200);

        const tester = await login('demo-tester@example.com');
        expect(tester.res.status).toBe(200);
        expect(tester.res.body.role).toBe('TST');
    });

    it('undo removes all demo data', async () => {
        await down(queryInterface);
        for (const user of DEMO_USERS) {
            expect((await login(user.email)).res.status).toBe(401);
        }
    });
});
