import express from 'express';
import { getUserById, updateUser, deleteUser, loginUser, registerUser, restoreUser, logoutUser, getUserProjects } from "../controllers/userController.js";
import { verifyAccessToken } from '../middleware/verifyToken.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { idParams, loginBody, registerBody, updateUserBody } from '../validation/schemas.js';

const router = express.Router();

// Public routes
router.post("/login", loginLimiter, validate({ body: loginBody }), loginUser);
router.post("/register", registerLimiter, validate({ body: registerBody }), registerUser);
// Public on purpose: logging out must work even when the session has already expired
router.post("/logout", logoutUser);

// Routes that require a logged-in user
router.get("/me", verifyAccessToken, restoreUser);
router.get("/getUserProjects", verifyAccessToken, getUserProjects);
router.get("/:id", verifyAccessToken, validate({ params: idParams }), getUserById);
router.put("/:id", verifyAccessToken, validate({ params: idParams, body: updateUserBody }), updateUser);
router.delete("/:id", verifyAccessToken, validate({ params: idParams }), deleteUser);

export default router;
