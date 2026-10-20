import express from 'express';
import { getUserById, updateUser, deleteUser, loginUser, registerUser, restoreUser, logoutUser, getUserProjects } from "../controllers/userController.js";
import { verifyAccessToken } from '../middleware/verifyToken.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post("/login", loginLimiter, loginUser);
router.post("/register", registerLimiter, registerUser);

// Routes that require a logged-in user
router.get("/me", verifyAccessToken, restoreUser);
router.get("/getUserProjects", verifyAccessToken, getUserProjects);
router.post("/logout", verifyAccessToken, logoutUser);
router.get("/:id", verifyAccessToken, getUserById);
router.put("/:id", verifyAccessToken, updateUser);
router.delete("/:id", verifyAccessToken, deleteUser);

export default router;
