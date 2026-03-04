import express from "express";
import { responder } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", responder);

export default router;
