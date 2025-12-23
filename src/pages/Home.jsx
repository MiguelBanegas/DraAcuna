import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCalendarPlus, FaCalendarAlt, FaCalendarCheck, FaClock } from 'react-icons/fa';
import { usePacientes } from '../context/PacientesContext';
import { useTurnos } from '../context/TurnosContext';
import CalendarView from '../components/layout/CalendarView';

const Home = () => {
  const { pacientes } = usePacientes();
  const { obtenerTurnosPorFecha, obtenerTurnosProximos } = useTurnos();

  // Obtener turnos del día
  const turnosHoy = obtenerTurnosPorFecha(new Date());
  const turnosProximos = obtenerTurnosProximos();

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Función para formatear hora
  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estadoColor = {
    pendiente: 'warning',
    confirmado: 'success',
    cancelado: 'danger',
    completado: 'secondary'
  };

  return (
    <Container>
      {/* Turnos de Hoy */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">Turnos de Hoy</h2>
            <Link to="/turnos/nuevo" className="btn btn-success">
              <FaCalendarPlus className="me-2" />
              Nuevo Turno
            </Link>
          </div>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaClock className="me-2" />
                  Agenda de Hoy
                </h5>
                <Badge bg="light" text="dark">{turnosHoy.length}</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {turnosHoy.length > 0 ? (
                <>
                  <div className="list-group list-group-flush">
                    {turnosHoy.map(turno => {
                      const paciente = pacientes.find(p => p.id === turno.pacienteId);
                      const hora = formatearHora(turno.fechaHora);

                      return (
                        <div key={turno.id} className="list-group-item px-0">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                <strong className="me-2" style={{ fontSize: '1.1rem' }}>{hora}</strong>
                                <Badge bg={estadoColor[turno.estado]}>
                                  {turno.estado}
                                </Badge>
                              </div>
                              <div className="text-dark">{paciente?.nombreCompleto || 'Paciente no encontrado'}</div>
                              <small className="text-muted">{turno.motivo}</small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center mt-3">
                    <Link to="/turnos" className="btn btn-outline-primary">
                      Ver todos los turnos
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaCalendarAlt size={40} className="mb-2 opacity-50" />
                  <p className="mb-0">No hay turnos programados para hoy</p>
                  <Link to="/turnos/nuevo" className="btn btn-success mt-3">
                    <FaCalendarPlus className="me-2" />
                    Agendar Turno
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Próximos Turnos */}
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">Próximos Turnos</h2>
            <Link to="/turnos" className="btn btn-primary">
              <FaCalendarAlt className="me-2" />
              Ver Todos los Turnos
            </Link>
          </div>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaCalendarCheck className="me-2" />
                  Turnos Agendados
                </h5>
                <Badge bg="light" text="dark">{turnosProximos.length}</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {turnosProximos.length > 0 ? (
                <>
                  <div className="list-group list-group-flush">
                    {turnosProximos.slice(0, 8).map(turno => {
                      const paciente = pacientes.find(p => p.id === turno.pacienteId);
                      const fecha = formatearFecha(turno.fechaHora);
                      const hora = formatearHora(turno.fechaHora);

                      return (
                        <div key={turno.id} className="list-group-item px-0">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                <strong className="me-2">{fecha}</strong>
                                <span className="text-muted me-2">•</span>
                                <span className="me-2">{hora}</span>
                                <Badge bg={estadoColor[turno.estado]}>
                                  {turno.estado}
                                </Badge>
                              </div>
                              <div className="text-dark">{paciente?.nombreCompleto || 'Paciente no encontrado'}</div>
                              <small className="text-muted">{turno.motivo}</small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {turnosProximos.length > 8 && (
                    <div className="text-center mt-3">
                      <Link to="/turnos" className="btn btn-outline-success">
                        Ver todos los próximos turnos ({turnosProximos.length})
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaCalendarCheck size={40} className="mb-2 opacity-50" />
                  <p className="mb-0">No hay próximos turnos programados</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Calendarios de 3 meses */}
      <CalendarView />
    </Container>
  );
};

export default Home;
