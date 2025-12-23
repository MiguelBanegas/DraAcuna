import express from "express";
import * as historiaClinicaController from "../controllers/historiaClinicaController.js";

const router = express.Router();

router.get(
  "/paciente/:pacienteId",
  historiaClinicaController.getHistoriaClinicaByPaciente
);
router.post("/", historiaClinicaController.createHistoriaClinica);
router.put("/:id", historiaClinicaController.updateHistoriaClinica);

export default router;
