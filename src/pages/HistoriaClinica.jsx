import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaFileMedical, FaPlus, FaEye } from 'react-icons/fa';
import { useHistoriaClinica } from '../context/HistoriaClinicaContext';
import { usePacientes } from '../context/PacientesContext';

const HistoriaClinica = () => {
  const navigate = useNavigate();
  const { historiasClinicas } = useHistoriaClinica();
  const { pacientes } = usePacientes();

  const formatearFecha = (fecha) => {
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
          <div className="d-flex justify-content-between align-items-center">
            <h2>
              <FaFileMedical className="me-2" />
              Historia Clínica
            </h2>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col className="text-end">
          <Badge bg="secondary" className="fs-6">
            {historiasClinicas.length} historia{historiasClinicas.length !== 1 ? 's' : ''} clínica{historiasClinicas.length !== 1 ? 's' : ''}
          </Badge>
        </Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          {historiasClinicas.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                No hay historias clínicas registradas
              </p>
              <p className="text-muted">
                Las historias clínicas se crean desde el detalle de cada paciente
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Paciente</th>
                    <th>DNI</th>
                    <th>Fecha Creación</th>
                    <th>Última Actualización</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historiasClinicas.map((historia) => {
                    const paciente = pacientes.find(p => p.id === historia.pacienteId);
                    return (
                      <tr key={historia.id}>
                        <td>
                          <strong>{paciente?.nombreCompleto || 'Paciente no encontrado'}</strong>
                        </td>
                        <td>{paciente?.dni || '-'}</td>
                        <td>{formatearFecha(historia.fechaCreacion)}</td>
                        <td>{formatearFecha(historia.fechaUltimaActualizacion)}</td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => navigate(`/historia-clinica/${historia.id}`)}
                              title="Ver detalle"
                            >
                              <FaEye />
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

export default HistoriaClinica;
