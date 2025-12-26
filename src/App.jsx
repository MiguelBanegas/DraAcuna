import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PacientesProvider } from './context/PacientesContext';
import { ConsultasProvider } from './context/ConsultasContext';
import { TurnosProvider } from './context/TurnosContext';
import { HistoriaClinicaProvider } from './context/HistoriaClinicaContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import Pacientes from './pages/Pacientes';
import PacienteForm from './components/pacientes/PacienteForm';
import PacienteDetalle from './components/pacientes/PacienteDetalle';
import Consultas from './pages/Consultas';
import ConsultaForm from './components/consultas/ConsultaForm';
import ConsultaDetalle from './components/consultas/ConsultaDetalle';
import Turnos from './pages/Turnos';
import TurnoForm from './components/turnos/TurnoForm';
import HistoriaClinica from './pages/HistoriaClinica';
import HistoriaClinicaForm from './components/historiaClinica/HistoriaClinicaForm';
import HistoriaClinicaDetalle from './components/historiaClinica/HistoriaClinicaDetalle';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PacientesProvider>
          <ConsultasProvider>
            <TurnosProvider>
              <HistoriaClinicaProvider>
              <div className="min-vh-100 bg-light">
                <Navbar />
                <Routes>
                  {/* Rutas Públicas */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* Rutas protegidas */}
                  <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
                  <Route path="/pacientes/nuevo" element={<ProtectedRoute><PacienteForm /></ProtectedRoute>} />
                  <Route path="/pacientes/:id" element={<ProtectedRoute><PacienteDetalle /></ProtectedRoute>} />
                  <Route path="/pacientes/:id/editar" element={<ProtectedRoute><PacienteForm /></ProtectedRoute>} />
                  
                  <Route path="/consultas" element={<ProtectedRoute><Consultas /></ProtectedRoute>} />
                  <Route path="/consultas/nueva" element={<ProtectedRoute><ConsultaForm /></ProtectedRoute>} />
                  <Route path="/consultas/:id" element={<ProtectedRoute><ConsultaDetalle /></ProtectedRoute>} />
                  <Route path="/consultas/:id/editar" element={<ProtectedRoute><ConsultaForm /></ProtectedRoute>} />
                  
                  <Route path="/turnos" element={<ProtectedRoute><Turnos /></ProtectedRoute>} />
                  <Route path="/turnos/nuevo" element={<ProtectedRoute><TurnoForm /></ProtectedRoute>} />
                  <Route path="/turnos/:id/editar" element={<ProtectedRoute><TurnoForm /></ProtectedRoute>} />
                  
                  <Route path="/historia-clinica" element={<ProtectedRoute><HistoriaClinica /></ProtectedRoute>} />
                  <Route path="/historia-clinica/nueva/:pacienteId" element={<ProtectedRoute><HistoriaClinicaForm /></ProtectedRoute>} />
                  <Route path="/historia-clinica/:id" element={<ProtectedRoute><HistoriaClinicaDetalle /></ProtectedRoute>} />
                  <Route path="/historia-clinica/:id/editar" element={<ProtectedRoute><HistoriaClinicaForm /></ProtectedRoute>} />
                  
                  {/* Ruta por defecto */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              </HistoriaClinicaProvider>
            </TurnosProvider>
          </ConsultasProvider>
        </PacientesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
