import express from 'express';
import {
    createTeam, getAllTeams, getMyTeam, inviteToTeam, leaveTeam
} from '../controllers/teamController.js';
import { verifyAccessToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Every team route requires a logged-in user
router.use(verifyAccessToken);

router.post('/', createTeam);
router.get('/', getAllTeams);
router.get('/my', getMyTeam);
router.post('/invite', inviteToTeam);
router.post('/leave', leaveTeam);

export default router;
