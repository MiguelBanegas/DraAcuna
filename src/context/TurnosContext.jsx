import { createContext, useContext, useState, useEffect } from 'react';
import * as turnosService from '../services/turnosService';

const TurnosContext = createContext();

export const useTurnos = () => {
  const context = useContext(TurnosContext);
  if (!context) {
    throw new Error('useTurnos debe usarse dentro de TurnosProvider');
  }
  return context;
};

export const TurnosProvider = ({ children }) => {
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState('mes'); // 'dia', 'semana', 'mes'
  const [loading, setLoading] = useState(false);

  // Cargar turnos al iniciar
  useEffect(() => {
    cargarTurnos();
  }, []);

  const cargarTurnos = () => {
    setLoading(true);
    try {
      const data = turnosService.getAllTurnos();
      setTurnos(data);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarTurno = async (turnoData) => {
    try {
      const nuevoTurno = turnosService.createTurno(turnoData);
      setTurnos(prev => [...prev, nuevoTurno]);
      return nuevoTurno;
    } catch (error) {
      console.error('Error al agregar turno:', error);
      throw error;
    }
  };

  const actualizarTurno = async (id, turnoData) => {
    try {
      const turnoActualizado = turnosService.updateTurno(id, turnoData);
      setTurnos(prev => prev.map(t => t.id === id ? turnoActualizado : t));
      return turnoActualizado;
    } catch (error) {
      console.error('Error al actualizar turno:', error);
      throw error;
    }
  };

  const cambiarEstadoTurno = async (id, estado) => {
    try {
      const turnoActualizado = turnosService.updateEstadoTurno(id, estado);
      setTurnos(prev => prev.map(t => t.id === id ? turnoActualizado : t));
      return turnoActualizado;
    } catch (error) {
      console.error('Error al cambiar estado del turno:', error);
      throw error;
    }
  };

  const eliminarTurno = async (id) => {
    try {
      await turnosService.deleteTurno(id);
      setTurnos(prev => prev.filter(t => t.id !== id));
      if (turnoSeleccionado?.id === id) {
        setTurnoSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al eliminar turno:', error);
      throw error;
    }
  };

  const obtenerTurnosPorPaciente = (pacienteId) => {
    return turnosService.getTurnosByPaciente(pacienteId);
  };

  const obtenerTurnosPorFecha = (fecha) => {
    return turnosService.getTurnosByFecha(fecha);
  };

  const obtenerTurnosPorRango = (fechaInicio, fechaFin) => {
    return turnosService.getTurnosByRangoFechas(fechaInicio, fechaFin);
  };

  const obtenerTurnosProximos = () => {
    return turnosService.getTurnosProximos();
  };

  const seleccionarTurno = (turno) => {
    setTurnoSeleccionado(turno);
  };

  const cambiarFechaSeleccionada = (fecha) => {
    setFechaSeleccionada(fecha);
  };

  const cambiarVistaCalendario = (vista) => {
    setVistaCalendario(vista);
  };

  const value = {
    turnos,
    turnoSeleccionado,
    fechaSeleccionada,
    vistaCalendario,
    loading,
    cargarTurnos,
    agregarTurno,
    actualizarTurno,
    cambiarEstadoTurno,
    eliminarTurno,
    obtenerTurnosPorPaciente,
    obtenerTurnosPorFecha,
    obtenerTurnosPorRango,
    obtenerTurnosProximos,
    seleccionarTurno,
    cambiarFechaSeleccionada,
    cambiarVistaCalendario
  };

  return (
    <TurnosContext.Provider value={value}>
      {children}
    </TurnosContext.Provider>
  );
};
