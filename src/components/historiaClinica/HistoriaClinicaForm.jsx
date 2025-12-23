import { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useHistoriaClinica } from '../../context/HistoriaClinicaContext';
import { usePacientes } from '../../context/PacientesContext';

const HistoriaClinicaForm = () => {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const { agregarHistoriaClinica } = useHistoriaClinica();
  const { pacientes } = usePacientes();
  
  const [observaciones, setObservaciones] = useState('');
  const [submitError, setSubmitError] = useState('');

  const paciente = pacientes.find(p => p.id === pacienteId);

  if (!paciente) {
    return (
      <Container>
        <Alert variant="danger">Paciente no encontrado</Alert>
      </Container>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    try {
      const historiaData = {
        pacienteId: pacienteId,
        fechaGeneracion: new Date().toISOString(),
        medicoNombre: 'Dra. Acuña',
        medicoMatricula: 'MP 12345',
        observacionesMedico: observaciones
      };

      const nuevaHistoria = await agregarHistoriaClinica(historiaData);
      navigate(`/historia-clinica/${nuevaHistoria.id}`);
    } catch (error) {
      setSubmitError(error.message || 'Error al generar la historia clínica');
    }
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Generar Historia Clínica</h2>
        </Col>
      </Row>

      {submitError && (
        <Alert variant="danger" dismissible onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Alert variant="info">
            <strong>Paciente:</strong> {paciente.nombreCompleto} - DNI: {paciente.dni}
          </Alert>

          <p className="text-muted mb-4">
            Se generará un resumen automático de todas las consultas del paciente.
            Puede agregar observaciones adicionales si lo desea.
          </p>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Observaciones del Médico (Opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Agregue observaciones, conclusiones o recomendaciones generales..."
              />
              <Form.Text className="text-muted">
                Estas observaciones aparecerán al final del resumen de historia clínica.
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end mt-4">
              <Button 
                variant="secondary" 
                onClick={() => navigate(`/pacientes/${pacienteId}`)}
              >
                <FaTimes className="me-2" />
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                <FaSave className="me-2" />
                Generar Historia Clínica
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default HistoriaClinicaForm;
