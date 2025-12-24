import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as historiaClinicaService from '../services/historiaClinicaService';

const HistoriaClinicaContext = createContext();

export const useHistoriaClinica = () => {
  const context = useContext(HistoriaClinicaContext);
  if (!context) {
    throw new Error('useHistoriaClinica debe ser usado dentro de un HistoriaClinicaProvider');
  }
  return context;
};

export const HistoriaClinicaProvider = ({ children }) => {
  const [historiasClinicas, setHistoriasClinicas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarHistorias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await historiaClinicaService.getAllHistoriasClinicas();
      setHistoriasClinicas(data);
    } catch (error) {
      console.error('Error al cargar historias clínicas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorias();
  }, [cargarHistorias]);

  const obtenerHistoriaClinicaPorPaciente = async (pacienteId) => {
    try {
      return await historiaClinicaService.getHistoriaClinicaByPaciente(pacienteId);
    } catch (error) {
      console.error('Error al obtener historia clínica por paciente:', error);
      return null;
    }
  };

  const agregarHistoriaClinica = async (historiaData) => {
    try {
      const nuevaHistoria = await historiaClinicaService.createHistoriaClinica(historiaData);
      setHistoriasClinicas(prev => [...prev, nuevaHistoria]);
      return nuevaHistoria;
    } catch (error) {
      console.error('Error al agregar historia clínica:', error);
      throw error;
    }
  };

  const actualizarHistoriaClinica = async (id, historiaData) => {
    try {
      const historiaActualizada = await historiaClinicaService.updateHistoriaClinica(id, historiaData);
      setHistoriasClinicas(prev => prev.map(h => h.id == id ? historiaActualizada : h));
      return historiaActualizada;
    } catch (error) {
      console.error('Error al actualizar historia clínica:', error);
      throw error;
    }
  };

  const value = {
    historiasClinicas,
    loading,
    cargarHistorias,
    obtenerHistoriaClinicaPorPaciente,
    agregarHistoriaClinica,
    actualizarHistoriaClinica
  };

  return <HistoriaClinicaContext.Provider value={value}>{children}</HistoriaClinicaContext.Provider>;
};
