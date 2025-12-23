// Servicio para gestionar turnos usando localStorage

const STORAGE_KEY = "turnos";

// Generar ID único
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Obtener todos los turnos
export const getAllTurnos = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener turnos:", error);
    return [];
  }
};

// Obtener turno por ID
export const getTurnoById = (id) => {
  const turnos = getAllTurnos();
  return turnos.find((t) => t.id === id);
};

// Obtener turnos de un paciente
export const getTurnosByPaciente = (pacienteId) => {
  const turnos = getAllTurnos();
  return turnos
    .filter((t) => t.pacienteId === pacienteId)
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)); // Ordenar por fecha
};

// Obtener turnos de una fecha específica
export const getTurnosByFecha = (fecha) => {
  const turnos = getAllTurnos();
  const fechaBuscada = new Date(fecha).toDateString();

  return turnos
    .filter((t) => new Date(t.fechaHora).toDateString() === fechaBuscada)
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
};

// Obtener turnos en un rango de fechas
export const getTurnosByRangoFechas = (fechaInicio, fechaFin) => {
  const turnos = getAllTurnos();
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  return turnos
    .filter((t) => {
      const fechaTurno = new Date(t.fechaHora);
      return fechaTurno >= inicio && fechaTurno <= fin;
    })
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
};

// Crear nuevo turno
export const createTurno = (turnoData) => {
  try {
    const turnos = getAllTurnos();

    // Validar superposición de turnos
    const fechaTurno = new Date(turnoData.fechaHora);
    const duracion = turnoData.duracion || 30; // Duración por defecto 30 minutos
    const finTurno = new Date(fechaTurno.getTime() + duracion * 60000);

    const haySuperposicion = turnos.some((t) => {
      if (t.estado === "cancelado") return false;

      const inicioExistente = new Date(t.fechaHora);
      const finExistente = new Date(
        inicioExistente.getTime() + (t.duracion || 30) * 60000
      );

      return (
        (fechaTurno >= inicioExistente && fechaTurno < finExistente) ||
        (finTurno > inicioExistente && finTurno <= finExistente) ||
        (fechaTurno <= inicioExistente && finTurno >= finExistente)
      );
    });

    if (haySuperposicion) {
      throw new Error("Ya existe un turno en ese horario");
    }

    const nuevoTurno = {
      id: generateId(),
      ...turnoData,
      estado: turnoData.estado || "pendiente",
      recordatorioEnviado: false,
      fechaCreacion: new Date().toISOString(),
    };

    turnos.push(nuevoTurno);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(turnos));
    return nuevoTurno;
  } catch (error) {
    console.error("Error al crear turno:", error);
    throw error;
  }
};

// Actualizar turno
export const updateTurno = (id, turnoData) => {
  try {
    const turnos = getAllTurnos();
    const index = turnos.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error("Turno no encontrado");
    }

    // Si se cambia la fecha/hora, validar superposición
    if (
      turnoData.fechaHora &&
      turnoData.fechaHora !== turnos[index].fechaHora
    ) {
      const fechaTurno = new Date(turnoData.fechaHora);
      const duracion = turnoData.duracion || turnos[index].duracion || 30;
      const finTurno = new Date(fechaTurno.getTime() + duracion * 60000);

      const haySuperposicion = turnos.some((t, i) => {
        if (i === index || t.estado === "cancelado") return false;

        const inicioExistente = new Date(t.fechaHora);
        const finExistente = new Date(
          inicioExistente.getTime() + (t.duracion || 30) * 60000
        );

        return (
          (fechaTurno >= inicioExistente && fechaTurno < finExistente) ||
          (finTurno > inicioExistente && finTurno <= finExistente) ||
          (fechaTurno <= inicioExistente && finTurno >= finExistente)
        );
      });

      if (haySuperposicion) {
        throw new Error("Ya existe un turno en ese horario");
      }
    }

    turnos[index] = {
      ...turnos[index],
      ...turnoData,
      id, // Mantener el ID original
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(turnos));
    return turnos[index];
  } catch (error) {
    console.error("Error al actualizar turno:", error);
    throw error;
  }
};

// Actualizar solo el estado del turno
export const updateEstadoTurno = (id, estado) => {
  return updateTurno(id, { estado });
};

// Eliminar turno
export const deleteTurno = (id) => {
  try {
    const turnos = getAllTurnos();
    const filteredTurnos = turnos.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTurnos));
    return true;
  } catch (error) {
    console.error("Error al eliminar turno:", error);
    throw error;
  }
};

// Obtener turnos próximos (siguientes 7 días)
export const getTurnosProximos = () => {
  const turnos = getAllTurnos();
  const hoy = new Date();
  const enUnaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

  return turnos
    .filter((t) => {
      const fechaTurno = new Date(t.fechaHora);
      return (
        fechaTurno >= hoy &&
        fechaTurno <= enUnaSemana &&
        t.estado !== "cancelado"
      );
    })
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
};
