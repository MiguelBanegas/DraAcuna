import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { FaEdit, FaPlus, FaSave, FaTrash, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  createAgendaExcepcion,
  deleteAgendaExcepcion,
  getAgendaExcepciones,
  updateAgendaExcepcion,
} from '../../services/agendaExcepcionesService';

const DEFAULT_FORM = {
  fecha: '',
  tipo: 'cerrado',
  motivo: '',
  horaInicio: '',
  horaFin: '',
  bloqueaTurnos: true,
};

const formatDate = (fecha) => {
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
};

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const AgendaExcepcionesPanel = ({ onExceptionsChange }) => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  const range = useMemo(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 6, 0);
    return {
      fechaInicio: toDateKey(from),
      fechaFin: toDateKey(to),
    };
  }, []);

  const loadExceptions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAgendaExcepciones(range.fechaInicio, range.fechaFin);
      setExceptions(data);
    } catch (error) {
      console.error('Error al cargar excepciones de agenda:', error);
      Swal.fire('Error', 'No se pudieron cargar las excepciones de agenda.', 'error');
    } finally {
      setLoading(false);
    }
  }, [range.fechaFin, range.fechaInicio]);

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      fecha: item.fecha,
      tipo: item.tipo,
      motivo: item.motivo || '',
      horaInicio: item.horaInicio || '',
      horaFin: item.horaFin || '',
      bloqueaTurnos: item.bloqueaTurnos,
    });
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: 'Eliminar excepción',
      text: `Se eliminará la excepción del ${formatDate(item.fecha)}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteAgendaExcepcion(item.id);
      await loadExceptions();
      onExceptionsChange?.();
    } catch (error) {
      console.error('Error al eliminar excepción:', error);
      Swal.fire('Error', error.message || 'No se pudo eliminar la excepción.', 'error');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.fecha) {
      Swal.fire('Falta la fecha', 'Debe indicar una fecha para la excepción.', 'warning');
      return;
    }

    if (formData.horaInicio && formData.horaFin && formData.horaInicio >= formData.horaFin) {
      Swal.fire('Horario inválido', 'La hora de inicio debe ser menor a la hora de fin.', 'warning');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await updateAgendaExcepcion(editingId, formData);
      } else {
        await createAgendaExcepcion(formData);
      }

      await loadExceptions();
      onExceptionsChange?.();
      resetForm();
    } catch (error) {
      console.error('Error al guardar excepción:', error);
      Swal.fire('Error', error.message || 'No se pudo guardar la excepción.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-1">Excepciones de agenda</h5>
            <small className="text-muted">Vacaciones, licencias, cierres o días con horario especial.</small>
          </div>
          {!editingId && (
            <Badge bg="secondary">{exceptions.length} cargada{exceptions.length === 1 ? '' : 's'}</Badge>
          )}
        </div>

        <Form onSubmit={handleSubmit}>
          <Row className="g-2 align-items-end">
            <Col md={2}>
              <Form.Group>
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                  disabled={saving}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select
                  value={formData.tipo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
                  disabled={saving}
                >
                  <option value="cerrado">Cerrado</option>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="licencia">Licencia</option>
                  <option value="horario_especial">Horario especial</option>
                  <option value="personalizado">Personalizado</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Motivo</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.motivo}
                  placeholder="Ej: Congreso, descanso, feriado puente"
                  onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))}
                  disabled={saving}
                />
              </Form.Group>
            </Col>
            <Col md={1}>
              <Form.Group>
                <Form.Label>Desde</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, horaInicio: e.target.value }))}
                  disabled={saving}
                />
              </Form.Group>
            </Col>
            <Col md={1}>
              <Form.Group>
                <Form.Label>Hasta</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, horaFin: e.target.value }))}
                  disabled={saving}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Check
                className="mt-4"
                type="switch"
                id="bloquea-turnos"
                label="Bloquear turnos"
                checked={formData.bloqueaTurnos}
                onChange={(e) => setFormData((prev) => ({ ...prev, bloqueaTurnos: e.target.checked }))}
                disabled={saving}
              />
            </Col>
            <Col md={1} className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {editingId ? <FaSave /> : <FaPlus />}
              </Button>
              {editingId && (
                <Button type="button" variant="outline-secondary" onClick={resetForm} disabled={saving}>
                  <FaTimes />
                </Button>
              )}
            </Col>
          </Row>
        </Form>

        <div className="table-responsive mt-4">
          <Table hover size="sm" className="mb-0">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Horario</th>
                <th>Bloquea</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3">Cargando excepciones...</td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3">No hay excepciones cargadas para este período.</td>
                </tr>
              ) : (
                exceptions.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.fecha)}</td>
                    <td className="text-capitalize">{item.tipo.replace('_', ' ')}</td>
                    <td>{item.motivo || <span className="text-muted">Sin detalle</span>}</td>
                    <td>{item.horaInicio && item.horaFin ? `${item.horaInicio.slice(0, 5)} - ${item.horaFin.slice(0, 5)}` : <span className="text-muted">Todo el día</span>}</td>
                    <td>
                      <Badge bg={item.bloqueaTurnos ? 'danger' : 'info'}>
                        {item.bloqueaTurnos ? 'Sí' : 'No'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(item)}>
                          <FaEdit />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item)}>
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AgendaExcepcionesPanel;
