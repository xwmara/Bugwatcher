import express from 'express';
import {
    createTeam, getAllTeams, getMyTeam, inviteToTeam, leaveTeam
} from '../controllers/teamController.js';
import { verifyAccessToken } from '../middleware/verifyToken.js';
import { validate } from '../middleware/validate.js';
import { createTeamBody, inviteBody } from '../validation/schemas.js';

const router = express.Router();

// Every team route requires a logged-in user
router.use(verifyAccessToken);

router.post('/', validate({ body: createTeamBody }), createTeam);
router.get('/', getAllTeams);
router.get('/my', getMyTeam);
router.post('/invite', validate({ body: inviteBody }), inviteToTeam);
router.post('/leave', leaveTeam);

export default router;
