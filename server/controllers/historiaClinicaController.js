import * as db from "../db/index.js";

// Obtener metadatos de historia clínica por paciente
export const getHistoriaClinicaByPaciente = async (req, res) => {
  const { pacienteId } = req.params;
  try {
    const { rows } = await db.query(
      "SELECT * FROM historias_clinicas WHERE paciente_id = $1",
      [pacienteId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Historia clínica no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en getHistoriaClinicaByPaciente:", error);
    res.status(500).json({ error: "Error al obtener la historia clínica" });
  }
};

// Crear historia clínica (inicializar)
export const createHistoriaClinica = async (req, res) => {
  const { paciente_id, observaciones_medico } = req.body;
  try {
    const query = `
      INSERT INTO historias_clinicas (paciente_id, observaciones_medico)
      VALUES ($1, $2)
      RETURNING *
    `;
    const { rows } = await db.query(query, [paciente_id, observaciones_medico]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error en createHistoriaClinica:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "Ya existe una historia clínica para este paciente" });
    }
    res.status(500).json({ error: "Error al crear la historia clínica" });
  }
};

// Actualizar observaciones de historia clínica
export const updateHistoriaClinica = async (req, res) => {
  const { id } = req.params;
  const { observaciones_medico } = req.body;
  try {
    const query = `
      UPDATE historias_clinicas 
      SET observaciones_medico = $1, fecha_ultima_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *
    `;
    const { rows } = await db.query(query, [observaciones_medico, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Historia clínica no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en updateHistoriaClinica:", error);
    res.status(500).json({ error: "Error al actualizar la historia clínica" });
  }
};
