import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaFileMedical, FaSearch, FaEye, FaPlus } from 'react-icons/fa';
import { useHistoriaClinica } from '../context/HistoriaClinicaContext';
import { usePacientes } from '../context/PacientesContext';

const HistoriaClinica = () => {
  const navigate = useNavigate();
  const { historiasClinicas } = useHistoriaClinica();
  const { pacientes, buscarPacientes } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 3) {
      setPacientesFiltrados([]);
    } else {
      const resultados = buscarPacientes(term);
      setPacientesFiltrados(resultados);
    }
  }, [searchTerm, pacientes, buscarPacientes]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const getHistoriaId = (pacienteId) => {
    const historia = historiasClinicas.find(h => h.pacienteId == pacienteId);
    return historia ? historia.id : null;
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>
              <FaFileMedical className="me-2 text-primary" />
              Generar Historia Clínica
            </h2>
          </div>
          <p className="text-muted">Busque un paciente para generar su resumen de atención, observaciones e imprimir.</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8} lg={6}>
          <InputGroup className="shadow-sm">
            <InputGroup.Text className="bg-white border-end-0">
              <FaSearch className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              ref={searchInputRef}
              type="text"
              placeholder="Buscar paciente (mínimo 3 caracteres)..."
              value={searchTerm}
              onChange={handleSearch}
              className="border-start-0 ps-0"
            />
          </InputGroup>
          {searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
            <Form.Text className="text-muted ms-1">
              Ingrese al menos 3 caracteres para buscar
            </Form.Text>
          )}
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="py-3">DNI</th>
                  <th className="py-3">Obra Social</th>
                  <th className="py-3 text-center">Estado HC</th>
                  <th className="px-4 py-3 text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      {searchTerm.trim().length >= 3 
                        ? 'No se encontraron pacientes que coincidan con la búsqueda' 
                        : 'Ingrese un nombre o DNI para buscar (mínimo 3 caracteres)'}
                    </td>
                  </tr>
                ) : (
                  pacientesFiltrados.map((paciente) => {
                    const hcId = getHistoriaId(paciente.id);
                    return (
                      <tr key={paciente.id}>
                        <td className="px-4">
                          <div className="fw-bold text-dark">{paciente.nombreCompleto}</div>
                          <div className="small text-muted">{paciente.email || 'Sin email'}</div>
                        </td>
                        <td>{paciente.dni}</td>
                        <td>{paciente.obraSocial || '-'}</td>
                        <td className="text-center">
                          {hcId ? (
                            <Badge bg="info" pill>Existente</Badge>
                          ) : (
                            <Badge bg="light" text="dark" pill className="border">No creada</Badge>
                          )}
                        </td>
                        <td className="px-4 text-end">
                          {hcId ? (
                            <Button
                              variant="primary"
                              size="sm"
                              className="d-inline-flex align-items-center gap-2"
                              onClick={() => navigate(`/historia-clinica/${hcId}`)}
                            >
                              <FaEye />
                              Ver Detalle
                            </Button>
                          ) : (
                            <Button
                              variant="success"
                              size="sm"
                              className="d-inline-flex align-items-center gap-2"
                              onClick={() => navigate(`/historia-clinica/nueva/${paciente.id}`)}
                            >
                              <FaPlus />
                              Generar Resumen
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default HistoriaClinica;
