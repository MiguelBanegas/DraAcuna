import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Configuración de variables de entorno
dotenv.config({ path: "./server/.env" });

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(
  cors({
    origin: "*", // Permitir todos los orígenes por ahora para facilitar desarrollo
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Importar Rutas
import authRoutes from "./routes/authRoutes.js";
import pacientesRoutes from "./routes/pacientesRoutes.js";
import consultasRoutes from "./routes/consultasRoutes.js";
import turnosRoutes from "./routes/turnosRoutes.js";
import historiaClinicaRoutes from "./routes/historiaClinicaRoutes.js";
import healthRouter from "./routes/health.js";

// Usar Rutas
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/turnos", turnosRoutes);
app.use("/api/historia-clinica", historiaClinicaRoutes);
app.use("/api/health", healthRouter);


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
