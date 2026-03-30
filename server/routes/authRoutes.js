import express from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register); // Idealmente protegido o deshabilitado después del primer uso
router.put("/credentials", requireAuth, authController.updateCredentials);

export default router;
