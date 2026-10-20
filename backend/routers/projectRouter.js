import express from "express";
import {
    createProject,
    getAllProjects,
    getProjectById,
    joinProject
 } from "../controllers/projectController.js";
import { verifyAccessToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Every project route requires a logged-in user
router.use(verifyAccessToken);

router.post("/", createProject);
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/:id/join', joinProject);

export default router;
