import { Modal, ListGroup, Badge } from 'react-bootstrap';
import { usePacientes } from '../../context/PacientesContext';

const TurnosDiaModal = ({ show, onHide, fecha, turnos }) => {
  const { pacientes } = usePacientes();

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estadoColor = {
    pendiente: 'warning',
    confirmado: 'success',
    cancelado: 'danger',
    completado: 'secondary'
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Turnos del {fecha && formatearFecha(fecha)}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {turnos && turnos.length > 0 ? (
          <ListGroup>
            {turnos.map(turno => {
              const paciente = pacientes.find(p => p.id === turno.pacienteId);
              const hora = formatearHora(turno.fechaHora);

              return (
                <ListGroup.Item key={turno.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-1">
                        <strong className="me-2" style={{ fontSize: '1.1rem' }}>{hora}</strong>
                        <Badge bg={estadoColor[turno.estado]}>
                          {turno.estado}
                        </Badge>
                      </div>
                      <div className="text-dark fw-bold">{paciente?.nombreCompleto || 'Paciente no encontrado'}</div>
                      <small className="text-muted d-block">{turno.motivo}</small>
                      {paciente?.telefono && (
                        <small className="text-muted">Tel: {paciente.telefono}</small>
                      )}
                    </div>
                    <div className="text-end">
                      <small className="text-muted">{turno.duracion || 30} min</small>
                    </div>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        ) : (
          <div className="text-center text-muted py-4">
            <p className="mb-0">No hay turnos programados para este día</p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default TurnosDiaModal;
