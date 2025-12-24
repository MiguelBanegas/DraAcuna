import API_URL from "../utils/apiConfig";

const getHeaders = () => {
  const token = localStorage.getItem("token");
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
  fechaCreacion: p.fecha_creacion,
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

export const getAllPacientes = async () => {
  try {
    const response = await fetch(`${API_URL}/pacientes`, {
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

export const deletePaciente = async (id) => {
  try {
    const response = await fetch(`${API_URL}/pacientes/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Error al eliminar paciente");
    return true;
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    throw error;
  }
};
