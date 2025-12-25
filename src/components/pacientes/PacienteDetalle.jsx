import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, ListGroup } from 'react-bootstrap';
import { FaEdit, FaArrowLeft, FaCalendarAlt, FaStethoscope, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaFileMedical } from 'react-icons/fa';
import { usePacientes } from '../../context/PacientesContext';
import { useConsultas } from '../../context/ConsultasContext';
import { useTurnos } from '../../context/TurnosContext';

const PacienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pacientes } = usePacientes();
  const { obtenerConsultasPorPaciente } = useConsultas();
  const { obtenerTurnosPorPaciente } = useTurnos();
  
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [turnos, setTurnos] = useState([]);

  useEffect(() => {
    const fetchDatosPaciente = async () => {
      const pacienteEncontrado = pacientes.find(p => p.id == id);
      if (pacienteEncontrado) {
        setPaciente(pacienteEncontrado);
        
        try {
          const [consultasData, turnosData] = await Promise.all([
            obtenerConsultasPorPaciente(id),
            obtenerTurnosPorPaciente(id)
          ]);
          
          setConsultas(consultasData);
          setTurnos(turnosData);
        } catch (error) {
          console.error("Error al cargar datos adicionales del paciente:", error);
        }
      } else if (pacientes.length > 0) {
        // Solo redirigir si ya intentó cargar pacientes y no lo encontró
        navigate('/pacientes');
      }
    };

    fetchDatosPaciente();
  }, [id, pacientes, navigate, obtenerConsultasPorPaciente, obtenerTurnosPorPaciente]);

  if (!paciente) {
    return null;
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      <Row className="mb-4">
        <Col>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/pacientes')}
            className="mb-3"
          >
            <FaArrowLeft className="me-2" />
            Volver a Pacientes
          </Button>
          <div className="d-flex justify-content-between align-items-center">
            <h2>{paciente.nombreCompleto}</h2>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/pacientes/${id}/editar`)}
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
                Información Personal
              </h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">
                      <FaIdCard className="me-2" />
                      DNI:
                    </span>
                    <strong>{paciente.dni}</strong>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Edad:</span>
                    <strong>{calcularEdad(paciente.fechaNacimiento)} años</strong>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Fecha Nac.:</span>
                    <span>{formatearFecha(paciente.fechaNacimiento)}</span>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Género:</span>
                    <span>{paciente.genero}</span>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">Contacto</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <FaPhone className="me-2 text-primary" />
                  {paciente.telefono}
                </ListGroup.Item>
                {paciente.email && (
                  <ListGroup.Item>
                    <FaEnvelope className="me-2 text-primary" />
                    {paciente.email}
                  </ListGroup.Item>
                )}
                {paciente.direccion && (
                  <ListGroup.Item>
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    {paciente.direccion}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>

          {(paciente.obraSocial || paciente.numeroAfiliado) && (
            <Card className="mt-3">
              <Card.Header>
                <h5 className="mb-0">Cobertura Médica</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  {paciente.obraSocial && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Obra Social:</span>
                        <strong>{paciente.obraSocial}</strong>
                      </div>
                    </ListGroup.Item>
                  )}
                  {paciente.numeroAfiliado && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">N° Afiliado:</span>
                        <span>{paciente.numeroAfiliado}</span>
                      </div>
                    </ListGroup.Item>
                  )}


                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Historial de Consultas y Turnos */}
        <Col md={8}>
          {/* Turnos Próximos */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" />
                Turnos
              </h5>
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => navigate('/turnos/nuevo', { state: { pacienteId: id } })}
              >
                Nuevo Turno
              </Button>
            </Card.Header>
            <Card.Body>
              {turnos.length === 0 ? (
                <p className="text-muted text-center mb-0">No hay turnos registrados</p>
              ) : (
                <ListGroup variant="flush">
                  {turnos.slice(0, 5).map(turno => (
                    <ListGroup.Item key={turno.id}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{formatearFechaHora(turno.fechaHora)}</strong>
                          <br />
                          <small className="text-muted">{turno.motivo}</small>
                        </div>
                        <Badge bg={estadoColor[turno.estado]}>
                          {turno.estado}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
              {turnos.length > 5 && (
                <div className="text-center mt-3">
                  <Button 
                    size="sm" 
                    variant="outline-primary"
                    onClick={() => navigate('/turnos')}
                  >
                    Ver todos los turnos
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Historial de Consultas */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaStethoscope className="me-2" />
                Historial de Consultas
              </h5>
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => navigate('/consultas/nueva', { state: { pacienteId: id } })}
              >
                Nueva Consulta
              </Button>
            </Card.Header>
            <Card.Body>
              {consultas.length === 0 ? (
                <p className="text-muted text-center mb-0">No hay consultas registradas</p>
              ) : (
                <div className="timeline">
                  {consultas.map((consulta, index) => (
                    <Card key={consulta.id} className={index > 0 ? 'mt-3' : ''}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">{formatearFechaHora(consulta.fechaHora)}</h6>
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => navigate(`/consultas/${consulta.id}`)}
                          >
                            Ver detalle
                          </Button>
                        </div>
                        <p className="mb-1">
                          <strong>Motivo:</strong> {consulta.motivo}
                        </p>
                        {consulta.diagnostico && (
                          <p className="mb-1">
                            <strong>Diagnóstico:</strong> {consulta.diagnostico}
                          </p>
                        )}
                        {consulta.tratamiento && (
                          <p className="mb-0">
                            <strong>Tratamiento:</strong> {consulta.tratamiento}
                          </p>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PacienteDetalle;
