import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { PASSWORD, anonymous, createUser, uniqueEmail } from './helpers.js';

describe('POST /users/register', () => {
    it('creates a user and never returns the password', async () => {
        const email = uniqueEmail('new');
        const res = await anonymous().post('/users/register').send({ email, password: PASSWORD, role: 'MP' });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ email, role: 'MP' });
        expect(res.body).not.toHaveProperty('password');
    });

    it('uses TST as the default role', async () => {
        const res = await anonymous().post('/users/register').send({ email: uniqueEmail(), password: PASSWORD });
        expect(res.status).toBe(201);
        expect(res.body.role).toBe('TST');
    });

    it('stores the email trimmed and in lowercase', async () => {
        const email = uniqueEmail('Mixed');
        const res = await anonymous().post('/users/register').send({ email: `  ${email.toUpperCase()} `, password: PASSWORD });
        expect(res.status).toBe(201);
        expect(res.body.email).toBe(email.toLowerCase());
    });

    it('rejects an email that is already registered', async () => {
        const { email } = await createUser();
        const res = await anonymous().post('/users/register').send({ email, password: PASSWORD });
        expect(res.status).toBe(409);
    });

    it('rejects a weak password', async () => {
        const res = await anonymous().post('/users/register').send({ email: uniqueEmail(), password: '123456' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Password too weak.');
    });

    it.each([
        ['an invalid email', { email: 'not-an-email', password: PASSWORD }, 'Email invalid.'],
        ['a missing password', { email: 'someone@example.com' }, 'Password is required.'],
        ['an unknown role', { email: 'someone@example.com', password: PASSWORD, role: 'ADMIN' }, 'Role invalid. Use MP or TST.'],
    ])('rejects %s', async (_case, body, message) => {
        const res = await anonymous().post('/users/register').send(body);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(message);
    });
});

describe('POST /users/login', () => {
    it('logs in and sets an httpOnly cookie', async () => {
        const { email } = await createUser('MP');
        const res = await anonymous().post('/users/login').send({ email, password: PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(email);
        expect(res.body).not.toHaveProperty('password');
        const cookie = res.headers['set-cookie'][0];
        expect(cookie).toMatch(/^accessToken=/);
        expect(cookie).toMatch(/HttpOnly/i);
    });

    it('rejects a wrong password with a generic message', async () => {
        const { email } = await createUser();
        const res = await anonymous().post('/users/login').send({ email, password: 'wrong-password' });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password.');
    });

    it('gives the same answer for an unknown email (no hint that it does not exist)', async () => {
        const res = await anonymous().post('/users/login').send({ email: uniqueEmail('ghost'), password: PASSWORD });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password.');
    });

    it('requires email and password', async () => {
        const res = await anonymous().post('/users/login').send({});
        expect(res.status).toBe(400);
    });
});

describe('session', () => {
    it('GET /users/me returns the logged-in user', async () => {
        const { agent, email } = await createUser('MP');
        const res = await agent.get('/users/me');
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(email);
        expect(res.body).not.toHaveProperty('password');
    });

    it('GET /users/me without a session returns 401', async () => {
        expect((await anonymous().get('/users/me')).status).toBe(401);
    });

    it('rejects an invalid token with 401', async () => {
        const res = await anonymous().get('/users/me').set('Cookie', 'accessToken=not-a-real-token');
        expect(res.status).toBe(401);
    });

    it('logout ends the session', async () => {
        const { agent } = await createUser();
        expect((await agent.post('/users/logout')).status).toBe(200);
        expect((await agent.get('/users/me')).status).toBe(401);
    });

    it('logout works even when the session already expired', async () => {
        const res = await anonymous().post('/users/logout').set('Cookie', 'accessToken=expired-token');
        expect(res.status).toBe(200);
    });
});

describe('rate limiting', () => {
    it('blocks an IP after 10 login attempts in 15 minutes', async () => {
        process.env.DISABLE_RATE_LIMIT = 'false';
        try {
            const statuses = [];
            for (let i = 0; i < 11; i++) {
                const res = await request(app).post('/users/login').send({ email: 'nobody@example.com', password: 'x' });
                statuses.push(res.status);
            }
            expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
            expect(statuses[10]).toBe(429);
        } finally {
            process.env.DISABLE_RATE_LIMIT = 'true';
        }
    });
});
