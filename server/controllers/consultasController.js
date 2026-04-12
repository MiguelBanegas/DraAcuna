import * as db from "../db/index.js";

const ensurePacienteActivo = async (pacienteId) => {
  const { rows } = await db.query("SELECT activo FROM pacientes WHERE id = $1", [pacienteId]);
  if (rows.length === 0) {
    return { ok: false, error: "Paciente no encontrado" };
  }
  if (rows[0].activo === false) {
    return { ok: false, error: "El paciente está archivado y no admite nuevas consultas" };
  }
  return { ok: true };
};

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
    console.error("Error al obtener consultas:", error);
    res.status(500).json({ error: "Error al obtener consultas" });
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
    examen_fisico,
    diagnostico,
    tratamiento,
    observaciones,
    signos_vitales,
    proxima_consulta,
  } = req.body;
  try {
    const pacienteValidation = await ensurePacienteActivo(paciente_id);
    if (!pacienteValidation.ok) {
      return res.status(400).json({ error: pacienteValidation.error });
    }

    const query = `
      INSERT INTO consultas (
        paciente_id, fecha_hora, motivo, examen_fisico, diagnostico, 
        tratamiento, observaciones, signos_vitales, proxima_consulta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `;
    const values = [
      paciente_id,
      fecha_hora,
      motivo,
      examen_fisico,
      diagnostico,
      tratamiento,
      observaciones,
      signos_vitales ? JSON.stringify(signos_vitales) : null,
      proxima_consulta || null, // ? Cambiar "" por null
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
    paciente_id,
    motivo,
    examen_fisico,
    diagnostico,
    tratamiento,
    observaciones,
    signos_vitales,
    proxima_consulta,
    fecha_hora,
  } = req.body;

  try {
    if (paciente_id) {
      const pacienteValidation = await ensurePacienteActivo(paciente_id);
      if (!pacienteValidation.ok) {
        return res.status(400).json({ error: pacienteValidation.error });
      }
    }

    const query = `
      UPDATE consultas SET 
        motivo = $1, examen_fisico = $2, diagnostico = $3, tratamiento = $4, observaciones = $5, 
        signos_vitales = $6, proxima_consulta = $7, fecha_hora = $8
      WHERE id = $9 
      RETURNING *
    `;

    const values = [
      motivo,
      examen_fisico,
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

// Buscar consultas con filtros
export const searchConsultas = async (req, res) => {
  const { q, pacienteId, fecha } = req.query;
  try {
    let query = `
      SELECT c.*, p.nombre_completo as paciente_nombre, p.dni as paciente_dni
      FROM consultas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (q) {
      query += ` AND (c.motivo ILIKE $${paramCount} OR c.diagnostico ILIKE $${paramCount} OR p.nombre_completo ILIKE $${paramCount} OR p.dni::text ILIKE $${paramCount})`;
      values.push(`%${q}%`);
      paramCount++;
    }

    if (pacienteId) {
      query += ` AND c.paciente_id = $${paramCount}`;
      values.push(pacienteId);
      paramCount++;
    }

    if (fecha) {
      query += ` AND DATE(c.fecha_hora) = $${paramCount}`;
      values.push(fecha);
      paramCount++;
    }

    query += ` ORDER BY c.fecha_hora DESC`;

    const { rows } = await db.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error("Error en searchConsultas:", error);
    res.status(500).json({ error: "Error al buscar consultas" });
  }
};
