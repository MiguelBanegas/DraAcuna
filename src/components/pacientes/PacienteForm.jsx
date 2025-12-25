import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import { usePacientes } from '../../context/PacientesContext';
import Swal from 'sweetalert2';

const PacienteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pacientes, agregarPaciente, actualizarPaciente } = usePacientes();
  
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    dni: '',
    fechaNacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    obraSocial: '',
    numeroAfiliado: ''
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const firstInputRef = useRef(null);

  // Cargar datos si es edición
  useEffect(() => {
    if (id) {
      const paciente = pacientes.find(p => p.id == id);
      if (paciente) {
        // Deferir setState para evitar setState síncrono en el efecto
        Promise.resolve().then(() => {
          setIsEditing(true);
          setFormData({
            nombreCompleto: paciente.nombreCompleto || '',
            dni: paciente.dni || '',
            fechaNacimiento: paciente.fechaNacimiento || '',
            genero: paciente.genero || '',
            telefono: paciente.telefono || '',
            email: paciente.email || '',
            direccion: paciente.direccion || '',
            obraSocial: paciente.obraSocial || '',
            numeroAfiliado: paciente.numeroAfiliado || ''
          });
        });
      } else {
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre completo es requerido';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (!/^\d{7,8}$/.test(formData.dni.trim())) {
      newErrors.dni = 'El DNI debe tener 7 u 8 dígitos';
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
    } else {
      const fechaNac = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      if (fechaNac > hoy) {
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
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        await actualizarPaciente(id, formData);
      } else {
        await agregarPaciente(formData);
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
      setSubmitError('Error al guardar el paciente. Por favor, intente nuevamente.');
      Swal.fire('Error', 'No se pudo guardar el paciente', 'error');
    }
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Completo *</Form.Label>
                  <Form.Control
                    ref={firstInputRef}
                    type="text"
                    name="nombreCompleto"
                    value={formData.nombreCompleto}
                    onChange={handleChange}
                    isInvalid={!!errors.nombreCompleto}
                    placeholder="Ej: Juan Pérez"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombreCompleto}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>DNI *</Form.Label>
                  <Form.Control
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    isInvalid={!!errors.dni}
                    placeholder="Ej: 12345678"
                    maxLength="8"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.dni}
                  </Form.Control.Feedback>
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

export default PacienteForm;
