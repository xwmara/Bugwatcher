import { describe, expect, it } from 'vitest';
import { anonymous } from './helpers.js';

describe('deployment helpers', () => {
    it('GET /health answers without login (used by Render)', async () => {
        const res = await anonymous().get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('the IP check endpoint is off unless DEBUG_IP=true', async () => {
        expect((await anonymous().get('/debug/ip')).status).toBe(404);
    });
});
