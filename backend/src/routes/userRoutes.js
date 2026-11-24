import { Router } from "express";
import { changeUserEmail, changeUserPassword, createUser, listUsers } from "../controllers/userController.js";
import { requireSession } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/", requireSession, requireRole("admin"), listUsers);
router.post("/", requireSession, requireRole("admin"), createUser);
router.patch("/:userId/email", requireSession, requireRole("admin"), changeUserEmail);
router.patch("/:userId/password", requireSession, requireRole("admin"), changeUserPassword);

export default router;
