import { useState, useEffect, useRef } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import Select from 'react-select';
import { useTurnos } from '../../context/TurnosContext';
import { usePacientes } from '../../context/PacientesContext';

const TurnoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { turnos, agregarTurno, actualizarTurno } = useTurnos();
  const { pacientes } = usePacientes();
  
  const [formData, setFormData] = useState({
    pacienteId: location.state?.pacienteId || '',
    fechaHora: '',
    duracion: '30',
    estado: 'pendiente',
    motivo: '',
    observaciones: ''
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef(null);

  // Preparar opciones para react-select
  const pacientesOptions = pacientes.map(p => ({
    value: p.id,
    label: `${p.nombreCompleto} - DNI: ${p.dni}`,
    paciente: p
  }));

  // Cargar datos si es edición
  useEffect(() => {
    if (id) {
      const turno = turnos.find(t => t.id === id);
      if (turno) {
        setIsEditing(true);
        setFormData({
          pacienteId: turno.pacienteId || '',
          fechaHora: turno.fechaHora ? new Date(turno.fechaHora).toISOString().slice(0, 16) : '',
          duracion: turno.duracion?.toString() || '30',
          estado: turno.estado || 'pendiente',
          motivo: turno.motivo || '',
          observaciones: turno.observaciones || ''
        });
      } else {
        navigate('/turnos');
      }
    } else {
      // Si es nuevo turno, sugerir próxima hora disponible
      const ahora = new Date();
      ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
      // Redondear a la próxima media hora
      const minutos = ahora.getMinutes();
      if (minutos < 30) {
        ahora.setMinutes(30);
      } else {
        ahora.setHours(ahora.getHours() + 1);
        ahora.setMinutes(0);
      }
      ahora.setSeconds(0);
      setFormData(prev => ({
        ...prev,
        fechaHora: ahora.toISOString().slice(0, 16)
      }));
    }
  }, [id, turnos, navigate]);

  // Auto-focus en el campo de búsqueda al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

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
    setSubmitError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.pacienteId) {
      newErrors.pacienteId = 'Debe seleccionar un paciente';
    }

    if (!formData.fechaHora) {
      newErrors.fechaHora = 'La fecha y hora son requeridas';
    } else {
      const fechaTurno = new Date(formData.fechaHora);
      const ahora = new Date();
      ahora.setHours(ahora.getHours() - 1); // Permitir turnos de hace 1 hora
      
      if (fechaTurno < ahora && !isEditing) {
        newErrors.fechaHora = 'La fecha y hora no pueden ser en el pasado';
      }
    }

    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo es requerido';
    }

    if (!formData.duracion || parseInt(formData.duracion) < 5) {
      newErrors.duracion = 'La duración debe ser al menos 5 minutos';
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
      const turnoData = {
        ...formData,
        fechaHora: new Date(formData.fechaHora).toISOString(),
        duracion: parseInt(formData.duracion)
      };

      if (isEditing) {
        await actualizarTurno(id, turnoData);
      } else {
        await agregarTurno(turnoData);
      }
      navigate('/turnos');
    } catch (error) {
      if (error.message.includes('superposición') || error.message.includes('Ya existe')) {
        setSubmitError('Ya existe un turno en ese horario. Por favor, elija otro horario.');
      } else {
        setSubmitError('Error al guardar el turno. Por favor, intente nuevamente.');
      }
    }
  };

  const pacienteSeleccionado = pacientes.find(p => p.id === formData.pacienteId);

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>{isEditing ? 'Editar Turno' : 'Nuevo Turno'}</h2>
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
                  <Select
                    ref={selectRef}
                    options={pacientesOptions}
                    value={pacientesOptions.find(opt => opt.value === formData.pacienteId) || null}
                    onChange={(selectedOption) => {
                      setFormData(prev => ({ ...prev, pacienteId: selectedOption ? selectedOption.value : '' }));
                      if (errors.pacienteId) {
                        setErrors(prev => ({ ...prev, pacienteId: '' }));
                      }
                    }}
                    placeholder="Buscar paciente por nombre o DNI..."
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "No se encontraron pacientes"}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: errors.pacienteId ? '#dc3545' : state.isFocused ? '#0d6efd' : base.borderColor,
                        '&:hover': {
                          borderColor: errors.pacienteId ? '#dc3545' : '#0d6efd'
                        },
                        boxShadow: state.isFocused ? (errors.pacienteId ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : '0 0 0 0.2rem rgba(13, 110, 253, 0.25)') : 'none'
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999
                      })
                    }}
                    autoFocus
                  />
                  {errors.pacienteId && (
                    <div className="invalid-feedback d-block">
                      {errors.pacienteId}
                    </div>
                  )}
                  {formData.pacienteId && (
                    <div className="mt-2">
                      <small className="text-success">
                        ✓ Paciente seleccionado
                      </small>
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="completado">Completado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {pacienteSeleccionado && (
              <Alert variant="info">
                <strong>Paciente:</strong> {pacienteSeleccionado.nombreCompleto}
                {pacienteSeleccionado.telefono && (
                  <> - Tel: {pacienteSeleccionado.telefono}</>
                )}
              </Alert>
            )}

            <Row>
              <Col md={8}>
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
                  <Form.Text className="text-muted">
                    El sistema validará que no haya superposición con otros turnos
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Duración (minutos) *</Form.Label>
                  <Form.Select
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleChange}
                    isInvalid={!!errors.duracion}
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1 hora 30 min</option>
                    <option value="120">2 horas</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.duracion}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Motivo / Tipo de Consulta *</Form.Label>
              <Form.Control
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                isInvalid={!!errors.motivo}
                placeholder="Ej: Control de rutina, Consulta general, etc."
              />
              <Form.Control.Feedback type="invalid">
                {errors.motivo}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Observaciones adicionales sobre el turno..."
              />
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end mt-4">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/turnos')}
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

export default TurnoForm;
