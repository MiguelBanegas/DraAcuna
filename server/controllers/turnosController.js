import * as db from "../db/index.js";
import { getBlockingAgendaExceptionByDate } from "./agendaExcepcionesController.js";

const ensurePacienteActivo = async (pacienteId) => {
  const { rows } = await db.query("SELECT activo FROM pacientes WHERE id = $1", [pacienteId]);
  if (rows.length === 0) {
    return { ok: false, error: "Paciente no encontrado" };
  }
  if (rows[0].activo === false) {
    return { ok: false, error: "El paciente está archivado y no admite nuevos cambios de agenda" };
  }
  return { ok: true };
};

const getDateKeyFromIsoString = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

const validateAgendaException = async (fechaHora) => {
  const fecha = getDateKeyFromIsoString(fechaHora);

  if (!fecha) {
    return null;
  }

  return getBlockingAgendaExceptionByDate(fecha);
};

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
  const { paciente_id, fecha_hora, duracion, motivo, observaciones, estado } = req.body;
  try {
    const pacienteValidation = await ensurePacienteActivo(paciente_id);
    if (!pacienteValidation.ok) {
      return res.status(400).json({ error: pacienteValidation.error });
    }

    const agendaException = await validateAgendaException(fecha_hora);
    if (agendaException) {
      return res.status(400).json({
        error: `La agenda está bloqueada para el ${agendaException.fecha} (${agendaException.tipo}${agendaException.motivo ? `: ${agendaException.motivo}` : ""})`,
      });
    }

    // Validar solapamiento: comprobar si existe otro turno cuyo intervalo se superponga
    const dur = duracion ? parseInt(duracion, 10) : 30;
    const startDate = new Date(fecha_hora);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Fecha/hora inválida' });
    }
    const endDate = new Date(startDate.getTime() + dur * 60000);

    const { rows: overlapping } = await db.query(
      `SELECT t.*, p.nombre_completo as paciente_nombre
       FROM turnos t
       JOIN pacientes p ON t.paciente_id = p.id
       WHERE t.fecha_hora < $1
         AND (t.fecha_hora + (t.duracion * interval '1 minute')) > $2
       LIMIT 1`,
      [endDate.toISOString(), startDate.toISOString()]
    );

    if (overlapping.length > 0 && !req.body.force) {
      const existing = overlapping[0];
      return res.status(409).json({
        error: 'El horario seleccionado se superpone con otro turno existente',
        conflict: { id: existing.id, paciente_nombre: existing.paciente_nombre, fecha_hora: existing.fecha_hora, duracion: existing.duracion }
      });
    }

    const query = `
      INSERT INTO turnos (paciente_id, fecha_hora, duracion, motivo, observaciones, estado)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      paciente_id,
      fecha_hora,
      duracion ? parseInt(duracion) : 30,  // Convertir a n�mero
      motivo || null,
      observaciones || null,  // Convertir "" a null
      estado || 'pendiente'
    ];
    
    const { rows } = await db.query(query, values);
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

// Obtener turnos por paciente
export const getTurnosByPaciente = async (req, res) => {
  const { pacienteId } = req.params;
  try {
    const { rows } = await db.query(
      "SELECT * FROM turnos WHERE paciente_id = $1 ORDER BY fecha_hora DESC",
      [pacienteId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error en getTurnosByPaciente:", error);
    res.status(500).json({ error: "Error al obtener los turnos del paciente" });
  }
};

// Actualizar un turno completo
export const updateTurno = async (req, res) => {
  const { id } = req.params;
  const { paciente_id, fecha_hora, duracion, estado, motivo, observaciones } = req.body;
  
  try {
    const pacienteValidation = await ensurePacienteActivo(paciente_id);
    if (!pacienteValidation.ok) {
      return res.status(400).json({ error: pacienteValidation.error });
    }

    const agendaException = await validateAgendaException(fecha_hora);
    if (agendaException) {
      return res.status(400).json({
        error: `La agenda está bloqueada para el ${agendaException.fecha} (${agendaException.tipo}${agendaException.motivo ? `: ${agendaException.motivo}` : ""})`,
      });
    }

    // Validar solapamiento al actualizar (excluir el propio turno)
    const durUp = duracion ? parseInt(duracion, 10) : 30;
    const startUp = new Date(fecha_hora);
    if (Number.isNaN(startUp.getTime())) {
      return res.status(400).json({ error: 'Fecha/hora inválida' });
    }
    const endUp = new Date(startUp.getTime() + durUp * 60000);

    const { rows: overlappingUp } = await db.query(
      `SELECT t.*, p.nombre_completo as paciente_nombre
       FROM turnos t
       JOIN pacientes p ON t.paciente_id = p.id
       WHERE t.id <> $3
         AND t.fecha_hora < $1
         AND (t.fecha_hora + (t.duracion * interval '1 minute')) > $2
       LIMIT 1`,
      [endUp.toISOString(), startUp.toISOString(), id]
    );

    if (overlappingUp.length > 0 && !req.body.force) {
      const existing = overlappingUp[0];
      return res.status(409).json({
        error: 'El horario seleccionado se superpone con otro turno existente',
        conflict: { id: existing.id, paciente_nombre: existing.paciente_nombre, fecha_hora: existing.fecha_hora, duracion: existing.duracion }
      });
    }

    const query = `
      UPDATE turnos SET 
        paciente_id = $1, 
        fecha_hora = $2, 
        duracion = $3, 
        estado = $4, 
        motivo = $5,
	observaciones = $6
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      paciente_id,
      fecha_hora,
      duracion || 30,
      estado || 'pendiente',
      motivo,
	observaciones,
      id
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error en updateTurno:", error);
    res.status(500).json({ error: "Error al actualizar el turno completo" });
  }
};
