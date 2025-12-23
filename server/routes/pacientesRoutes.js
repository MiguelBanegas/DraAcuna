import express from "express";
import * as pacientesController from "../controllers/pacientesController.js";

const router = express.Router();

router.get("/", pacientesController.getAllPacientes);
router.get("/:id", pacientesController.getPacienteById);
router.post("/", pacientesController.createPaciente);
router.put("/:id", pacientesController.updatePaciente);
router.delete("/:id", pacientesController.deletePaciente);

export default router;
