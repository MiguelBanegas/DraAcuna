import { Link } from 'react-router-dom';
import { Navbar as BSNavbar, Container, Nav } from 'react-bootstrap';
import { FaUserMd, FaUsers, FaStethoscope, FaCalendarAlt } from 'react-icons/fa';

const Navbar = () => {
  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BSNavbar.Brand as={Link} to="/">
          <FaUserMd className="me-2" />
          Consultorio Médico
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
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
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
