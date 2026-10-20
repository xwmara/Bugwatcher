import express from 'express';
import {
    createBug, getBugsByProjectId, updateBug, deleteBug, getBugById
} from '../controllers/bugController.js';
import { verifyAccessToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Every bug route requires a logged-in user
router.use(verifyAccessToken);

router.post('/', createBug);
router.get('/project/:projectId', getBugsByProjectId);
router.get('/:id', getBugById);
router.put('/:id', updateBug);
router.delete('/:id', deleteBug);

export default router;
