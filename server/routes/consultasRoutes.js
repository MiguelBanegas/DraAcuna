import express from "express";
import * as consultasController from "../controllers/consultasController.js";

const router = express.Router();

router.get("/paciente/:pacienteId", consultasController.getConsultasByPaciente);
router.get("/:id", consultasController.getConsultaById);
router.post("/", consultasController.createConsulta);
router.put("/:id", consultasController.updateConsulta);
router.delete("/:id", consultasController.deleteConsulta);

export default router;
