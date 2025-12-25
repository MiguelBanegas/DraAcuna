import { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaPrint, FaFileMedical, FaStethoscope } from 'react-icons/fa';
import { useHistoriaClinica } from '../../context/HistoriaClinicaContext';
import { usePacientes } from '../../context/PacientesContext';
import { useConsultas } from '../../context/ConsultasContext';
import Swal from 'sweetalert2';

const HistoriaClinicaForm = () => {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const { agregarHistoriaClinica } = useHistoriaClinica();
  const { pacientes } = usePacientes();
  const { obtenerConsultasPorPaciente } = useConsultas();
  
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      const pacienteEncontrado = pacientes.find(p => p.id == pacienteId);
      if (pacienteEncontrado) {
        setPaciente(pacienteEncontrado);
        try {
          const consultasData = await obtenerConsultasPorPaciente(pacienteId);
          setConsultas(consultasData);
        } catch (error) {
          console.error("Error al cargar consultas:", error);
        }
      }
      setLoading(false);
    };
    fetchDatos();
  }, [pacienteId, pacientes, obtenerConsultasPorPaciente]);

  if (loading) return <Container className="py-5 text-center"><p>Cargando datos del paciente...</p></Container>;

  if (!paciente) {
    return (
      <Container className="py-5 text-center">
        <div className="alert alert-danger mb-4">Paciente no encontrado</div>
        <Button onClick={() => navigate('/historia-clinica')}>Volver</Button>
      </Container>
    );
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError('');

    try {
      const historiaData = {
        pacienteId: pacienteId,
        observacionesMedico: observaciones
      };

      const nuevaHistoria = await agregarHistoriaClinica(historiaData);
      
      await Swal.fire({
        title: '¡Guardada!',
        text: 'La historia clínica ha sido generada correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Una vez guardada, vamos al detalle normal
      navigate(`/historia-clinica/${nuevaHistoria.id}`);
    } catch (error) {
      const msg = error?.message || 'Error al guardar la historia clínica';
      setSubmitError(msg);
      Swal.fire('Error', msg, 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container className="py-4">
      {/* Botones de acción superiores (No se imprimen) */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <h2 className="mb-0">
          <FaFileMedical className="me-2 text-primary" />
          Generar Historia Clínica
        </h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate('/historia-clinica')}>
            <FaTimes className="me-2" /> Cancelar
          </Button>
          <Button variant="info" onClick={handlePrint}>
            <FaPrint className="me-2" /> Imprimir Vista
          </Button>
        </div>
      </div>



      {/* Vista de Historia Clínica (Lo que se imprime) */}
      <div className="print-container">
        {/* Encabezado Profesional (Solo impresión/Vista previa) */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <div className="text-center mb-4">
              <h3 className="mb-1">CONSULTORIO MÉDICO - Dra. Acuña</h3>
              <p className="text-muted small">Resumen de Atención del Paciente</p>
            </div>
            
            <Row className="bg-light p-3 rounded mx-0">
              <Col md={6}>
                <h6 className="text-uppercase text-muted small fw-bold">Datos del Paciente</h6>
                <p className="mb-1"><strong>Nombre:</strong> {paciente.nombreCompleto}</p>
                <p className="mb-1"><strong>DNI:</strong> {paciente.dni}</p>
                <p className="mb-0"><strong>Obra Social:</strong> {paciente.obraSocial || 'Particular'} {paciente.numeroAfiliado ? `(${paciente.numeroAfiliado})` : ''}</p>
              </Col>
              <Col md={6} className="text-md-end mt-3 mt-md-0">
                <h6 className="text-uppercase text-muted small fw-bold">Información del Reporte</h6>
                <p className="mb-1"><strong>Fecha Emisión:</strong> {new Date().toLocaleDateString('es-AR')}</p>
                <p className="mb-0"><strong>Médico:</strong> Dra. Acuña</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Historial de Consultas */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Header className="bg-white py-3">
            <h5 className="mb-0"><FaStethoscope className="me-2 text-primary" />Historial de Consultas</h5>
          </Card.Header>
          <Card.Body>
            {consultas.length === 0 ? (
              <p className="text-muted text-center py-3">No hay registros de consultas para este paciente.</p>
            ) : (
              <div className="timeline">
                {consultas.sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora)).map((consulta, idx) => (
                  <div key={consulta.id} className={`pb-3 ${idx < consultas.length - 1 ? 'border-bottom mb-3' : ''}`}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="fw-bold">{formatearFechaHora(consulta.fechaHora)}</span>
                    </div>
                    <p className="mb-1"><strong>Motivo:</strong> {consulta.motivo}</p>
                    {consulta.diagnostico && <p className="mb-1"><strong>Diagnóstico:</strong> {consulta.diagnostico}</p>}
                    {consulta.tratamiento && <p className="mb-0 text-muted small"><strong>Tratamiento:</strong> {consulta.tratamiento}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Sección de Observaciones Editables (No se imprime el textarea, se imprime el contenido) */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Observaciones y Recomendaciones</h5>
          </Card.Header>
          <Card.Body>
            {/* Solo se muestra el TextArea en la pantalla, no en la impresión */}
            <div className="no-print">
              <Form.Control
                as="textarea"
                rows={4}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Escriba aquí sus observaciones generales, recomendaciones o conclusiones..."
                className="mb-3"
              />
              <div className="text-end">
                <Button 
                  variant="primary" 
                  onClick={handleSubmit}
                  disabled={!observaciones.trim()}
                  className="d-inline-flex align-items-center gap-2"
                >
                  <FaSave />
                  Guardar Observaciones
                </Button>
              </div>
            </div>
            {/* Este div solo es visible en la impresión para mostrar el texto del TextArea */}
            <div className="print-only" style={{ display: 'none', whiteSpace: 'pre-wrap' }}>
              {observaciones || 'No se registraron observaciones adicionales.'}
            </div>
          </Card.Body>
        </Card>

        {/* Firma para la impresión */}
        <div className="print-only mt-5 pt-5 text-end" style={{ display: 'none' }}>
          <div className="d-inline-block text-center" style={{ borderTop: '1px solid black', minWidth: '200px', paddingTop: '5px' }}>
            <strong>Dra. Acuña</strong><br />
            <span className="small">Médica - MP 12345</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background-color: white !important; }
          .container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .card { border: none !important; box-shadow: none !important; }
          .bg-light { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
          @page { margin: 2cm; }
        }
      `}</style>
    </Container>
  );
};

export default HistoriaClinicaForm;
