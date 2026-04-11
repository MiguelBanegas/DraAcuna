import { Card, Badge } from 'react-bootstrap';
import { useTurnos } from '../../context/TurnosContext';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatDateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const MiniCalendar = ({ year, month, onDayClick, feriadosMap = new Map(), agendaExcepcionesMap = new Map() }) => {
  const { turnos } = useTurnos();

  // Obtener el primer día del mes y el último día
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo

  // Nombres de los días de la semana
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Nombre del mes
  // Función para obtener turnos de un día específico
  const getTurnosDia = (day) => {
    return turnos.filter(turno => {
      const turnoDate = new Date(turno.fechaHora);
      return turnoDate.getDate() === day &&
             turnoDate.getMonth() === month &&
             turnoDate.getFullYear() === year &&
             turno.estado !== 'cancelado';
    });
  };

  // Función para contar turnos en un día específico
  const getTurnosCount = (day) => {
    return getTurnosDia(day).length;
  };

  // Verificar si es el día actual
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
           month === today.getMonth() &&
           year === today.getFullYear();
  };

  // Crear array de días
  const days = [];
  
  // Días vacíos al inicio
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="mini-calendar-day empty"></div>);
  }

  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const turnosCount = getTurnosCount(day);
    const today = isToday(day);
    const turnosDia = getTurnosDia(day);
    const feriado = feriadosMap.get(formatDateKey(year, month, day));
    const agendaExcepcion = agendaExcepcionesMap.get(formatDateKey(year, month, day));

    days.push(
      <div
        key={day}
        className={`mini-calendar-day ${today ? 'today' : ''} ${turnosCount > 0 ? 'has-turnos' : ''} ${feriado ? 'is-holiday' : ''} ${agendaExcepcion ? 'has-exception' : ''}`}
        onClick={() => {
          if (onDayClick) {
            const fecha = new Date(year, month, day);
            onDayClick(fecha, turnosDia);
          }
        }}
        style={{ cursor: turnosCount > 0 || onDayClick ? 'pointer' : 'default' }}
        title={
          agendaExcepcion
            ? `${agendaExcepcion.tipo.replace('_', ' ')}${agendaExcepcion.motivo ? `: ${agendaExcepcion.motivo}` : ''}`
            : feriado
              ? `${feriado.nombre} (${feriado.tipo})`
              : undefined
        }
      >
        <div className="day-number">{day}</div>
        {agendaExcepcion && (
          <div className="exception-indicator" aria-label={`Excepción de agenda: ${agendaExcepcion.tipo}`}>
            E
          </div>
        )}
        {feriado && (
          <div className="holiday-indicator" aria-label={`Feriado: ${feriado.nombre}`}>
            F
          </div>
        )}
        {turnosCount > 0 && (
          <Badge bg="primary" pill className="turnos-badge">
            {turnosCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="shadow-sm h-100">
      <Card.Header className="bg-light">
        <h6 className="mb-0 text-center">{MONTH_NAMES[month]} {year}</h6>
      </Card.Header>
      <Card.Body className="p-2">
        <div className="mini-calendar">
          {/* Días de la semana */}
          <div className="mini-calendar-header">
            {daysOfWeek.map(day => (
              <div key={day} className="day-name">{day}</div>
            ))}
          </div>
          {/* Días del mes */}
          <div className="mini-calendar-grid">
            {days}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MiniCalendar;
