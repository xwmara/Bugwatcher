// Entry point: loads settings, checks the database connection and starts the HTTP server.
// Load backend/.env before any other module reads process.env.
import 'dotenv/config';
import app from './app.js';
import db from './models/index.js';

// Without a secret, login would fail at runtime, so stop early with a clear message.
if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in backend/.env (see backend/.env.example).");
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

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
