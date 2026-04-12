import { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, InputGroup, Badge, Container, Row, Col, Card, Pagination } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye, FaUndo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { usePacientes } from '../../context/PacientesContext';
import Swal from 'sweetalert2';
import { calcularEdadDesdeFecha } from '../../utils/date';

const PacientesList = () => {
  const navigate = useNavigate();
  const { pacientes, eliminarPaciente, reactivarPaciente } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingActionId, setPendingActionId] = useState(null);
  const [currentPageActive, setCurrentPageActive] = useState(1);
  const [currentPageArchived, setCurrentPageArchived] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const searchInputRef = useRef(null);
  const itemsPerPage = 10;

  // Auto-focus en el campo de búsqueda al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Actualizar filtro cuando cambia el término de búsqueda
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Manejar eliminación con confirmación
  const handleDelete = async (id, nombre) => {
    if (pendingActionId !== null) {
      return;
    }

      const result = await Swal.fire({
      title: '¿Archivar paciente?',
      text: `Se archivará al paciente ${nombre}. Su historial se conserva, pero no podrá usarse para nuevos registros.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        setPendingActionId(id);
        try {
          await eliminarPaciente(id);
        } catch (error) {
          setPendingActionId(null);
          Swal.showValidationMessage('No se pudo archivar el paciente');
          throw error;
        }
      }
    });

    if (result.isConfirmed) {
      try {
        await Swal.fire({
          title: 'Archivado',
          text: 'El paciente ha sido archivado correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al eliminar paciente:', error);
          Swal.fire('Error', 'No se pudo archivar al paciente', 'error');
      } finally {
        setPendingActionId(null);
      }
    }
  };

  const handleReactivate = async (id, nombre) => {
    try {
      setPendingActionId(id);
      await reactivarPaciente(id);
      await Swal.fire({
        title: 'Reactivado',
        text: `El paciente ${nombre} volvió a estar activo.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al reactivar paciente:', error);
      Swal.fire('Error', 'No se pudo reactivar al paciente', 'error');
    } finally {
      setPendingActionId(null);
    }
  };

  // Calcular edad
  const calcularEdad = (fechaNacimiento) => calcularEdadDesdeFecha(fechaNacimiento);

  // Filtrado por búsqueda (requiere 3 caracteres)
  const listaMostrar = (() => {
    const termRaw = searchTerm.trim();
    if (termRaw.length < 3) return pacientes;
    const term = termRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    
    return pacientes.filter((p) => {
      const nombre = String(p.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const apellido = String(p.apellido || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const completo = String(p.nombreCompleto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const dni = String(p.dni || '').toLowerCase();
      return nombre.includes(term) || apellido.includes(term) || completo.includes(term) || dni.includes(term);
    });
  })();

  // Helper para obtener el nombre en formato "Apellido, Nombre" para mostrar y ordenar
  const getFormatName = (p) => {
    if (p.apellido) {
      return `${p.apellido}${p.nombre ? `, ${p.nombre}` : ''}`;
    }
    if (!p.nombreCompleto) return '';
    
    // Intento de extraer el apellido de nombreCompleto para registros legacy
    const partes = p.nombreCompleto.trim().split(/\s+/);
    if (partes.length > 1) {
      const apellido = partes.pop();
      const nombre = partes.join(' ');
      return `${apellido}, ${nombre}`;
    }
    return p.nombreCompleto;
  };

  const normalizeName = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sortByName = (a, b) => {
    return normalizeName(getFormatName(a)).localeCompare(normalizeName(getFormatName(b)));
  };

  const activeList = listaMostrar.filter((p) => p.activo !== false).sort(sortByName);
  const archivedList = listaMostrar.filter((p) => p.activo === false).sort(sortByName);

  const totalPagesActive = Math.max(1, Math.ceil(activeList.length / itemsPerPage));
  const totalPagesArchived = Math.max(1, Math.ceil(archivedList.length / itemsPerPage));

  const startActive = (currentPageActive - 1) * itemsPerPage;
  const visibleActive = activeList.slice(startActive, startActive + itemsPerPage);

  const startArchived = (currentPageArchived - 1) * itemsPerPage;
  const visibleArchived = archivedList.slice(startArchived, startArchived + itemsPerPage);

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Pacientes</h2>
            <div className="d-flex gap-2 align-items-center">
              <small className="text-muted me-2">Activos: {activeList.length}</small>
              <small className="text-muted me-2">Archivados: {archivedList.length}</small>
              <Button variant="outline-secondary" size="sm" onClick={() => { setShowArchived(v => !v); setCurrentPageArchived(1); }} disabled={pendingActionId !== null}>
                {showArchived ? 'Ocultar archivados' : 'Mostrar archivados'}
              </Button>
              <Button 
                variant="primary" 
                onClick={() => navigate('/pacientes/nuevo')}
                disabled={pendingActionId !== null}
              >
                <FaPlus className="me-2" />
                Nuevo Paciente
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nombre o DNI (mínimo 3 caracteres)..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </InputGroup>
          {searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
            <Form.Text className="text-muted ms-1">
              Ingrese al menos 3 caracteres para buscar
            </Form.Text>
          )}
        </Col>
        <Col md={6} className="text-end">
          <Badge bg="secondary" className="fs-6">
            {activeList.length} paciente{activeList.length !== 1 ? 's' : ''}
          </Badge>
        </Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          {activeList.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                {searchTerm.trim().length >= 3 
                  ? 'No se encontraron pacientes activos' 
                  : 'Ingrese un nombre o DNI para buscar pacientes (mínimo 3 caracteres)'}
              </p>
              {searchTerm.trim().length === 0 && (
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/pacientes/nuevo')}
                  disabled={pendingActionId !== null}
                >
                  <FaPlus className="me-2" />
                  Agregar Nuevo Paciente
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nombre Completo</th>
                    <th>DNI</th>
                    <th>Edad</th>
                    <th>Teléfono</th>
                    <th>Obra Social</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleActive.map((paciente) => (
                    <tr key={paciente.id}>
                      <td>
                        <strong>
                          {getFormatName(paciente)}
                        </strong>
                        {paciente.activo === false && (
                          <Badge bg="secondary" className="ms-2">Archivado</Badge>
                        )}
                        <br />
                        <small className="text-muted">{paciente.email}</small>
                      </td>
                      <td>{paciente.dni}</td>
                      <td>{calcularEdad(paciente.fechaNacimiento)} años</td>
                      <td>{paciente.telefono}</td>
                      <td>
                        {paciente.obraSocial || '-'}
                        {paciente.numeroAfiliado && (
                          <>
                            <br />
                            <small className="text-muted">N° {paciente.numeroAfiliado}</small>
                          </>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          {(() => {
                            const nombreFmt = getFormatName(paciente);
                            return (
                              <>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => navigate(`/pacientes/${paciente.id}`)}
                            title="Ver detalle"
                            disabled={pendingActionId !== null}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
                            title="Editar"
                            disabled={pendingActionId !== null}
                          >
                            <FaEdit />
                          </Button>
                          {paciente.activo === false ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleReactivate(paciente.id, nombreFmt)}
                              title="Reactivar"
                              disabled={pendingActionId !== null}
                            >
                              {pendingActionId === paciente.id ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <FaUndo />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(paciente.id, nombreFmt)}
                              title="Archivar"
                              disabled={pendingActionId !== null}
                            >
                              {pendingActionId === paciente.id ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <FaTrash />
                              )}
                            </Button>
                          )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-center p-2">
                <Pagination>
                  <Pagination.Prev onClick={() => setCurrentPageActive(p => Math.max(1, p - 1))} disabled={currentPageActive === 1} />
                  {Array.from({ length: totalPagesActive }).map((_, i) => (
                    <Pagination.Item key={i} active={i + 1 === currentPageActive} onClick={() => setCurrentPageActive(i + 1)}>
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => setCurrentPageActive(p => Math.min(totalPagesActive, p + 1))} disabled={currentPageActive === totalPagesActive} />
                </Pagination>
              </div>
            </div>
          )}
          {showArchived && (
            <div className="p-3">
              <h5>Archivados</h5>
              {archivedList.length === 0 ? (
                <p className="text-muted">No hay pacientes archivados.</p>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre Completo</th>
                        <th>DNI</th>
                        <th>Edad</th>
                        <th>Teléfono</th>
                        <th>Obra Social</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleArchived.map((paciente) => (
                        <tr key={paciente.id}>
                          <td>
                            <strong>
                              {getFormatName(paciente)}
                            </strong>
                            <Badge bg="secondary" className="ms-2">Archivado</Badge>
                            <br />
                            <small className="text-muted">{paciente.email}</small>
                          </td>
                          <td>{paciente.dni}</td>
                          <td>{calcularEdad(paciente.fechaNacimiento)} años</td>
                          <td>{paciente.telefono}</td>
                          <td>
                            {paciente.obraSocial || '-'}
                            {paciente.numeroAfiliado && (
                              <>
                                <br />
                                <small className="text-muted">N° {paciente.numeroAfiliado}</small>
                              </>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => navigate(`/pacientes/${paciente.id}`)}
                                title="Ver detalle"
                                disabled={pendingActionId !== null}
                              >
                                <FaEye />
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
                                title="Editar"
                                disabled={pendingActionId !== null}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                              onClick={() => handleReactivate(paciente.id, getFormatName(paciente))}
                                title="Reactivar"
                                disabled={pendingActionId !== null}
                              >
                                <FaUndo />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="d-flex justify-content-center p-2">
                    <Pagination>
                      <Pagination.Prev onClick={() => setCurrentPageArchived(p => Math.max(1, p - 1))} disabled={currentPageArchived === 1} />
                      {Array.from({ length: totalPagesArchived }).map((_, i) => (
                        <Pagination.Item key={i} active={i + 1 === currentPageArchived} onClick={() => setCurrentPageArchived(i + 1)}>{i + 1}</Pagination.Item>
                      ))}
                      <Pagination.Next onClick={() => setCurrentPageArchived(p => Math.min(totalPagesArchived, p + 1))} disabled={currentPageArchived === totalPagesArchived} />
                    </Pagination>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PacientesList;
