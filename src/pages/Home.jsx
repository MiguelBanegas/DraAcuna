import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUsers, FaStethoscope, FaCalendarAlt, FaCalendarCheck } from 'react-icons/fa';
import { usePacientes } from '../context/PacientesContext';
import { useConsultas } from '../context/ConsultasContext';
import { useTurnos } from '../context/TurnosContext';

const Home = () => {
  const { pacientes } = usePacientes();
  const { consultas } = useConsultas();
  const { obtenerTurnosPorFecha, obtenerTurnosProximos } = useTurnos();

  // Obtener turnos del día
  const turnosHoy = obtenerTurnosPorFecha(new Date());
  const turnosProximos = obtenerTurnosProximos();

  // Obtener consultas del mes actual
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const consultasMes = consultas.filter(c => {
    const fechaConsulta = new Date(c.fechaHora);
    return fechaConsulta >= primerDiaMes;
  });

  return (
    <Container>
      <h1 className="mb-4">Dashboard</h1>

      {/* Estadísticas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaUsers size={40} className="text-primary mb-2" />
              <h3>{pacientes.length}</h3>
              <p className="text-muted mb-0">Total Pacientes</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaCalendarAlt size={40} className="text-success mb-2" />
              <h3>{turnosHoy.length}</h3>
              <p className="text-muted mb-0">Turnos Hoy</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaStethoscope size={40} className="text-info mb-2" />
              <h3>{consultasMes.length}</h3>
              <p className="text-muted mb-0">Consultas del Mes</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaCalendarCheck size={40} className="text-warning mb-2" />
              <h3>{turnosProximos.length}</h3>
              <p className="text-muted mb-0">Próximos Turnos</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Accesos rápidos */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Accesos Rápidos</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3 mb-md-0">
                  <Link to="/pacientes/nuevo" className="btn btn-primary w-100">
                    <FaUsers className="me-2" />
                    Nuevo Paciente
                  </Link>
                </Col>
                <Col md={4} className="mb-3 mb-md-0">
                  <Link to="/consultas/nueva" className="btn btn-info w-100">
                    <FaStethoscope className="me-2" />
                    Nueva Consulta
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/turnos/nuevo" className="btn btn-success w-100">
                    <FaCalendarAlt className="me-2" />
                    Nuevo Turno
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Turnos de hoy */}
      {turnosHoy.length > 0 && (
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Turnos de Hoy</h5>
              </Card.Header>
              <Card.Body>
                <div className="list-group">
                  {turnosHoy.slice(0, 5).map(turno => {
                    const paciente = pacientes.find(p => p.id === turno.pacienteId);
                    const hora = new Date(turno.fechaHora).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    const estadoColor = {
                      pendiente: 'warning',
                      confirmado: 'success',
                      cancelado: 'danger',
                      completado: 'secondary'
                    };

                    return (
                      <div key={turno.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{hora}</strong> - {paciente?.nombreCompleto || 'Paciente no encontrado'}
                          <br />
                          <small className="text-muted">{turno.motivo}</small>
                        </div>
                        <span className={`badge bg-${estadoColor[turno.estado]}`}>
                          {turno.estado}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {turnosHoy.length > 5 && (
                  <div className="text-center mt-3">
                    <Link to="/turnos" className="btn btn-sm btn-outline-primary">
                      Ver todos los turnos
                    </Link>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Home;
