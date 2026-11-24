import { Router } from "express";
import { changeOwnPassword, currentUser, login, logout } from "../controllers/authController.js";
import { requireSession } from "../middleware/authenticate.js";
import { loginLimiter } from "../middleware/loginLimiter.js";

const router = Router();

router.post("/login", loginLimiter, login);
router.get("/me", requireSession, currentUser);
router.patch("/password", requireSession, changeOwnPassword);
router.post("/logout", logout);

export default router;
