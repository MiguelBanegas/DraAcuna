import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, InputGroup, Badge, Container, Row, Col, Card } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { usePacientes } from '../../context/PacientesContext';
import Swal from 'sweetalert2';

const PacientesList = () => {
  const navigate = useNavigate();
  const { pacientes, eliminarPaciente, buscarPacientes } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const searchInputRef = useRef(null);

  // Auto-focus en el campo de búsqueda al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Actualizar filtro cuando cambia el término de búsqueda
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim().length < 3) {
      setPacientesFiltrados([]);
    } else {
      const resultados = buscarPacientes(term);
      setPacientesFiltrados(resultados);
    }
  };

  // Manejar eliminación con confirmación
  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `Está por eliminar al paciente ${nombre}. Esta acción no se puede deshacer.`,
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
        await eliminarPaciente(id);
        // Actualizar la lista filtrada tras eliminar
        if (searchTerm.trim().length >= 3) {
          const resultados = buscarPacientes(searchTerm);
          setPacientesFiltrados(resultados);
        }
        await Swal.fire({
          title: 'Eliminado',
          text: 'El paciente ha sido eliminado correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al eliminar paciente:', error);
        Swal.fire('Error', 'No se pudo eliminar al paciente', 'error');
      }
    }
  };

  // Calcular edad
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // El sistema ahora no carga todos al inicio, solo muestra los filtrados
  const listaMostrar = pacientesFiltrados;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Pacientes</h2>
            <Button 
              variant="primary" 
              onClick={() => navigate('/pacientes/nuevo')}
            >
              <FaPlus className="me-2" />
              Nuevo Paciente
            </Button>
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
            {listaMostrar.length} paciente{listaMostrar.length !== 1 ? 's' : ''}
          </Badge>
        </Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          {listaMostrar.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                {searchTerm.trim().length >= 3 
                  ? 'No se encontraron pacientes' 
                  : 'Ingrese un nombre o DNI para buscar pacientes (mínimo 3 caracteres)'}
              </p>
              {searchTerm.trim().length === 0 && (
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/pacientes/nuevo')}
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
                  {listaMostrar.map((paciente) => (
                    <tr key={paciente.id}>
                      <td>
                        <strong>{paciente.nombreCompleto}</strong>
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
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
                            title="Editar"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(paciente.id, paciente.nombreCompleto)}
                            title="Eliminar"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PacientesList;
