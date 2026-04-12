import { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, InputGroup, Container, Row, Col, Card, Badge, Pagination } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaClock, FaCheckDouble } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTurnos } from '../../context/TurnosContext';
import { usePacientes } from '../../context/PacientesContext';
import Swal from 'sweetalert2';
import CalendarView from '../layout/CalendarView';
import AgendaExcepcionesPanel from './AgendaExcepcionesPanel';
import { matchTokensInFields, tokenizeSearch } from '../../utils/search';

const TurnosList = () => {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const { turnos, eliminarTurno, cambiarEstadoTurno } = useTurnos();
  const { pacientes } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [pendingActionId, setPendingActionId] = useState(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef(null);

  // Auto-focus en el campo de búsqueda al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroFecha, filtroEstado, filtroPaciente]);

  // Filtrar turnos
  const turnosFiltrados = turnos.filter(turno => {
    // Usamos == para evitar problemas de tipos string/number en los IDs
    const paciente = pacientes.find(p => p.id == turno.pacienteId);
    const nombrePaciente = paciente ? (paciente.apellido ? `${paciente.apellido}, ${paciente.nombre}` : paciente.nombreCompleto) : '';
    const dniPaciente = paciente?.dni || '';

    const tokens = tokenizeSearch(searchTerm);
    const cumpleBusqueda = matchTokensInFields(tokens, [
      nombrePaciente,
      dniPaciente,
      turno.motivo || '',
    ]);
    
    // Comparar solo la fecha sin la hora
    let cumpleFecha = true;
    if (filtroFecha) {
      const fechaTurno = new Date(turno.fechaHora);
      // `filtroFecha` viene del input type="date" en formato YYYY-MM-DD.
      // new Date('YYYY-MM-DD') se interpreta como UTC en algunos navegadores,
      // lo que puede desplazar la fecha al día anterior según el huso.
      // Parseamos manualmente para crear una fecha en horario local.
      const parts = filtroFecha.split('-').map(Number);
      const fechaFiltro = new Date(parts[0], parts[1] - 1, parts[2]);
      cumpleFecha = (
        fechaTurno.getFullYear() === fechaFiltro.getFullYear() &&
        fechaTurno.getMonth() === fechaFiltro.getMonth() &&
        fechaTurno.getDate() === fechaFiltro.getDate()
      );
    }
    
    const cumpleEstado = filtroEstado === '' || turno.estado === filtroEstado;
    
    const cumplePaciente = filtroPaciente === '' || String(turno.pacienteId) === String(filtroPaciente);
    
    return cumpleBusqueda && cumpleFecha && cumpleEstado && cumplePaciente;
  }).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));

  const totalPages = Math.max(1, Math.ceil(turnosFiltrados.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, turnosFiltrados.length);
  const turnosPaginados = turnosFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const handleDelete = async (id, pacienteNombre) => {
    if (pendingActionId !== null) {
      return;
    }

    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `Está por eliminar el turno de ${pacienteNombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        setPendingActionId(id);
        try {
          await eliminarTurno(id);
          return true;
        } catch (error) {
          console.error('Error al eliminar turno:', error);
          Swal.showValidationMessage('No se pudo eliminar el turno');
          setPendingActionId(null);
          return false;
        }
      }
    });

    if (result.isConfirmed) {
      setPendingActionId(null);
      await Swal.fire({
        title: 'Eliminado',
        text: 'El turno ha sido eliminado correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    if (pendingActionId !== null) {
      return;
    }

    try {
      setPendingActionId(id);
      await cambiarEstadoTurno(id, nuevoEstado);
    } catch (error) {
      console.error('Error al cambiar estado del turno:', error);
      Swal.fire('Error', 'No se pudo cambiar el estado del turno', 'error');
    } finally {
      setPendingActionId(null);
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
    completado: FaCheckDouble
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
              disabled={pendingActionId !== null}
            >
              <FaPlus className="me-2" />
              Nuevo Turno
            </Button>
          </div>
        </Col>
      </Row>

      <div className="mb-5">
        <h4 className="mb-3 text-muted">Agenda Mensual</h4>
        <CalendarView refreshKey={calendarRefreshKey} />
      </div>

      <AgendaExcepcionesPanel onExceptionsChange={() => setCalendarRefreshKey((current) => current + 1)} />

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
                  ref={searchInputRef}
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
                  <option key={p.id} value={p.id}>
                    {p.apellido ? `${p.apellido}, ${p.nombre}` : p.nombreCompleto}
                  </option>
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
                  disabled={pendingActionId !== null}
                >
                  Limpiar filtros
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Row className="mb-3">
        <Col className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <small className="text-muted">
            Mostrando {turnosFiltrados.length === 0 ? 0 : startIndex + 1} a {endIndex} de {turnosFiltrados.length}
          </small>
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
                  disabled={pendingActionId !== null}
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
                  {turnosPaginados.map((turno) => {
                    const paciente = pacientes.find(p => p.id == turno.pacienteId);
                    const IconoEstado = estadoIcono[turno.estado];
                    const isPendingRow = pendingActionId === turno.id;
                    return (
                      <tr key={turno.id}>
                        <td>
                          <strong>{formatearFechaHora(turno.fechaHora)}</strong>
                        </td>
                        <td>
                          {paciente ? (
                            <>
                              {paciente.apellido ? `${paciente.apellido}, ${paciente.nombre}` : paciente.nombreCompleto}
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
                            {IconoEstado ? <IconoEstado className="me-1" /> : null}
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
                                disabled={pendingActionId !== null}
                              >
                                {isPendingRow ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <FaCheck />
                                )}
                              </Button>
                            )}
                            {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleCambiarEstado(turno.id, 'completado')}
                                title="Marcar como completado"
                                disabled={pendingActionId !== null}
                              >
                                {isPendingRow ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <FaCheckDouble />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/turnos/${turno.id}/editar`)}
                              title="Editar"
                              disabled={pendingActionId !== null}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(
                                turno.id, 
                                paciente ? (paciente.apellido ? `${paciente.apellido}, ${paciente.nombre}` : paciente.nombreCompleto) : 'paciente'
                              )}
                              title="Eliminar"
                              disabled={pendingActionId !== null}
                            >
                              {pendingActionId === turno.id ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <FaTrash />
                              )}
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

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First onClick={() => setCurrentPage(1)} disabled={safeCurrentPage === 1} />
            <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={safeCurrentPage === 1} />
            {[...Array(totalPages).keys()].map(number => (
              <Pagination.Item
                key={number + 1}
                active={number + 1 === safeCurrentPage}
                onClick={() => setCurrentPage(number + 1)}
              >
                {number + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={safeCurrentPage === totalPages} />
            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage === totalPages} />
          </Pagination>
        </div>
      )}
    </Container>
  );
};

export default TurnosList;