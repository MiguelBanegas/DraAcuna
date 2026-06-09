import { useState, useEffect, useRef } from 'react';
import { Form, Button, Container, Row, Col, Card, Modal } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSave, FaTimes, FaUserPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import AsyncSelect from 'react-select/async';
import { searchPacientes, getPacienteById } from '../../services/pacientesService';
import { useTurnos } from '../../context/TurnosContext';
import { usePacientes } from '../../context/PacientesContext';
import { getFeriadoByDate } from '../../services/feriadosService';
import { getAgendaExcepciones } from '../../services/agendaExcepcionesService';

// Función auxiliar para convertir fecha UTC a local para el input datetime-local
const formatearFechaLocal = (fechaUTC) => {
  if (!fechaUTC) return '';
  const fecha = new Date(fechaUTC);
  const offset = fecha.getTimezoneOffset() * 60000;
  const fechaLocal = new Date(fecha.getTime() - offset);
  return fechaLocal.toISOString().slice(0, 16);
};

const isValidDni = (value) => {
  const dni = String(value || '').trim();
  return /^\d{7,8}$/.test(dni) && !/^0+$/.test(dni);
};

const capitalizeEachWord = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const WHATSAPP_COUNTRY_CODE = '54';
const WHATSAPP_SIGNATURE = import.meta.env.VITE_WHATSAPP_SIGNATURE || 'Consultorio Dra. Ana Acuña';

const normalizePhoneForWhatsApp = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith(WHATSAPP_COUNTRY_CODE)) return digits;
  return `${WHATSAPP_COUNTRY_CODE}${digits}`;
};

const buildTurnoWhatsappMessage = ({ pacienteNombre, fechaHora, duracion, motivo }) => {
  const fecha = new Date(fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-AR');
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `Hola ${pacienteNombre}, te recordamos tu turno:
Fecha: ${fechaStr}
Hora: ${horaStr}
Duración: ${duracion} min
Motivo: ${motivo}

${WHATSAPP_SIGNATURE}`;
};

const TurnoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { turnos, agregarTurno, actualizarTurno } = useTurnos();
  const { pacientes, pacientesActivos, agregarPaciente } = usePacientes();
  
  const isEditing = !!id;

  const [formData, setFormData] = useState(() => {
    const initialData = {
      pacienteId: location.state?.pacienteId || '',
      fechaHora: '',
      duracion: '30',
      estado: 'pendiente',
      motivo: '',
      observaciones: ''
    };

    // Si estamos editando y los turnos ya están cargados (ej: navegando desde la lista)
    if (id && turnos && turnos.length > 0) {
      const turno = turnos.find(t => String(t.id) === String(id));
      if (turno) {
        return {
          pacienteId: turno.pacienteId || '',
          fechaHora: formatearFechaLocal(turno.fechaHora),
          duracion: turno.duracion?.toString() || '30',
          estado: turno.estado || 'pendiente',
          motivo: turno.motivo || '',
          observaciones: turno.observaciones || ''
        };
      }
    }

    if (!id) {
      const ahora = new Date();
      ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
      const minutos = ahora.getMinutes();
      if (minutos < 30) {
        ahora.setMinutes(30);
      } else {
        ahora.setHours(ahora.getHours() + 1);
        ahora.setMinutes(0);
      }
      ahora.setSeconds(0);
      initialData.fechaHora = ahora.toISOString().slice(0, 16);
    }
    return initialData;
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feriadoInfo, setFeriadoInfo] = useState(null);
  const [agendaExceptionInfo, setAgendaExceptionInfo] = useState(null);
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);
  const [pacienteOption, setPacienteOption] = useState(null);
  const [showNuevoPacienteModal, setShowNuevoPacienteModal] = useState(false);
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  const [nuevoPacienteErrors, setNuevoPacienteErrors] = useState({});
  const [nuevoPacienteData, setNuevoPacienteData] = useState({
    apellido: '',
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    obraSocial: '',
    numeroAfiliado: '',
  });
  const loadTimer = useRef(null);
  
  // Ref para evitar re-inicializar el formulario si ya se cargaron los datos.
  // Se inicializa en true si los datos ya estaban disponibles durante el primer render.
  const initializedRef = useRef(!!(id && turnos.length > 0 && turnos.find(t => String(t.id) === String(id))));

  // Resetear el estado de inicialización si cambia el ID (por si el componente se reutiliza)
  useEffect(() => {
    initializedRef.current = false;
  }, [id]);

  // Preparar opciones para react-select
  const pacientesDisponibles = pacientesActivos.filter((p) => p.activo !== false || p.id === formData.pacienteId);
  const pacientesOptions = pacientesDisponibles.map(p => ({
    value: p.id,
    label: `${p.apellido ? `${p.apellido}, ${p.nombre}` : p.nombreCompleto} - DNI: ${p.dni}`,
    paciente: p
  }));

  // Cargar datos si es edición
  useEffect(() => {
    if (id && !initializedRef.current) {
      const turno = turnos.find(t => String(t.id) === String(id));
      if (turno) {
        // Defer the state update to avoid synchronous setState in effect body
        Promise.resolve().then(() => {
          setFormData({
            pacienteId: turno.pacienteId || '',
            fechaHora: formatearFechaLocal(turno.fechaHora),
            duracion: turno.duracion?.toString() || '30',
            estado: turno.estado || 'pendiente',
            motivo: turno.motivo || '',
            observaciones: turno.observaciones || ''
          });
          // try to set pacienteOption for AsyncSelect
          const found = pacientes.find(p => p.id === turno.pacienteId);
          if (found) {
            setPacienteOption({ value: found.id, label: `${found.apellido ? `${found.apellido}, ${found.nombre}` : found.nombreCompleto} - DNI: ${found.dni}`, paciente: found });
          } else if (turno.pacienteId) {
            getPacienteById(turno.pacienteId).then(p => {
              setPacienteOption({ value: p.id, label: `${p.apellido ? `${p.apellido}, ${p.nombre}` : p.nombreCompleto} - DNI: ${p.dni}`, paciente: p });
            }).catch(err => console.error('Error cargando paciente:', err));
          }
          initializedRef.current = true;
        });
      } else if (turnos.length > 0) {
        navigate('/turnos');
      }
    }
  }, [id, turnos, navigate, pacientes]);

  // Auto-focus en el campo de búsqueda al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadFeriado = async () => {
      if (!formData.fechaHora) {
        if (isMounted) {
          setFeriadoInfo(null);
        }
        return;
      }

      try {
        const feriado = await getFeriadoByDate(formData.fechaHora.slice(0, 10));
        if (isMounted) {
          setFeriadoInfo(feriado);
        }
      } catch (error) {
        console.error('Error al consultar feriado:', error);
        if (isMounted) {
          setFeriadoInfo(null);
        }
      }
    };

    loadFeriado();

    return () => {
      isMounted = false;
    };
  }, [formData.fechaHora]);

  useEffect(() => {
    let isMounted = true;

    const loadAgendaException = async () => {
      if (!formData.fechaHora) {
        if (isMounted) {
          setAgendaExceptionInfo(null);
        }
        return;
      }

      try {
        const fecha = formData.fechaHora.slice(0, 10);
        const data = await getAgendaExcepciones(fecha, fecha);
        if (isMounted) {
          setAgendaExceptionInfo(data[0] || null);
        }
      } catch (error) {
        console.error('Error al consultar excepción de agenda:', error);
        if (isMounted) {
          setAgendaExceptionInfo(null);
        }
      }
    };

    loadAgendaException();

    return () => {
      isMounted = false;
    };
  }, [formData.fechaHora]);

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
    // usamos toasts para mostrar errores, no mantenemos estado submitError
  };

  // AsyncSelect loadOptions con debounce
  const loadOptions = (inputValue) => {
    return new Promise((resolve) => {
      clearTimeout(loadTimer.current);
      loadTimer.current = setTimeout(async () => {
        if (!inputValue) return resolve([]);
        try {
          const results = await searchPacientes(inputValue, 30);
          const options = results.map(p => ({ 
            value: p.id, 
            label: `${p.apellido ? `${p.apellido}, ${p.nombre}` : p.nombreCompleto} - DNI: ${p.dni}`, 
            paciente: p 
          }));
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

    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (pacienteSeleccionado?.activo === false) {
      Swal.fire('Paciente archivado', 'No se pueden registrar nuevos turnos para un paciente archivado.', 'warning');
      return;
    }

    if (agendaExceptionInfo?.bloqueaTurnos) {
      Swal.fire(
        'Agenda bloqueada',
        `La fecha seleccionada tiene una excepción de agenda (${agendaExceptionInfo.tipo}${agendaExceptionInfo.motivo ? `: ${agendaExceptionInfo.motivo}` : ''}).`,
        'warning',
      );
      return;
    }

    let formToSubmit = null;
    try {
      setSubmitting(true);
      formToSubmit = {
        ...formData,
        fechaHora: new Date(formData.fechaHora).toISOString(),
        duracion: parseInt(formData.duracion)
      };

      if (isEditing) {
        await actualizarTurno(id, formToSubmit);
      } else {
        await agregarTurno(formToSubmit);
      }

      if (!isEditing) {
        const sendWhatsappResult = await Swal.fire({
          title: 'Turno guardado',
          text: '¿Desea enviar aviso por WhatsApp al paciente?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, enviar',
          cancelButtonText: 'No enviar'
        });

        if (sendWhatsappResult.isConfirmed) {
          await handleWhatsappTurno(formToSubmit);
        }
      }

      await Swal.fire({
        title: '¡Guardado!',
        text: isEditing ? 'El turno ha sido actualizado.' : 'El turno ha sido programado.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      navigate('/turnos');
    } catch (error) {
      // Si el backend devolvió detalles de conflicto, mostrar información más específica
      if (error && error.conflict) {
        const c = error.conflict;
        let fechaStr = c.fecha_hora;
        try {
          fechaStr = new Date(c.fecha_hora).toLocaleString();
        } catch {
          // ignore
        }
        const result = await Swal.fire({
          title: 'Conflicto de Horario',
          html: `El horario seleccionado se superpone con un turno existente de <strong>${c.paciente_nombre}</strong> el <strong>${fechaStr}</strong> (duración: ${c.duracion} min).<br>¿Desea forzar la creación del turno de todos modos?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Forzar creación',
          cancelButtonText: 'Cancelar',
        });

        if (result.isConfirmed) {
          // Reintentar forzando la creación/actualización
          const turnoDataForce = { ...formToSubmit, force: true };
          try {
            setSubmitting(true);
            if (isEditing) {
              await actualizarTurno(id, turnoDataForce);
            } else {
              await agregarTurno(turnoDataForce);
            }
            await Swal.fire({ title: '¡Guardado!', text: isEditing ? 'El turno ha sido actualizado.' : 'El turno ha sido programado.', icon: 'success', timer: 2000, showConfirmButton: false });
            navigate('/turnos');
            return;
          } catch (err2) {
            console.error('Error al forzar turno:', err2);
            Swal.fire('Error', 'No se pudo forzar el guardado del turno. Intente nuevamente.', 'error');
          } finally {
            setSubmitting(false);
          }
        }
      } else if (error.message && (error.message.includes('superpone') || error.message.includes('Ya existe'))) {
        Swal.fire('Conflicto de Horario', 'Ya existe un turno en ese horario. Por favor, elija otro horario.', 'warning');
      } else {
        Swal.fire('Error', 'No se pudo guardar el turno. Por favor, intente nuevamente.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetNuevoPacienteModal = () => {
    setNuevoPacienteData({
      apellido: '',
      nombre: '',
      dni: '',
      fechaNacimiento: '',
      genero: '',
      telefono: '',
      email: '',
      direccion: '',
      obraSocial: '',
      numeroAfiliado: '',
    });
    setNuevoPacienteErrors({});
  };

  const validateNuevoPaciente = () => {
    const nextErrors = {};
    if (!nuevoPacienteData.apellido.trim()) nextErrors.apellido = 'El apellido es requerido';
    if (!nuevoPacienteData.nombre.trim()) nextErrors.nombre = 'El nombre es requerido';
    if (!isValidDni(nuevoPacienteData.dni.trim())) nextErrors.dni = 'DNI inválido: debe tener 7 u 8 dígitos y no puede ser todo ceros';
    if (!nuevoPacienteData.fechaNacimiento) nextErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
    if (!nuevoPacienteData.genero) nextErrors.genero = 'El género es requerido';
    if (!nuevoPacienteData.telefono.trim()) nextErrors.telefono = 'El teléfono es requerido';
    if (nuevoPacienteData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoPacienteData.email)) nextErrors.email = 'El email no es válido';
    const duplicated = pacientes.find((p) => String(p.dni).trim() === nuevoPacienteData.dni.trim());
    if (duplicated) nextErrors.dni = 'Ya existe un paciente con ese DNI';
    setNuevoPacienteErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGuardarNuevoPaciente = async () => {
    if (guardandoPaciente) return;
    if (!validateNuevoPaciente()) return;
    try {
      setGuardandoPaciente(true);
      const apellidoNormalizado = capitalizeEachWord(nuevoPacienteData.apellido.trim());
      const nombreNormalizado = capitalizeEachWord(nuevoPacienteData.nombre.trim());
      const payload = {
        nombreCompleto: `${apellidoNormalizado}, ${nombreNormalizado}`,
        apellido: apellidoNormalizado,
        nombre: nombreNormalizado,
        dni: nuevoPacienteData.dni.trim(),
        fechaNacimiento: nuevoPacienteData.fechaNacimiento,
        genero: nuevoPacienteData.genero,
        telefono: nuevoPacienteData.telefono.trim(),
        email: nuevoPacienteData.email.trim(),
        direccion: nuevoPacienteData.direccion.trim(),
        obraSocial: nuevoPacienteData.obraSocial.trim(),
        numeroAfiliado: nuevoPacienteData.numeroAfiliado.trim()
      };
      const nuevo = await agregarPaciente(payload);
      const option = {
        value: nuevo.id,
        label: `${nuevo.apellido ? `${nuevo.apellido}, ${nuevo.nombre}` : nuevo.nombreCompleto} - DNI: ${nuevo.dni}`,
        paciente: nuevo,
      };
      setPacienteOption(option);
      setFormData((prev) => ({ ...prev, pacienteId: nuevo.id }));
      setShowNuevoPacienteModal(false);
      resetNuevoPacienteModal();
      Swal.fire({ title: 'Paciente creado', text: 'Se seleccionó automáticamente para este turno.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', error?.message || 'No se pudo guardar el paciente', 'error');
    } finally {
      setGuardandoPaciente(false);
    }
  };

  const pacienteSeleccionado = pacientes.find(p => p.id === formData.pacienteId);

  const handleWhatsappTurno = async (turnoData) => {
    if (!pacienteSeleccionado) return;
    const phone = normalizePhoneForWhatsApp(pacienteSeleccionado.telefono);
    if (!phone) {
      await Swal.fire('Sin teléfono', 'El paciente no tiene teléfono cargado para enviar WhatsApp.', 'warning');
      return;
    }

    const pacienteNombre = pacienteSeleccionado.apellido
      ? `${pacienteSeleccionado.apellido}, ${pacienteSeleccionado.nombre}`
      : pacienteSeleccionado.nombreCompleto;
    const message = buildTurnoWhatsappMessage({
      pacienteNombre,
      fechaHora: turnoData.fechaHora,
      duracion: turnoData.duracion,
      motivo: turnoData.motivo
    });
    const action = await Swal.fire({
      title: 'Enviar aviso',
      text: 'Puede abrir WhatsApp o copiar el mensaje.',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Abrir WhatsApp',
      denyButtonText: 'Copiar mensaje',
      cancelButtonText: 'Cancelar'
    });

    if (action.isConfirmed) {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, 'draacuna-whatsapp', 'noopener,noreferrer');
      return;
    }

    if (action.isDenied) {
      await navigator.clipboard.writeText(message);
      await Swal.fire('Copiado', 'Mensaje copiado al portapapeles.', 'success');
    }
  };

  return (
    <>
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>{isEditing ? 'Editar Turno' : 'Nuevo Turno'}</h2>
        </Col>
      </Row>

          {/* Los errores de guardado se muestran con toast; no usar Alert inline aquí */}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Paciente *</Form.Label>
                  <AsyncSelect
                    loadOptions={loadOptions}
                    ref={selectRef}
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
                    isDisabled={submitting}
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
                  <div className="mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowNuevoPacienteModal(true)}
                      disabled={submitting}
                    >
                      <FaUserPlus className="me-2" />
                      Nuevo paciente
                    </Button>
                  </div>
                  {formData.pacienteId && (
                    <div className="mt-2">
                      <small className={pacienteSeleccionado?.activo === false ? 'text-warning' : 'text-success'}>
                        {pacienteSeleccionado?.activo === false ? 'Paciente archivado' : '✓ Paciente seleccionado'}
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
                    disabled={submitting}
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
              <div className="alert alert-info py-2 px-3 mb-3">
                <strong>Paciente:</strong> {pacienteSeleccionado.apellido ? `${pacienteSeleccionado.apellido}, ${pacienteSeleccionado.nombre}` : pacienteSeleccionado.nombreCompleto}
                {pacienteSeleccionado.telefono && (
                  <> - Tel: {pacienteSeleccionado.telefono}</>
                )}
              </div>
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
                    disabled={submitting}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.fechaHora}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    El sistema validará que no haya superposición con otros turnos
                  </Form.Text>
                </Form.Group>
                {feriadoInfo && (
                  <div className="alert alert-warning py-2 px-3">
                    <strong>Feriado nacional:</strong> {feriadoInfo.nombre} ({feriadoInfo.tipo}).
                    Verificá si ese día habrá atención antes de confirmar el turno.
                  </div>
                )}
                {agendaExceptionInfo && (
                  <div className={`alert ${agendaExceptionInfo.bloqueaTurnos ? 'alert-danger' : 'alert-info'} py-2 px-3`}>
                    <strong>Excepción de agenda:</strong> {agendaExceptionInfo.tipo.replace('_', ' ')}
                    {agendaExceptionInfo.motivo ? ` - ${agendaExceptionInfo.motivo}` : ''}.
                    {agendaExceptionInfo.bloqueaTurnos
                      ? ' Ese día está bloqueado para nuevos turnos.'
                      : ' Revisá el detalle antes de confirmar el turno.'}
                  </div>
                )}
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Duración (minutos) *</Form.Label>
                  <Form.Select
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleChange}
                    isInvalid={!!errors.duracion}
                    disabled={submitting}
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
                disabled={submitting}
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
                disabled={submitting}
              />
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end mt-4">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/turnos')}
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
          </Form>
        </Card.Body>
      </Card>

      <div className="mt-3 text-muted">
        <small>* Campos requeridos</small>
      </div>
    </Container>
    <Modal show={showNuevoPacienteModal} onHide={() => { if (!guardandoPaciente) { setShowNuevoPacienteModal(false); resetNuevoPacienteModal(); } }} backdrop="static">
      <Modal.Header closeButton={!guardandoPaciente}>
        <Modal.Title>Nuevo Paciente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Apellido *</Form.Label>
              <Form.Control value={nuevoPacienteData.apellido} onChange={(e) => setNuevoPacienteData((p) => ({ ...p, apellido: capitalizeEachWord(e.target.value) }))} isInvalid={!!nuevoPacienteErrors.apellido} />
              <Form.Control.Feedback type="invalid">{nuevoPacienteErrors.apellido}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control value={nuevoPacienteData.nombre} onChange={(e) => setNuevoPacienteData((p) => ({ ...p, nombre: capitalizeEachWord(e.target.value) }))} isInvalid={!!nuevoPacienteErrors.nombre} />
              <Form.Control.Feedback type="invalid">{nuevoPacienteErrors.nombre}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>DNI *</Form.Label>
              <Form.Control value={nuevoPacienteData.dni} maxLength={8} onChange={(e) => setNuevoPacienteData((p) => ({ ...p, dni: e.target.value.replace(/\D/g, '') }))} isInvalid={!!nuevoPacienteErrors.dni} />
              <Form.Control.Feedback type="invalid">{nuevoPacienteErrors.dni}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Nacimiento *</Form.Label>
              <Form.Control type="date" value={nuevoPacienteData.fechaNacimiento} onChange={(e) => setNuevoPacienteData((p) => ({ ...p, fechaNacimiento: e.target.value }))} isInvalid={!!nuevoPacienteErrors.fechaNacimiento} />
              <Form.Control.Feedback type="invalid">{nuevoPacienteErrors.fechaNacimiento}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Género *</Form.Label>
              <Form.Select value={nuevoPacienteData.genero} onChange={(e) => setNuevoPacienteData((p) => ({ ...p, genero: e.target.value }))} isInvalid={!!nuevoPacienteErrors.genero}>
                <option value="">Seleccione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">{nuevoPacienteErrors.genero}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Teléfono *</Form.Label>
              <Form.Control value={nuevoPacienteData.telefono} onChange={(e) => setNuevoPacienteData((p) => ({ ...p, telefono: e.target.value }))} isInvalid={!!nuevoPacienteErrors.telefono} />
              <Form.Control.Feedback type="invalid">{nuevoPacienteErrors.telefono}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => { setShowNuevoPacienteModal(false); resetNuevoPacienteModal(); }} disabled={guardandoPaciente}>Cancelar</Button>
        <Button variant="primary" onClick={handleGuardarNuevoPaciente} disabled={guardandoPaciente}>
          {guardandoPaciente ? 'Guardando...' : 'Guardar Paciente'}
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default TurnoForm;
