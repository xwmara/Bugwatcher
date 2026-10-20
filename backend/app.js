// The Express application: middleware, routes and error handling.
// It does not connect to the database or listen on a port (server.js does that),
// so tests can import it and send requests to it directly.
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import userRouter from './routers/userRouter.js';
import projectRouter from './routers/projectRouter.js';
import teamRouter from './routers/teamRouter.js';
import bugRouter from './routers/bugRouter.js';
import { apiAudit } from './middleware/apiAudit.js';
import { errorHandler } from './middleware/errorHandler.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

// Standard security headers (e.g. no MIME sniffing, no framing, hide "X-Powered-By: Express")
app.use(helmet());
app.use(express.json());
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));
app.use(cookieParser());
// One log line per request (skipped in tests to keep the output readable)
if (process.env.NODE_ENV !== 'test') {
    app.use(apiAudit);
}

/* Routers */
app.use('/users', userRouter);
app.use('/projects', projectRouter);
app.use('/teams', teamRouter);
app.use('/bugs', bugRouter);

// Must be registered after the routers
app.use(errorHandler);

export default app;
