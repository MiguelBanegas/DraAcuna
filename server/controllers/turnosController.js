import * as db from "../db/index.js";

// Obtener todos los turnos (con filtros opcionales)
export const getAllTurnos = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  try {
    let queryText =
      "SELECT t.*, p.nombre_completo as paciente_nombre FROM turnos t JOIN pacientes p ON t.paciente_id = p.id";
    const values = [];

    if (fecha_inicio && fecha_fin) {
      queryText += " WHERE t.fecha_hora >= $1 AND t.fecha_hora <= $2";
      values.push(fecha_inicio, fecha_fin);
    }

    queryText += " ORDER BY t.fecha_hora ASC";
    const { rows } = await db.query(queryText, values);
    res.json(rows);
  } catch (error) {
    console.error("Error en getAllTurnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Crear un nuevo turno
export const createTurno = async (req, res) => {
  const { paciente_id, fecha_hora, duracion, motivo } = req.body;
  try {
    const query = `
      INSERT INTO turnos (paciente_id, fecha_hora, duracion, motivo)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      paciente_id,
      fecha_hora,
      duracion || 30,
      motivo,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error en createTurno:", error);
    res.status(500).json({ error: "Error al agendar el turno" });
  }
};

// Actualizar estado de un turno
export const updateEstadoTurno = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const { rows } = await db.query(
      "UPDATE turnos SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en updateEstadoTurno:", error);
    res.status(500).json({ error: "Error al actualizar el estado del turno" });
  }
};

// Eliminar un turno
export const deleteTurno = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query("DELETE FROM turnos WHERE id = $1", [
      id,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }
    res.json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteTurno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};
