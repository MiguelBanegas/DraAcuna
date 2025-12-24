import * as db from "../db/index.js";

export const getAllConsultas = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, p.nombre_completo as paciente_nombre
      FROM consultas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      ORDER BY c.fecha_hora DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener consultas:', error);
    res.status(500).json({ error: 'Error al obtener consultas' });
  }
};

// Obtener todas las consultas de un paciente
export const getConsultasByPaciente = async (req, res) => {
  const { pacienteId } = req.params;
  try {
    const { rows } = await db.query(
      "SELECT * FROM consultas WHERE paciente_id = $1 ORDER BY fecha_hora DESC",
      [pacienteId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error en getConsultasByPaciente:", error);
    res
      .status(500)
      .json({ error: "Error al obtener las consultas del paciente" });
  }
};

// Obtener una consulta por ID
export const getConsultaById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query("SELECT * FROM consultas WHERE id = $1", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Consulta no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en getConsultaById:", error);
    res.status(500).json({ error: "Error al obtener la consulta" });
  }
};

// Crear una nueva consulta

export const createConsulta = async (req, res) => {
  const {
    paciente_id,
    fecha_hora,
    motivo,
    diagnostico,
    tratamiento,
    observaciones,
    signos_vitales,
    proxima_consulta,
  } = req.body;
  try {
    const query = `
      INSERT INTO consultas (
        paciente_id, fecha_hora, motivo, diagnostico, 
        tratamiento, observaciones, signos_vitales, proxima_consulta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const values = [
      paciente_id,
      fecha_hora,
      motivo,
      diagnostico,
      tratamiento,
      observaciones,
      signos_vitales ? JSON.stringify(signos_vitales) : null,
      proxima_consulta || null,  // ? Cambiar "" por null
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error en createConsulta:", error);
    res.status(500).json({ error: "Error al registrar la consulta" });
  }
};

// Actualizar una consulta
export const updateConsulta = async (req, res) => {
  const { id } = req.params;
  const {
    motivo,
    diagnostico,
    tratamiento,
    observaciones,
    signos_vitales,
    proxima_consulta,
    fecha_hora,
  } = req.body;

  try {
    const query = `
      UPDATE consultas SET 
        motivo = $1, diagnostico = $2, tratamiento = $3, observaciones = $4, 
        signos_vitales = $5, proxima_consulta = $6, fecha_hora = $7
      WHERE id = $8 
      RETURNING *
    `;

	const values = [
  motivo,
  diagnostico,
  tratamiento,
  observaciones,
  signos_vitales ? JSON.stringify(signos_vitales) : null,
  proxima_consulta || null,  
  fecha_hora,
  id,
];    

    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Consulta no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en updateConsulta:", error);
    res.status(500).json({ error: "Error al actualizar la consulta" });
  }
};

// Eliminar una consulta
export const deleteConsulta = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query("DELETE FROM consultas WHERE id = $1", [
      id,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Consulta no encontrada" });
    }
    res.json({ message: "Consulta eliminada correctamente" });
  } catch (error) {
    console.error("Error en deleteConsulta:", error);
    res.status(500).json({ error: "Error al eliminar la consulta" });
  }
};
