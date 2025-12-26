import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCalendarPlus, FaCalendarAlt, FaClock, FaUserPlus, FaStethoscope, FaFileMedical, FaUsers, FaUserMd } from 'react-icons/fa';
import { usePacientes } from '../context/PacientesContext';
import { useTurnos } from '../context/TurnosContext';
import { useAuth } from '../context/AuthContext';
import PublicHome from '../components/home/PublicHome';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { pacientes } = usePacientes();
  const { obtenerTurnosPorFecha, obtenerTurnosProximos } = useTurnos();

  // Si no está autenticado, mostrar la Home pública
  if (!isAuthenticated()) {
    return <PublicHome />;
  }

  // Obtener turnos del día para el dashboard privado
  const turnosHoy = obtenerTurnosPorFecha(new Date());
  const turnosProximos = obtenerTurnosProximos();

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
    <Container className="py-2 fade-in">
      {/* Sección Hero / Bienvenida */}
      <div className="bg-primary text-white p-5 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" 
           style={{ 
             background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
             border: 'none'
           }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: '0.1' }}>
          <FaUserMd size={200} />
        </div>
        <Row className="align-items-center position-relative" style={{ zIndex: 1 }}>
          <Col md={8}>
            <h1 className="display-5 fw-bold mb-2 text-white">¡Bienvenida, Dra. Acuña!</h1>
            <p className="lead mb-0 opacity-75">Panel de gestión integral de su consultorio médico.</p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <Badge bg="light" text="dark" className="fs-6 py-2 px-3 shadow-sm border-0">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Badge>
          </Col>
        </Row>
      </div>

      {/* Estadísticas Rápidas */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center p-4">
              <div className="bg-primary-subtle text-primary p-3 rounded-3 me-3">
                <FaUsers size={28} />
              </div>
              <div>
                <h6 className="text-secondary mb-0">Total Pacientes</h6>
                <h3 className="mb-0 fw-bold">{pacientes.length}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center p-4">
              <div className="bg-success-subtle text-success p-3 rounded-3 me-3">
                <FaCalendarAlt size={28} />
              </div>
              <div>
                <h6 className="text-secondary mb-0">Turnos para Hoy</h6>
                <h3 className="mb-0 fw-bold">{turnosHoy.length}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center p-4">
              <div className="bg-info-subtle text-info p-3 rounded-3 me-3">
                <FaStethoscope size={28} />
              </div>
              <div>
                <h6 className="text-secondary mb-0">Agenda Total</h6>
                <h3 className="mb-0 fw-bold">{turnosProximos.length}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Accesos Rápidos */}
      <h4 className="mb-3 fw-bold text-dark">Accesos Rápidos</h4>
      <Row className="mb-5 g-3">
        <Col md={3} xs={6}>
          <Card as={Link} to="/consultas/nueva" className="text-decoration-none border-0 shadow-sm h-100 text-center p-3 hover-shadow transition-all">
            <Card.Body>
              <FaStethoscope size={36} className="text-primary mb-3" />
              <h6 className="fw-bold text-dark mb-0">Nueva Consulta</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card as={Link} to="/pacientes/nuevo" className="text-decoration-none border-0 shadow-sm h-100 text-center p-3 hover-shadow transition-all">
            <Card.Body>
              <FaUserPlus size={36} className="text-success mb-3" />
              <h6 className="fw-bold text-dark mb-0">Nuevo Paciente</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card as={Link} to="/turnos/nuevo" className="text-decoration-none border-0 shadow-sm h-100 text-center p-3 hover-shadow transition-all">
            <Card.Body>
              <FaCalendarPlus size={36} className="text-warning mb-3" />
              <h6 className="fw-bold text-dark mb-0">Agendar Turno</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card as={Link} to="/historia-clinica" className="text-decoration-none border-0 shadow-sm h-100 text-center p-3 hover-shadow transition-all">
            <Card.Body>
              <FaFileMedical size={36} className="text-info mb-3" />
              <h6 className="fw-bold text-dark mb-0">Historia Clínica</h6>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Dashboard Bottom Section */}
      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Próximos Turnos (Hoy)</h5>
              <Link to="/turnos" className="btn btn-sm btn-link text-decoration-none fw-bold">Ver todos</Link>
            </Card.Header>
            <Card.Body className="pt-0">
              {turnosHoy.length > 0 ? (
                <div className="list-group list-group-flush">
                  {turnosHoy.slice(0, 5).map(turno => {
                    const paciente = pacientes.find(p => p.id === turno.pacienteId);
                    return (
                      <div key={turno.id} className="list-group-item px-0 py-3 border-light d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-light p-2 rounded text-primary me-3 fw-bold text-center" style={{ minWidth: '70px' }}>
                            {formatearHora(turno.fechaHora)}
                          </div>
                          <div>
                            <div className="fw-bold text-dark mb-0">{paciente?.nombreCompleto || 'Paciente'}</div>
                            <small className="text-muted">{turno.motivo}</small>
                          </div>
                        </div>
                        <Badge bg={estadoColor[turno.estado]} className="text-capitalize px-3">
                          {turno.estado}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No hay más turnos para hoy.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="border-0 shadow-sm bg-light h-100">
            <Card.Body className="d-flex flex-column justify-content-center text-center p-4">
              <div className="mb-3 opacity-50">
                <FaCalendarAlt size={60} className="text-primary" />
              </div>
              <h5 className="fw-bold">Gestión de Agenda</h5>
              <p className="text-muted mb-4 small">
                Consulte el calendario mensual completo, gestione disponibilidad y filtre turnos por estado o paciente.
              </p>
              <Button as={Link} to="/turnos" variant="primary" className="mx-auto rounded-pill px-5 py-2 fw-bold shadow-sm">
                Abrir Agenda
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
