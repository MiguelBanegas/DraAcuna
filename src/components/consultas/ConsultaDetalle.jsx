import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ListGroup, Alert } from 'react-bootstrap';
import { FaEdit, FaArrowLeft, FaUser, FaCalendarAlt, FaStethoscope } from 'react-icons/fa';
import { useConsultas } from '../../context/ConsultasContext';
import { usePacientes } from '../../context/PacientesContext';

const ConsultaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { consultas } = useConsultas();
  const { pacientes } = usePacientes();
  
  const [consulta, setConsulta] = useState(null);
  const [paciente, setPaciente] = useState(null);

  useEffect(() => {
    const consultaEncontrada = consultas.find(c => c.id === id);
    if (consultaEncontrada) {
      setConsulta(consultaEncontrada);
      const pacienteEncontrado = pacientes.find(p => p.id === consultaEncontrada.pacienteId);
      setPaciente(pacienteEncontrado);
    } else {
      navigate('/consultas');
    }
  }, [id, consultas, pacientes, navigate]);

  if (!consulta) {
    return null;
  }

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/consultas')}
            className="mb-3"
          >
            <FaArrowLeft className="me-2" />
            Volver a Consultas
          </Button>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Detalle de Consulta</h2>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/consultas/${id}/editar`)}
            >
              <FaEdit className="me-2" />
              Editar
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Información del Paciente */}
        <Col md={4} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Paciente
              </h5>
            </Card.Header>
            <Card.Body>
              {paciente ? (
                <>
                  <h6>{paciente.nombreCompleto}</h6>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">DNI:</span>
                        <strong>{paciente.dni}</strong>
                      </div>
                    </ListGroup.Item>
                    {paciente.telefono && (
                      <ListGroup.Item>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Teléfono:</span>
                          <span>{paciente.telefono}</span>
                        </div>
                      </ListGroup.Item>
                    )}
                    {paciente.obraSocial && (
                      <ListGroup.Item>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Obra Social:</span>
                          <span>{paciente.obraSocial}</span>
                        </div>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                  <div className="mt-3">
                    <Button 
                      size="sm" 
                      variant="outline-primary" 
                      className="w-100"
                      onClick={() => navigate(`/pacientes/${paciente.id}`)}
                    >
                      Ver Historial del Paciente
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="warning" className="mb-0">
                  Paciente no encontrado
                </Alert>
              )}
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" />
                Información de la Consulta
              </h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Fecha y Hora:</span>
                    <strong>{formatearFechaHora(consulta.fechaHora)}</strong>
                  </div>
                </ListGroup.Item>
                {consulta.proximaConsulta && (
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Próxima Consulta:</span>
                      <span>{formatearFecha(consulta.proximaConsulta)}</span>
                    </div>
                  </ListGroup.Item>
                )}
                <ListGroup.Item>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Registrada:</span>
                    <small>{formatearFechaHora(consulta.fechaCreacion)}</small>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Detalles de la Consulta */}
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header>
              <h5 className="mb-0">
                <FaStethoscope className="me-2" />
                Motivo de Consulta
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {consulta.motivo}
              </p>
            </Card.Body>
          </Card>

          {consulta.diagnostico && (
            <Card className="mb-3">
              <Card.Header>
                <h5 className="mb-0">Diagnóstico</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {consulta.diagnostico}
                </p>
              </Card.Body>
            </Card>
          )}

          {consulta.tratamiento && (
            <Card className="mb-3">
              <Card.Header>
                <h5 className="mb-0">Tratamiento / Indicaciones</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {consulta.tratamiento}
                </p>
              </Card.Body>
            </Card>
          )}

          {consulta.observaciones && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Observaciones</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {consulta.observaciones}
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ConsultaDetalle;
