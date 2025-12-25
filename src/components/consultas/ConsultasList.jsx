import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, InputGroup, Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useConsultas } from '../../context/ConsultasContext';
import { usePacientes } from '../../context/PacientesContext';
import Swal from 'sweetalert2';

const ConsultasList = () => {
  const navigate = useNavigate();
  const { consultas, eliminarConsulta, buscarConsultas } = useConsultas();
  const { pacientes } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchInputRef = useRef(null);

  // Auto-focus en el campo de búsqueda al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Ejecutar búsqueda automática cuando cambian los filtros
  useEffect(() => {
    const term = searchTerm.trim();
    
    // Solo buscamos si hay paciente, fecha, o al menos 3 caracteres de texto
    if (term.length >= 3 || filtroPaciente || filtroFecha) {
      const doSearch = async () => {
        setLoadingSearch(true);
        await buscarConsultas({
          q: term,
          pacienteId: filtroPaciente,
          fecha: filtroFecha
        });
        setLoadingSearch(false);
      };

      // Debounce simple para el campo de texto si es lo único que cambió
      const timeoutId = setTimeout(() => {
        doSearch();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      // Si no se cumple ninguna condición, forzamos lista vacía (opcional, 
      // pero cumple con el pedido de "lo mismo" que pacientes)
      const clearSearch = async () => {
        await buscarConsultas({ q: '_____no_match_____' }); // Truco para limpiar lista en el context
      };
      clearSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filtroPaciente, filtroFecha]);

  const handleDelete = async (id, pacienteNombre) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `Está por eliminar la consulta de ${pacienteNombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await eliminarConsulta(id);
        await Swal.fire({
          title: 'Eliminado',
          text: 'La consulta ha sido eliminada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al eliminar consulta:', error);
        Swal.fire('Error', 'No se pudo eliminar la consulta', 'error');
      }
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

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Historial de Consultas Médicas</h2>
          </div>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  {loadingSearch ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <FaSearch />
                  )}
                </InputGroup.Text>
                <Form.Control
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar texto (min. 3 caracteres)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              {searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
                <Form.Text className="text-muted ms-1">
                  Mínimo 3 caracteres para buscar por texto
                </Form.Text>
              )}
            </Col>
            <Col md={4}>
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
            <Col md={4}>
              <Form.Control
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                placeholder="Filtrar por fecha"
              />
            </Col>
          </Row>

          <Row className="mt-3">
            <Col className="d-flex gap-2 align-items-center">
              <Button 
                variant="success" 
                onClick={() => navigate('/consultas/nueva')}
                className="d-flex align-items-center"
              >
                <FaPlus className="me-2" />
                Nueva Consulta
              </Button>
              
              {(searchTerm || filtroFecha || filtroPaciente) && (
                <Button 
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFiltroFecha('');
                    setFiltroPaciente('');
                  }}
                  className="ms-auto"
                >
                  Limpiar filtros
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-3">
        <Col className="text-end">
          <Badge bg="secondary" className="fs-6">
            {consultas.length} consulta{consultas.length !== 1 ? 's' : ''} encontrada{consultas.length !== 1 ? 's' : ''}
          </Badge>
        </Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          {consultas.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                {(searchTerm.trim().length >= 3 || filtroFecha || filtroPaciente)
                  ? 'No se encontraron consultas con los filtros aplicados'
                  : 'Ingrese al menos 3 caracteres, seleccione un paciente o una fecha para buscar'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Paciente</th>
                    <th>Motivo</th>
                    <th>Diagnóstico</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {consultas.map((consulta) => {
                    const paciente = pacientes.find(p => p.id === consulta.pacienteId);
                    return (
                      <tr key={consulta.id}>
                        <td>
                          <strong>{formatearFechaHora(consulta.fechaHora)}</strong>
                        </td>
                        <td>
                          {paciente ? (
                            <>
                              {paciente.nombreCompleto}
                              <br />
                              <small className="text-muted">DNI: {paciente.dni}</small>
                            </>
                          ) : (
                            <span className="text-muted">Paciente no encontrado</span>
                          )}
                        </td>
                        <td>{consulta.motivo}</td>
                        <td>{consulta.diagnostico || '-'}</td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => navigate(`/consultas/${consulta.id}`)}
                              title="Ver detalle"
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/consultas/${consulta.id}/editar`)}
                              title="Editar"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(consulta.id, paciente?.nombreCompleto || 'paciente')}
                              title="Eliminar"
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

export default ConsultasList;
