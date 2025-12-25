import { useState, useEffect, useRef } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import AsyncSelect from 'react-select/async';
import { searchPacientes, getPacienteById } from '../../services/pacientesService';
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
    proximaConsulta: '',
    // Signos Vitales
    signosVitales: {
      presionArterial: {
        sistolica: '',
        diastolica: ''
      },
      frecuenciaCardiaca: '',
      temperatura: '',
      frecuenciaRespiratoria: '',
      saturacionO2: '',
      peso: '',
      talla: '',
      imc: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [pacienteOption, setPacienteOption] = useState(null);
  const loadTimer = useRef(null);

  // Preparar opciones para react-select
  const pacientesOptions = pacientes.map(p => ({
    value: p.id,
    label: `${p.nombreCompleto} - DNI: ${p.dni}`,
    paciente: p
  }));

  // Cargar datos si es edición
  useEffect(() => {
    if (id) {
      const consulta = consultas.find(c => c.id == id);
      if (consulta) {
        // Deferir updates de estado para evitar setState síncrono en el efecto
        Promise.resolve().then(() => {
          setIsEditing(true);
          // Convertir fecha UTC a local para el input datetime-local
          const formatearFechaLocal = (fechaUTC) => {
            const fecha = new Date(fechaUTC);
            const offset = fecha.getTimezoneOffset() * 60000;
            const fechaLocal = new Date(fecha.getTime() - offset);
            return fechaLocal.toISOString().slice(0, 16);
          };
          setFormData({
            pacienteId: consulta.pacienteId || '',
            fechaHora: consulta.fechaHora ? formatearFechaLocal(consulta.fechaHora) : '',
            motivo: consulta.motivo || '',
            diagnostico: consulta.diagnostico || '',
            tratamiento: consulta.tratamiento || '',
            observaciones: consulta.observaciones || '',
            proximaConsulta: consulta.proximaConsulta || '',
            signosVitales: consulta.signosVitales || {
              presionArterial: { sistolica: '', diastolica: '' },
              frecuenciaCardiaca: '',
              temperatura: '',
              frecuenciaRespiratoria: '',
              saturacionO2: '',
              peso: '',
              talla: '',
              imc: ''
              }
            });
            // try to set pacienteOption for AsyncSelect
            const found = pacientes.find(p => p.id === consulta.pacienteId);
            if (found) {
              setPacienteOption({ value: found.id, label: `${found.nombreCompleto} - DNI: ${found.dni}`, paciente: found });
            } else if (consulta.pacienteId) {
              getPacienteById(consulta.pacienteId).then(p => {
                setPacienteOption({ value: p.id, label: `${p.nombreCompleto} - DNI: ${p.dni}`, paciente: p });
              }).catch(err => console.error('Error cargando paciente:', err));
            }
          });
      } else {
        navigate('/consultas');
      }
    } else {
      // Si es nueva consulta, establecer fecha y hora actual
      const ahora = new Date();
      ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
      // Deferir el setState para evitar setState síncrono dentro del efecto
      Promise.resolve().then(() => {
        setFormData(prev => ({
          ...prev,
          fechaHora: ahora.toISOString().slice(0, 16)
        }));
      });
    }
  }, [id, consultas, navigate, pacientes]);

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

  // Manejar cambios en signos vitales
  function handleSignosVitalesChange(e) {
    const { name, value } = e.target;
    const keys = name.split('.');

    setFormData(prev => {
      const newFormData = { ...prev };

      if (keys.length === 2) {
        // Para campos simples como temperatura, peso, etc.
        newFormData.signosVitales = {
          ...prev.signosVitales,
          [keys[1]]: value
        };
      } else if (keys.length === 3) {
        // Para presión arterial (sistólica/diastólica)
        newFormData.signosVitales = {
          ...prev.signosVitales,
          presionArterial: {
            ...prev.signosVitales.presionArterial,
            [keys[2]]: value
          }
        };
      }

      // Calcular IMC automáticamente si hay peso y talla
      if ((keys[1] === 'peso' || keys[1] === 'talla') && newFormData.signosVitales.peso && newFormData.signosVitales.talla) {
        const peso = parseFloat(newFormData.signosVitales.peso);
        const talla = parseFloat(newFormData.signosVitales.talla) / 100; // convertir cm a m
        if (peso > 0 && talla > 0) {
          newFormData.signosVitales.imc = (peso / (talla * talla)).toFixed(2);
        }
      }

      return newFormData;
    });
  }

    // AsyncSelect loadOptions con debounce
    const loadOptions = (inputValue) => {
      return new Promise((resolve) => {
        clearTimeout(loadTimer.current);
        loadTimer.current = setTimeout(async () => {
          if (!inputValue) return resolve([]);
          try {
            const results = await searchPacientes(inputValue, 30);
            const options = results.map(p => ({ value: p.id, label: `${p.nombreCompleto} - DNI: ${p.dni}`, paciente: p }));
            resolve(options);
          } catch (err) {
            console.error(err);
            resolve([]);
          }
        }, 300);
      });
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

      await Swal.fire({
        title: '¡Guardado!',
        text: isEditing ? 'La consulta ha sido actualizada.' : 'La consulta ha sido registrada.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      navigate('/consultas');
    } catch (error) {
      console.error('Error al guardar la consulta:', error);
      setSubmitError('Error al guardar la consulta. Por favor, intente nuevamente.');
      Swal.fire('Error', 'No se pudo guardar la consulta', 'error');
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



      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Paciente *</Form.Label>
                  <AsyncSelect
                    loadOptions={loadOptions}
                    value={pacienteOption || pacientesOptions.find(opt => opt.value === formData.pacienteId) || null}
                    onChange={(selectedOption) => {
                      setFormData(prev => ({ ...prev, pacienteId: selectedOption ? selectedOption.value : '' }));
                      setPacienteOption(selectedOption || null);
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
              <div className="alert alert-info py-2 px-3 mb-3">
                <strong>Paciente seleccionado:</strong> {pacienteSeleccionado.nombreCompleto}
                {pacienteSeleccionado.obraSocial && (
                  <> - Obra Social: {pacienteSeleccionado.obraSocial}</>
                )}
              </div>
            )}

            {/* Signos Vitales */}
            <Card className="mb-3 border-primary">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Signos Vitales</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Presión Arterial (mmHg)</Form.Label>
                      <Row>
                        <Col>
                          <Form.Control
                            type="number"
                            name="signosVitales.presionArterial.sistolica"
                            value={formData.signosVitales.presionArterial.sistolica}
                            onChange={handleSignosVitalesChange}
                            placeholder="Sistólica"
                            min="0"
                            max="300"
                            className="placeholder-subtle"
                          />
                          <Form.Text className="text-muted">Sistólica</Form.Text>
                        </Col>
                        <Col>
                          <Form.Control
                            type="number"
                            name="signosVitales.presionArterial.diastolica"
                            value={formData.signosVitales.presionArterial.diastolica}
                            onChange={handleSignosVitalesChange}
                            placeholder="Diastólica"
                            min="0"
                            max="200"
                            className="placeholder-subtle"
                          />
                          <Form.Text className="text-muted">Diastólica</Form.Text>
                        </Col>
                      </Row>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Frecuencia Cardíaca (lpm)</Form.Label>
                      <Form.Control
                        type="number"
                        name="signosVitales.frecuenciaCardiaca"
                        value={formData.signosVitales.frecuenciaCardiaca}
                        onChange={handleSignosVitalesChange}
                        placeholder="72"
                        min="0"
                        max="300"
                        className="placeholder-subtle"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Temperatura (°C)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        name="signosVitales.temperatura"
                        value={formData.signosVitales.temperatura}
                        onChange={handleSignosVitalesChange}
                        placeholder="36.5"
                        min="30"
                        max="45"
                        className="placeholder-subtle"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Frec. Respiratoria (rpm)</Form.Label>
                      <Form.Control
                        type="number"
                        name="signosVitales.frecuenciaRespiratoria"
                        value={formData.signosVitales.frecuenciaRespiratoria}
                        onChange={handleSignosVitalesChange}
                        placeholder="16"
                        min="0"
                        max="100"
                        className="placeholder-subtle"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Saturación O₂ (%)</Form.Label>
                      <Form.Control
                        type="number"
                        name="signosVitales.saturacionO2"
                        value={formData.signosVitales.saturacionO2}
                        onChange={handleSignosVitalesChange}
                        placeholder="98"
                        min="0"
                        max="100"
                        className="placeholder-subtle"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Peso (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        name="signosVitales.peso"
                        value={formData.signosVitales.peso}
                        onChange={handleSignosVitalesChange}
                        placeholder="70"
                        min="0"
                        max="500"
                        className="placeholder-subtle"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Talla (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        name="signosVitales.talla"
                        value={formData.signosVitales.talla}
                        onChange={handleSignosVitalesChange}
                        placeholder="170"
                        min="0"
                        max="250"
                        className="placeholder-subtle"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>IMC</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.signosVitales.imc}
                        readOnly
                        placeholder="Auto"
                        className="bg-light"
                      />
                      {formData.signosVitales.imc && (
                        <Form.Text className={
                          formData.signosVitales.imc < 18.5 ? 'text-warning' :
                          formData.signosVitales.imc > 24.9 ? 'text-danger' :
                          'text-success'
                        }>
                          {formData.signosVitales.imc < 18.5 ? 'Bajo' :
                           formData.signosVitales.imc > 24.9 ? 'Alto' :
                           'Normal'}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

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
