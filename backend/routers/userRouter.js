/* */

import express from 'express';
import { createUser, getUsers, getUserById, updateUser,deleteUser, loginUser, registerUser, restoreUser, logoutUser, getUserProjects } from "../controllers/userController.js";
// import verifyAccessToken from '../middleware/authMiddleware.js';
import { verifyAccessToken } from '../middleware/verifyToken.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
const router = express.Router();

router.post('/', createUser);
router.get("/", getUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/login", loginLimiter, loginUser);
router.post("/register", registerLimiter, registerUser);
router.get("/me", verifyAccessToken, restoreUser);
router.get("/getUserProjects", verifyAccessToken, getUserProjects);
router.get("/:id", getUserById);
router.post("/logout", verifyAccessToken, logoutUser);


export default router;