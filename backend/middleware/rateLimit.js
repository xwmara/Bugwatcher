import { rateLimit } from 'express-rate-limit';

// Limits repeated attempts from the same IP address, to slow down
// password guessing (login) and mass account creation (register).
const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const loginLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

export const registerLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: "Too many accounts created. Please try again in 15 minutes." },
});
