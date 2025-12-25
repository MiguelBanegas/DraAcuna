import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ListGroup } from 'react-bootstrap';
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
    const consultaEncontrada = consultas.find(c => c.id == id);
    if (consultaEncontrada) {
      // Deferir setState para evitar setState síncrono en el efecto
      Promise.resolve().then(() => {
        setConsulta(consultaEncontrada);
        const pacienteEncontrado = pacientes.find(p => p.id == consultaEncontrada.pacienteId);
        setPaciente(pacienteEncontrado);
      });
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
                <div className="alert alert-warning mb-0">
                  Paciente no encontrado
                </div>
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
          {/* Signos Vitales */}
          {consulta.signosVitales && (
            consulta.signosVitales.presionArterial?.sistolica ||
            consulta.signosVitales.frecuenciaCardiaca ||
            consulta.signosVitales.temperatura ||
            consulta.signosVitales.peso
          ) && (
            <Card className="mb-3 border-primary">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Signos Vitales</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {consulta.signosVitales.presionArterial?.sistolica && (
                    <Col md={4} className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="fas fa-heartbeat text-danger" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Presión Arterial</small>
                          <strong>{consulta.signosVitales.presionArterial.sistolica}/{consulta.signosVitales.presionArterial.diastolica} mmHg</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {consulta.signosVitales.frecuenciaCardiaca && (
                    <Col md={4} className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="fas fa-heart text-danger" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Frecuencia Cardíaca</small>
                          <strong>{consulta.signosVitales.frecuenciaCardiaca} lpm</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {consulta.signosVitales.temperatura && (
                    <Col md={4} className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="fas fa-thermometer-half text-warning" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Temperatura</small>
                          <strong>{consulta.signosVitales.temperatura} °C</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {consulta.signosVitales.frecuenciaRespiratoria && (
                    <Col md={4} className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="fas fa-lungs text-info" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Frec. Respiratoria</small>
                          <strong>{consulta.signosVitales.frecuenciaRespiratoria} rpm</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {consulta.signosVitales.saturacionO2 && (
                    <Col md={4} className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="fas fa-wind text-primary" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Saturación O₂</small>
                          <strong>{consulta.signosVitales.saturacionO2} %</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {consulta.signosVitales.peso && (
                    <Col md={4} className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="fas fa-weight text-secondary" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Peso</small>
                          <strong>{consulta.signosVitales.peso} kg</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {consulta.signosVitales.talla && (
                    <Col md={4} className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="fas fa-ruler-vertical text-secondary" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">Talla</small>
                          <strong>{consulta.signosVitales.talla} cm</strong>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {consulta.signosVitales.imc && (
                    <Col md={4} className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="fas fa-calculator text-success" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">IMC</small>
                          <strong>{consulta.signosVitales.imc}</strong>
                          <small className={`ms-2 ${
                            consulta.signosVitales.imc < 18.5 ? 'text-warning' :
                            consulta.signosVitales.imc > 24.9 ? 'text-danger' :
                            'text-success'
                          }`}>
                            ({consulta.signosVitales.imc < 18.5 ? 'Bajo' :
                              consulta.signosVitales.imc > 24.9 ? 'Alto' :
                              'Normal'})
                          </small>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>
          )}

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
