import express from "express";
import * as pacientesController from "../controllers/pacientesController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", pacientesController.getAllPacientes);
router.get("/:id", pacientesController.getPacienteById);
router.post("/", pacientesController.createPaciente);
router.put("/:id", pacientesController.updatePaciente);
router.patch("/:id/estado", pacientesController.updatePacienteEstado);
router.delete("/:id", pacientesController.deletePaciente);

export default router;
