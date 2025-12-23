import { createContext, useContext, useState, useEffect } from 'react';
import * as pacientesService from '../services/pacientesService';

const PacientesContext = createContext();

export const usePacientes = () => {
  const context = useContext(PacientesContext);
  if (!context) {
    throw new Error('usePacientes debe usarse dentro de PacientesProvider');
  }
  return context;
};

export const PacientesProvider = ({ children }) => {
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar pacientes al iniciar
  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = () => {
    setLoading(true);
    try {
      const data = pacientesService.getAllPacientes();
      setPacientes(data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarPaciente = async (pacienteData) => {
    try {
      const nuevoPaciente = pacientesService.createPaciente(pacienteData);
      setPacientes(prev => [...prev, nuevoPaciente]);
      return nuevoPaciente;
    } catch (error) {
      console.error('Error al agregar paciente:', error);
      throw error;
    }
  };

  const actualizarPaciente = async (id, pacienteData) => {
    try {
      const pacienteActualizado = pacientesService.updatePaciente(id, pacienteData);
      setPacientes(prev => prev.map(p => p.id === id ? pacienteActualizado : p));
      return pacienteActualizado;
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      throw error;
    }
  };

  const eliminarPaciente = async (id) => {
    try {
      await pacientesService.deletePaciente(id);
      setPacientes(prev => prev.filter(p => p.id !== id));
      if (pacienteSeleccionado?.id === id) {
        setPacienteSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      throw error;
    }
  };

  const buscarPacientes = (query) => {
    return pacientesService.searchPacientes(query);
  };

  const seleccionarPaciente = (paciente) => {
    setPacienteSeleccionado(paciente);
  };

  const value = {
    pacientes,
    pacienteSeleccionado,
    loading,
    cargarPacientes,
    agregarPaciente,
    actualizarPaciente,
    eliminarPaciente,
    buscarPacientes,
    seleccionarPaciente
  };

  return (
    <PacientesContext.Provider value={value}>
      {children}
    </PacientesContext.Provider>
  );
};
