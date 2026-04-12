import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as pacientesService from '../services/pacientesService';
import { matchTokensInFields, tokenizeSearch } from '../utils/search';

const PacientesContext = createContext();

export const usePacientes = () => {
  const context = useContext(PacientesContext);
  if (!context) {
    throw new Error('usePacientes debe ser usado dentro de un PacientesProvider');
  }
  return context;
};

export const PacientesProvider = ({ children }) => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pacientesService.getAllPacientes(true);
      setPacientes(data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  const agregarPaciente = async (pacienteData) => {
    try {
      const nuevoPaciente = await pacientesService.createPaciente(pacienteData);
      setPacientes(prev => [...prev, nuevoPaciente]);
      return nuevoPaciente;
    } catch (error) {
      console.error('Error al agregar paciente:', error);
      throw error;
    }
  };

  const actualizarPaciente = async (id, pacienteData) => {
    try {
      const pacienteActualizado = await pacientesService.updatePaciente(id, pacienteData);
      setPacientes(prev => prev.map(p => p.id == id ? pacienteActualizado : p));
      return pacienteActualizado;
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      throw error;
    }
  };

  const eliminarPaciente = async (id) => {
    try {
      const pacienteActualizado = await pacientesService.deletePaciente(id);
      setPacientes(prev => prev.map(p => p.id == id ? pacienteActualizado : p));
      return pacienteActualizado;
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      throw error;
    }
  };

  const reactivarPaciente = async (id) => {
    try {
      const pacienteActualizado = await pacientesService.updatePacienteEstado(id, true);
      setPacientes(prev => prev.map(p => p.id == id ? pacienteActualizado : p));
      return pacienteActualizado;
    } catch (error) {
      console.error('Error al reactivar paciente:', error);
      throw error;
    }
  };

  const pacientesActivos = pacientes.filter((p) => p.activo !== false);

  const buscarPacientes = (term) => {
    const tokens = tokenizeSearch(term);
    if (tokens.length === 0) {
      return pacientesActivos;
    }
    return pacientesActivos.filter((p) =>
      matchTokensInFields(tokens, [p.nombreCompleto, p.dni])
    );
  };

  const value = {
    pacientes,
    pacientesActivos,
    loading,
    cargarPacientes,
    agregarPaciente,
    actualizarPaciente,
    eliminarPaciente,
    reactivarPaciente,
    buscarPacientes
  };

  return <PacientesContext.Provider value={value}>{children}</PacientesContext.Provider>;
};
