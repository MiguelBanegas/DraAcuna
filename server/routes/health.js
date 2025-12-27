import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/", (req, res) => {
  const deployInfoPath = path.resolve("deploy-info.json");

  let deployInfo = null;

  try {
    deployInfo = JSON.parse(fs.readFileSync(deployInfoPath, "utf8"));
  } catch {
    deployInfo = { error: "deploy-info.json no encontrado" };
  }

  res.json({
    status: "ok",
    service: "api-dra-acuna",
    environment: process.env.NODE_ENV || "unknown",
    uptime_seconds: Math.floor(process.uptime()),
    deploy: deployInfo
  });
});

export default router;
