import API_URL from "../utils/apiConfig";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const mapTurnoFromAPI = (t) => ({
  id: t.id,
  pacienteId: t.paciente_id,
  pacienteNombre: t.paciente_nombre,
  fechaHora: t.fecha_hora,
  duracion: t.duracion,
  estado: t.estado,
  motivo: t.motivo,
  observaciones: t.observaciones,
  fechaCreacion: t.fecha_creacion,
});

const mapTurnoToAPI = (t) => ({
  paciente_id: t.pacienteId,
  fecha_hora: t.fechaHora,
  duracion: parseInt(t.duracion),
  estado: t.estado,
  motivo: t.motivo,
  observaciones: t.observaciones,
});

export const getAllTurnos = async (fechaInicio, fechaFin) => {
  try {
    let url = `${API_URL}/turnos`;
    if (fechaInicio && fechaFin) {
      url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error("Error al cargar turnos");
    const data = await response.json();
    return data.map(mapTurnoFromAPI);
  } catch (error) {
    console.error("Error al obtener turnos:", error);
    throw error;
  }
};

export const createTurno = async (turno) => {
  try {
    const response = await fetch(`${API_URL}/turnos`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(mapTurnoToAPI(turno)),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al crear turno");
    }
    const data = await response.json();
    return mapTurnoFromAPI(data);
  } catch (error) {
    console.error("Error al crear turno:", error);
    throw error;
  }
};

export const updateTurno = async (id, turno) => {
  try {
    const response = await fetch(`${API_URL}/turnos/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(mapTurnoToAPI(turno)),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al actualizar turno");
    }
    const data = await response.json();
    return mapTurnoFromAPI(data);
  } catch (error) {
    console.error("Error al actualizar turno:", error);
    throw error;
  }
};

export const deleteTurno = async (id) => {
  try {
    const response = await fetch(`${API_URL}/turnos/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Error al eliminar turno");
    return true;
  } catch (error) {
    console.error("Error al eliminar turno:", error);
    throw error;
  }
};

export const getTurnosByPaciente = async (pacienteId) => {
  try {
    const response = await fetch(`${API_URL}/turnos/paciente/${pacienteId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Error al cargar turnos del paciente");
    const data = await response.json();
    return data.map(mapTurnoFromAPI);
  } catch (error) {
    console.error("Error al obtener turnos del paciente:", error);
    throw error;
  }
};
