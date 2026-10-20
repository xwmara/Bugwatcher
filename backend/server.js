// Load backend/.env before any other module reads process.env.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import db from './models/index.js';
import userRouter from './routers/userRouter.js';
import projectRouter from './routers/projectRouter.js';
import teamRouter from './routers/teamRouter.js';
import bugRouter from './routers/bugRouter.js';
import { apiAudit } from './middleware/apiAudit.js';
import { errorHandler } from './middleware/errorHandler.js';

// Without a secret, login would fail at runtime, so stop early with a clear message.
if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in backend/.env (see backend/.env.example).");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Standard security headers (e.g. no MIME sniffing, no framing, hide "X-Powered-By: Express")
app.use(helmet());
app.use(express.json());
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(apiAudit);

/* Routers */
app.use('/users', userRouter);
app.use('/projects', projectRouter);
app.use('/teams', teamRouter);
app.use('/bugs', bugRouter);

// Must be registered after the routers
app.use(errorHandler);

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        console.log("Connected to PostgreSQL.");
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (err) {
        console.error(`Could not connect to the database: ${err.name} ${err.message}`);
        process.exit(1);
    }
}

startServer();
