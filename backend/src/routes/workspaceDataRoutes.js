import { Router } from "express";
import { getWorkspaceData, saveWorkspaceData } from "../controllers/workspaceDataController.js";
import { requireSession } from "../middleware/authenticate.js";

const router = Router();

router.use(requireSession);
router.get("/", getWorkspaceData);
router.put("/", saveWorkspaceData);

export default router;
