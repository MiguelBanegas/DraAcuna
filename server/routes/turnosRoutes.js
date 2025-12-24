import express from "express";
import * as turnosController from "../controllers/turnosController.js";

const router = express.Router();

router.get("/", turnosController.getAllTurnos);
router.get("/paciente/:pacienteId", turnosController.getTurnosByPaciente);
router.post("/", turnosController.createTurno);
router.patch("/:id/estado", turnosController.updateEstadoTurno);
router.delete("/:id", turnosController.deleteTurno);
router.put("/:id", turnosController.updateTurno);

export default router;
