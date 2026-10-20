import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Sequelize } from "sequelize";
import userRouter from './routers/userRouter.js';
import projectRouter from './routers/projectRouter.js';
import teamRouter from './routers/teamRouter.js';
import bugRouter from './routers/bugRouter.js';
import { apiAudit } from './middleware/apiAudit.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());
app.use(apiAudit);



const sequelize = new Sequelize(
    "postgres",
    `${process.env.POSTGRES_USERNAME}`,
    `${process.env.POSTGRES_PASS}`,

{
    host: "localhost",
    port: 5433,
    dialect: "postgres",
    logging: false
});

// await sequelize.sync({ alter: true });

console.log("Database:", sequelize.config.database);
console.log("Host:", sequelize.config.host);
console.log("Port:", sequelize.config.port);


const startServer = async () => {
    try {
        console.log("Testing database connection...");
        await sequelize.authenticate();
        console.log("Connected to PostgreSQL.");
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        })
    } catch (err) {
        console.log(`Internal server error: ${err}`);
    }
}

startServer();

/* Routers */
app.use('/users', userRouter); // -> http://localhost:3000/users/
app.use('/projects', projectRouter); // -> http://localhost:3000/projects/
app.use('/teams', teamRouter); // -> http://localhost:3000/teams/
app.use('/bugs', bugRouter); // -> http://localhost:3000/bugs/


