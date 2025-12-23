import { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useConsultas } from '../../context/ConsultasContext';
import { usePacientes } from '../../context/PacientesContext';

const ConsultaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { consultas, agregarConsulta, actualizarConsulta } = useConsultas();
  const { pacientes } = usePacientes();
  
  const [formData, setFormData] = useState({
    pacienteId: location.state?.pacienteId || '',
    fechaHora: '',
    motivo: '',
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
    proximaConsulta: ''
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchPaciente, setSearchPaciente] = useState('');

  // Filtrar pacientes según búsqueda
  const pacientesFiltrados = pacientes.filter(p => {
    if (!searchPaciente.trim()) return true;
    const searchLower = searchPaciente.toLowerCase();
    return (
      p.nombreCompleto?.toLowerCase().includes(searchLower) ||
      p.dni?.toLowerCase().includes(searchLower)
    );
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (id) {
      const consulta = consultas.find(c => c.id === id);
      if (consulta) {
        setIsEditing(true);
        setFormData({
          pacienteId: consulta.pacienteId || '',
          fechaHora: consulta.fechaHora ? new Date(consulta.fechaHora).toISOString().slice(0, 16) : '',
          motivo: consulta.motivo || '',
          diagnostico: consulta.diagnostico || '',
          tratamiento: consulta.tratamiento || '',
          observaciones: consulta.observaciones || '',
          proximaConsulta: consulta.proximaConsulta || ''
        });
      } else {
        navigate('/consultas');
      }
    } else {
      // Si es nueva consulta, establecer fecha y hora actual
      const ahora = new Date();
      ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
      setFormData(prev => ({
        ...prev,
        fechaHora: ahora.toISOString().slice(0, 16)
      }));
    }
  }, [id, consultas, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.pacienteId) {
      newErrors.pacienteId = 'Debe seleccionar un paciente';
    }

    if (!formData.fechaHora) {
      newErrors.fechaHora = 'La fecha y hora son requeridas';
    } else {
      const fechaConsulta = new Date(formData.fechaHora);
      const ahora = new Date();
      // Permitir fechas futuras para programar consultas
      if (fechaConsulta > new Date(ahora.getTime() + 365 * 24 * 60 * 60 * 1000)) {
        newErrors.fechaHora = 'La fecha no puede ser mayor a un año en el futuro';
      }
    }

    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo de consulta es requerido';
    }

    if (formData.proximaConsulta) {
      const proximaFecha = new Date(formData.proximaConsulta);
      const fechaConsulta = new Date(formData.fechaHora);
      if (proximaFecha <= fechaConsulta) {
        newErrors.proximaConsulta = 'La próxima consulta debe ser posterior a la fecha actual';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      const consultaData = {
        ...formData,
        fechaHora: new Date(formData.fechaHora).toISOString()
      };

      if (isEditing) {
        await actualizarConsulta(id, consultaData);
      } else {
        await agregarConsulta(consultaData);
      }
      navigate('/consultas');
    } catch (error) {
      setSubmitError('Error al guardar la consulta. Por favor, intente nuevamente.');
    }
  };

  const pacienteSeleccionado = pacientes.find(p => p.id === formData.pacienteId);

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>{isEditing ? 'Editar Consulta' : 'Nueva Consulta'}</h2>
        </Col>
      </Row>

      {submitError && (
        <Alert variant="danger" dismissible onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Paciente *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o DNI..."
                    value={searchPaciente}
                    onChange={(e) => setSearchPaciente(e.target.value)}
                    className="mb-2"
                  />
                  <Form.Select
                    name="pacienteId"
                    value={formData.pacienteId}
                    onChange={handleChange}
                    isInvalid={!!errors.pacienteId}
                    size="lg"
                  >
                    <option value="">Seleccione un paciente...</option>
                    {pacientesFiltrados.length === 0 ? (
                      <option disabled>No se encontraron pacientes</option>
                    ) : (
                      pacientesFiltrados.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombreCompleto} - DNI: {p.dni}
                        </option>
                      ))
                    )}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.pacienteId}
                  </Form.Control.Feedback>
                  {searchPaciente && pacientesFiltrados.length > 0 && (
                    <Form.Text className="text-muted">
                      {pacientesFiltrados.length} paciente{pacientesFiltrados.length !== 1 ? 's' : ''} encontrado{pacientesFiltrados.length !== 1 ? 's' : ''}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha y Hora *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="fechaHora"
                    value={formData.fechaHora}
                    onChange={handleChange}
                    isInvalid={!!errors.fechaHora}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.fechaHora}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {pacienteSeleccionado && (
              <Alert variant="info">
                <strong>Paciente seleccionado:</strong> {pacienteSeleccionado.nombreCompleto}
                {pacienteSeleccionado.obraSocial && (
                  <> - Obra Social: {pacienteSeleccionado.obraSocial}</>
                )}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Motivo de Consulta *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                isInvalid={!!errors.motivo}
                placeholder="Describa el motivo de la consulta..."
              />
              <Form.Control.Feedback type="invalid">
                {errors.motivo}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Diagnóstico</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="diagnostico"
                value={formData.diagnostico}
                onChange={handleChange}
                placeholder="Diagnóstico médico..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tratamiento / Indicaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="tratamiento"
                value={formData.tratamiento}
                onChange={handleChange}
                placeholder="Medicación, estudios solicitados, indicaciones..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Observaciones adicionales..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Próxima Consulta</Form.Label>
              <Form.Control
                type="date"
                name="proximaConsulta"
                value={formData.proximaConsulta}
                onChange={handleChange}
                isInvalid={!!errors.proximaConsulta}
              />
              <Form.Control.Feedback type="invalid">
                {errors.proximaConsulta}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Opcional: Fecha sugerida para la próxima consulta
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end mt-4">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/consultas')}
              >
                <FaTimes className="me-2" />
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                <FaSave className="me-2" />
                {isEditing ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <div className="mt-3 text-muted">
        <small>* Campos requeridos</small>
      </div>
    </Container>
  );
};

export default ConsultaForm;
