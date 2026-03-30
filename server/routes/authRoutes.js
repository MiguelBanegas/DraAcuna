import express from "express";
import * as authController from "../controllers/authController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", requireAdmin, authController.register);
router.put("/credentials", requireAuth, authController.updateCredentials);
router.get("/users", requireAdmin, authController.listUsers);
router.put(
  "/users/:id/reset-credentials",
  requireAdmin,
  authController.adminResetCredentials
);

export default router;
