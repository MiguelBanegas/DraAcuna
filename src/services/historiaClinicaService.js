import API_URL from "../utils/apiConfig";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const mapHistoriaFromAPI = (h) => ({
  id: h.id,
  pacienteId: h.paciente_id,
  observacionesMedico: h.observaciones_medico,
  fechaGeneracion: h.fecha_generacion,
  fechaUltimaActualizacion: h.fecha_ultima_actualizacion,
});

const mapHistoriaToAPI = (h) => ({
  paciente_id: h.pacienteId,
  observaciones_medico: h.observacionesMedico,
});

export const getAllHistoriasClinicas = async () => {
  try {
    const response = await fetch(`${API_URL}/historia-clinica`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Error al cargar historias clínicas");
    const data = await response.json();
    return data.map(mapHistoriaFromAPI);
  } catch (error) {
    console.error("Error al obtener historias clínicas:", error);
    throw error;
  }
};

export const getHistoriaClinicaByPaciente = async (pacienteId) => {
  try {
    const response = await fetch(
      `${API_URL}/historia-clinica/paciente/${pacienteId}`,
      { headers: getHeaders() }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return mapHistoriaFromAPI(data);
  } catch (error) {
    console.error("Error al obtener historia clínica:", error);
    return null;
  }
};

export const createHistoriaClinica = async (historia) => {
  try {
    const response = await fetch(`${API_URL}/historia-clinica`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(mapHistoriaToAPI(historia)),
    });
    if (!response.ok) throw new Error("Error al crear historia clínica");
    const data = await response.json();
    return mapHistoriaFromAPI(data);
  } catch (error) {
    console.error("Error al crear historia clínica:", error);
    throw error;
  }
};

export const updateHistoriaClinica = async (id, historia) => {
  try {
    const response = await fetch(`${API_URL}/historia-clinica/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(mapHistoriaToAPI(historia)),
    });
    if (!response.ok) throw new Error("Error al actualizar historia clínica");
    const data = await response.json();
    return mapHistoriaFromAPI(data);
  } catch (error) {
    console.error("Error al actualizar historia clínica:", error);
    throw error;
  }
};
