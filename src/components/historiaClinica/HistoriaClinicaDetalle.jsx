import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import { FaArrowLeft, FaEdit, FaPrint, FaEye, FaSave, FaTrash } from 'react-icons/fa';
import { useHistoriaClinica } from '../../context/HistoriaClinicaContext';
import { usePacientes } from '../../context/PacientesContext';
import { useConsultas } from '../../context/ConsultasContext';
import Swal from 'sweetalert2';

const HistoriaClinicaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { historiasClinicas, actualizarHistoriaClinica, eliminarHistoriaClinica } = useHistoriaClinica();
  const { pacientes } = usePacientes();
  const { obtenerConsultasPorPaciente } = useConsultas();
  
  const [historia, setHistoria] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const [editando, setEditando] = useState(false);

  // Datos del médico
  const medicoData = {
    nombre: 'Dra. Acuña',
    matricula: 'MP 12345' // Puedes cambiar este número
  };

  useEffect(() => {
    const fetchHistoria = async () => {
      const historiaEncontrada = historiasClinicas.find(h => h.id == id);
      if (historiaEncontrada) {
        setHistoria(historiaEncontrada);
        setObservaciones(historiaEncontrada.observacionesMedico || '');
        const pacienteEncontrado = pacientes.find(p => p.id == historiaEncontrada.pacienteId);
        setPaciente(pacienteEncontrado);
        
        // Obtener consultas del paciente
        const consultasPaciente = await obtenerConsultasPorPaciente(historiaEncontrada.pacienteId);
        setConsultas(consultasPaciente);
      } else if (historiasClinicas.length > 0) {
        navigate('/historia-clinica');
      }
    };
    fetchHistoria();
  }, [id, historiasClinicas, pacientes, obtenerConsultasPorPaciente, navigate]);

  if (!historia || !paciente) {
    return null;
  }

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGuardarObservaciones = async () => {
    try {
      await actualizarHistoriaClinica(id, {
        ...historia,
        observacionesMedico: observaciones
      });
      setEditando(false);
    } catch (error) {
      console.error('Error al guardar observaciones:', error);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleEliminar = async () => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Está por eliminar esta historia clínica. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await eliminarHistoriaClinica(id);
        navigate('/historia-clinica');
        await Swal.fire({
          title: 'Eliminado',
          text: 'La historia clínica ha sido eliminada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la historia clínica', 'error');
        console.error('Error al eliminar:', error);
      }
    }
  };

  return (
    <div className="historia-clinica-container">
      <Container className="no-print mb-4">
        <Row>
          <Col>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/historia-clinica')}
              className="mb-3 no-print"
            >
              <FaArrowLeft className="me-2 no-print" />
              Volver
            </Button>
            <div className="d-flex justify-content-between align-items-center no-print">
              <h2 className="no-print">Historia Clínica - Resumen</h2>
              <div className="d-flex gap-2 no-print">
                <Button 
                  variant="danger" 
                  onClick={handleEliminar}
                  className="no-print"
                >
                  <FaTrash className="me-2 no-print" />
                  Eliminar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleImprimir}
                  className="no-print"
                >
                  <FaPrint className="me-2 no-print" />
                  Imprimir
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Contenido imprimible */}
      <Container className="print-container">
        {/* Encabezado del Resumen */}
        <Card className="mb-3 border-0">
          <Card.Body className="p-0">
            <div className="text-center mb-3">
              <h3 className="mb-1" style={{ fontSize: '1.4rem' }}>CONSULTORIO MÉDICO</h3>
              <h4 className="mb-1" style={{ fontSize: '1.2rem' }}>{medicoData.nombre}</h4>
              <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>Matrícula: {medicoData.matricula}</p>
            </div>
            
            <div style={{ borderTop: '1.5px solid #333', borderBottom: '1.5px solid #333', padding: '10px 0' }} className="mb-3">
              <Row className="g-0">
                <Col xs={7} style={{ borderRight: '1px solid #dee2e6' }}>
                  <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Datos del Paciente</h6>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                    <p className="mb-1"><strong>Nombre:</strong> {paciente.nombreCompleto}</p>
                    <div className="d-flex gap-3">
                      <p className="mb-1"><strong>DNI:</strong> {paciente.dni}</p>
                      <p className="mb-1"><strong>Edad:</strong> {Math.floor((new Date() - new Date(paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))} años</p>
                    </div>
                    {paciente.obraSocial && (
                      <p className="mb-1"><strong>OS:</strong> {paciente.obraSocial}</p>
                    )}
                  </div>
                </Col>
                <Col xs={5} className="ps-3">
                  <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Información del Reporte</h6>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <p className="mb-1"><strong>Emisión:</strong> {formatearFechaHora(historia.fechaGeneracion)}</p>
                    <p className="mb-1"><strong>Médico:</strong> {medicoData.nombre}</p>
                    <p className="mb-1"><strong>Registros:</strong> {consultas.length} consultas</p>
                  </div>
                </Col>
              </Row>
            </div>
          </Card.Body>
        </Card>

        {/* Historial de Consultas */}
        <Card className="mb-4 border-1">
          <Card.Header className="bg-white py-2">
            <h5 className="mb-0" style={{ fontSize: '1.1rem' }}>Historial de Consultas</h5>
          </Card.Header>
          <Card.Body className="py-2">
            {consultas.length === 0 ? (
              <p className="text-muted text-center mb-0">No hay consultas registradas</p>
            ) : (
              <div className="consultas-timeline">
                {consultas.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora)).map((consulta, idx) => (
                  <div key={consulta.id} className="consulta-item mb-3 pb-3" style={{ borderBottom: idx < consultas.length - 1 ? '1px solid #eee' : 'none' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-0" style={{ fontSize: '1rem' }}>Consulta {consultas.length - idx}</h6>
                      <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: '500' }}>{formatearFechaHora(consulta.fechaHora)}</span>
                    </div>
                    
                    <div className="mb-2" style={{ fontSize: '0.95rem' }}>
                      <p className="mb-1"><strong>Motivo:</strong> {consulta.motivo}</p>
                      
                      {consulta.diagnostico && (
                        <p className="mb-1"><strong>Diagnóstico:</strong> {consulta.diagnostico}</p>
                      )}
                      
                      {consulta.tratamiento && (
                        <p className="mb-1"><strong>Tratamiento:</strong> {consulta.tratamiento}</p>
                      )}
                    </div>
                    
                    {/* Signos Vitales */}
                    {consulta.signosVitales && (
                      consulta.signosVitales.presionArterial?.sistolica ||
                      consulta.signosVitales.temperatura ||
                      consulta.signosVitales.peso
                    ) && (
                      <div className="mt-2 p-2 rounded" style={{ border: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
                        <small className="d-block mb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Signos Vitales:</small>
                        <div className="d-flex flex-wrap gap-3">
                          {consulta.signosVitales.presionArterial?.sistolica && (
                            <div style={{ minWidth: '100px' }}>
                              <span style={{ fontSize: '0.8rem' }} className="text-muted">P.A.: </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{consulta.signosVitales.presionArterial.sistolica}/{consulta.signosVitales.presionArterial.diastolica} mmHg</span>
                            </div>
                          )}
                          {consulta.signosVitales.frecuenciaCardiaca && (
                            <div style={{ minWidth: '80px' }}>
                              <span style={{ fontSize: '0.8rem' }} className="text-muted">FC: </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{consulta.signosVitales.frecuenciaCardiaca} lpm</span>
                            </div>
                          )}
                          {consulta.signosVitales.temperatura && (
                            <div style={{ minWidth: '70px' }}>
                              <span style={{ fontSize: '0.8rem' }} className="text-muted">Temp: </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{consulta.signosVitales.temperatura} °C</span>
                            </div>
                          )}
                          {consulta.signosVitales.peso && (
                            <div style={{ minWidth: '70px' }}>
                              <span style={{ fontSize: '0.8rem' }} className="text-muted">Peso: </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{consulta.signosVitales.peso} kg</span>
                            </div>
                          )}
                          {consulta.signosVitales.talla && (
                            <div style={{ minWidth: '70px' }}>
                              <span style={{ fontSize: '0.8rem' }} className="text-muted">Talla: </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{consulta.signosVitales.talla} cm</span>
                            </div>
                          )}
                          {consulta.signosVitales.imc && (
                            <div style={{ minWidth: '60px' }}>
                              <span style={{ fontSize: '0.8rem' }} className="text-muted">IMC: </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{consulta.signosVitales.imc}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Observaciones del Médico */}
        <Card className="mb-4 border-1">
          <Card.Header className="bg-white py-2 d-flex justify-content-between align-items-center">
            <h5 className="mb-0" style={{ fontSize: '1.1rem' }}>Observaciones y Recomendaciones</h5>
            {!editando && (
              <Button 
                size="sm" 
                variant="outline-primary" 
                onClick={() => setEditando(true)}
                className="no-print"
              >
                <FaEdit className="me-1" />
                Editar
              </Button>
            )}
          </Card.Header>
          <Card.Body className="py-3">
            {editando ? (
              <div className="no-print">
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agregue observaciones, conclusiones o recomendaciones..."
                />
                <div className="d-flex gap-2 justify-content-end mt-3">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setObservaciones(historia.observacionesMedico || '');
                      setEditando(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleGuardarObservaciones}
                  >
                    <FaSave className="me-1" />
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {observaciones || <em className="text-muted">No hay observaciones registradas</em>}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Firma */}
        <div className="text-end mt-5 pt-4" style={{ borderTop: '1px solid #dee2e6' }}>
          <div style={{ display: 'inline-block', textAlign: 'center', minWidth: '200px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginBottom: '5px' }}>
              <strong>{medicoData.nombre}</strong>
            </div>
            <p className="mb-0">Matrícula: {medicoData.matricula}</p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default HistoriaClinicaDetalle;
