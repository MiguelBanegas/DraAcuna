import express from "express";
import * as historiaClinicaController from "../controllers/historiaClinicaController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", historiaClinicaController.getAllHistoriasClinicas);

router.get(
  "/paciente/:pacienteId",
  historiaClinicaController.getHistoriaClinicaByPaciente
);
router.post("/", historiaClinicaController.createHistoriaClinica);
router.put("/:id", historiaClinicaController.updateHistoriaClinica);
router.delete("/:id", historiaClinicaController.deleteHistoriaClinica);

export default router;
