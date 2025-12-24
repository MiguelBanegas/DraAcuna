import * as db from "../db/index.js";

export const getAllHistoriasClinicas = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT h.*, p.nombre_completo as paciente_nombre
      FROM historias_clinicas h
      LEFT JOIN pacientes p ON h.paciente_id = p.id
      ORDER BY h.fecha_ultima_actualizacion DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener historias clínicas:", error);
    res.status(500).json({ error: "Error al obtener historias clínicas" });
  }
};

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

// Eliminar historia clínica
export const deleteHistoriaClinica = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query(
      "DELETE FROM historias_clinicas WHERE id = $1",
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Historia clínica no encontrada" });
    }
    res.json({ message: "Historia clínica eliminada correctamente" });
  } catch (error) {
    console.error("Error en deleteHistoriaClinica:", error);
    res.status(500).json({ error: "Error al eliminar la historia clínica" });
  }
};
