import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as turnosService from '../services/turnosService';

const TurnosContext = createContext();

export const useTurnos = () => {
  const context = useContext(TurnosContext);
  if (!context) {
    throw new Error('useTurnos debe ser usado dentro de un TurnosProvider');
  }
  return context;
};

export const TurnosProvider = ({ children }) => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarTurnos = useCallback(async (fechaInicio, fechaFin) => {
    setLoading(true);
    try {
      const data = await turnosService.getAllTurnos(fechaInicio, fechaFin);
      setTurnos(data);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTurnos();
  }, [cargarTurnos]);

  const agregarTurno = async (turnoData) => {
    try {
      const nuevoTurno = await turnosService.createTurno(turnoData);
      setTurnos(prev => [...prev, nuevoTurno]);
      return nuevoTurno;
    } catch (error) {
      console.error('Error al agregar turno:', error);
      throw error;
    }
  };

  const actualizarTurno = async (id, turnoData) => {
    try {
      const turnoActualizado = await turnosService.updateTurno(id, turnoData);
      setTurnos(prev => prev.map(t => t.id == id ? turnoActualizado : t));
      return turnoActualizado;
    } catch (error) {
      console.error('Error al actualizar turno:', error);
      throw error;
    }
  };

  const eliminarTurno = async (id) => {
    try {
      await turnosService.deleteTurno(id);
      setTurnos(prev => prev.filter(t => t.id != id));
    } catch (error) {
      console.error('Error al eliminar turno:', error);
      throw error;
    }
  };

  const obtenerTurnosPorPaciente = async (pacienteId) => {
    try {
      return await turnosService.getTurnosByPaciente(pacienteId);
    } catch (error) {
      console.error('Error al obtener turnos por paciente:', error);
      return [];
    }
  };

  const obtenerTurnosPorFecha = (fecha) => {
    const fechaBuscada = new Date(fecha);
    fechaBuscada.setHours(0, 0, 0, 0);
    
    return turnos.filter(turno => {
      const fechaTurno = new Date(turno.fechaHora);
      fechaTurno.setHours(0, 0, 0, 0);
      return fechaTurno.getTime() === fechaBuscada.getTime();
    });
  };

  const obtenerTurnosProximos = () => {
    const ahora = new Date();
    return turnos
      .filter(turno => new Date(turno.fechaHora) >= ahora)
      .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  };

  const value = {
    turnos,
    loading,
    cargarTurnos,
    agregarTurno,
    actualizarTurno,
    eliminarTurno,
    obtenerTurnosPorPaciente,
    obtenerTurnosPorFecha,
    obtenerTurnosProximos
  };

  return <TurnosContext.Provider value={value}>{children}</TurnosContext.Provider>;
};
