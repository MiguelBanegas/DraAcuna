import API_URL from "../utils/apiConfig";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  //console.log("=== VERSION NUEVA DEL FRONT ===");
  //console.log("TOKEN:", token);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const mapPacienteFromAPI = (p) => ({
  id: p.id,
  nombreCompleto: p.nombre_completo,
  dni: p.dni,
  fechaNacimiento: p.fecha_nacimiento,
  genero: p.genero,
  telefono: p.telefono,
  email: p.email,
  direccion: p.direccion,
  obraSocial: p.obra_social,
  numeroAfiliado: p.numero_afiliado,
  fecha_registro: p.fecha_registro,
  activo: p.activo !== false,
});

const mapPacienteToAPI = (p) => ({
  nombre_completo: p.nombreCompleto,
  dni: p.dni,
  fecha_nacimiento: p.fechaNacimiento,
  genero: p.genero,
  telefono: p.telefono,
  email: p.email,
  direccion: p.direccion,
  obra_social: p.obraSocial,
  numero_afiliado: p.numeroAfiliado,
});

export const getAllPacientes = async (includeInactivos = false) => {
  //console.log("Cargando pacientes...");
  try {
    const response = await fetch(`${API_URL}/pacientes?includeInactivos=${includeInactivos}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Error al cargar pacientes");
    const data = await response.json();
    return data.map(mapPacienteFromAPI);
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    throw error;
  }
};

export const getPacienteById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/pacientes/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Paciente no encontrado");
    const data = await response.json();
    return mapPacienteFromAPI(data);
  } catch (error) {
    console.error("Error al obtener paciente:", error);
    throw error;
  }
};

export const createPaciente = async (paciente) => {
  try {
    const response = await fetch(`${API_URL}/pacientes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(mapPacienteToAPI(paciente)),
    });
    if (!response.ok) throw new Error("Error al crear paciente");
    const data = await response.json();
    return mapPacienteFromAPI(data);
  } catch (error) {
    console.error("Error al crear paciente:", error);
    throw error;
  }
};

export const updatePaciente = async (id, paciente) => {
  try {
    const response = await fetch(`${API_URL}/pacientes/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(mapPacienteToAPI(paciente)),
    });
    if (!response.ok) throw new Error("Error al actualizar paciente");
    const data = await response.json();
    return mapPacienteFromAPI(data);
  } catch (error) {
    console.error("Error al actualizar paciente:", error);
    throw error;
  }
};

export const updatePacienteEstado = async (id, activo) => {
  try {
    const response = await fetch(`${API_URL}/pacientes/${id}/estado`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ activo }),
    });
    if (!response.ok) {
      let detail = "Error al actualizar el estado del paciente";
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          detail = errorData.error;
        }
      } catch {
        // ignore parse error and keep fallback message
      }
      throw new Error(detail);
    }
    const data = await response.json();
    return mapPacienteFromAPI(data);
  } catch (error) {
    console.error("Error al actualizar estado de paciente:", error);
    throw error;
  }
};

export const deletePaciente = async (id) => updatePacienteEstado(id, false);

export const searchPacientes = async (q, limit = 30, includeInactivos = false) => {
  try {
    const response = await fetch(`${API_URL}/pacientes?q=${encodeURIComponent(q)}&limit=${limit}&includeInactivos=${includeInactivos}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Error al buscar pacientes');
    const data = await response.json();
    return data.map(mapPacienteFromAPI);
  } catch (error) {
    console.error('Error en searchPacientes:', error);
    throw error;
  }
};
