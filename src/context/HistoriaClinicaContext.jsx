import { createContext, useContext, useState, useEffect } from 'react';
import * as historiaClinicaService from '../services/historiaClinicaService';

const HistoriaClinicaContext = createContext();

export const useHistoriaClinica = () => {
  const context = useContext(HistoriaClinicaContext);
  if (!context) {
    throw new Error('useHistoriaClinica debe usarse dentro de HistoriaClinicaProvider');
  }
  return context;
};

export const HistoriaClinicaProvider = ({ children }) => {
  const [historiasClinicas, setHistoriasClinicas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar historias clínicas al iniciar
  useEffect(() => {
    cargarHistoriasClinicas();
  }, []);

  const cargarHistoriasClinicas = () => {
    setLoading(true);
    try {
      const data = historiaClinicaService.getAllHistoriasClinicas();
      setHistoriasClinicas(data);
    } catch (error) {
      console.error('Error al cargar historias clínicas:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarHistoriaClinica = async (historiaData) => {
    try {
      const nuevaHistoria = historiaClinicaService.createHistoriaClinica(historiaData);
      setHistoriasClinicas(prev => [...prev, nuevaHistoria]);
      return nuevaHistoria;
    } catch (error) {
      console.error('Error al agregar historia clínica:', error);
      throw error;
    }
  };

  const actualizarHistoriaClinica = async (id, historiaData) => {
    try {
      const historiaActualizada = historiaClinicaService.updateHistoriaClinica(id, historiaData);
      setHistoriasClinicas(prev => prev.map(h => h.id === id ? historiaActualizada : h));
      return historiaActualizada;
    } catch (error) {
      console.error('Error al actualizar historia clínica:', error);
      throw error;
    }
  };

  const eliminarHistoriaClinica = async (id) => {
    try {
      await historiaClinicaService.deleteHistoriaClinica(id);
      setHistoriasClinicas(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error('Error al eliminar historia clínica:', error);
      throw error;
    }
  };

  const obtenerHistoriaClinicaPorPaciente = (pacienteId) => {
    return historiaClinicaService.getHistoriaClinicaByPaciente(pacienteId);
  };

  const value = {
    historiasClinicas,
    loading,
    cargarHistoriasClinicas,
    agregarHistoriaClinica,
    actualizarHistoriaClinica,
    eliminarHistoriaClinica,
    obtenerHistoriaClinicaPorPaciente
  };

  return (
    <HistoriaClinicaContext.Provider value={value}>
      {children}
    </HistoriaClinicaContext.Provider>
  );
};
