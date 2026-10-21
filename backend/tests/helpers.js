// Shared helpers for the API tests.
import request from 'supertest';
import app from '../app.js';

export const PASSWORD = 'Correct-Horse-Battery-42';

let counter = 0;
// Every test creates its own users and projects, so tests never depend on each other
export const uniqueEmail = (prefix = 'user') => `${prefix}-${Date.now()}-${counter++}@example.com`;

// A client without a session (not logged in)
export const anonymous = () => request(app);

// Registers and logs in a new user. The returned agent keeps the login cookie,
// so its next requests are made as that user.
export async function createUser(role = 'TST') {
    const email = uniqueEmail(role.toLowerCase());
    const agent = request.agent(app);
    await agent.post('/users/register').send({ email, password: PASSWORD, role }).expect(201);
    const res = await agent.post('/users/login').send({ email, password: PASSWORD }).expect(200);
    return { agent, user: res.body, email };
}

// Creates a project owned by the given MP (agent) and returns it
export async function createProject(agent, title = `Project ${counter++}`) {
    const res = await agent
        .post('/projects')
        .send({ title, commit_link: 'https://github.com/xwmara/Bugwatcher' })
        .expect(201);
    return res.body.project;
}

// Creates a project with an owner, a tester who joined it, and one reported bug
export async function createProjectWithBug() {
    const owner = await createUser('MP');
    const tester = await createUser('TST');
    const project = await createProject(owner.agent);
    await tester.agent.post(`/projects/${project.id}/join`).expect(200);
    const res = await tester.agent
        .post('/bugs')
        .send({ title: 'Login button does nothing', severity: 'High', priority: 'Medium', projectId: project.id })
        .expect(201);
    return { owner, tester, project, bug: res.body };
}
