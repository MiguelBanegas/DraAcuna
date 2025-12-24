import API_URL from "../utils/apiConfig";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const mapConsultaFromAPI = (c) => ({
  id: c.id,
  pacienteId: c.paciente_id,
  pacienteNombre: c.paciente_nombre,
  fechaHora: c.fecha_hora,
  motivo: c.motivo,
  diagnostico: c.diagnostico,
  tratamiento: c.tratamiento,
  observaciones: c.observaciones,
  proximaConsulta: c.proxima_consulta,
  signosVitales: c.signos_vitales || {},
  fechaCreacion: c.fecha_creacion,
});

const mapConsultaToAPI = (c) => ({
  paciente_id: c.pacienteId,
  fecha_hora: c.fechaHora,
  motivo: c.motivo,
  diagnostico: c.diagnostico,
  tratamiento: c.tratamiento,
  observaciones: c.observaciones,
  proxima_consulta: c.proximaConsulta,
  signos_vitales: c.signosVitales,
});

export const getAllConsultas = async () => {
  try {
    const response = await fetch(`${API_URL}/consultas`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Error al cargar consultas");
    const data = await response.json();
    return data.map(mapConsultaFromAPI);
  } catch (error) {
    console.error("Error al obtener consultas:", error);
    throw error;
  }
};

export const getConsultasByPaciente = async (pacienteId) => {
  try {
    const response = await fetch(
      `${API_URL}/consultas/paciente/${pacienteId}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error("Error al cargar consultas del paciente");
    const data = await response.json();
    return data.map(mapConsultaFromAPI);
  } catch (error) {
    console.error("Error al obtener consultas del paciente:", error);
    throw error;
  }
};

export const createConsulta = async (consulta) => {
  try {
    const response = await fetch(`${API_URL}/consultas`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(mapConsultaToAPI(consulta)),
    });
    if (!response.ok) throw new Error("Error al crear consulta");
    const data = await response.json();
    return mapConsultaFromAPI(data);
  } catch (error) {
    console.error("Error al crear consulta:", error);
    throw error;
  }
};

export const updateConsulta = async (id, consulta) => {
  try {
    const response = await fetch(`${API_URL}/consultas/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(mapConsultaToAPI(consulta)),
    });
    if (!response.ok) throw new Error("Error al actualizar consulta");
    const data = await response.json();
    return mapConsultaFromAPI(data);
  } catch (error) {
    console.error("Error al actualizar consulta:", error);
    throw error;
  }
};

export const deleteConsulta = async (id) => {
  try {
    const response = await fetch(`${API_URL}/consultas/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Error al eliminar consulta");
    return true;
  } catch (error) {
    console.error("Error al eliminar consulta:", error);
    throw error;
  }
};

export const searchConsultas = async (params) => {
  const { q, pacienteId, fecha } = params;
  let url = `${API_URL}/consultas/search?`;
  if (q) url += `q=${encodeURIComponent(q)}&`;
  if (pacienteId) url += `pacienteId=${pacienteId}&`;
  if (fecha) url += `fecha=${fecha}&`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error("Error al buscar consultas");
    const data = await response.json();
    return data.map(mapConsultaFromAPI);
  } catch (error) {
    console.error("Error al buscar consultas:", error);
    throw error;
  }
};
