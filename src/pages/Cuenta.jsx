import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { FaKey, FaSave, FaUser } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

const Cuenta = () => {
  const { user, updateCredentials } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: user?.username || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    setSubmitError('');
  };

  const validate = () => {
    const nextErrors = {};
    const trimmedUsername = formData.newUsername.trim();

    if (!formData.currentPassword) {
      nextErrors.currentPassword = 'Debe ingresar su contraseña actual';
    }

    if (!trimmedUsername && !formData.newPassword) {
      nextErrors.newUsername = 'Ingrese un nuevo usuario o una nueva contraseña';
    }

    if (trimmedUsername && trimmedUsername.length < 3) {
      nextErrors.newUsername = 'El usuario debe tener al menos 3 caracteres';
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      nextErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'La confirmación no coincide con la nueva contraseña';
    }

    if (
      trimmedUsername === (user?.username || '') &&
      !formData.newPassword
    ) {
      nextErrors.newUsername = 'No hay cambios para guardar';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setLoading(true);
    const result = await updateCredentials({
      currentPassword: formData.currentPassword,
      newUsername: formData.newUsername.trim(),
      newPassword: formData.newPassword,
    });
    setLoading(false);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    await Swal.fire({
      title: 'Credenciales actualizadas',
      text: 'Los cambios se guardaron correctamente.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });

    setFormData((prev) => ({
      ...prev,
      currentPassword: '',
      newUsername: result.user.username,
      newPassword: '',
      confirmPassword: '',
    }));
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Mi Cuenta</h2>
          <p className="text-muted mb-0">
            Actualice su nombre de usuario y su contraseña de acceso.
          </p>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              {submitError && <Alert variant="danger">{submitError}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUser className="me-2" />
                    Usuario actual
                  </Form.Label>
                  <Form.Control type="text" value={user?.username || ''} readOnly className="bg-light" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nuevo usuario</Form.Label>
                  <Form.Control
                    type="text"
                    name="newUsername"
                    value={formData.newUsername}
                    onChange={handleChange}
                    isInvalid={!!errors.newUsername}
                    placeholder="Ingrese el nuevo nombre de usuario"
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.newUsername}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaKey className="me-2" />
                    Contraseña actual
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.currentPassword}
                    placeholder="Ingrese su contraseña actual"
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.currentPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nueva contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.newPassword}
                    placeholder="Ingrese una nueva contraseña"
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.newPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirmar nueva contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.confirmPassword}
                    placeholder="Repita la nueva contraseña"
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button type="submit" disabled={loading}>
                    <FaSave className="me-2" />
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cuenta;
