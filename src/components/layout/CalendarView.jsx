import { useMemo, useState } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MiniCalendar from './MiniCalendar';
import TurnosDiaModal from './TurnosDiaModal';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const addMonths = (date, monthsToAdd) => {
  const nextDate = new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1);
  return {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth(),
  };
};

const CalendarView = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const [windowOffset, setWindowOffset] = useState(0);
  const maxWindowOffset = 2;

  // Estado del modal
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTurnos, setSelectedTurnos] = useState([]);

  // Manejar clic en un día
  const handleDayClick = (fecha, turnos) => {
    setSelectedDate(fecha);
    setSelectedTurnos(turnos);
    setShowModal(true);
  };

  const visibleMonths = useMemo(
    () => {
      const baseMonth = new Date(currentYear, currentMonth, 1);
      return [-1, 0, 1].map((relativeOffset) => addMonths(baseMonth, windowOffset + relativeOffset));
    },
    [currentMonth, currentYear, windowOffset],
  );

  const firstVisibleMonth = visibleMonths[0];
  const lastVisibleMonth = visibleMonths[visibleMonths.length - 1];
  const visibleRangeLabel = `${MONTH_NAMES[firstVisibleMonth.month]} ${firstVisibleMonth.year} - ${MONTH_NAMES[lastVisibleMonth.month]} ${lastVisibleMonth.year}`;

  return (
    <>
      <div className="calendar-view-toolbar">
        <div>
          <h5 className="mb-1">Calendario de turnos</h5>
          <small className="text-muted">{visibleRangeLabel}</small>
        </div>
        <div className="calendar-view-actions">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setWindowOffset((currentOffset) => Math.max(0, currentOffset - 1))}
            disabled={windowOffset === 0}
            aria-label="Ver meses anteriores"
          >
            <FaChevronLeft />
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setWindowOffset((currentOffset) => Math.min(maxWindowOffset, currentOffset + 1))}
            disabled={windowOffset === maxWindowOffset}
            aria-label="Ver meses siguientes"
          >
            <FaChevronRight />
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        {visibleMonths.map(({ year, month }, index) => (
          <Col key={`${year}-${month}`} xs={12} md={6} lg={4} className={index < 2 ? 'mb-3 mb-lg-0' : ''}>
            <MiniCalendar year={year} month={month} onDayClick={handleDayClick} />
          </Col>
        ))}
      </Row>

      <TurnosDiaModal
        show={showModal}
        onHide={() => setShowModal(false)}
        fecha={selectedDate}
        turnos={selectedTurnos}
      />
    </>
  );
};

export default CalendarView;
