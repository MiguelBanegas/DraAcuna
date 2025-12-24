import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as consultasService from '../services/consultasService';

const ConsultasContext = createContext();

export const useConsultas = () => {
  const context = useContext(ConsultasContext);
  if (!context) {
    throw new Error('useConsultas debe ser usado dentro de un ConsultasProvider');
  }
  return context;
};

export const ConsultasProvider = ({ children }) => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarConsultas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await consultasService.getAllConsultas();
      setConsultas(data);
    } catch (error) {
      console.error('Error al cargar consultas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Comentado para evitar cargar todas las consultas al inicio, 
  // cumpliendo con el nuevo criterio de buscador bajo demanda.
  /*
  useEffect(() => {
    cargarConsultas();
  }, [cargarConsultas]);
  */

  const agregarConsulta = async (consultaData) => {
    try {
      const nuevaConsulta = await consultasService.createConsulta(consultaData);
      setConsultas(prev => [nuevaConsulta, ...prev]);
      return nuevaConsulta;
    } catch (error) {
      console.error('Error al agregar consulta:', error);
      throw error;
    }
  };

  const actualizarConsulta = async (id, consultaData) => {
    try {
      const consultaActualizada = await consultasService.updateConsulta(id, consultaData);
      setConsultas(prev => prev.map(c => c.id == id ? consultaActualizada : c));
      return consultaActualizada;
    } catch (error) {
      console.error('Error al actualizar consulta:', error);
      throw error;
    }
  };

  const eliminarConsulta = async (id) => {
    try {
      await consultasService.deleteConsulta(id);
      setConsultas(prev => prev.filter(c => c.id != id));
    } catch (error) {
      console.error('Error al eliminar consulta:', error);
      throw error;
    }
  };

  const buscarConsultas = async (params) => {
    try {
      const data = await consultasService.searchConsultas(params);
      setConsultas(data);
      return data;
    } catch (error) {
      console.error('Error al buscar consultas:', error);
      return [];
    }
  };

  const value = {
    consultas,
    loading,
    cargarConsultas,
    agregarConsulta,
    actualizarConsulta,
    eliminarConsulta,
    buscarConsultas
  };

  return <ConsultasContext.Provider value={value}>{children}</ConsultasContext.Provider>;
};
