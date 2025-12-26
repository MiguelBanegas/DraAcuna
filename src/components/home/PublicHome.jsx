import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaStethoscope, FaMapMarkerAlt, FaClock, FaPhoneAlt, FaUserMd, FaHeartbeat, FaCalendarCheck, FaClinicMedical, FaMedkit, FaMicroscope } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const PublicHome = () => {
  return (
    <div className="public-home bg-medical-pattern min-vh-100">
      {/* Hero Section Modernizada */}
      <section className="position-relative overflow-hidden mb-5" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        {/* Background Image with Overlay */}
        <div 
          className="position-absolute w-100 h-100" 
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }}
        >
          <div className="hero-overlay"></div>
        </div>

        <Container className="hero-content">
          <Row className="justify-content-center text-center">
            <Col lg={9}>
              <div className="glass-effect p-5 mb-4 float-animation shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.85)' }}>
                <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill text-uppercase ls-1 fw-bold">
                  Atención Médica de Excelencia
                </Badge>
                <h1 className="display-2 fw-bold mb-3 text-dark">
                  Dra. <span className="text-gradient">Acuña</span>
                </h1>
                
                {/* Electrocardiograma animado */}
                <div className="mb-4 d-flex justify-content-center">
                  <svg viewBox="0 0 128 64" style={{ width: '200px', height: 'auto', color: '#0d6efd' }}>
                    <style>{`
                      .ecg-back { fill: none; stroke: currentColor; opacity: 0.1; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
                      .ecg-front { fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 260; stroke-dashoffset: 0; animation: ecg-dash 1.4s linear infinite; }
                      @keyframes ecg-dash { 0% { stroke-dashoffset: 260; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0.5; } }
                    `}</style>
                    <polyline points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486" className="ecg-back"/>
                    <polyline points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486" className="ecg-front"/>
                  </svg>
                </div>
                <p className="lead text-dark fs-4 mb-5 mx-auto" style={{ maxWidth: '700px' }}>
                  Comprometida con su bienestar a través de una medicina integral, 
                  tecnología de vanguardia y un trato humano excepcional.
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Button as={Link} to="/login" variant="primary" size="lg" className="px-5 py-3 shadow-sm fw-bold rounded-pill transition-all">
                    Acceso Personal
                  </Button>
                  <Button 
                    variant="light" 
                    size="lg" 
                    className="px-5 py-3 fw-bold rounded-pill shadow-sm transition-all border-0"
                    onClick={() => document.getElementById('servicios').scrollIntoView({ behavior: 'smooth' })}
                  >
                    Explorar Servicios
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Servicios Premium Section */}
      <Container id="servicios" className="py-5 mb-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold display-5 mb-3">Servicios de Salud</h2>
          <div className="bg-primary mx-auto mb-4" style={{ width: '80px', height: '5px', borderRadius: '10px' }}></div>
          <p className="text-muted lead">Soluciones médicas integrales para cada etapa de su vida.</p>
        </div>
        <Row className="g-4">
          {[
            { icon: FaHeartbeat, title: 'Control Clínico', desc: 'Evaluaciones exhaustivas para prevenir y tratar condiciones de salud.' },
            { icon: FaMicroscope, title: 'Diagnóstico Avanzado', desc: 'Utilizamos tecnología moderna para resultados precisos y rápidos.' },
            { icon: FaMedkit, title: 'Atención Integral', desc: 'Un enfoque holístico que abarca tanto el tratamiento como la prevención.' }
          ].map((item, idx) => (
            <Col md={4} key={idx}>
              <Card className="h-100 border-0 shadow-sm text-center p-4 hover-up transition-all bg-white rounded-4">
                <Card.Body>
                  <div className="bg-primary-subtle text-primary p-4 rounded-circle d-inline-block mb-4">
                    <item.icon size={40} />
                  </div>
                  <h4 className="fw-bold mb-3">{item.title}</h4>
                  <p className="text-muted mb-0">{item.desc}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Info & Contact Info Section */}
      <section className="bg-white py-section shadow-sm border-top border-bottom">
        <Container>
          <Row className="g-5 justify-content-center text-center">
            <Col md={4}>
              <div className="hover-up transition-all p-3">
                <div className="bg-primary text-white p-3 rounded-4 shadow-sm d-inline-block mb-3">
                  <FaMapMarkerAlt size={28} />
                </div>
                <h5 className="fw-bold">Visítenos</h5>
                <p className="text-muted small">Av. Principal 1234, Consultorio 5<br />Recoleta, Buenos Aires</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="hover-up transition-all p-3">
                <div className="bg-primary text-white p-3 rounded-4 shadow-sm d-inline-block mb-3">
                  <FaClock size={28} />
                </div>
                <h5 className="fw-bold">Nuestros Horarios</h5>
                <p className="text-muted small">Lunes a Viernes: 08:00 - 20:00<br />Sábados por la mañana</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="hover-up transition-all p-3">
                <div className="bg-primary text-white p-3 rounded-4 shadow-sm d-inline-block mb-3">
                  <FaPhoneAlt size={28} />
                </div>
                <h5 className="fw-bold">Contacto Directo</h5>
                <p className="text-muted small">Tel: (011) 4567-8910<br />consultas@draacuna.com.ar</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer Minimalista */}
      <footer className="py-5 bg-white text-center">
        <Container>
          <div className="mb-4">
            <svg viewBox="0 0 128 64" style={{ width: '150px', height: 'auto', color: '#0d6efd', opacity: 0.4 }}>
              <style>{`
                .ecg-back-footer { fill: none; stroke: currentColor; opacity: 0.1; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
                .ecg-front-footer { fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 260; stroke-dashoffset: 0; animation: ecg-dash-footer 1.4s linear infinite; }
                @keyframes ecg-dash-footer { 0% { stroke-dashoffset: 260; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0.5; } }
              `}</style>
              <polyline points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486" className="ecg-back-footer"/>
              <polyline points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486" className="ecg-front-footer"/>
            </svg>
          </div>
          <p className="mb-0 text-secondary small">© {new Date().getFullYear()} Consultorio Dra. Acuña. Gestión Médica Profesional.</p>
        </Container>
      </footer>
    </div>
  );
};

export default PublicHome;
