import { Router } from "express";
import { createInvoice, getInvoice, listInvoices, updateInvoice } from "../controllers/invoiceController.js";
import { requireSession } from "../middleware/authenticate.js";

const router = Router();

router.use(requireSession);
router.get("/", listInvoices);
router.post("/", createInvoice);
router.get("/:invoiceId", getInvoice);
router.put("/:invoiceId", updateInvoice);

export default router;
