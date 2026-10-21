import express from "express";
import { 
    createProject,
    getAllProjects,
    getProjectById,
    joinProject
 } from "../controllers/projectController.js";
import { verifyAccessToken } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { createProjectBody, idParams } from "../validation/schemas.js";

const router = express.Router();

// Every project route requires a logged-in user
router.use(verifyAccessToken);

router.post("/", validate({ body: createProjectBody }), createProject);
router.get('/', getAllProjects);
router.get('/:id', validate({ params: idParams }), getProjectById);
router.post('/:id/join', validate({ params: idParams }), joinProject);

export default router;
