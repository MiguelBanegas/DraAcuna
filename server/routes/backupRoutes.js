import express from "express";
import { requireAdmin } from "../middleware/authMiddleware.js";
import { createBackup, listBackups, restoreBackup } from "../controllers/backupController.js";

const router = express.Router();

router.get("/", requireAdmin, listBackups);
router.post("/create", requireAdmin, createBackup);
router.post("/restore", requireAdmin, restoreBackup);

export default router;
