// Servicio para gestionar consultas usando localStorage

const STORAGE_KEY = "consultas";

// Generar ID único
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Obtener todas las consultas
export const getAllConsultas = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener consultas:", error);
    return [];
  }
};

// Obtener consulta por ID
export const getConsultaById = (id) => {
  const consultas = getAllConsultas();
  return consultas.find((c) => c.id === id);
};

// Obtener consultas de un paciente
export const getConsultasByPaciente = (pacienteId) => {
  const consultas = getAllConsultas();
  return consultas
    .filter((c) => c.pacienteId === pacienteId)
    .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora)); // Más recientes primero
};

// Crear nueva consulta
export const createConsulta = (consultaData) => {
  try {
    const consultas = getAllConsultas();
    const nuevaConsulta = {
      id: generateId(),
      ...consultaData,
      fechaCreacion: new Date().toISOString(),
    };
    consultas.push(nuevaConsulta);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consultas));
    return nuevaConsulta;
  } catch (error) {
    console.error("Error al crear consulta:", error);
    throw error;
  }
};

// Actualizar consulta
export const updateConsulta = (id, consultaData) => {
  try {
    const consultas = getAllConsultas();
    const index = consultas.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error("Consulta no encontrada");
    }

    consultas[index] = {
      ...consultas[index],
      ...consultaData,
      id, // Mantener el ID original
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(consultas));
    return consultas[index];
  } catch (error) {
    console.error("Error al actualizar consulta:", error);
    throw error;
  }
};

// Eliminar consulta
export const deleteConsulta = (id) => {
  try {
    const consultas = getAllConsultas();
    const filteredConsultas = consultas.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredConsultas));
    return true;
  } catch (error) {
    console.error("Error al eliminar consulta:", error);
    throw error;
  }
};
