import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import MiniCalendar from './MiniCalendar';
import TurnosDiaModal from './TurnosDiaModal';

const CalendarView = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Calcular mes anterior
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Calcular mes siguiente
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

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

  return (
    <>
      <Row className="mb-4">
        <Col xs={12} md={6} lg={4} className="mb-3 mb-lg-0">
          <MiniCalendar year={prevYear} month={prevMonth} onDayClick={handleDayClick} />
        </Col>
        <Col xs={12} md={6} lg={4} className="mb-3 mb-lg-0">
          <MiniCalendar year={currentYear} month={currentMonth} onDayClick={handleDayClick} />
        </Col>
        <Col xs={12} md={12} lg={4}>
          <MiniCalendar year={nextYear} month={nextMonth} onDayClick={handleDayClick} />
        </Col>
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
