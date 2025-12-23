// Servicio para gestionar pacientes usando localStorage

const STORAGE_KEY = "pacientes";

// Generar ID único
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Obtener todos los pacientes
export const getAllPacientes = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    return [];
  }
};

// Obtener paciente por ID
export const getPacienteById = (id) => {
  const pacientes = getAllPacientes();
  return pacientes.find((p) => p.id === id);
};

// Crear nuevo paciente
export const createPaciente = (pacienteData) => {
  try {
    const pacientes = getAllPacientes();
    const nuevoPaciente = {
      id: generateId(),
      ...pacienteData,
      fechaRegistro: new Date().toISOString(),
    };
    pacientes.push(nuevoPaciente);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));
    return nuevoPaciente;
  } catch (error) {
    console.error("Error al crear paciente:", error);
    throw error;
  }
};

// Actualizar paciente
export const updatePaciente = (id, pacienteData) => {
  try {
    const pacientes = getAllPacientes();
    const index = pacientes.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error("Paciente no encontrado");
    }

    pacientes[index] = {
      ...pacientes[index],
      ...pacienteData,
      id, // Mantener el ID original
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));
    return pacientes[index];
  } catch (error) {
    console.error("Error al actualizar paciente:", error);
    throw error;
  }
};

// Eliminar paciente
export const deletePaciente = (id) => {
  try {
    const pacientes = getAllPacientes();
    const filteredPacientes = pacientes.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPacientes));
    return true;
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    throw error;
  }
};

// Buscar pacientes por nombre o DNI
export const searchPacientes = (query) => {
  const pacientes = getAllPacientes();
  const searchTerm = query.toLowerCase();

  return pacientes.filter(
    (p) =>
      p.nombreCompleto?.toLowerCase().includes(searchTerm) ||
      p.dni?.toLowerCase().includes(searchTerm)
  );
};
