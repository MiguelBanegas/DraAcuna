import { createContext, useContext, useState, useEffect } from 'react';
import * as consultasService from '../services/consultasService';

const ConsultasContext = createContext();

export const useConsultas = () => {
  const context = useContext(ConsultasContext);
  if (!context) {
    throw new Error('useConsultas debe usarse dentro de ConsultasProvider');
  }
  return context;
};

export const ConsultasProvider = ({ children }) => {
  const [consultas, setConsultas] = useState([]);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar consultas al iniciar
  useEffect(() => {
    cargarConsultas();
  }, []);

  const cargarConsultas = () => {
    setLoading(true);
    try {
      const data = consultasService.getAllConsultas();
      setConsultas(data);
    } catch (error) {
      console.error('Error al cargar consultas:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarConsulta = async (consultaData) => {
    try {
      const nuevaConsulta = consultasService.createConsulta(consultaData);
      setConsultas(prev => [...prev, nuevaConsulta]);
      return nuevaConsulta;
    } catch (error) {
      console.error('Error al agregar consulta:', error);
      throw error;
    }
  };

  const actualizarConsulta = async (id, consultaData) => {
    try {
      const consultaActualizada = consultasService.updateConsulta(id, consultaData);
      setConsultas(prev => prev.map(c => c.id === id ? consultaActualizada : c));
      return consultaActualizada;
    } catch (error) {
      console.error('Error al actualizar consulta:', error);
      throw error;
    }
  };

  const eliminarConsulta = async (id) => {
    try {
      await consultasService.deleteConsulta(id);
      setConsultas(prev => prev.filter(c => c.id !== id));
      if (consultaSeleccionada?.id === id) {
        setConsultaSeleccionada(null);
      }
    } catch (error) {
      console.error('Error al eliminar consulta:', error);
      throw error;
    }
  };

  const obtenerConsultasPorPaciente = (pacienteId) => {
    return consultasService.getConsultasByPaciente(pacienteId);
  };

  const seleccionarConsulta = (consulta) => {
    setConsultaSeleccionada(consulta);
  };

  const value = {
    consultas,
    consultaSeleccionada,
    loading,
    cargarConsultas,
    agregarConsulta,
    actualizarConsulta,
    eliminarConsulta,
    obtenerConsultasPorPaciente,
    seleccionarConsulta
  };

  return (
    <ConsultasContext.Provider value={value}>
      {children}
    </ConsultasContext.Provider>
  );
};
