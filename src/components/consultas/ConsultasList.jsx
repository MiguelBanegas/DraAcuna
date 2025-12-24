import { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, InputGroup, Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useConsultas } from '../../context/ConsultasContext';
import { usePacientes } from '../../context/PacientesContext';

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

  const handleConsultar = async () => {
    setLoadingSearch(true);
    await buscarConsultas({
      q: searchTerm,
      pacienteId: filtroPaciente,
      fecha: filtroFecha
    });
    setLoadingSearch(false);
  };

  const handleDelete = async (id, pacienteNombre) => {
    if (window.confirm(`¿Está seguro de eliminar esta consulta de ${pacienteNombre}?`)) {
      try {
        await eliminarConsulta(id);
      } catch (error) {
        alert('Error al eliminar consulta');
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
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar por paciente, DNI, motivo o diagnóstico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
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
            <Col className="d-flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleConsultar}
                disabled={loadingSearch}
                className="d-flex align-items-center"
              >
                {loadingSearch ? '...' : <FaSearch className="me-2" />} 
                Consultar
              </Button>
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
                {searchTerm || filtroFecha || filtroPaciente
                  ? 'No se encontraron consultas con los filtros aplicados'
                  : 'Utilice los filtros superiores para buscar consultas'}
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
