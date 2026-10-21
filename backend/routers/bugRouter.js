import express from 'express';
import {
    createBug, getBugsByProjectId, updateBug, deleteBug, getBugById
} from '../controllers/bugController.js';
import { verifyAccessToken } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { createBugBody, idParams, projectIdParams, updateBugBody } from "../validation/schemas.js";

const router = express.Router();

// Every bug route requires a logged-in user
router.use(verifyAccessToken);

router.post('/', validate({ body: createBugBody }), createBug);
router.get('/project/:projectId', validate({ params: projectIdParams }), getBugsByProjectId);
router.get('/:id', validate({ params: idParams }), getBugById);
router.put('/:id', validate({ params: idParams, body: updateBugBody }), updateBug);
router.delete('/:id', validate({ params: idParams }), deleteBug);

export default router;
