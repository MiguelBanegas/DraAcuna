import { useState } from 'react';
import { Table, Button, Form, InputGroup, Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTurnos } from '../../context/TurnosContext';
import { usePacientes } from '../../context/PacientesContext';

const TurnosList = () => {
  const navigate = useNavigate();
  const { turnos, eliminarTurno, cambiarEstadoTurno } = useTurnos();
  const { pacientes } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');

  // Filtrar turnos
  const turnosFiltrados = turnos.filter(turno => {
    const paciente = pacientes.find(p => p.id === turno.pacienteId);
    const nombrePaciente = paciente?.nombreCompleto || '';
    const dniPaciente = paciente?.dni || '';
    
    const cumpleBusqueda = searchTerm === '' || 
      nombrePaciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dniPaciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      turno.motivo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Comparar solo la fecha sin la hora
    let cumpleFecha = true;
    if (filtroFecha) {
      const fechaTurno = new Date(turno.fechaHora);
      const fechaFiltro = new Date(filtroFecha);
      cumpleFecha = (
        fechaTurno.getFullYear() === fechaFiltro.getFullYear() &&
        fechaTurno.getMonth() === fechaFiltro.getMonth() &&
        fechaTurno.getDate() === fechaFiltro.getDate()
      );
    }
    
    const cumpleEstado = filtroEstado === '' || turno.estado === filtroEstado;
    
    const cumplePaciente = filtroPaciente === '' || turno.pacienteId === filtroPaciente;
    
    return cumpleBusqueda && cumpleFecha && cumpleEstado && cumplePaciente;
  }).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)); // Ordenar por fecha

  const handleDelete = async (id, pacienteNombre) => {
    if (window.confirm(`¿Está seguro de eliminar este turno de ${pacienteNombre}?`)) {
      try {
        await eliminarTurno(id);
      } catch (error) {
        alert('Error al eliminar turno');
      }
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await cambiarEstadoTurno(id, nuevoEstado);
    } catch (error) {
      alert('Error al cambiar estado del turno');
    }
  };

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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

  const estadoIcono = {
    pendiente: FaClock,
    confirmado: FaCheck,
    cancelado: FaTimes,
    completado: FaCheck
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Gestión de Turnos</h2>
            <Button 
              variant="primary" 
              onClick={() => navigate('/turnos/nuevo')}
            >
              <FaPlus className="me-2" />
              Nuevo Turno
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por paciente, DNI o motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filtroPaciente}
                onChange={(e) => setFiltroPaciente(e.target.value)}
              >
                <option value="">Todos los pacientes</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombreCompleto}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Control
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                placeholder="Filtrar por fecha"
              />
            </Col>
            <Col md={3}>
              <Form.Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
                <option value="completado">Completado</option>
              </Form.Select>
            </Col>
          </Row>
          {(searchTerm || filtroFecha || filtroEstado || filtroPaciente) && (
            <Row className="mt-2">
              <Col>
                <Button 
                  size="sm" 
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setFiltroFecha('');
                    setFiltroEstado('');
                    setFiltroPaciente('');
                  }}
                >
                  Limpiar filtros
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Row className="mb-3">
        <Col className="text-end">
          <Badge bg="secondary" className="fs-6">
            {turnosFiltrados.length} turno{turnosFiltrados.length !== 1 ? 's' : ''}
          </Badge>
        </Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          {turnosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                {turnos.length === 0 
                  ? 'No hay turnos registrados' 
                  : 'No se encontraron turnos con los filtros aplicados'}
              </p>
              {turnos.length === 0 && (
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/turnos/nuevo')}
                >
                  <FaPlus className="me-2" />
                  Programar Primer Turno
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Paciente</th>
                    <th>Motivo</th>
                    <th>Duración</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {turnosFiltrados.map((turno) => {
                    const paciente = pacientes.find(p => p.id === turno.pacienteId);
                    const IconoEstado = estadoIcono[turno.estado];
                    return (
                      <tr key={turno.id}>
                        <td>
                          <strong>{formatearFechaHora(turno.fechaHora)}</strong>
                        </td>
                        <td>
                          {paciente ? (
                            <>
                              {paciente.nombreCompleto}
                              <br />
                              <small className="text-muted">{paciente.telefono}</small>
                            </>
                          ) : (
                            <span className="text-muted">Paciente no encontrado</span>
                          )}
                        </td>
                        <td>{turno.motivo}</td>
                        <td>{turno.duracion || 30} min</td>
                        <td>
                          <Badge bg={estadoColor[turno.estado]}>
                            <IconoEstado className="me-1" />
                            {turno.estado}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            {turno.estado === 'pendiente' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleCambiarEstado(turno.id, 'confirmado')}
                                title="Confirmar"
                              >
                                <FaCheck />
                              </Button>
                            )}
                            {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleCambiarEstado(turno.id, 'completado')}
                                title="Marcar como completado"
                              >
                                <FaCheck />
                              </Button>
                            )}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/turnos/${turno.id}/editar`)}
                              title="Editar"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                if (turno.estado !== 'cancelado') {
                                  handleCambiarEstado(turno.id, 'cancelado');
                                } else {
                                  handleDelete(turno.id, paciente?.nombreCompleto || 'paciente');
                                }
                              }}
                              title={turno.estado !== 'cancelado' ? 'Cancelar' : 'Eliminar'}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TurnosList;
