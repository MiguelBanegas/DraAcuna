import { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useConsultas } from '../../context/ConsultasContext';
import { usePacientes } from '../../context/PacientesContext';

const ConsultasList = () => {
  const navigate = useNavigate();
  const { consultas, eliminarConsulta } = useConsultas();
  const { pacientes } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');

  // Filtrar consultas
  const consultasFiltradas = consultas.filter(consulta => {
    const paciente = pacientes.find(p => p.id === consulta.pacienteId);
    const nombrePaciente = paciente?.nombreCompleto || '';
    const dniPaciente = paciente?.dni || '';
    
    const cumpleBusqueda = searchTerm === '' || 
      nombrePaciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dniPaciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Comparar solo la fecha sin la hora
    let cumpleFecha = true;
    if (filtroFecha) {
      const fechaConsulta = new Date(consulta.fechaHora);
      const fechaFiltro = new Date(filtroFecha);
      cumpleFecha = (
        fechaConsulta.getFullYear() === fechaFiltro.getFullYear() &&
        fechaConsulta.getMonth() === fechaFiltro.getMonth() &&
        fechaConsulta.getDate() === fechaFiltro.getDate()
      );
    }
    
    const cumplePaciente = filtroPaciente === '' || consulta.pacienteId === filtroPaciente;
    
    return cumpleBusqueda && cumpleFecha && cumplePaciente;
  });

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
            <h2>Consultas Médicas</h2>
            <Button 
              variant="primary" 
              onClick={() => navigate('/consultas/nueva')}
            >
              <FaPlus className="me-2" />
              Nueva Consulta
            </Button>
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
          {(searchTerm || filtroFecha || filtroPaciente) && (
            <Row className="mt-2">
              <Col>
                <Button 
                  size="sm" 
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setFiltroFecha('');
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
            {consultasFiltradas.length} consulta{consultasFiltradas.length !== 1 ? 's' : ''}
          </Badge>
        </Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          {consultasFiltradas.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                {consultas.length === 0 
                  ? 'No hay consultas registradas' 
                  : 'No se encontraron consultas con los filtros aplicados'}
              </p>
              {consultas.length === 0 && (
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/consultas/nueva')}
                >
                  <FaPlus className="me-2" />
                  Registrar Primera Consulta
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
                    <th>Diagnóstico</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {consultasFiltradas.map((consulta) => {
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
