import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Container, Nav, Button } from 'react-bootstrap';
import { FaUserMd, FaUsers, FaStethoscope, FaCalendarAlt, FaSignOutAlt, FaFileMedical } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" className="mb-4" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <BSNavbar.Brand as={Link} to="/" onClick={() => setExpanded(false)}>
          <FaUserMd className="me-2" />
          Consultorio Dra Acuña
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav" onClick={() => setExpanded(false)}>
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">
              <FaUserMd className="me-1" />
              Inicio
            </Nav.Link>
            <Nav.Link as={Link} to="/pacientes">
              <FaUsers className="me-1" />
              Pacientes
            </Nav.Link>
            <Nav.Link as={Link} to="/consultas">
              <FaStethoscope className="me-1" />
              Consultas
            </Nav.Link>
            <Nav.Link as={Link} to="/turnos">
              <FaCalendarAlt className="me-1" />
              Turnos
            </Nav.Link>
            <Nav.Link as={Link} to="/historia-clinica">
              <FaFileMedical className="me-1" />
              Historia Clínica
            </Nav.Link>
          </Nav>
          {user && (
            <Nav className="ms-3">
              <span className="navbar-text text-white me-3">
                {user.name}
              </span>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                <FaSignOutAlt className="me-1" />
                Salir
              </Button>
            </Nav>
          )}
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
