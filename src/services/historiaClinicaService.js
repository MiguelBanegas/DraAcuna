// Servicio para gestionar historias clínicas usando localStorage

const STORAGE_KEY = "historias_clinicas";

// Generar ID único
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Obtener todas las historias clínicas
export const getAllHistoriasClinicas = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener historias clínicas:", error);
    return [];
  }
};

// Obtener historia clínica por ID
export const getHistoriaClinicaById = (id) => {
  const historias = getAllHistoriasClinicas();
  return historias.find((h) => h.id === id);
};

// Obtener historia clínica de un paciente
export const getHistoriaClinicaByPaciente = (pacienteId) => {
  const historias = getAllHistoriasClinicas();
  return historias.find((h) => h.pacienteId === pacienteId);
};

// Crear nueva historia clínica
export const createHistoriaClinica = (historiaData) => {
  try {
    const historias = getAllHistoriasClinicas();

    // Verificar si ya existe una historia para este paciente
    const existente = historias.find(
      (h) => h.pacienteId === historiaData.pacienteId
    );
    if (existente) {
      throw new Error("Ya existe una historia clínica para este paciente");
    }

    const nuevaHistoria = {
      id: generateId(),
      ...historiaData,
      fechaCreacion: new Date().toISOString(),
      fechaUltimaActualizacion: new Date().toISOString(),
    };

    historias.push(nuevaHistoria);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historias));
    return nuevaHistoria;
  } catch (error) {
    console.error("Error al crear historia clínica:", error);
    throw error;
  }
};

// Actualizar historia clínica
export const updateHistoriaClinica = (id, historiaData) => {
  try {
    const historias = getAllHistoriasClinicas();
    const index = historias.findIndex((h) => h.id === id);

    if (index === -1) {
      throw new Error("Historia clínica no encontrada");
    }

    historias[index] = {
      ...historias[index],
      ...historiaData,
      id, // Mantener el ID original
      fechaUltimaActualizacion: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(historias));
    return historias[index];
  } catch (error) {
    console.error("Error al actualizar historia clínica:", error);
    throw error;
  }
};

// Eliminar historia clínica
export const deleteHistoriaClinica = (id) => {
  try {
    const historias = getAllHistoriasClinicas();
    const filteredHistorias = historias.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistorias));
    return true;
  } catch (error) {
    console.error("Error al eliminar historia clínica:", error);
    throw error;
  }
};
