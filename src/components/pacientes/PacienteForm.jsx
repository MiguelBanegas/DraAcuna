import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import { usePacientes } from '../../context/PacientesContext';
import Swal from 'sweetalert2';
import { parseLocalDate } from '../../utils/date';

const formatDateForInput = (value) => {
  if (!value) return '';
  const parsed = parseLocalDate(value);
  if (!parsed) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTimeForDisplay = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
};

const PacienteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pacientes, agregarPaciente, actualizarPaciente } = usePacientes();
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    obraSocial: '',
    numeroAfiliado: '',
    fechaCreacion: ''
  });

  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pacienteExistentePorDni, setPacienteExistentePorDni] = useState(null);
  const firstInputRef = useRef(null);

  const buscarPacientePorDni = (dniValue) => {
    const normalizedDni = String(dniValue || '').trim();
    if (!/^\d{7,8}$/.test(normalizedDni)) {
      return null;
    }

    return (
      pacientes.find(
        (paciente) =>
          String(paciente.dni).trim() === normalizedDni &&
          String(paciente.id) !== String(id)
      ) || null
    );
  };

  // Cargar datos si es edición
  useEffect(() => {
    if (id) {
      const paciente = pacientes.find(p => p.id == id);
      if (paciente) {
        // Deferir setState para evitar setState síncrono en el efecto
        Promise.resolve().then(() => {
          setIsEditing(true);

          // Lógica de migración inteligente para registros viejos
          let nombre = paciente.nombre || '';
          let apellido = paciente.apellido || '';
          
          if (!nombre && !apellido && paciente.nombreCompleto) {
            const partes = paciente.nombreCompleto.trim().split(' ');
            if (partes.length > 1) {
              apellido = partes.pop(); // Tomamos la última palabra como apellido
              nombre = partes.join(' ');
            } else {
              nombre = partes[0];
            }
          }

          setFormData({
            nombre: nombre,
            apellido: apellido,
            dni: paciente.dni || '',
            fechaNacimiento: formatDateForInput(paciente.fechaNacimiento),
            genero: paciente.genero || '',
            telefono: paciente.telefono || '',
            email: paciente.email || '',
            direccion: paciente.direccion || '',
            obraSocial: paciente.obraSocial || '',
            numeroAfiliado: paciente.numeroAfiliado || '',
            fechaCreacion: formatDateTimeForDisplay(paciente.fechaCreacion)
          });
        });
      } else if (pacientes.length > 0) {
        navigate('/pacientes');
      }
    }
  }, [id, pacientes, navigate]);

  // Auto-focus en el primer campo al cargar el componente
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
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

    if (name === 'dni') {
      setPacienteExistentePorDni(null);
    }
  };

  const handleDniBlur = () => {
    const pacienteExistente = buscarPacientePorDni(formData.dni);
    setPacienteExistentePorDni(pacienteExistente);

    if (pacienteExistente) {
      setErrors((prev) => ({
        ...prev,
        dni: 'Ya existe un paciente registrado con ese DNI',
      }));
      return;
    }

    if (errors.dni === 'Ya existe un paciente registrado con ese DNI') {
      setErrors((prev) => ({
        ...prev,
        dni: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (!/^\d{7,8}$/.test(formData.dni.trim())) {
      newErrors.dni = 'El DNI debe tener 7 u 8 dígitos';
    } else {
      const pacienteExistente = buscarPacientePorDni(formData.dni);
      if (pacienteExistente) {
        newErrors.dni = 'Ya existe un paciente registrado con ese DNI';
        setPacienteExistentePorDni(pacienteExistente);
      }
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
    } else {
      const fechaNac = parseLocalDate(formData.fechaNacimiento);
      const hoy = new Date();
      if (!fechaNac) {
        newErrors.fechaNacimiento = 'La fecha de nacimiento no es válida';
      } else if (fechaNac > hoy) {
        newErrors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura';
      }
    }

    if (!formData.genero) {
      newErrors.genero = 'El género es requerido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const dataToSubmit = {
        ...formData,
        nombreCompleto: `${formData.nombre.trim()} ${formData.apellido.trim()}`.trim()
      };

      if (isEditing) {
        await actualizarPaciente(id, dataToSubmit);
      } else {
        await agregarPaciente(dataToSubmit);
      }
      
      await Swal.fire({
        title: '¡Guardado!',
        text: isEditing ? 'El paciente ha sido actualizado.' : 'El paciente ha sido registrado.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      navigate('/pacientes');
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      Swal.fire('Error', 'No se pudo guardar el paciente', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '-';
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>{isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
        </Col>
      </Row>



      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <fieldset disabled={submitting}>
            {isEditing && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha registrada</Form.Label>
                    <Form.Control
                      type="text"
                      value={formatearFechaHora(formData.fechaCreacion)}
                      readOnly
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido/s *</Form.Label>
                  <Form.Control
                    ref={firstInputRef}
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    isInvalid={!!errors.apellido}
                    placeholder="Ej: Pérez"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.apellido}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre/s *</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    isInvalid={!!errors.nombre}
                    placeholder="Ej: Juan"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombre}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>DNI *</Form.Label>
                  <Form.Control
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    onBlur={handleDniBlur}
                    isInvalid={!!errors.dni}
                    placeholder="Ej: 12345678"
                    maxLength="8"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.dni}
                  </Form.Control.Feedback>
                  {pacienteExistentePorDni && (
                    <Form.Text className="text-warning">
                      Ya existe el paciente: <strong>{pacienteExistentePorDni.apellido ? `${pacienteExistentePorDni.apellido}, ${pacienteExistentePorDni.nombre}` : pacienteExistentePorDni.nombreCompleto}</strong>
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Nacimiento *</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    isInvalid={!!errors.fechaNacimiento}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.fechaNacimiento}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Género *</Form.Label>
                  <Form.Select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    isInvalid={!!errors.genero}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.genero}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    isInvalid={!!errors.telefono}
                    placeholder="Ej: 11-1234-5678"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.telefono}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder="ejemplo@email.com"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Calle, número, ciudad"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Obra Social / Prepaga</Form.Label>
                  <Form.Control
                    type="text"
                    name="obraSocial"
                    value={formData.obraSocial}
                    onChange={handleChange}
                    placeholder="Ej: OSDE, Swiss Medical"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Afiliado</Form.Label>
                  <Form.Control
                    type="text"
                    name="numeroAfiliado"
                    value={formData.numeroAfiliado}
                    onChange={handleChange}
                    placeholder="Número de afiliado"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2 justify-content-end mt-4">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/pacientes')}
                disabled={submitting}
              >
                <FaTimes className="me-2" />
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                <FaSave className="me-2" />
                {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
            </fieldset>
          </Form>
        </Card.Body>
      </Card>

      <div className="mt-3 text-muted">
        <small>* Campos requeridos</small>
      </div>
    </Container>
  );
};

export default PacienteForm;
