import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

const initialCreateForm = {
  nombre: '',
  username: '',
  email: '',
  rol: 'admin',
  password: '',
};

const initialResetForm = {
  userId: '',
  username: '',
  password: '',
};

const Usuarios = () => {
  const { getUsers, createUser, adminResetUserCredentials, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [resetForm, setResetForm] = useState(initialResetForm);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [errors, setErrors] = useState({});
  const [createError, setCreateError] = useState('');
  const [resetError, setResetError] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const result = await getUsers();
    if (result.success) {
      setUsers(result.users);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin()) {
      loadUsers();
    }
  }, []);

  const validateCreateForm = () => {
    const nextErrors = {};
    if (!createForm.nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio';
    if (!createForm.username.trim()) nextErrors.username = 'El usuario es obligatorio';
    if (createForm.username.trim().length < 3) nextErrors.username = 'El usuario debe tener al menos 3 caracteres';
    if (!createForm.password) nextErrors.password = 'La contraseña es obligatoria';
    if (createForm.password.length < 6) nextErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateResetForm = () => {
    const nextErrors = {};
    if (!resetForm.userId) nextErrors.resetUserId = 'Debe seleccionar un usuario';
    if (!resetForm.username.trim()) nextErrors.resetUsername = 'El nuevo usuario es obligatorio';
    if (!resetForm.password) nextErrors.resetPassword = 'La nueva contraseña es obligatoria';
    if (resetForm.password.length < 6) nextErrors.resetPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    setCreateError('');
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleResetChange = (name, value) => {
    setResetForm((prev) => ({ ...prev, [name]: value }));
    setResetError('');
    const errorKey =
      name === 'username'
        ? 'resetUsername'
        : name === 'password'
          ? 'resetPassword'
          : name;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handleSelectUser = (e) => {
    const userId = e.target.value;
    const selected = users.find((item) => String(item.id) === String(userId));
    setResetForm({
      userId,
      username: selected?.username || '',
      password: '',
    });
    setSelectedUserName(selected?.nombre || selected?.username || '');
    setResetError('');
    setErrors((prev) => ({
      ...prev,
      resetUserId: '',
      resetUsername: '',
      resetPassword: '',
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!validateCreateForm()) return;

    setSubmittingCreate(true);
    const result = await createUser({
      ...createForm,
      nombre: createForm.nombre.trim(),
      username: createForm.username.trim(),
      email: createForm.email.trim(),
    });
    setSubmittingCreate(false);

    if (!result.success) {
      setCreateError(result.error);
      return;
    }

    await Swal.fire({
      title: 'Usuario creado',
      text: 'El nuevo usuario fue registrado correctamente.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });

    setCreateForm(initialCreateForm);
    await loadUsers();
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!validateResetForm()) return;

    setSubmittingReset(true);
    const result = await adminResetUserCredentials({
      userId: resetForm.userId,
      username: resetForm.username.trim(),
      password: resetForm.password,
    });
    setSubmittingReset(false);

    if (!result.success) {
      setResetError(result.error);
      return;
    }

    await Swal.fire({
      title: 'Credenciales restablecidas',
      text: 'El usuario y la contraseña se actualizaron correctamente.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });

    setResetForm(initialResetForm);
    setSelectedUserName('');
    await loadUsers();
  };

  if (!isAdmin()) {
    return (
      <Container>
        <Alert variant="danger">Acceso solo para administradores.</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Gestión de Usuarios</h2>
          <p className="text-muted mb-0">
            Cree usuarios nuevos y restablezca usuario o contraseña cuando sea necesario.
          </p>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>Nuevo Usuario</strong>
            </Card.Header>
            <Card.Body>
              {createError && <Alert variant="danger">{createError}</Alert>}
              <Form onSubmit={handleCreateSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    name="nombre"
                    value={createForm.nombre}
                    onChange={handleCreateChange}
                    isInvalid={!!errors.nombre}
                    disabled={submittingCreate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.nombre}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Usuario</Form.Label>
                  <Form.Control
                    name="username"
                    value={createForm.username}
                    onChange={handleCreateChange}
                    isInvalid={!!errors.username}
                    disabled={submittingCreate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateChange}
                    disabled={submittingCreate}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    name="rol"
                    value={createForm.rol}
                    onChange={handleCreateChange}
                    disabled={submittingCreate}
                  >
                    <option value="admin">Admin</option>
                    <option value="secretaria">Secretaria</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Contraseña inicial</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={createForm.password}
                    onChange={handleCreateChange}
                    isInvalid={!!errors.password}
                    disabled={submittingCreate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>
                <Button type="submit" disabled={submittingCreate}>
                  {submittingCreate ? 'Creando...' : 'Crear usuario'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white">
              <strong>Usuarios registrados</strong>
            </Card.Header>
            <Card.Body className="p-0">
              {loadingUsers ? (
                <div className="p-4 text-center text-muted">Cargando usuarios...</div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => (
                      <tr key={item.id}>
                        <td>{item.nombre}</td>
                        <td>{item.username}</td>
                        <td>{item.email || '-'}</td>
                        <td>{item.rol}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>Restablecer usuario y contraseña</strong>
            </Card.Header>
            <Card.Body>
              {resetError && <Alert variant="danger">{resetError}</Alert>}
              <Form onSubmit={handleResetSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Seleccionar usuario</Form.Label>
                  <Form.Select
                    value={resetForm.userId}
                    onChange={handleSelectUser}
                    isInvalid={!!errors.resetUserId}
                    disabled={submittingReset || loadingUsers}
                  >
                    <option value="">Seleccione...</option>
                    {users.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre} ({item.username})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.resetUserId}</Form.Control.Feedback>
                </Form.Group>

                {selectedUserName && (
                  <Alert variant="info" className="py-2">
                    Usuario seleccionado: <strong>{selectedUserName}</strong>
                  </Alert>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Nuevo usuario</Form.Label>
                  <Form.Control
                    name="resetUsername"
                    value={resetForm.username}
                    onChange={(e) => handleResetChange('username', e.target.value)}
                    isInvalid={!!errors.resetUsername}
                    disabled={submittingReset}
                  />
                  <Form.Control.Feedback type="invalid">{errors.resetUsername}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Nueva contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="resetPassword"
                    value={resetForm.password}
                    onChange={(e) => handleResetChange('password', e.target.value)}
                    isInvalid={!!errors.resetPassword}
                    disabled={submittingReset}
                  />
                  <Form.Control.Feedback type="invalid">{errors.resetPassword}</Form.Control.Feedback>
                </Form.Group>

                <Button type="submit" variant="warning" disabled={submittingReset}>
                  {submittingReset ? 'Restableciendo...' : 'Restablecer credenciales'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Usuarios;
