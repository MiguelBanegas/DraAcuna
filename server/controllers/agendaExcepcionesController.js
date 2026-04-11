import * as db from "../db/index.js";

let ensureAgendaExcepcionesTablePromise;

const ensureAgendaExcepcionesTable = async () => {
  if (!ensureAgendaExcepcionesTablePromise) {
    ensureAgendaExcepcionesTablePromise = db.query(`
      CREATE TABLE IF NOT EXISTS agenda_excepciones (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL UNIQUE,
        tipo VARCHAR(30) NOT NULL,
        motivo TEXT,
        hora_inicio TIME NULL,
        hora_fin TIME NULL,
        bloquea_turnos BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  }

  await ensureAgendaExcepcionesTablePromise;
};

const normalizeExceptionRow = (row) => ({
  ...row,
  fecha: row.fecha instanceof Date
    ? `${row.fecha.getFullYear()}-${String(row.fecha.getMonth() + 1).padStart(2, '0')}-${String(row.fecha.getDate()).padStart(2, '0')}`
    : String(row.fecha).slice(0, 10),
  bloquea_turnos: Boolean(row.bloquea_turnos),
});

export const getBlockingAgendaExceptionByDate = async (fecha) => {
  await ensureAgendaExcepcionesTable();
  const { rows } = await db.query(
    `SELECT * FROM agenda_excepciones
     WHERE fecha = $1 AND bloquea_turnos = TRUE
     LIMIT 1`,
    [fecha],
  );
  return rows[0] ? normalizeExceptionRow(rows[0]) : null;
};

export const getAgendaExcepciones = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    await ensureAgendaExcepcionesTable();

    let query = "SELECT * FROM agenda_excepciones";
    const values = [];

    if (fechaInicio && fechaFin) {
      query += " WHERE fecha BETWEEN $1 AND $2";
      values.push(fechaInicio, fechaFin);
    }

    query += " ORDER BY fecha ASC";

    const { rows } = await db.query(query, values);
    res.json(rows.map(normalizeExceptionRow));
  } catch (error) {
    console.error("Error en getAgendaExcepciones:", error);
    res.status(500).json({ error: "Error al obtener las excepciones de agenda" });
  }
};

export const createAgendaExcepcion = async (req, res) => {
  const { fecha, tipo, motivo, hora_inicio, hora_fin, bloquea_turnos } = req.body;

  try {
    await ensureAgendaExcepcionesTable();

    const { rows } = await db.query(
      `INSERT INTO agenda_excepciones (
        fecha, tipo, motivo, hora_inicio, hora_fin, bloquea_turnos
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        fecha,
        tipo,
        motivo || null,
        hora_inicio || null,
        hora_fin || null,
        bloquea_turnos ?? true,
      ],
    );

    res.status(201).json(normalizeExceptionRow(rows[0]));
  } catch (error) {
    console.error("Error en createAgendaExcepcion:", error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "Ya existe una excepción cargada para esa fecha" });
    }
    res.status(500).json({ error: "Error al guardar la excepción de agenda" });
  }
};

export const updateAgendaExcepcion = async (req, res) => {
  const { id } = req.params;
  const { fecha, tipo, motivo, hora_inicio, hora_fin, bloquea_turnos } = req.body;

  try {
    await ensureAgendaExcepcionesTable();

    const { rows } = await db.query(
      `UPDATE agenda_excepciones
       SET fecha = $1,
           tipo = $2,
           motivo = $3,
           hora_inicio = $4,
           hora_fin = $5,
           bloquea_turnos = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        fecha,
        tipo,
        motivo || null,
        hora_inicio || null,
        hora_fin || null,
        bloquea_turnos ?? true,
        id,
      ],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Excepción de agenda no encontrada" });
    }

    res.json(normalizeExceptionRow(rows[0]));
  } catch (error) {
    console.error("Error en updateAgendaExcepcion:", error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "Ya existe una excepción cargada para esa fecha" });
    }
    res.status(500).json({ error: "Error al actualizar la excepción de agenda" });
  }
};

export const deleteAgendaExcepcion = async (req, res) => {
  const { id } = req.params;

  try {
    await ensureAgendaExcepcionesTable();
    const { rowCount } = await db.query("DELETE FROM agenda_excepciones WHERE id = $1", [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Excepción de agenda no encontrada" });
    }

    res.json({ message: "Excepción de agenda eliminada correctamente" });
  } catch (error) {
    console.error("Error en deleteAgendaExcepcion:", error);
    res.status(500).json({ error: "Error al eliminar la excepción de agenda" });
  }
};
