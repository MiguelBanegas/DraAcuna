import { Router } from "express";
import * as agendaExcepcionesController from "../controllers/agendaExcepcionesController.js";

const router = Router();

router.get("/", agendaExcepcionesController.getAgendaExcepciones);
router.post("/", agendaExcepcionesController.createAgendaExcepcion);
router.put("/:id", agendaExcepcionesController.updateAgendaExcepcion);
router.delete("/:id", agendaExcepcionesController.deleteAgendaExcepcion);

export default router;
